/**
 * Simulates a slow database query.
 * 
 * @param {number|string} productId - ID of the product to query
 * @param {number} delayMs - Delay in milliseconds (defaults to 2000ms)
 * @returns {Promise<object>} Resolved product details
 */
function simulateDbQuery(productId, delayMs = 2000) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id: productId,
        name: 'Gaming Laptop',
        source: 'Database (Slow Query)'
      });
    }, delayMs);
  });
}

module.exports = {
  simulateDbQuery
};
