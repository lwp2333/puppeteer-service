import fs from 'fs';
import { Cluster } from 'puppeteer-cluster';
import { Page, Viewport, ScreenshotOptions, PDFOptions } from 'puppeteer';
import { enableRequestInterception } from './interception';
import { log } from './log';

export type CommonParams = {
  url: string;
  clipDom: boolean;
  waitUntilHookFunctionTriggered: boolean;
  hookFunctionName: string;
  transparentBackground: boolean;
};

export type ClusterScreenshotTaskData = CommonParams & Viewport & ScreenshotOptions;

export type ClusterPDFTaskData = CommonParams & PDFOptions;

export type ClusterTaskData = ClusterScreenshotTaskData | ClusterPDFTaskData;

let cluster: Cluster<ClusterTaskData, Buffer | string> | null = null;

function getGlobalChromiumPath() {
  try {
    const chromiumPath = '/usr/local/lib/chrome';
    if (!fs.existsSync(chromiumPath)) {
      throw new Error('全局 Chromium 不存在');
    }
    return chromiumPath;
  } catch (error) {
    log.warn(`⚠️ 未找到全局 Chromium，使用本地：${JSON.stringify(error)}`);
    return undefined;
  }
}

export const initCluster = async () => {
  log.info('🚀 Start Puppeteer Cluster...');
  const chromiumPath = getGlobalChromiumPath();
  cluster = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_PAGE,
    maxConcurrency: 4,
    monitor: false,
    puppeteerOptions: {
      headless: true,
      executablePath: chromiumPath,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-extensions',
        '--disable-background-networking',
        '--disable-default-apps',
        '--disable-sync',
        '--disable-translate',
        '--hide-scrollbars',
        '--metrics-recording-only',
        '--mute-audio',
        '--no-first-run',
        '--safebrowsing-disable-auto-update',
        '--js-flags=--max-old-space-size=512',
      ],
    },
    timeout: 60 * 1000,
  });

  await cluster.task(async ({ page, data }: { page: Page; data: ClusterTaskData }) => {
    if (!data.url.includes('#')) {
      await enableRequestInterception(page);
    }
    if ('format' in data && data.format) {
      const { url, ...options } = data;
      const start = Date.now();
      await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
      const loaded = Date.now();
      const buffer = await page.pdf({
        ...options,
        printBackground: true,
      });
      const finished = Date.now();
      log.info(`⏱️ 加载耗时：${loaded - start}ms, 生成耗时: ${finished - loaded}ms`);
      return buffer;
    } else {
      const {
        url,
        width = 375,
        height = 0,
        isMobile,
        isLandscape,
        deviceScaleFactor = 2,
        type = 'jpeg',
        transparentBackground,
        clipDom,
        quality,
        waitUntilHookFunctionTriggered,
        hookFunctionName,
        ...options
      } = data as ClusterScreenshotTaskData;
      const start = Date.now();
      let resolveHookTriggered!: () => void;
      let rejectHookTriggered!: (reason?: unknown) => void;
      const hookTriggeredPromise = waitUntilHookFunctionTriggered
        ? new Promise<void>((resolve, reject) => {
            resolveHookTriggered = resolve;
            rejectHookTriggered = reject;
          })
        : Promise.resolve();

      if (waitUntilHookFunctionTriggered) {
        await page.exposeFunction(hookFunctionName, async (payload?: { status?: boolean }) => {
          log.info(`⌛️收到钩子函数回调: ${JSON.stringify(payload)}`);
          if (payload?.status) {
            resolveHookTriggered();
          } else {
            rejectHookTriggered('页面出现未知错误');
          }
        });
      }

      await page.setViewport({ width, height, isMobile, isLandscape, deviceScaleFactor });
      await page.goto(url, {
        waitUntil: waitUntilHookFunctionTriggered ? 'domcontentloaded' : 'networkidle0',
        timeout: 60000,
      });

      // 设置透明背景
      if (transparentBackground) {
        await page.evaluate(() => {
          document.body.style.backgroundColor = 'transparent';
        });
      }

      if (waitUntilHookFunctionTriggered) {
        let timeoutId!: ReturnType<typeof setTimeout>;
        const timeoutPromise = new Promise<void>(resolve => {
          timeoutId = setTimeout(() => {
            log.warn(`⏳等待钩子函数 ${hookFunctionName} 超时 12000ms，直接截图`);
            resolve();
          }, 12000);
        });
        await Promise.race([hookTriggeredPromise.finally(() => clearTimeout(timeoutId)), timeoutPromise]);
      } else {
        await hookTriggeredPromise;
      }
      // await page.evaluate(async () => {
      //   await new Promise(resolve => {
      //     const scroll = () => {
      //       window.scrollBy(0, window.innerHeight);
      //       if (window.scrollY + window.innerHeight >= document.body.scrollHeight) {
      //         resolve(true);
      //       } else {
      //         setTimeout(scroll, 100);
      //       }
      //     };
      //     scroll();
      //   });
      // });
      // 获取 #screenshot 元素的边界信息
      let clip: DOMRect | undefined = undefined;
      if (clipDom) {
        clip = await page.evaluate(() => {
          const el = document.querySelector('#screenshot');
          if (!el) return undefined;
          const rect = el.getBoundingClientRect();
          return {
            x: Math.floor(rect.x),
            y: Math.floor(rect.y),
            width: Math.ceil(rect.width),
            height: Math.ceil(rect.height),
          } as DOMRect;
        });
      }
      const loaded = Date.now();
      const imageType = transparentBackground ? 'png' : type;
      const buffer = await page.screenshot({
        fullPage: !clipDom && !height,
        type: imageType,
        omitBackground: transparentBackground,
        quality: imageType !== 'png' ? quality : undefined,
        clip,
        ...options,
      });
      const finished = Date.now();
      log.info(`⏱️ 加载耗时: ${loaded - start}ms, 生成耗时: ${finished - loaded}ms`);
      return buffer;
    }
  });
};

export const getCluster = async () => {
  if (!cluster) {
    await initCluster();
  }
  return cluster;
};
