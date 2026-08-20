module.exports = {
  apps: [
    {
      name: 'api.sparks-learning.com',
      script: 'src/index.js',
      instances: 'max', // Or 1 depending on server vCPUs
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      // Log management
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
    },
  ],
};
