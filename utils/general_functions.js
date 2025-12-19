/**
 * Remove password (or other sensitive keys) from a single object (shallow).
 */
function omitPassword(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const copy = { ...obj };
  if ('password' in copy) {
    delete copy.password;
  }
  return copy;
}

/**
 * Given an array of objects, return a new array where each object is sanitized.
 */
function omitPasswords(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.map(item => omitPassword(item));
}

module.exports = {
  omitPassword,
  omitPasswords,
};
