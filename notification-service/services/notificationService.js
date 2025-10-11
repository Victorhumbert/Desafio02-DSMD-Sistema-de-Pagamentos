const notifications = [];

exports.record = (entry) => {
  notifications.push(entry);
};

exports.list = () => notifications.slice().reverse();