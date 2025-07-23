import { Cluster } from 'puppeteer-cluster';
import { Page, Viewport, ScreenshotOptions, PDFOptions } from 'puppeteer';
import { enableRequestInterception } from './interception';

export type ClusterScreenshotTaskData = { url: string } & Viewport & ScreenshotOptions;

export type ClusterPDFTaskData = { url: string } & PDFOptions;

export type ClusterTaskData = ClusterScreenshotTaskData | ClusterPDFTaskData;

let cluster: Cluster<ClusterTaskData, Buffer | string> | null = null;

export const initCluster = async () => {
  console.log('🚀 Starting screenshot-service...');
  cluster = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_PAGE,
    maxConcurrency: 4,
    monitor: false,
    puppeteerOptions: {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    },
    timeout: 30 * 1000,
  });

  await cluster.task(async ({ page, data }: { page: Page; data: ClusterTaskData }) => {
    await enableRequestInterception(page);
    if ('format' in data) {
      const { url, ...options } = data;
      const start = Date.now();
      await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
      const loaded = Date.now();
      const buffer = await page.pdf(options);
      const finished = Date.now();
      console.log(`加载耗时: ${loaded - start}ms, 生成耗时: ${finished - loaded}ms`);
      return buffer;
    } else {
      const {
        url,
        width = 375,
        height = 0,
        deviceScaleFactor = 2,
        type = 'jpeg',
        ...options
      } = data as ClusterScreenshotTaskData;
      const start = Date.now();
      await page.setViewport({ width, height, deviceScaleFactor });
      await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
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
      const loaded = Date.now();
      const buffer = await page.screenshot({ fullPage: !height, type, ...options });
      const finished = Date.now();
      console.log(`加载耗时: ${loaded - start}ms, 生成耗时: ${finished - loaded}ms`);
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
