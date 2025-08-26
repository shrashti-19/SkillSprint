// utils/redisClient.js
// STEP 1: Keep your existing connection setup (it's good!)
const redis = require('redis');

const isTrue = (v) => String(v).toLowerCase() === 'true';

const client = redis.createClient({
  socket: {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
    tls: isTrue(process.env.REDIS_TLS) ? { rejectUnauthorized: false } : undefined,
  },
  username: process.env.REDIS_USERNAME,
  password: process.env.REDIS_PASSWORD,
});

// STEP 2: Keep your existing event handlers
client.on('connect', () => console.log('✅ Redis connected'));
client.on('reconnecting', () => console.log('🔄 Redis reconnecting...'));
client.on('end', () => console.log('🔌 Redis connection closed'));
client.on('error', (err) => console.error('❌ Redis error:', err));

// STEP 3: Keep your existing connection function
let started = false;
async function ensureConnected() {
  if (!started) {
    started = true;
    await client.connect();
    try { await client.clientSetName('skillsprint-backend'); } catch {}
    try { await client.ping(); } catch (e) { console.error('Redis ping failed', e); }
  }
}

// STEP 4: ADD NEW - Cache wrapper class for SkillSprint
class SkillSprintCache {
  constructor(client) {
    this.client = client;
    this.defaultTTL = 3600; // 1 hour
  }

  // Replace your LRU cache.get()
  async getUserProfile(userId) {
    try {
      const key = `skillsprint:user:${userId}`;
      const cached = await this.client.hGetAll(key);
      
      if (Object.keys(cached).length > 0) {
        console.log(`🎯 Cache HIT for user ${userId}`);
        return {
          source: 'cache',
          data: cached,
          timestamp: cached.timestamp
        };
      }
      
      console.log(`📀 Cache MISS for user ${userId}`);
      return null;
    } catch (error) {
      console.error('❌ Redis getUserProfile error:', error.message);
      return null;
    }
  }

  // Replace your LRU cache.set()
  async setUserProfile(userId, profileData, ttl = this.defaultTTL) {
    try {
      const key = `skillsprint:user:${userId}`;
      
      // Convert all values to strings for Redis hash
      const dataForRedis = {};
      Object.keys(profileData).forEach(k => {
        dataForRedis[k] = typeof profileData[k] === 'object' 
          ? JSON.stringify(profileData[k]) 
          : String(profileData[k]);
      });
      
      dataForRedis.timestamp = new Date().toISOString();
      dataForRedis.cached_at = String(Date.now());

      await this.client.hSet(key, dataForRedis);
      await this.client.expire(key, ttl);
      
      console.log(`✅ Cached user profile: ${userId} (TTL: ${ttl}s)`);
      return true;
    } catch (error) {
      console.error('❌ Redis setUserProfile error:', error.message);
      return false;
    }
  }

  // Replace your LRU cache.getStats()
  async getStats() {
    try {
      const info = await this.client.info('stats');
      const keyspace = await this.client.keys('skillsprint:*');
      
      return {
        connected: true,
        totalKeys: keyspace.length,
        keyspaceHits: info.match(/keyspace_hits:(\d+)/)?.[1] || '0',
        keyspaceMisses: info.match(/keyspace_misses:(\d+)/)?.[1] || '0'
      };
    } catch (error) {
      console.error('❌ Redis getStats error:', error.message);
      return { connected: false, error: error.message };
    }
  }

  // New feature: Cache invalidation
  async invalidateUser(userId) {
    try {
      const key = `skillsprint:user:${userId}`;
      await this.client.del(key);
      console.log(`🗑️ Invalidated cache for user ${userId}`);
      return true;
    } catch (error) {
      console.error('❌ Redis invalidateUser error:', error.message);
      return false;
    }
  }

  // New feature: Clear all cache
  async clearAll() {
    try {
      const keys = await this.client.keys('skillsprint:*');
      if (keys.length > 0) {
        await this.client.del(keys);
        console.log(`🗑️ Cleared ${keys.length} cache entries`);
      }
      return keys.length;
    } catch (error) {
      console.error('❌ Redis clearAll error:', error.message);
      return 0;
    }
  }
}

// STEP 5: Create cache instance
const cache = new SkillSprintCache(client);

// STEP 6: Export everything (keep your existing exports + add cache)
module.exports = { client, ensureConnected, cache };