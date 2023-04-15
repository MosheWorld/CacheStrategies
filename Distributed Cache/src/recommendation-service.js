const redis = require('./utils/redis-client');
const { simulateDbQuery } = require('./utils/db');

const startTime = Date.now();
function log(message) {
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`[Recommendation Service] [T+${elapsed}s] ${message}`);
}
const PRODUCT_KEY = 'product:42';

async function performCheck() {
  log(`Check Redis cache for "${PRODUCT_KEY}"...`);
  
  const startCheck = Date.now();
  let cachedData = null;
  try {
    cachedData = await redis.get(PRODUCT_KEY);
  } catch (err) {
    log(`Redis connectivity error: ${err.message}`);
    return;
  }
  const latency = Date.now() - startCheck;
  
  if (cachedData) {
    log(`Check Redis cache for "${PRODUCT_KEY}" -> [CACHE HIT] (took ${latency}ms)`);
    log(`Bypassed database query. Returned: ${cachedData}`);
  } else {
    log(`Check Redis cache for "${PRODUCT_KEY}" -> [CACHE MISS] (Expired/Not Found) (took ${latency}ms)`);
    log(`Executing slow database query for "${PRODUCT_KEY}"...`);
    
    const dbProduct = await simulateDbQuery(42);
    log(`DB Query finished (took 2000ms). Returning: "${dbProduct.name}"`);
    
    log(`Populating Redis with "${PRODUCT_KEY}" (TTL: 10s)`);
    await redis.set(PRODUCT_KEY, JSON.stringify(dbProduct), 'EX', 10);
  }
}

async function run() {
  // Perform check at absolute T = 4s
  setTimeout(async () => {
    await performCheck();
  }, 4000);

  // Perform check at absolute T = 13s
  setTimeout(async () => {
    await performCheck();
  }, 13000);

  // Exit at absolute T = 20s (gives Catalog Service time to complete at T=18s)
  setTimeout(() => {
    redis.quit();
    log('Finished simulation workflow. Exiting...');
    process.exit(0);
  }, 20000);
}

run();
