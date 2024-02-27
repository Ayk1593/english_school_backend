const router = require('express').Router();

// Получаем схемы валидации входящих запросов через celebrate.
const { celebrateCreateWorkbook, celebrateModifyWorkbook } = require('../validators/workbooks')

// Получаем данные функций обработчиков запросов из "/controllers".
const { createWorkbook, modifyWorkbook } = require('../controllers/workbooks')

// Добавляем курс.
router.post('/create', celebrateCreateWorkbook, createWorkbook);

// Обновляем курс.
router.patch('/modify/:_id', celebrateModifyWorkbook, modifyWorkbook);

module.exports = router;