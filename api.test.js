import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 10, // 设置 10 个虚拟用户
  duration: '10s', // 压测持续时间 10 秒
};

const apiRun = () => {
  const data = {
    url: 'https://m.baidu.com',
    width: 375,
    height: 0,
    deviceScaleFactor: 3,
    isMobile: true,
  };
  const headers = {
    'Content-Type': 'application/json',
  };
  // 发送请求
  return http.post('http://localhost:3000/api/generate', JSON.stringify(data), { headers });
};

export default function () {
  const res = apiRun();
  // 校验响应状态码
  check(res, {
    'status is 200': r => r.status === 200,
  });

  sleep(0.5); // 每个虚拟用户每次请求后等待 0.33 秒
}
