const express = require('express');
const bodyParser = require('body-parser');
const notificationRoutes = require('./routes/notifications');
const consumer = require('./consumer');
const publisher = require('./publisher'); 

const PORT = process.env.PORT || 3001;

async function start() {
  await publisher.connect();
  await consumer.start();

  const app = express();
  app.use(bodyParser.json());

  app.use('/notifications', notificationRoutes);

  app.get('/health', (req, res) => res.json({ status: 'ok' }));

  app.listen(PORT, () => console.log(`notification-service listening on ${PORT}`));
}

start().catch(err => {
  console.error(err);
  process.exit(1);
});