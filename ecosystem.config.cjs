module.exports = {
  apps: [
    {
      name: 'api-kesehatan',
      script: 'apps/backend/dist/index.js',
      cwd: './',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '512M',
      kill_timeout: 10000,
      env: {
        PORT: 3000,
        NODE_ENV: 'production'
      },
      error_file: './logs/api-error.log',
      out_file: './logs/api-out.log',
      merge_logs: true,
      time: true
    }
  ]
};
