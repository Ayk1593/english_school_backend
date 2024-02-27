const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
const UnauthorizedError = require('../errors/UnauthorizedError');
const { apiUrl } = require('../utils/constants')
const { emailRegex, langLevelRegex } = require('../utils/regexp')

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
    required: true,
    validate: {
      validator: (email) => emailRegex.test(email),
      message: () => 'Введите корректный email в формате name@example.ru',
    },
  },
  password: {
    type: String,
    required: true,
    select: false,
  },
  name: {
    type: String,
    minlength: 2,
    maxlength: 30,
    required: true,
  },
  avatar: {
    type: String,
    default: `${apiUrl}public/avatars/avatar-default.jpg`,
  },
  user_agreement_accepted: {
    type: Boolean,
    required: true,
  },
  email_subscription: {
    type: Boolean,
    default: false,
  },
  lang_level: {
    type: String,
    length: 2,
    default: "no",
    validate: {
      validator: (lang_level) => langLevelRegex.test(lang_level),
      message: () => 'Введите корректный уровень языка "no" или "A1", "A2" и т.д.',
    },
  },
  workbooks: {
    type: Array,
    default: [],
  },
  lessons: {
    type: Array,
    default: [],
  },
  courses: {
    type: Array,
    default: [],
  },
  payments: {
    type: Array,
    default: [],
  },
  is_admin: {
    type: Boolean,
    default: false,
  },
}, { versionKey: false });

userSchema.statics.findUserByCredentials = function findUserByCredentials(email, password) {
  return this.findOne({ email }).select('+password')
    .then((data) => {
      if (!data) {
        return Promise.reject(new UnauthorizedError('Неправильные почта или пароль'));
      }
      return bcrypt.compare(password, data.password)
        .then((matched) => {
          if (!matched) {
            return Promise.reject(new UnauthorizedError('Неправильные почта или пароль'));
          }
          const user = data.toObject();
          delete user.password;
          return user;
        });
    });
};

module.exports = mongoose.model('user', userSchema);
