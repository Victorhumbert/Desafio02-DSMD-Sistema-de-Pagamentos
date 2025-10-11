const express = require('express');
const bodyParser = require('body-parser');
const paymentRoutes = require('./routes/payments');
const { initDb } = require('./db');
const publisher = require('./publisher');

const PORT = process.env.PORT || 3000;

async function start() {
  await initDb();
  await publisher.connect();

  const app = express();
  app.use(bodyParser.json());

  app.use('/payments', paymentRoutes);

  app.get('/health', (req, res) => res.json({ status: 'ok' }));

  app.listen(PORT, () => {
    console.log(`payment-service listening on ${PORT}`);
  });
}

start().catch(err => {
  console.error(err);
  process.exit(1);
});