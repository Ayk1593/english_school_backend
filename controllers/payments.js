const { YooCheckout } = require('@a2seven/yoo-checkout');
const { ICreatePayment } = require('@a2seven/yoo-checkout');
const User = require('../models/users');
const Payment = require('../models/payments');
const Course = require('../models/courses')
const Workbook = require('../models/workbooks')
const ServerError = require('../errors/ServerError');
const BadRequestError = require('../errors/BadRequestError');
const NotFoundError = require('../errors/NotFoundError');
const ConflictError = require('../errors/ConflictError');
const { now } = require('mongoose');


// Создаем платеж и записываем данные в БД.
module.exports.createPayment = async (req, res, next) => {
  const { idempotenceKey, type, type_id } = req.body;
  const userId = req.user._id

  try {
    // Проверяем, что есть такой пользователь.
    const user = await User.findById(userId);
    if (!user) return next(new NotFoundError('Пользователь не найден.'));

    // Проверяем корректность объекта платежа.
    if (!["workbook", "lesson", "course"].includes(type)) return next(new BadRequestError('Передан неверный тип объекта платежа'));

    // Если Продукт куплен, то уходим в ошибку.
    let alreadyBoughtThisProduct;
    if (type === "workbook") {
      alreadyBoughtThisProduct = user.workbooks.some((workbook) => workbook.type_id === type_id);
    }
    if (type === "course") {
      alreadyBoughtThisProduct = user.courses.some((course) => course.type_id === type_id);
    }
    if (alreadyBoughtThisProduct) return next(new ConflictError('Вы уже покупали этот продукт'));

    // Находим объект платежа и получаем цену.
    let objectOfPurchase;
    if (type === "course") {
      objectOfPurchase = await Course.findById(type_id);
    }
    if (type === "workbook") {
      objectOfPurchase = await Workbook.findById(type_id);
    }


    if (!objectOfPurchase) return next(new NotFoundError('Объект платежа с таким id не найден'));
    const priсe = objectOfPurchase.price_rub;

    // Создаем экземпляр платежа и его тело.
    const checkout = new YooCheckout({ shopId: '208764', secretKey: 'test_J3BEsxeNbDhUnJYUa7Dvu6lwfGRealTxJSbMPqvfs_I' });
    const createPayload = {
      amount: {
        value: priсe,
        currency: 'RUB'
      },
      confirmation: {
        type: 'embedded'
      },
      "capture": true,
      "description": type_id
    };

    const yooPayment = await checkout.createPayment(createPayload, idempotenceKey);

    // Возвращаем ошибку, если ошибка платежа у этого idempotenceKey.
    if (yooPayment.status === "canceled") {
      await Payment.create({ date: Date.now(), user_id: userId, idempotence_key: idempotenceKey, type, type_id, request_token_result: yooPayment });
      return next(new BadRequestError(JSON.stringify(yooPayment)));
    }

    // Создаем запись в нашей БД.
    const requestTokenResult = await Payment.create({ date: Date.now(), user_id: userId, idempotence_key: idempotenceKey, type, type_id, request_token_result: yooPayment });

    // Обрабатываем ошибку записи в БД.
    if (!requestTokenResult) return next(new BadRequestError('Ошибка записи в БД.'));

    // Получаем данные для записи в аккаунт пользователя.
    const localPaymentId = requestTokenResult._id;
    const { id: yooPaymentId, amount, status } = yooPayment
    const confirmationToken = yooPayment.confirmation.confirmation_token;

    // Формируем объект с данными платежа
    const paymentResult = {
      date: new Date(),
      type,
      type_id,
      localPaymentId,
      yooPaymentId,
      confirmationToken,
      amount,
      status
    }

    // Добавляем к массиву существующих платежей пользователя.
    const updatedUser = await User.findByIdAndUpdate(userId, { $push: { payments: paymentResult } }, { new: true })

    // На всякий случай.
    if (!updatedUser) return next(new NotFoundError('Пользователь не найден во время добавления курса'));

    res.send({ status, confirmationToken });
  } catch (err) {
    // Если ошибка yoopay.
    if (err.response) {
      const yooError = err.response.data;
      await Payment.create({ date: Date.now(), user_id: userId, idempotence_key: idempotenceKey, type, type_id, request_token_result: yooError });
      return next(new BadRequestError(JSON.stringify(yooError)));
    }

    await Payment.create({ date: Date.now(), user_id: userId, idempotence_key: idempotenceKey, type, type_id, request_token_result: err });
    return next(new ServerError(err.message));
  }
};

// Получить статус последнего платежа и обновить данные в БД.
module.exports.getPaymentStatus = async (req, res, next) => {
  const userId = req.user._id

  try {
    // Проверяем, что есть такой пользователь.
    const user = await User.findById(userId);
    if (!user) return next(new NotFoundError('Пользователь не найден.'));

    // Получаем последний платеж пользователя и его данные.
    const lastPayment = user.payments.at(-1);
    const { localPaymentId, yooPaymentId, type, type_id } = lastPayment;

    // Создаем экземпляр платежа и его тело.
    const checkout = new YooCheckout({ shopId: '208764', secretKey: 'test_J3BEsxeNbDhUnJYUa7Dvu6lwfGRealTxJSbMPqvfs_I' });

    const paymentStatusResult = await checkout.getPayment(yooPaymentId);

    // Добавляем в БД платежей результат платежа.
    const updateDbPayment = await Payment.findByIdAndUpdate(localPaymentId, { $push: { payment_result: { data: new Date(), paymentStatusResult } } }, { new: true })
    if (!updateDbPayment) return next(new NotFoundError('Такого платежа не существует.'));

    // Обрабатываем статусы платежа. Если статус платежа не изменился:
    const { status } = paymentStatusResult;
    if (status === lastPayment.status) return res.send({ status: paymentStatusResult.status });

    // Если изменился, то обновляем статус последнего платежа в БД пользователя.
    const lastPaymentUpdate = {
      ...lastPayment,
      status
    }
    const payments = user.payments;
    payments[payments.length - 1] = lastPaymentUpdate;

    const updatedUser = await User.findByIdAndUpdate(userId, { payments }, { new: true })
    // На всякий случай.
    if (!updatedUser) return next(new NotFoundError('Пользователь не найден во время обновления статуса'));

    // И если статус "succeeded" и это Курс - добавляем в купленные в БД пользователя.
    if (status === "succeeded" && type === "course") {
      // Проверяем, что у пользователя еще не куплен этот курс.
      const alreadyHasThisCourse = user.courses.some((course) => course.type_id === type_id);
      if (alreadyHasThisCourse) return next(new ConflictError('У пользователя уже куплен этот курс'));

      // Находим курс в БД.
      const course = await Course.findById(type_id);
      if (!course) return next(new NotFoundError('Такого курса не существует.'));

      // Создаем новый курс.
      const newCourse = {
        type_id,
        purchase_date: new Date(),
        progress: Array(course.number_of_lessons).fill(false),
      }

      // Добавляем к массиву существующих курсов и обновляем данные у пользователя.
      const updatedUser = await User.findByIdAndUpdate(userId, { $push: { courses: newCourse } }, { new: true })

      // На всякий случай.
      if (!updatedUser) return next(new NotFoundError('Пользователь не найден во время добавления курса'));
    }

    // И если статус "succeeded" и это Рабочая тетрадь - добавляем в купленные в БД пользователя.
    if (status === "succeeded" && type === "workbook") {
      // Проверяем, что у пользователя еще не куплена это рабочая тетрадь.
      const alreadyHasThisWorkbook = user.workbooks.some((workbook) => workbook.type_id === type_id);
      if (alreadyHasThisWorkbook) return next(new ConflictError('У пользователя уже куплена эта рабочая тетрадь'));

      // Находим рабочую тетрадь в БД.
      const workbook = await Workbook.findById(type_id);
      if (!workbook) return next(new NotFoundError('Такой рабочей тетради не существует.'));

      // Создаем новую рабочую тетрадь.
      const newWorkbook = {
        type_id,
        purchase_date: new Date(),
      }

      // Добавляем к массиву существующих рабочих тетрадей и обновляем данные у пользователя.
      const updatedUser = await User.findByIdAndUpdate(userId, { $push: { workbooks: newWorkbook } }, { new: true })

      // На всякий случай.
      if (!updatedUser) return next(new NotFoundError('Пользователь не найден во время добавления рабочей тетради'));
    }

    res.send({ status: paymentStatusResult.status });
  } catch (err) {
    if (err.response?.status === 401) return next(new BadRequestError('Неверные данные магазина'));

    if (err.response?.status === 404) return next(new NotFoundError('Платеж не найдет в Yoopay'));

    return next(new ServerError(err.message));
  };
};