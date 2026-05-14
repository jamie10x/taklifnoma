module.exports = {
  apps: [
    {
      name: 'taklifnoma',
      script: 'bun',
      args: 'run start -- -H 127.0.0.1 -p 3000',
      interpreter: 'none',
      cwd: '/var/www/taklifnoma',
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};

