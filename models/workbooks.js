const mongoose = require('mongoose');

const workbookSchema = new mongoose.Schema({
  name: {
    type: String,
    minlength: 2,
    maxlength: 30,
    required: true,
  },
  description: {
    type: String,
    minlength: 2,
    maxlength: 700,
    required: true,
  },
  level: {
    type: String,
    minlength: 2,
    maxlength: 50,
    required: true,
  },
  content: {
    type: String,
    minlength: 2,
    maxlength: 50,
    required: true,
  },
  technique: {
    type: String,
    minlength: 2,
    maxlength: 50,
    required: true,
  },
  gift: {
    type: Boolean,
    required: true,
  },
  price_rub: {
    type: Number,
    required: true,
  },
  price_rub_old: {
    type: Number,
  },
}, { versionKey: false })

module.exports = mongoose.model('workbook', workbookSchema)