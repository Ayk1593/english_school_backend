const rateLimit = require('express-rate-limit');

const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // Ограничиваем время запросов 15 минутами;
  max: 100, // Ограничиваем лимит запросов с одного IP 100шт. за 15 минут;
});

module.exports = rateLimiter;
