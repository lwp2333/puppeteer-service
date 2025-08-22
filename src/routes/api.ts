import { Router } from 'express';
import { ClusterPDFTaskData, ClusterScreenshotTaskData, getCluster } from '../cluster';
import { generateFilename, isValidUrl, sendError } from '../utils';
import { transformParams } from '../params';

const router = Router();

// 路由：网页截图
router.post('/screenshot', async (req, res) => {
  const params = transformParams(req.body) as ClusterScreenshotTaskData;
  const { url, type = 'jpeg' } = params;
  if (!isValidUrl(url)) {
    return res.status(400).json({ error: 'Invalid or missing URL' });
  }

  try {
    const cluster = await getCluster();
    if (!cluster) throw new Error('Cluster not ready yet');

    const imageBuffer = await cluster.execute(params);
    const filename = generateFilename(type);
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.type(`image/${type}`).send(imageBuffer);
  } catch (err) {
    sendError(res, err, 'Screenshot error');
  }
});

// 路由：PDF 生成
router.post('/pdf', async (req, res) => {
  const params = transformParams(req.body) as ClusterPDFTaskData;
  const { url } = params;
  if (!isValidUrl(url)) {
    return res.status(400).json({ error: 'Invalid or missing URL' });
  }

  try {
    const cluster = await getCluster();
    if (!cluster) throw new Error('Cluster not ready yet');

    const pdfBuffer = await cluster.execute(params);
    const filename = generateFilename('pdf');

    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/pdf');
    res.send(pdfBuffer);
  } catch (err) {
    sendError(res, err, 'PDF generation error');
  }
});

// 路由：pdf、截图合并接口
router.post('/generate', async (req, res) => {
  const params = transformParams(req.body);
  const { url, format, type } = params as any;
  if (!isValidUrl(url)) {
    return res.status(400).json({ error: 'Invalid or missing URL' });
  }

  try {
    const cluster = await getCluster();
    if (!cluster) throw new Error('Cluster not ready yet');

    const isPDF = !!format;
    const resultBuffer = await cluster.execute(req.body);

    const filename = generateFilename(isPDF ? 'pdf' : type);

    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.setHeader('Content-Type', isPDF ? 'application/pdf' : `image/${type}`);
    res.send(resultBuffer);
  } catch (err) {
    sendError(res, err, 'Generation error');
  }
});

export default router;
