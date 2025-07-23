import { Response } from 'express';

// 检查 URL 是否合法
export const isValidUrl = (url?: string) => {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * 生成文件名，默认格式：2025-07-22T08-30-00-000Z.png
 */
export const generateFilename = (ext: string, prefix = '') => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `${prefix ? prefix + '-' : ''}${timestamp}.${ext}`;
};

/**
 * 统一错误响应
 */
export const sendError = (res: Response, error: unknown, defaultMsg = '服务器发生错误', statusCode = 500) => {
  const message = typeof error === 'string' ? error : (error as Error)?.message || defaultMsg;
  console.error('[Error]', message, error);
  res.status(statusCode).json({ error: message });
};

/**
 * 统一成功响应
 */
export const sendSuccess = (res: Response, data: unknown = null, message = '操作成功', statusCode = 200): void => {
  res.status(statusCode).json({
    data,
    code: 0,
    message,
  });
};

/**
 *
 * @returns 生成一个 UUID v4 字符串
 */
export const uuidv4 = () => {
  // 如果支持 crypto.getRandomValues（如 Node.js、现代浏览器），用它生成更安全的随机数
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);

    // 按照 RFC 4122 第4版的规范设置特定位
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant

    return [...bytes]
      .map((b, i) =>
        [4, 6, 8, 10].includes(i) ? '-' + b.toString(16).padStart(2, '0') : b.toString(16).padStart(2, '0')
      )
      .join('');
  } else {
    // fallback（不建议用于生产，缺乏加密级随机性）
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
};
