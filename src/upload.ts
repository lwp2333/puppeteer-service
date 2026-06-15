import OSS from 'ali-oss';
import { uuidv4 } from './utils';
import { getOssConfig } from './config';
import { log } from './log';

/**
 * 上传 Buffer 到 OSS
 * @param fileBuffer Buffer 数据
 * @param appCode 业务标识
 * @param extension 文件扩展名（如 jpg, png）
 * @returns 上传后返回的 OSS URL
 */
export async function uploadBufferByOss(
  fileBuffer: Buffer,
  appCode: string,
  extension: string,
  customFileName?: string
): Promise<string> {
  const OSSConfig = getOssConfig();
  const client = new OSS({
    region: OSSConfig.region,
    bucket: OSSConfig.bucket,
    endpoint: OSSConfig.endpoint,
    accessKeyId: OSSConfig.accessKeyId!,
    accessKeySecret: OSSConfig.accessKeySecret!,
    secure: true,
  });

  const fileName = customFileName ? customFileName : `${uuidv4()}-${Date.now()}.${extension}`;
  const objectPath = `spfe/material/${appCode}/${fileName}`;

  const startTime = Date.now(); // 开始计时

  try {
    const result = await client.put(objectPath, fileBuffer, {
      timeout: 30000,
    });

    const duration = Date.now() - startTime;
    log.info(`📤 OSS上传成功：耗时 ${duration}ms，${objectPath}`);
    if (OSSConfig.cdnBaseUrl) {
      return client.getObjectUrl(result.name, OSSConfig.cdnBaseUrl);
    }
    // 阿里云内网oss 转外网需要去掉 -internal
    return result.url.replace('-internal', '');
  } catch (error) {
    const duration = Date.now() - startTime;
    log.error(`❌ OSS上传失败：${objectPath}，耗时 ${duration}ms，${JSON.stringify(error)}`);
    throw error;
  }
}
