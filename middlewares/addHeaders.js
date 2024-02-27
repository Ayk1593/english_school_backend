const addHeaders = (req, res, next) => {
  res.header("Access-Control-Allow-Credentials", "true"); // добавление заголовка
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
};

module.exports = addHeaders;
