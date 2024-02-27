const Course = require('../models/courses')
const User = require('../models/users');
const ServerError = require('../errors/ServerError');
const BadRequestError = require('../errors/BadRequestError');
const NotFoundError = require('../errors/NotFoundError');
const ForbiddenError = require('../errors/ForbiddenError');

// Обрабатываем добавление курса.
module.exports.createCourse = async (req, res, next) => {
  try {
    // Проверяем найден ли пользователь и админ ли он.
    const user = await User.findById(req.user._id);
    if (!user) return next(new NotFoundError('Пользователь не найден.'));
    if (!user.is_admin) return next(new ForbiddenError('Добавлять курс может только админ'));

    // Создаем новый курс.
    const newCourse = await Course.create(req.body)

    // Возвращаем созданный курс.
    res.send(newCourse);
  } catch (err) {
    if (err.name === 'ValidationError') return next(new BadRequestError('Переданы некорректные данные.'));

    return next(new ServerError(err.message));
  };
}

// Возвращаем все курсы.
module.exports.getAllCourses = (req, res, next) => {
  Course.find({})
    .then((courses) => res.send(courses))
    .catch((err) => next(new ServerError(err.message)));
}

// Модифицируем курс.
module.exports.modifyCourse = async (req, res, next) => {
  try {
    // Проверяем найден ли пользователь и админ ли он.
    const user = await User.findById(req.user._id);
    if (!user) return next(new NotFoundError('Пользователь не найден.'));
    if (!user.is_admin) return next(new ForbiddenError('Изменять курс может только админ'));

    // Обновляем курс.
    const course = await Course.findByIdAndUpdate(req.params._id, req.body, { new: true });

    if (!course) return next(new NotFoundError('Курс не найден.'));

    res.send(course);
  } catch (err) {
    if (err.name === 'ValidationError') return next(new BadRequestError('Переданы некорректные данные курса.'));

    return next(new ServerError(err.message));
  };
}
