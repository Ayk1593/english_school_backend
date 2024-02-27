// Модуль для запуска сервера в облаке. Командой "pm2 start pm2.config.cjs".

module.exports = {
  apps: [
    {
      name: 'english-school',
      script: 'app.js',
      env: {
        'NODE_ENV': 'production',
      },
    },
  ],
};
