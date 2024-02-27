const { celebrate, Joi } = require('celebrate');

module.exports.celebrateCreateCourse = celebrate({
  body: Joi.object().keys({
    name: Joi.string().min(2).max(30).required(),
    description: Joi.string().min(2).max(700).required(),
    level: Joi.string().min(2).max(50).required(),
    content: Joi.string().min(2).max(50).required(),
    technique: Joi.string().min(2).max(50).required(),
    number_of_lessons: Joi.number().integer().min(1).max(99).required(),
    gift: Joi.boolean().required(),
    price_rub: Joi.number().required(),
  }),
});

module.exports.celebrateModifyCourse = celebrate({
  body: Joi.object().keys({
    name: Joi.string().min(2).max(30).required(),
    description: Joi.string().min(2).max(700).required(),
    level: Joi.string().min(2).max(50).required(),
    content: Joi.string().min(2).max(50).required(),
    technique: Joi.string().min(2).max(50).required(),
    number_of_lessons: Joi.number().integer().min(1).max(99).required(),
    gift: Joi.boolean().required(),
    price_rub: Joi.number().required(),
  }),
  params: Joi.object({
    _id: Joi.string().hex().length(24).required(),
  }).required(),
});
