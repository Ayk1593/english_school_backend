const router = require('express').Router();

// Получаем схемы валидации входящих запросов через celebrate.
const { celebrateCreateCourse, celebrateModifyCourse } = require('../validators/courses')

// Получаем данные функций обработчиков запросов из "/controllers".
const { createCourse, modifyCourse } = require('../controllers/courses')

// Добавляем курс.
router.post('/create', celebrateCreateCourse, createCourse);

// Обновляем курс.
router.patch('/modify/:_id', celebrateModifyCourse, modifyCourse);

module.exports = router;