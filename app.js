const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const { errors } = require('celebrate');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const helmet = require('helmet');

// Получаем данные функций обработчиков запросов из "/controllers".
const { login, createUser } = require('./controllers/users');
const { getAllCourses } = require('./controllers/courses');
const { getAllWorkbooks } = require('./controllers/workbooks');
const { Subscribe } = require('./controllers/emailSubscription');

const auth = require('./middlewares/auth');

// Получаем схемы валидации входящих запросов через celebrate.
const { celebrateCreateUser, celebrateLoginUser } = require('./validators/users');
const { celebrateSubscribe } = require('./validators/emailSubscription');

const NotFoundError = require('./errors/NotFoundError');

// Получаем логгеры, rate-limit и централизованный обрабочик ошибок.
const { requestLogger, errorLogger } = require('./middlewares/logger');
const addHeaders = require('./middlewares/addHeaders');
const rateLimiter = require('./middlewares/rateLimit');
const errorHandler = require('./middlewares/errorHandler');

const { PORT = 3002, dbName = 'mongodb+srv://englishschoolbackend:102030@cluster0.de1p8fm.mongodb.net/englishschool?retryWrites=true&w=majority&appName=Cluster0' } = process.env
const app = express();

mongoose.set({ runValidators: true });
mongoose.connect(dbName);

// Обработка res.body в json.
app.use(bodyParser.json());

app.use(cors(
  {
    origin: '*',
    allowedHeaders: ['Content-Type', 'Authorization', 'enctype', 'Access-Control-Allow-Credentials'],
  },
));

// Записываем в конфиг соль для шифрования пароля.
const config = dotenv.config({
  path: path
    .resolve(process.env.NODE_ENV === 'production' ? '.env' : '.env.common'),
}).parsed;

app.set('config', config);

// Подключаем добавление заколовков в ответы.
app.use(addHeaders);

// Подключаем папку public.
app.use('/public', express.static(__dirname + '/public'));

// Подключаем логгер запросов для всех роутов.
app.use(requestLogger);

// Подключаем helmet для защиты приложения от некоторых широко известных веб-уязвимостей.
app.use(helmet());

// Подключаем rate-limit для ограничения количества запросов.
app.use(rateLimiter);

// Обрабатываем логин.
app.post('/signin', celebrateLoginUser, login);

// Обрабатываем регистрацию.
app.post('/signup', celebrateCreateUser, createUser);

// Возвращаем все курсы.
app.get('/course/get-courses', getAllCourses);

// Возвращаем все курсы.
app.get('/workbook/get-workbooks', getAllWorkbooks);

// Подписка на рассылку.
app.post('/email-subscription', celebrateSubscribe, Subscribe);

app.use(auth);

// Обрабатываем роуты пользователей - "/users".
app.use('/users', require('./routes/users'));

// Обрабатываем роуты курсов - "/course".
app.use('/course', require('./routes/courses'));

// Обрабатываем роуты рабочих тетрадей - "/course".
app.use('/workbook', require('./routes/workbooks'));

// Обрабатываем роуты платежей - "/payments".
app.use('/payments', require('./routes/payments'));

// Подписка на рассылку.
app.use('/subscription', require('./routes/emailSubscription'));

// Обрабатываем несуществующие роуты.
app.use((req, res, next) => next(new NotFoundError('Страница не найдена.')));

// Подключаем логгер ошибок.
app.use(errorLogger);

// Обработчик ошибок celebrate.
app.use(errors());

// Централизованный обработчик ошибок.
app.use(errorHandler);

app.listen(PORT, () => {
  // Если всё работает, консоль покажет, какой порт приложение слушает
  console.log(`App listening on port ${PORT}`);
});
