const { celebrate, Joi } = require('celebrate');

module.exports.celebrateCreateUser = celebrate({
  body: Joi.object().keys({
    name: Joi.string().min(2).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().required(),
    user_agreement_accepted: Joi.boolean().required(),
    email_subscription: Joi.boolean(),
  }),
});

module.exports.celebrateLoginUser = celebrate({
  body: Joi.object().keys({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),
});

module.exports.celebrateChangeName = celebrate({
  body: Joi.object().keys({
    name: Joi.string().min(2).max(30).required(),
  }),
});

// Обновляем Email подписку пользователя.
module.exports.celebrateChangeEmailSubscription = celebrate({
  body: Joi.object().keys({
    email_subscription: Joi.boolean().required(),
  }),
});

// Обновляем уровень языка пользователя.
module.exports.celebrateChangeLangLevel = celebrate({
  body: Joi.object().keys({
    lang_level: Joi.string().length(2).required(),
  }),
});

// Обновляем факт покупки рабочей тетради.
module.exports.celebrateChangeWorkbook = celebrate({
  body: Joi.object().keys({
    workbook: Joi.boolean().required(),
  }),
});

// Обновляем факт покупки уроков.
module.exports.celebrateChangeLessons = celebrate({
  body: Joi.object().keys({
    lessons: Joi.boolean().required(),
  }),
});

// Добавляем купленный курс в User
module.exports.celebrateAddCourseToUser = celebrate({
  body: Joi.object().keys({
    course_id: Joi.string().hex().length(24).required(),
  }),
});

// Обновляем пройденные уроки в курсе пользователя.
module.exports.celebrateUpdateUserCourseProgress = celebrate({
  body: Joi.object().keys({
    course_id: Joi.string().hex().length(24).required(),
    lesson_number: Joi.number().integer().min(1).max(99).required(),
  }),
});
