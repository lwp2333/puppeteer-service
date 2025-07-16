module.exports = {
  apps: [
    {
      name: 'puppeteer-service',
      script: 'dist/index.js',
      instances: 'max',
      exec_mode: 'cluster',
      max_memory_restart: '1024M',
      env: {
        PORT: 3000,
        NODE_ENV: 'production',
      },
    },
  ],
};
