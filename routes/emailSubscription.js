const router = require('express').Router();

// Получаем схемы валидации входящих запросов через celebrate.
// const { celebrateCreateWorkbook, celebrateModifyWorkbook } = require('../validators/workbooks')

// Получаем данные функций обработчиков запросов из "/controllers".
const { getAllUnAuthSubscriptions } = require('../controllers/emailSubscription')

// Возвращаем список незарегистрированных пользователей, подписанных на расссылку.
router.get('/get-all', getAllUnAuthSubscriptions);

module.exports = router;