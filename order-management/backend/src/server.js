require('dotenv').config();

const createApp = require('./app');
const connectDB = require('./config/db');
const startInternalScheduler = require('./jobs/statusUpdateCron');

async function start() {
  await connectDB();

  const app = createApp();
  const PORT = process.env.PORT || 5000;

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
    startInternalScheduler();
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
