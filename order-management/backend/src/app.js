const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const orderRoutes = require('./routes/orderRoutes');
const schedulerRoutes = require('./routes/schedulerRoutes');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: process.env.FRONTEND_ORIGIN || '*',
    })
  );
  app.use(express.json());
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

  app.get('/health', (req, res) => {
    res.status(200).json({ success: true, message: 'Server is healthy' });
  });

  app.use('/api/orders', orderRoutes);
  app.use('/api/scheduler', schedulerRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
