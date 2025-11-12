/**
 * Generate a random 5-character alphanumeric access key
 * @returns {string} A 5-character alphanumeric key
 */
const generateAccessKey = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let key = '';
  for (let i = 0; i < 5; i++) {
    key += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return key;
};

/**
 * Validate if a string is a valid 5-character alphanumeric key
 * @param {string} key - The key to validate
 * @returns {boolean} True if valid, false otherwise
 */
const validateAccessKey = (key) => {
  return /^[A-Z0-9]{5}$/.test(key);
};

module.exports = {
  generateAccessKey,
  validateAccessKey
};
