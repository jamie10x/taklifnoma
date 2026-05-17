module.exports = {
  apps: [
    {
      name: 'taklifnoma',
      script: '/root/web/taklifnoma/node_modules/next/dist/bin/next',
      args: 'start -H 127.0.0.1 -p 3009',
      cwd: '/root/web/taklifnoma',
      interpreter: 'none',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
