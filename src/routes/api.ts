import { Router } from 'express';
import { getCluster } from '../cluster';
import { isValidUrl, sendError, sendSuccess } from '../utils';
import { transformParams } from '../params';
import { pngCompress } from '../compress';
import { uploadBufferByOss } from '../upload';
import { log } from '../log';

const router = Router();

// 路由：pdf、截图合并接口
router.post('/generate', async (req, res) => {
  await log.runWithTrace(async () => {
    try {
      log.info(`📋 请求体：${JSON.stringify(req.body)}`);
      // AppCode 校验
      const authorizationString = (req.headers.authorization || req.headers.Authorization) as string;
      if (!authorizationString) {
        sendError(res, '未获取到应用鉴权信息', 'AUTHORIZATION_CANNOT_BE_NULL');
        return;
      }
      const appCodeKey = authorizationString.split(' ')[0];
      const appCode = authorizationString.split(' ')[1];
      if (appCodeKey !== 'APPCODE' || !appCode) {
        sendError(res, '未获取到应用鉴权信息', 'AUTHORIZATION_CANNOT_BE_NULL');
        return;
      }
      log.info(`🔑 业务Appcode：${appCode}`);

      const params = transformParams(req.body);
      const { url, format, type, quality, transparentBackground, customFileName } = params as any;
      if (!isValidUrl(url)) {
        sendError(res, '请求体格式不正确', 'INVALID_REQUEST_BODY');
        return;
      }
      const cluster = await getCluster();
      if (!cluster) throw new Error('Cluster not ready yet');

      const isPDF = !!format;
      const resultBuffer = await cluster.execute(params);
      const resultType = transparentBackground && !isPDF ? 'png' : type;

      const imageBuffer =
        resultType === 'png' ? await pngCompress(resultBuffer as Buffer<ArrayBufferLike>, quality) : resultBuffer;

      const ossUrl = await uploadBufferByOss(
        imageBuffer as Buffer<ArrayBufferLike>,
        appCode,
        isPDF ? 'pdf' : resultType,
        customFileName
      );

      sendSuccess(res, ossUrl);
    } catch (err) {
      sendError(res, err, 'GENERATE_FAIL');
    }
  });
});

export default router;
