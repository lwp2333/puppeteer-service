const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config();

async function checkChromium() {
  // 指定全局 Chromium 路径，支持通过环境变量 CHROMIUM_PATH 覆盖
  const chromiumPath = process.env.CHROMIUM_PATH || '/usr/local/lib/chrome';

  // 检查 Chromium 文件是否存在
  if (!fs.existsSync(chromiumPath)) {
    console.error('❌ Chromium 文件不存在:', chromiumPath);
    process.exit(1);
  }
  console.log('✅ Chromium 文件存在:', chromiumPath);

  try {
    // require 全局 Puppeteer
    const puppeteer = require('puppeteer');

    // 尝试启动 Puppeteer 并打开一个页面
    const browser = await puppeteer.launch({
      headless: true,
      executablePath: chromiumPath,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
    });

    const page = await browser.newPage();
    await page.goto('https://m.baidu.com', { waitUntil: 'networkidle2', timeout: 10000 });

    console.log('✅ Puppeteer 成功打开页面！');
    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Puppeteer 启动 Chromium 失败:', err.message);
    process.exit(1);
  }
}

// 立即执行
checkChromium();
