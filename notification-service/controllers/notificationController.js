const notificationService = require('../services/notificationService');

exports.list = (req, res) => {
  res.json(notificationService.list());
};