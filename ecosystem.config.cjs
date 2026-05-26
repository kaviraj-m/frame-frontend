module.exports = {
  apps: [
    {
      name: "frame-frontend",
      cwd: __dirname,
      script: "npm",
      args: "run preview -- --host 127.0.0.1 --port 3015",
      instances: 1,
      autorestart: true,
      watch: false,
      time: true,
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
