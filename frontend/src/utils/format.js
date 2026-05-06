export const formatLKR = (amount, currency = 'LKR') => {
  if (amount == null) return '';
  return `${currency} ${Number(amount).toLocaleString('en-LK', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

export const monthName = (m) => {
  const names = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  return names[m - 1] || '';
};

export const initials = (first = '', last = '') =>
  `${first[0] || ''}${last[0] || ''}`.toUpperCase();
