const amqplib = require('amqplib');
const notificationService = require('./services/notificationService');

const RABBIT = process.env.RABBITMQ_URL || 'amqp://rabbitmq:5672';
const EXCHANGE = 'payments_exchange';
const Q_REQUESTED = 'payment_requested';
const Q_CONFIRMED = 'payment_confirmed';

async function connectWithRetry(url, retries = 0) {
  while (true) {
    try {
      const conn = await amqplib.connect(url);
      return conn;
    } catch (err) {
      const wait = Math.min(30000, 1000 * Math.pow(2, Math.min(retries, 6)));
      console.error(`[notification-service] amqp connect failed (${err.message || err}). retrying in ${wait}ms`);
      await new Promise(r => setTimeout(r, wait));
      retries++;
    }
  }
}

async function start() {
  const conn = await connectWithRetry(RABBIT);
  const channel = await conn.createChannel();
  await channel.assertExchange(EXCHANGE, 'direct', { durable: true });

  await channel.assertQueue(Q_REQUESTED, { durable: true });
  await channel.assertQueue(Q_CONFIRMED, { durable: true });
  await channel.bindQueue(Q_REQUESTED, EXCHANGE, 'payment.requested');
  await channel.bindQueue(Q_CONFIRMED, EXCHANGE, 'payment.confirmed');

  await channel.consume(Q_REQUESTED, msg => {
    if (!msg) return;
    try {
      const data = JSON.parse(msg.content.toString());
      console.log(`[notification-service] Received payment.requested for ${data.id} user=${data.userEmail}`);
      notificationService.record({ id: data.id, type: 'requested', data, receivedAt: Date.now() });
      channel.ack(msg);
    } catch (err) {
      console.error('consumer requested error', err);
      channel.nack(msg, false, false);
    }
  }, { noAck: false });

  await channel.consume(Q_CONFIRMED, msg => {
    if (!msg) return;
    try {
      const data = JSON.parse(msg.content.toString());
      console.log(`[notification-service] Received payment.confirmed for ${data.id} user=${data.userEmail}`);
      notificationService.record({ id: data.id, type: 'confirmed', data, receivedAt: Date.now() });
      channel.ack(msg);
    } catch (err) {
      console.error('consumer confirmed error', err);
      channel.nack(msg, false, false);
    }
  }, { noAck: false });

  console.log('[notification-service] connected to rabbitmq and consuming queues');
}

module.exports = { start };