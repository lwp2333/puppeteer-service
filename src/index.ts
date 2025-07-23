import dotenv from 'dotenv';
import express from 'express';
import rateLimit from 'express-rate-limit';
import { getCluster } from './cluster';
import routes from './routes';

// 加载 .env 文件中的变量到 process.env
dotenv.config();

async function bootstrap() {
  // Step 1: 启动 puppeteer-cluster
  await getCluster();
  console.log('✅ Puppeteer Cluster ready');

  // Step 2: 启动 Express
  const app = express();
  app.use(express.json());
  // 限流：每 IP 每分钟最多 100 个请求
  const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    message: 'Too many requests, please try again later.',
  });
  app.use(limiter);
  app.use(routes);

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
  });
}

bootstrap().catch(err => {
  console.error('❌ Failed to start app:', err);
  process.exit(1);
});
