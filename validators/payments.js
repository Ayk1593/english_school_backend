const { celebrate, Joi } = require('celebrate');

module.exports.celebrateCreatePayment = celebrate({
  body: Joi.object().keys({
    idempotenceKey: Joi.string().required(),
    type: Joi.string().required(),
    type_id: Joi.string().hex().length(24).required(),
  }),
});

