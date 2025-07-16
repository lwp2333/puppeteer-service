import { Router } from 'express';
import apiRoutes from './api';

const router = Router();

// 健康检查路由
router.get('/health', (req, res) => res.send('OK)'));

// api 路由
router.use('/api', apiRoutes);

export default router;
