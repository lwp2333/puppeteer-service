import OSS from 'ali-oss';
import { uuidv4 } from './utils';

/**
 * 上传 Buffer 到 OSS（使用 STS 临时凭证）
 * @param fileBuffer Buffer 数据
 * @param credentials 临时 STS 凭证
 * @param appCode 业务标识
 * @param ext 文件扩展名（如 jpg, png）
 * @returns 上传后返回的 OSS URL
 */
export async function uploadBufferWithSts(
  fileBuffer: Buffer,
  appCode: string,
  extension: string
): Promise<string> {
  const client = new OSS({
    region: OSSConfig.region,
    bucket: OSSConfig.bucket,
    endpoint: OSSConfig.endpoint,
    accessKeyId: OSSConfig.accessKeyId!,
    accessKeySecret: OSSConfig.accessKeySecret!,
    secure: true,
  });

  const fileName = `${uuidv4()}-${Date.now()}.${extension}`;
  const objectPath = `spfe/material/${appCode}/${fileName}`;

  const startTime = Date.now(); // 开始计时

  try {
    const result = await client.put(objectPath, fileBuffer, {
      timeout: 30000,
    });

    const duration = Date.now() - startTime;
    console.log(`✅[OSS 上传成功] ${objectPath}，耗时 ${duration}ms`);

    return result.url;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌[OSS STS 上传失败] ${objectPath}，耗时 ${duration}ms`, error);
    throw error;
  }
}
