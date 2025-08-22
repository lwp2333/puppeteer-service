import { PaperFormat } from 'puppeteer';
import { ClusterTaskData } from './cluster';

export enum OutputFileFormat {
  png = 'png',
  jpeg = 'jpeg',
  webp = 'webp',
  pdf = 'pdf',
}

export type V3Params = {
  // 快照目标
  target: string;
  // 宽度，默认 375px
  width: number;
  // 高度，默认全屏
  height?: number;
  // 是否根据 #screenshot 进行截图
  clipDom?: boolean;
  // 是否移动端 默认false
  isMobile?: boolean;
  // 多倍屏 默认2
  deviceScaleFactor?: number;
  // 压缩质量 0-100 (不适用于 png 图片)
  quality?: number;
  // 输出文件格式，默认 jpeg
  format?: OutputFileFormat;
  // PDF 的输出大小，默认 A4
  pdfSize?: PaperFormat;
  // 是否横屏
  landscape?: boolean;
  // 是否需要等待钩子函数被触发
  waitUntilHookFunctionTriggered?: boolean;
  // 钩子函数名称，默认值沿用 v1 中的 fcBridgeCallback
  hookFunctionName?: string;
  // 是否需要透明背景
  transparentBackground?: boolean;
};

/**
 * 转换V2Params参数对象为ClusterTaskData格式
 * @param params - V2Params类型的参数对象
 * @returns 转换后的ClusterTaskData对象，将原始参数映射到新的数据结构
 */
export const transformParams = (params: V3Params): ClusterTaskData => {
  // 将V2Params 和当前类型不一致的转换一下
  const {
    target,
    width = 0,
    isMobile = false,
    deviceScaleFactor = 2,
    format,
    pdfSize,
    landscape,
    clipDom = false,
    waitUntilHookFunctionTriggered = false,
    hookFunctionName = 'fcBridgeCallback',
    transparentBackground = false,
    ...rest
  } = params;
  return {
    url: params.target,
    width,
    isMobile,
    deviceScaleFactor,
    type: format !== OutputFileFormat.pdf ? format || 'jpeg' : undefined,
    format: format === OutputFileFormat.pdf ? pdfSize || 'A4' : undefined,
    isLandscape: landscape,
    clipDom,
    waitUntilHookFunctionTriggered,
    hookFunctionName,
    transparentBackground,
    ...rest,
  };
};
