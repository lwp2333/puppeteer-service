module.exports = {
  apps: [
    {
      name: 'puppeteer-service',
      script: 'dist/index.js',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '1024M',
      env: {
        PORT: 9000,
        NODE_ENV: 'production',
      },
    },
  ],
};
