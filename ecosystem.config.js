module.exports = {
  apps: [
    {
      name: 'ewt-api',
      cwd: '/var/www/ewt/backend',
      script: 'server.js',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
      },
      out_file: '/var/log/pm2/ewt-api.out.log',
      error_file: '/var/log/pm2/ewt-api.err.log',
      time: true,
    },
  ],
};
