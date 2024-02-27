const router = require('express').Router();

// Получаем схемы валидации входящих запросов через celebrate.
const {
  celebrateChangeName,
  celebrateChangeEmailSubscription,
  celebrateChangeLangLevel,
  celebrateChangeWorkbook,
  celebrateChangeLessons,
  celebrateAddCourseToUser,
  celebrateUpdateUserCourseProgress,
} = require('../validators/users');

// Получаем данные функций обработчиков запросов из "/controllers".
const {
  getCurrentUser,
  updateUser,
  updateUserEmailSubscription,
  updateUserAvatar,
  updateUserLangLevel,
  updateUserChangeWorkbook,
  updateUserChangeLessons,
  addCourseToUser,
  UpdateUserCourseProgress
} = require('../controllers/users');


// Получаем текущего пользователя.
router.get('/me', getCurrentUser);

// Обновляем имя пользователя.
router.patch('/me', celebrateChangeName, updateUser);

// Обновляем Email подписку пользователя.
router.patch('/me/email-subscription', celebrateChangeEmailSubscription, updateUserEmailSubscription);

// Обновляем аватар пользователя.
router.patch('/me/avatar', updateUserAvatar);

// Обновляем уровень языка пользователя.
router.patch('/me/lang-level', celebrateChangeLangLevel, updateUserLangLevel);

// Обновляем факт покупки рабочей тетради.
router.patch('/me/workbook', celebrateChangeWorkbook, updateUserChangeWorkbook);

// Обновляем факт покупки уроков.
router.patch('/me/lessons', celebrateChangeLessons, updateUserChangeLessons);

// Добавляем купленный курс.
router.patch('/me/add-course', celebrateAddCourseToUser, addCourseToUser);

// Обновляем пройденные уроки в курсе пользователя.
router.patch('/me/update-course', celebrateUpdateUserCourseProgress, UpdateUserCourseProgress);

module.exports = router;
