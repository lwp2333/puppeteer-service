import { Response } from 'express';

// 检查 URL 是否合法
const isValidUrl = (url?: string) => !!url && /^https?:\/\//.test(url);

// 格式化文件名
const generateFilename = (ext: string) => `${new Date().toISOString().replace(/[:.]/g, '-')}.${ext}`;

// 统一响应错误
const sendError = (res: Response, error: unknown, defaultMsg: string) => {
  console.error(defaultMsg, error);
  const message = (error as Error)?.message || defaultMsg;
  res.status(500).json({ error: message });
};

export { isValidUrl, generateFilename, sendError };
