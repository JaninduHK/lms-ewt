const crypto = require('crypto');

// Build the start-payment hash that PayHere expects in the checkout form
const generateHash = ({ merchantId, orderId, amount, currency, secret }) => {
  const md5Secret = crypto.createHash('md5').update(secret).digest('hex').toUpperCase();
  const formattedAmount = Number(amount).toFixed(2);
  const hashStr = `${merchantId}${orderId}${formattedAmount}${currency}${md5Secret}`;
  return crypto.createHash('md5').update(hashStr).digest('hex').toUpperCase();
};

// Verify the notify webhook signature
const verifyNotifyHash = (body, secret) => {
  const md5Secret = crypto.createHash('md5').update(secret).digest('hex').toUpperCase();
  const local = crypto
    .createHash('md5')
    .update(
      body.merchant_id +
      body.order_id +
      body.payhere_amount +
      body.payhere_currency +
      body.status_code +
      md5Secret
    )
    .digest('hex')
    .toUpperCase();
  return local === body.md5sig;
};

module.exports = { generateHash, verifyNotifyHash };
