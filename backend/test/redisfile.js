const redis = require('redis');

const client = redis.createClient({
  socket: {
    host: 'redis-15834.c82.us-east-1-2.ec2.redns.redis-cloud.com',
    port: 15834
    // ❌ no tls here, remove it
  },
  username: 'default',
  password: 'qs3Yu90bMyBEHC55tEh5oTYr1RIgGVLw',
});

client.on('connect', () => console.log('✅ Connected to Redis Cloud'));
client.on('error', (err) => console.error('❌ Redis error:', err));

(async () => {
  await client.connect();
  await client.set('testKey', 'hello');
  console.log('Value:', await client.get('testKey'));
  await client.quit();
})();
