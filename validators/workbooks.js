const { celebrate, Joi } = require('celebrate');

module.exports.celebrateCreateWorkbook = celebrate({
  body: Joi.object().keys({
    name: Joi.string().min(2).max(30).required(),
    description: Joi.string().min(2).max(700).required(),
    level: Joi.string().min(2).max(50).required(),
    content: Joi.string().min(2).max(50).required(),
    technique: Joi.string().min(2).max(50).required(),
    gift: Joi.boolean().required(),
    price_rub: Joi.number().required(),
    price_rub_old: Joi.number(),
  }),
});

module.exports.celebrateModifyWorkbook = celebrate({
  body: Joi.object().keys({
    name: Joi.string().min(2).max(30).required(),
    description: Joi.string().min(2).max(700).required(),
    level: Joi.string().min(2).max(50).required(),
    content: Joi.string().min(2).max(50).required(),
    technique: Joi.string().min(2).max(50).required(),
    gift: Joi.boolean().required(),
    price_rub: Joi.number().required(),
    price_rub_old: Joi.number(),
  }),
  params: Joi.object({
    _id: Joi.string().hex().length(24).required(),
  }).required(),
});
