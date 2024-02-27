const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const User = require('../models/users');
const Course = require('../models/courses');
const ServerError = require('../errors/ServerError');
const BadRequestError = require('../errors/BadRequestError');
const NotFoundError = require('../errors/NotFoundError');
const ConflictError = require('../errors/ConflictError');
const { apiUrl } = require('../utils/constants')

// Обрабатываем логин пользователя.
module.exports.login = (req, res, next) => {
  const { email, password } = req.body;
  const { JWT_SECRET } = req.app.get('config');
  return User.findUserByCredentials(email, password)
    .then((user) => {
      const token = jwt.sign(
        { _id: user._id },
        JWT_SECRET,
        { expiresIn: '7d' },
      );
      res.send({ token });
    })
    .catch((err) => {
      if (err.name !== 'UnauthorizedError') {
        next(new ServerError(err.message));
      } else {
        next(err);
      }
    });
};

// Получаем пользователя по id.
module.exports.getCurrentUser = (req, res, next) => {
  User.findById(req.user._id)
    .then((user) => {
      if (user) {
        res.send(user);
      } else {
        next(new NotFoundError('Пользователь не найден.'));
      }
    })
    .catch((err) => {
      next(new ServerError(err.message));
    });
};

// Создаем пользователя.
module.exports.createUser = (req, res, next) => {
  // Получаем данные из req.body.
  const {
    email,
    password,
    name,
    user_agreement_accepted,
    email_subscription,
  } = req.body;

  // Создаем запись в БД и обрабатываем ошибку.
  bcrypt.hash(password, 10)
    .then((hash) => User.create({
      email,
      password: hash,
      name,
      user_agreement_accepted,
      email_subscription,
    }))
    .then((document) => {
      const user = document.toObject();
      delete user.password;
      res.send(user);
    })
    .catch((err) => {
      if (err.name === 'ValidationError') {
        next(new BadRequestError('Переданы некорректные данные.'));
      } else if (err.code === 11000) {
        next(new ConflictError('Пользователь с такой почтой уже существует'));
      } else {
        next(new ServerError(err.message));
      }
    });
};

// Обновляем имя пользователя.
module.exports.updateUser = (req, res, next) => {
  // Получаем данные из req.body.
  const { name } = req.body;
  const userId = req.user._id;
  User.findByIdAndUpdate(userId, { name }, { new: true })
    .then((user) => {
      if (user) {
        res.send(user);
      } else {
        throw (new NotFoundError('Пользователь не найден.'));
      }
    })
    .catch((err) => {
      if (err.name === 'ValidationError') {
        next(new BadRequestError(err.message));
      } else {
        next(err);
      }
    });
};

// Обновляем Email подписку пользователя.
module.exports.updateUserEmailSubscription = (req, res, next) => {
  // Получаем данные из req.body.
  const { email_subscription } = req.body;

  const userId = req.user._id;
  User.findByIdAndUpdate(userId, { email_subscription }, { new: true })
    .then((user) => {
      if (user) {
        res.send(user);
      } else {
        throw (new NotFoundError('Пользователь не найден.'));
      }
    })
    .catch((err) => {
      if (err.name === 'ValidationError') {
        next(new BadRequestError(err.message));
      } else {
        next(err);
      }
    });
};

// Создаем хранилище для загруженных файлов
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/avatars');
  },
  filename: async function (req, file, cb) {
    const userId = req.user._id
    // Получаем абсолютный путь к папке "public"
    const ext = path.extname(file.originalname);
    const filename = userId + ext;

    cb(null, filename);
  }
});

// Фильтр для проверки типа файла
const fileFilter = function (req, file, cb) {
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
    cb(null, true);
  } else {
    return cb(new Error('Разрешены только файлы jpeg, jpg и png'), false);
  }
};

// Создаем middleware для загрузки файла
const upload = multer({
  fileFilter: fileFilter,
  limits: {
    fileSize: 500000 // ограничение размера файла в байтах (500Кб)
  },
  storage: storage
}).single('avatar');

// Обновляем Avatar пользователя.
module.exports.updateUserAvatar = async (req, res, next) => {
  // Проверяем, что есть такой пользователь.
  const userId = req.user._id
  const user = await User.findById(userId);
  if (!user) return next(new NotFoundError('Пользователь не найден.'));

  // Загружаем файл с помощью middleware upload
  upload(req, res, async function (err) {
    if (err instanceof multer.MulterError) return next(new BadRequestError('Размер фото до 500кб'));
    if (err) return next(new BadRequestError(err.message));

    // Расширение и имя старого аватара.
    const ext = user.avatar.split(".").at(-1);
    const oldAvatar = `${userId}.${ext}`;

    // Удаляем старый аватар, если имена не совпадают.
    if (oldAvatar !== req.file.filename) {
      try {
        const publicPath = path.join(__dirname, '../public/avatars');
        const files = await fs.promises.readdir(publicPath);
        const fileToDelete = files.find(file => file === oldAvatar);
        if (fileToDelete !== "avatar-default.jpg") {
          const filePath = path.join(publicPath, fileToDelete);
          await fs.promises.unlink(filePath);
        }
      } catch (err) {
        console.log(`Ошибка удаления старого аватара ${err}`);
      }
    }

    // Получаем путь до файла из объекта запроса.
    const filePath = `${apiUrl}${req.file.path}`;

    // Сохраняем путь до файла в users.
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        { $set: { avatar: filePath } },
        { new: true }
      );

      res.send(user);

    } catch (error) {
      return next(new ServerError(err.message));
    }
  });
};

// Обновляем уровень языка пользователя.
module.exports.updateUserLangLevel = (req, res, next) => {
  // Получаем данные из req.body.
  const { lang_level } = req.body;

  const userId = req.user._id;
  User.findByIdAndUpdate(userId, { lang_level }, { new: true })
    .then((user) => {
      if (user) {
        res.send(user);
      } else {
        throw (new NotFoundError('Пользователь не найден.'));
      }
    })
    .catch((err) => {
      if (err.name === 'ValidationError') {
        next(new BadRequestError(err.message));
      } else {
        next(err);
      }
    });
};

// Обновляем факт покупки рабочей тетради.
module.exports.updateUserChangeWorkbook = (req, res, next) => {
  // Получаем данные из req.body.
  const { workbook } = req.body;

  const userId = req.user._id;
  User.findByIdAndUpdate(userId, { workbook }, { new: true })
    .then((user) => {
      if (user) {
        res.send(user);
      } else {
        throw (new NotFoundError('Пользователь не найден.'));
      }
    })
    .catch((err) => {
      if (err.name === 'ValidationError') {
        next(new BadRequestError(err.message));
      } else {
        next(err);
      }
    });
};

// Обновляем факт покупки уроков.
module.exports.updateUserChangeLessons = (req, res, next) => {
  // Получаем данные из req.body.
  const { lessons } = req.body;

  const userId = req.user._id;
  User.findByIdAndUpdate(userId, { lessons }, { new: true })
    .then((user) => {
      if (user) {
        res.send(user);
      } else {
        throw (new NotFoundError('Пользователь не найден.'));
      }
    })
    .catch((err) => {
      if (err.name === 'ValidationError') {
        next(new BadRequestError(err.message));
      } else {
        next(err);
      }
    });
};

// Добавляем купленный курс в User.courses.
module.exports.addCourseToUser = async (req, res, next) => {
  try {
    // Проверяем, что курс есть в списке.
    const courseId = req.body.course_id
    const course = await Course.findById(courseId);
    if (!course) return next(new NotFoundError('Такого курса не существует.'));

    // Проверяем, что есть такой пользователь.
    const userId = req.user._id
    const user = await User.findById(userId);
    if (!user) return next(new NotFoundError('Пользователь не найден.'));

    // Проверяем, что у пользователя еще не куплен этот курс.
    const alreadyHasThisCourse = user.courses.some((course) => course.courseId === courseId);
    if (alreadyHasThisCourse) return next(new ConflictError('У пользователя уже куплен этот курс'));

    // Создаем новый курс.
    const newCourse = {
      courseId,
      purchase_date: new Date(),
      progress: Array(course.number_of_lessons).fill(false),
    }

    // Добавляем к массиву существующих курсов и обновляем данные у пользователя.
    const updatedUser = await User.findByIdAndUpdate(userId, { $push: { courses: newCourse } }, { new: true })

    // На всякий случай.
    if (!updatedUser) return next(new NotFoundError('Пользователь не найден во время добавления курса'));

    res.send(updatedUser);
  } catch (err) {
    if (err.name === 'ValidationError') next(new BadRequestError('Переданы некорректные данные курса.'));

    return next(new ServerError(err.message));
  };
};

// Обновляем пройденные уроки в курсе пользователя.
module.exports.UpdateUserCourseProgress = async (req, res, next) => {
  try {
    // Проверяем, что курс есть в списке.
    const courseId = req.body.course_id
    const course = await Course.findById(courseId);
    if (!course) return next(new NotFoundError('Такого курса не существует.'));

    // Проверяем, что есть такой пользователь.
    const userId = req.user._id
    const user = await User.findById(userId);
    if (!user) return next(new NotFoundError('Пользователь не найден.'));

    // Проверяем, что у пользователя куплен этот курс.
    const userCourses = user.courses
    const userCourseId = userCourses.findIndex((course) => course.courseId === courseId);
    if (userCourseId === -1) return next(new NotFoundError('У пользователя не куплен этот курс'));

    // Проверяем, что номер законченного урока находится в пределах количества уроков в курсе.
    const { lesson_number } = req.body;
    if (lesson_number > userCourses[userCourseId].progress.length) return next(new ConflictError('Передан номер урока, превышающий количество уроков в курсе.'));

    // Меняем нужный урок на пройденный.
    userCourses[userCourseId].progress[lesson_number - 1] = true;

    // Обновляем массив существующих курсов и обновляем данные у пользователя.
    const updatedUser = await User.findByIdAndUpdate(userId, { courses: userCourses }, { new: true })

    // На всякий случай.
    if (!updatedUser) return next(new NotFoundError('Пользователь не найден во время добавления курса'));

    res.send(updatedUser);
  } catch (err) {
    if (err.name === 'ValidationError') next(new BadRequestError('Переданы некорректные данные курса.'));

    return next(new ServerError(err.message));
  };
};