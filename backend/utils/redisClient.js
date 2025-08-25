const redis = require('redis');

const isTrue = (v) => String(v).toLowerCase() === 'true';

const client = redis.createClient({
  socket: {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
    tls: isTrue(process.env.REDIS_TLS) ? {} : undefined, // only enable if REDIS_TLS=true
  },
  username: process.env.REDIS_USERNAME,
  password: process.env.REDIS_PASSWORD,
});

client.on('connect', () => console.log('✅ Redis connected'));
client.on('reconnecting', () => console.log('🔄 Redis reconnecting...'));
client.on('end', () => console.log('🔌 Redis connection closed'));
client.on('error', (err) => console.error('❌ Redis error:', err));

let started = false;
async function ensureConnected() {
  if (!started) {
    started = true;
    await client.connect();
    try { await client.clientSetName('skillsprint-backend'); } catch {}
    try { await client.ping(); } catch (e) { console.error('Redis ping failed', e); }
  }
}
module.exports = { client, ensureConnected };
