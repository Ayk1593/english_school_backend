const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
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
  number_of_lessons: {
    type: Number,
    min: 1,
    max: 99,
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
}, { versionKey: false })

module.exports = mongoose.model('course', courseSchema)