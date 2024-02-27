const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  date: {
    type: Date,
  },
  user_id: {
    type: String,
    required: true,
  },
  idempotence_key: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  type_id: {
    type: String,
    required: true,
  },
  request_token_result: {
    type: Object,
  },
  payment_result: {
    type: Array,
  },
}, { versionKey: false })

module.exports = mongoose.model('payment', paymentSchema)