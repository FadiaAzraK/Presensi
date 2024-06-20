const express = require('express');
const config = require('./src/config');
const worker = require('./src');
const logger = require('./src/util/logger');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cors = require('cors');
const path = require('path');
const multer = require('multer');

const companyRoutes = require('./routes/company-router');
const superAdminRoutes = require('./routes/superAdmin-router');
const unitRoutes = require('./routes/unit-router');
const userRoutes = require('./routes/user-router');
const presenceRoutes = require('./routes/presensi-router');
const authRoutes = require('./src/routes/user-router');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(session({
  secret: 'secretPresenceToken',
  resave: true,
  saveUninitialized: true,
  store: MongoStore.create({ mongoUrl: process.env.DATABASE || 'mongodb://127.0.0.1:27017/presence' }),
  cookie: {
    maxAge: 60000
  }
}));

app.get('/', (req, res) => {
  res.send('Server is running');
});
app.use('/superAdmin/company', superAdminRoutes);
app.use('/company', companyRoutes);
app.use('/company/unit', unitRoutes);
app.use('/user', userRoutes);
app.use('/presence', presenceRoutes);
app.use('/auth', authRoutes);

app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).send('Something went wrong!');
});

async function main() {
  try {
    logger.info('Starting Worker..');

    await config.connectToMongoDB();
    const connectionRMQ = await config.RabbitMConnection();

    await worker.workerConsumer(connectionRMQ);

    setInterval(async () => {
      await worker.workerPublisher(connectionRMQ);
    }, 10000);

    subscribeToQueues();
  } catch (error) {
    logger.error('Error initializing services:', error);
  }
}

main();

const port = 8008;
app.listen(port, () => {
  logger.info(`Server is running on port ${port}`);
});