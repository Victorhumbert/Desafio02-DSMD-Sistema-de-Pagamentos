const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const publisher = require('../publisher');

const EXCHANGE_KEYS = {
  REQUESTED: 'payment.requested',
  CONFIRMED: 'payment.confirmed'
};

exports.create = async ({ amount, userEmail }) => {
  const id = uuidv4();
  await db.createPayment({ id, amount, user_email: userEmail, status: 'pending' });
  const payload = { id, amount, userEmail, status: 'pending', timestamp: Date.now() };
  await publisher.send(EXCHANGE_KEYS.REQUESTED, payload);
  return { id, status: 'pending' };
};

exports.findById = async (id) => {
  return db.getPayment(id);
};

exports.confirm = async ({ id, amount, userEmail }) => {
  await db.updatePaymentStatus(id, 'success');
  const payload = { id, amount, userEmail, status: 'success', timestamp: Date.now() };
  await publisher.send(EXCHANGE_KEYS.CONFIRMED, payload);
  return payload;
};