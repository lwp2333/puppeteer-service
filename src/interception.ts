import { Page } from 'puppeteer';

const hostMap: Record<string, string> = {
  // 更多映射...
};

export const enableRequestInterception = async (page: Page) => {
  await page.setRequestInterception(true);

  page.on('request', req => {
    try {
      const originalUrl = new URL(req.url());
      const mappedHost = hostMap[originalUrl.hostname];

      if (mappedHost) {
        originalUrl.host = mappedHost;
        const newUrl = originalUrl.href;

        // 替换 URL 后，referer 可能会发生冲突，索性直接删掉
        const originHeaders = req.headers();
        delete originHeaders['Referer'];

        return req.continue({ url: newUrl, headers: originHeaders });
      }

      // 正常放行
      return req.continue();
    } catch (err) {
      console.error('[拦截失败]', err);
      return req.continue();
    }
  });
};
