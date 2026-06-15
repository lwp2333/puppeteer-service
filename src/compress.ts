import sharp from 'sharp';
import { log } from './log';

export const pngCompress = async (image: Buffer, quality?: number) => {
  try {
    if (!quality || quality < 0 || quality > 100) {
      return image;
    }
    const start = Date.now();
    const compressedImage = await sharp(image).png({ quality }).toBuffer();
    log.info(`✅ 压缩图片耗时: ${Date.now() - start}ms`);
    return compressedImage;
  } catch (error) {
    log.error(`❌ 压缩图片出错: ${JSON.stringify(error)}`);
    throw error;
  }
};
