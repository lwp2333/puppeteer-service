import chalk from 'chalk';
import { AsyncLocalStorage } from 'async_hooks';
import { uuidv4 } from './utils';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogOptions {
  extra?: Record<string, any>;
}

interface LogContext {
  traceId: string;
}

const isDev = process.env.NODE_ENV !== 'production';
const asyncLocalStorage = new AsyncLocalStorage<LogContext>();

/**
 * 格式化时间（东八区）
 */
function getTimestamp() {
  const now = new Date();
  const offset = 8 * 60 * 60 * 1000;
  return new Date(now.getTime() + offset).toISOString().replace('Z', '+08:00');
}

/**
 * 打印日志（内部函数）
 */
function printLog(level: LogLevel, message: string, opts: LogOptions = {}) {
  const { extra } = opts;
  const traceId = asyncLocalStorage.getStore()?.traceId;
  const timestamp = getTimestamp();

  if (isDev) {
    // 开发环境：彩色文本日志
    let colorFn: (msg: string) => string = chalk.white;
    if (level === 'info') colorFn = chalk.green;
    if (level === 'warn') colorFn = chalk.yellow;
    if (level === 'error') colorFn = chalk.red;
    if (level === 'debug') colorFn = chalk.cyan;

    console.log(
      colorFn(`[${timestamp}] [${level.toUpperCase()}]`),
      traceId ? chalk.magenta(traceId) : '',
      message,
      extra ? JSON.stringify(extra) : ''
    );
  } else {
    // 生产环境：JSON 格式日志（适合 SLS）
    const logObj: Record<string, any> = {
      timestamp,
      level: level.toUpperCase(),
      traceId,
      message,
      extra,
    };

    console.log(JSON.stringify(logObj));
  }
}

/**
 * 日志工具
 */
export const log = {
  info: (msg: string, opts?: LogOptions) => printLog('info', msg, opts),
  warn: (msg: string, opts?: LogOptions) => printLog('warn', msg, opts),
  error: (msg: string, opts?: LogOptions) => printLog('error', msg, opts),
  debug: (msg: string, opts?: LogOptions) => printLog('debug', msg, opts),

  /**
   * 生成 traceId（请求链路 ID）
   */
  createTraceId: () => uuidv4(),

  /**
   * 在上下文中运行（自动带 traceId）
   */
  runWithTrace<T>(fn: () => T, traceId?: string) {
    const id = traceId || uuidv4();
    return asyncLocalStorage.run({ traceId: id }, fn);
  },

  /**
   * 获取当前上下文 traceId
   */
  getTraceId: () => asyncLocalStorage.getStore()?.traceId,
};
