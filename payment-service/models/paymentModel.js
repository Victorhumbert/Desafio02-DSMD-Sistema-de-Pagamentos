const db = require('../db');

exports.create = async (data) => db.createPayment(data);
exports.updateStatus = async (id, status) => db.updatePaymentStatus(id, status);
exports.findById = async (id) => db.getPayment(id);