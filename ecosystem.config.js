module.exports = {
  apps: [
    {
      name: 'puppeteer-service',
      script: 'dist/index.js',
      instances: 2,
      exec_mode: 'cluster',
      max_memory_restart: '2048M',
      env: {
        PORT: 9000,
        NODE_ENV: 'production',
      },
    },
  ],
};
