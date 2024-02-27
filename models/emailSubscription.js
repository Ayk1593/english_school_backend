const mongoose = require('mongoose');
const { emailRegex } = require('../utils/regexp')

const emailSubscriptionSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
    required: true,
    validate: {
      validator: (email) => emailRegex.test(email),
      message: () => 'Введите корректный email в формате xxx@yyy.zzz',
    },
  },
  date: {
    type: Date,
  },
}, { versionKey: false });

module.exports = mongoose.model('emailSubscription', emailSubscriptionSchema);
