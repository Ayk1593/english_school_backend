const router = require('express').Router();

// Получаем схемы валидации входящих запросов через celebrate.
const { celebrateCreatePayment } = require('../validators/payments');

// Получаем данные функций обработчиков запросов из "/controllers".
const {
  createPayment,
  getPaymentStatus
} = require('../controllers/payments');

// Создаем платеж и записываем данные в БД.
router.post('/create-payment', celebrateCreatePayment, createPayment);

// Получить статус последнего платежа и обновить данные в БД.
router.get('/get-payment-status', getPaymentStatus);

module.exports = router;