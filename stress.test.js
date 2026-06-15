import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Trend } from 'k6/metrics';

// 自定义指标
const errorCount = new Counter('errors');
const generateDuration = new Trend('generate_duration');

export const options = {
  // 阶梯式加压
  stages: [
    { duration: '10s', target: 5 }, // 预热：10秒内爬升到 5 VUs
    { duration: '20s', target: 10 }, // 加压：维持 10 VUs 持续 20 秒
    { duration: '10s', target: 0 }, // 降压：10秒内降到 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<30000'], // 95% 请求在 30s 内完成
    errors: ['count<10'], // 错误数小于 10
  },
};

const BASE_URL = 'http://localhost:9000';

const apiGenerate = () => {
  const data = {
    url: 'https://www.baidu.com',
    width: 375,
    height: 0,
    format: 'png',
    quality: 80,
    deviceScaleFactor: 3,
    isMobile: true,
  };
  const headers = {
    'Content-Type': 'application/json',
    Authorization: 'APPCODE lwp2333',
  };
  return http.post(`${BASE_URL}/api/generate`, JSON.stringify(data), {
    headers,
    timeout: '60s',
  });
};

export default function () {
  const res = apiGenerate();

  generateDuration.add(res.timings.duration);

  const passed = check(res, {
    'status is 200': r => r.status === 200,
    'response has data': r => {
      try {
        const body = JSON.parse(r.body);
        return body.code === 0 || body.success === true;
      } catch {
        return false;
      }
    },
  });

  if (!passed) {
    errorCount.add(1);
  }

  sleep(1); // 每个用户每次请求后等待 1 秒，模拟真实场景
}
