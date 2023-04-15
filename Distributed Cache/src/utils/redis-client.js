require('dotenv').config();
const Redis = require('ioredis');

const host = process.env.REDIS_HOST || 'localhost';
const port = parseInt(process.env.REDIS_PORT || '6379', 10);
const password = process.env.REDIS_PASSWORD || undefined;

const redis = new Redis({
  host,
  port,
  password: password || undefined,
  retryStrategy(times) {
    return Math.min(times * 50, 2000);
  }
});

module.exports = redis;
