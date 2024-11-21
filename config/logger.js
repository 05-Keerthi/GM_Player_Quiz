const morgan = require('morgan');

const logger = (app) => {
  app.use(morgan('dev'));
};

module.exports = logger;
