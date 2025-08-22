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
        const oldUrl = originalUrl.href;
        originalUrl.host = mappedHost;
        // originalUrl.protocol = 'http:'; // 如果需要强制使用 HTTP 协议，可以取消注释这一行
        const newUrl = originalUrl.href;

        console.log(`[拦截] ${oldUrl}、[替换] → ${newUrl}`);

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
