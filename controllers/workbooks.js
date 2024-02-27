const Workbook = require('../models/workbooks')
const User = require('../models/users');
const ServerError = require('../errors/ServerError');
const BadRequestError = require('../errors/BadRequestError');
const NotFoundError = require('../errors/NotFoundError');
const ForbiddenError = require('../errors/ForbiddenError');

// Обрабатываем добавление рабочей тетради.
module.exports.createWorkbook = async (req, res, next) => {
  try {
    // Проверяем найден ли пользователь и админ ли он.
    const user = await User.findById(req.user._id);
    if (!user) return next(new NotFoundError('Пользователь не найден.'));
    if (!user.is_admin) return next(new ForbiddenError('Добавлять рабочую тетрадь может только админ'));

    // Создаем новую рабочую тетрадь.
    const newWorkbook = await Workbook.create(req.body)

    // Возвращаем созданную рабочую тетрадь.
    res.send(newWorkbook);
  } catch (err) {
    if (err.name === 'ValidationError') return next(new BadRequestError('Переданы некорректные данные.'));

    return next(new ServerError(err.message));
  };
}

// Возвращаем все рабочие тетради.
module.exports.getAllWorkbooks = (req, res, next) => {
  Workbook.find({})
    .then((workbooks) => res.send(workbooks))
    .catch((err) => next(new ServerError(err.message)));
}

// Модифицируем рабочую тетрадь.
module.exports.modifyWorkbook = async (req, res, next) => {
  try {
    // Проверяем найден ли пользователь и админ ли он.
    const user = await User.findById(req.user._id);
    if (!user) return next(new NotFoundError('Пользователь не найден.'));
    if (!user.is_admin) return next(new ForbiddenError('Изменять рабочую тетрадь может только админ'));

    // Обновляем рабочую тетрадь.
    const workbook = await Workbook.findByIdAndUpdate(req.params._id, req.body, { new: true });

    if (!workbook) return next(new NotFoundError('Рабочая тетрадь не найдена.'));

    res.send(workbook);
  } catch (err) {
    if (err.name === 'ValidationError') return next(new BadRequestError('Переданы некорректные данные рабочей тетради.'));

    return next(new ServerError(err.message));
  };
}
