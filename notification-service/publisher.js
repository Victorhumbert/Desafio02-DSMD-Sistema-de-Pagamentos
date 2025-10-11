const amqplib = require('amqplib');

const RABBIT = process.env.RABBITMQ_URL || 'amqp://rabbitmq:5672';
const EXCHANGE = 'payments_exchange';

let channel;

async function connect(retries = 0) {
  while (true) {
    try {
      const conn = await amqplib.connect(RABBIT);
      channel = await conn.createChannel();
      await channel.assertExchange(EXCHANGE, 'direct', { durable: true });

      await channel.assertQueue('payment_requested', { durable: true });
      await channel.assertQueue('payment_confirmed', { durable: true });
      await channel.bindQueue('payment_requested', EXCHANGE, 'payment.requested');
      await channel.bindQueue('payment_confirmed', EXCHANGE, 'payment.confirmed');

      conn.on('error', () => {
        console.error('[notification publisher] connection error');
        channel = null;
      });
      conn.on('close', () => {
        console.error('[notification publisher] connection closed, will retry');
        channel = null;
        setTimeout(() => connect(0), 2000);
      });

      console.log('[notification publisher] connected to rabbitmq');
      return;
    } catch (err) {
      const wait = Math.min(30000, 1000 * Math.pow(2, Math.min(retries, 6)));
      console.error(`[notification publisher] connect failed (${err.message || err}). retrying in ${wait}ms`);
      await new Promise(r => setTimeout(r, wait));
      retries++;
    }
  }
}

module.exports = { connect };