const User = require('../models/users');
const EmailSubscription = require('../models/emailSubscription');
const ServerError = require('../errors/ServerError');
const BadRequestError = require('../errors/BadRequestError');
const NotFoundError = require('../errors/NotFoundError');
const ConflictError = require('../errors/ConflictError');
const ForbiddenError = require('../errors/ForbiddenError');


// Обрабатываем email подписку.
module.exports.Subscribe = async (req, res, next) => {
  const { email } = req.body;

  try {
    // Проверяем не зарегистрирован ли пользователь.
    const alreadyRegistered = await User.findOne({ email });
    if (alreadyRegistered?.email_subscription) return next(new ConflictError('Вы уже подписаны на email рассылку.'));
    if (alreadyRegistered?.email_subscription === false) {

      // Если зарегистрирован, но не подписан, то подписываем.
      const newUser = await User.findByIdAndUpdate(alreadyRegistered._id, { email_subscription: true }, { new: true })
      if (newUser) return res.send({ "message": "Теперь Вы подписаны на email рассылку." });
      return next(new NotFoundError('Ошибка обновления подписки у зарегистрированного пользователя. Пользователь не найден.'));
    };

    // Проверяем что еще не подписан для не зарегистрированного пользователя.
    const alreadyHasSubscription = await EmailSubscription.findOne({ email });
    if (alreadyHasSubscription) return next(new ConflictError('Вы уже подписаны на email рассылку.'));

    // Если нигде не подписан, то добавляем в БД.
    const addSubscription = await EmailSubscription.create({ email, date: new Date() });
    if (addSubscription) return res.send({ "message": "Теперь Вы подписаны на email рассылку." });
    return next(new BadRequestError('Ошибка добавления подписки в БД.'));

  } catch (err) {
    return next(new ServerError(err.message));
  }
};

// Возвращаем список незарегистрированных пользователей, подписанных на расссылку.
module.exports.getAllUnAuthSubscriptions = async (req, res, next) => {
  try {
    // Проверяем найден ли пользователь и админ ли он.
    const user = await User.findById(req.user._id);
    if (!user) return next(new NotFoundError('Пользователь не найден.'));
    if (!user.is_admin) return next(new ForbiddenError('Это может делать только админ'));

    // Если админ, то возвращаем все подписки.
    const allSubscriptions = await EmailSubscription.find({});
    res.send(allSubscriptions);
  } catch (err) {
    return next(new ServerError(err.message));
  };
}