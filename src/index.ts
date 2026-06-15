import dotenv from 'dotenv';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import { getCluster } from './cluster';
import routes from './routes';
import { log } from './log';

// 加载 .env 文件中的变量到 process.env
dotenv.config();

async function bootstrap() {
  // Step 1: 启动 puppeteer-cluster
  await getCluster();
  log.info('✅ Puppeteer Cluster ready');

  // Step 2: 启动 Express
  const app = express();
  app.use(
    cors({
      origin: '*', // 或者指定允许的域名
      methods: 'GET,POST',
    })
  );
  app.use(express.json());

  // Step 3: 限流，每个IP 每分钟最多 100 个请求
  const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    message: 'Too many requests, please try again later.',
  });
  app.use(limiter);

  // Step 4: 注册路由
  app.use(routes);

  const PORT = process.env.PORT || 9000;
  app.listen(PORT, () => {
    log.info(`✅ Server running at http://localhost:${PORT}`);
  });
}

bootstrap().catch(err => {
  log.error(`❌ Failed to start app:${JSON.stringify(err)}`);
  process.exit(1);
});
