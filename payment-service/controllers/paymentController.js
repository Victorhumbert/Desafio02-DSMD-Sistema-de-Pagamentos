const paymentService = require('../services/paymentService');

exports.createPayment = async (req, res) => {
  try {
    const { amount, userEmail } = req.body;
    if (!amount || !userEmail) return res.status(400).json({ error: 'amount and userEmail required' });

    const payment = await paymentService.create({ amount, userEmail });
    res.status(201).json(payment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'internal' });
  }
};

exports.getPayment = async (req, res) => {
  try {
    const payment = await paymentService.findById(req.params.id);
    if (!payment) return res.status(404).json({ error: 'not found' });
    res.json(payment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'internal' });
  }
};