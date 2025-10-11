const amqplib = require('amqplib');
const paymentService = require('./services/paymentService');
const publisher = require('./publisher');
const { initDb } = require('./db'); // <-- added

const RABBIT = process.env.RABBITMQ_URL || 'amqp://rabbitmq:5672';
const EXCHANGE = 'payments_exchange';
const QUEUE = 'payment_requested';

async function connectWithRetry(url, retries = 0) {
  while (true) {
    try {
      const conn = await amqplib.connect(url);
      return conn;
    } catch (err) {
      const wait = Math.min(30000, 1000 * Math.pow(2, Math.min(retries, 6)));
      console.error(`[payment-worker] amqp connect failed (${err.message || err}). retrying in ${wait}ms`);
      await new Promise(r => setTimeout(r, wait));
      retries++;
    }
  }
}

async function start() {
  // inicializa DB para que paymentService.update/use funcione no worker
  await initDb();

  // garante publisher com retry (usa o mesmo RABBIT)
  await publisher.connect();

  const conn = await connectWithRetry(RABBIT);
  const channel = await conn.createChannel();
  await channel.assertExchange(EXCHANGE, 'direct', { durable: true });

  await channel.assertQueue(QUEUE, { durable: true });
  await channel.bindQueue(QUEUE, EXCHANGE, 'payment.requested');

  console.log('[payment-worker] connected and waiting for payment.requested messages');

  await channel.consume(QUEUE, async (msg) => {
    if (!msg) return;
    try {
      const data = JSON.parse(msg.content.toString());
      console.log(`[payment-worker] processing payment ${data.id} for ${data.userEmail}`);

      await new Promise(r => setTimeout(r, 3000));

      // confirma via service (atualiza DB e publica payment.confirmed)
      await paymentService.confirm({ id: data.id, amount: data.amount, userEmail: data.userEmail });

      console.log(`[payment-worker] payment ${data.id} confirmed`);
      channel.ack(msg);
    } catch (err) {
      console.error('[payment-worker] error processing message', err);
      channel.nack(msg, false, true);
    }
  }, { noAck: false });
}

start().catch(err => {
  console.error(err);
  process.exit(1);
});