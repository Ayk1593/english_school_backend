const { celebrate, Joi } = require('celebrate');

module.exports.celebrateSubscribe = celebrate({
  body: Joi.object().keys({
    email: Joi.string().email().required(),
  }),
});