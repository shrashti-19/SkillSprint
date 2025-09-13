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

                // NEW: Deserialization Logic
                const parsedData = {};
                for (const k in cached) {
                    try {
                        // Attempt to parse the value as JSON
                        parsedData[k] = JSON.parse(cached[k]);
                    } catch (e) {
                        // If parsing fails, it's a simple string, so keep it as is
                        parsedData[k] = cached[k];
                    }
                }
                
                return {
                    source: 'cache',
                    data: parsedData, // Return the parsed object
                    timestamp: parsedData.timestamp,
                };
            }

            console.log(`📀 Cache MISS for user ${userId}`);
            return null;
        } catch (error) {
            console.error('❌ Redis getUserProfile error:', error.message);
            return null;
        }
    }

    async setUserProfile(userId, profileData, ttl = this.defaultTTL) {
        try {
            const key = `skillsprint:user:${userId}`;
            
            // Convert all nested objects to strings for Redis hash
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


  // ADD THESE FUNCTIONS TO YOUR SkillSprintCache CLASS in utils/redisClient.js
// (Add after your existing getUserProfile and setUserProfile functions)

  // 🚀 CHALLENGE CACHING FUNCTIONS

  // Get all challenges list
  async getAllChallenges() {
    try {
      const key = 'skillsprint:challenges:all';
      const cached = await this.client.get(key);
      
      if (cached) {
        console.log('🎯 Cache HIT for challenges list');
        return {
          data: JSON.parse(cached),
          cached_at: new Date().toISOString()
        };
      }
      
      console.log('📀 Cache MISS for challenges list');
      return null;
    } catch (error) {
      console.error('❌ Redis getAllChallenges error:', error.message);
      return null;
    }
  }

  // Set all challenges list
  async setAllChallenges(challengesData, ttl = 1800) { // 30 min default
    try {
      const key = 'skillsprint:challenges:all';
      await this.client.setEx(key, ttl, JSON.stringify(challengesData));
      
      console.log(`✅ Cached challenges list (${challengesData.length} challenges, TTL: ${ttl}s)`);
      return true;
    } catch (error) {
      console.error('❌ Redis setAllChallenges error:', error.message);
      return false;
    }
  }

  // Get single challenge
  async getChallenge(challengeId) {
    try {
      const key = `skillsprint:challenge:${challengeId}`;
      const cached = await this.client.get(key);
      
      if (cached) {
        console.log(`🎯 Cache HIT for challenge ${challengeId}`);
        return {
          data: JSON.parse(cached),
          cached_at: new Date().toISOString()
        };
      }
      
      console.log(`📀 Cache MISS for challenge ${challengeId}`);
      return null;
    } catch (error) {
      console.error('❌ Redis getChallenge error:', error.message);
      return null;
    }
  }

  // Set single challenge
  async setChallenge(challengeId, challengeData, ttl = 1200) { // 20 min default
    try {
      const key = `skillsprint:challenge:${challengeId}`;
      await this.client.setEx(key, ttl, JSON.stringify(challengeData));
      
      console.log(`✅ Cached challenge ${challengeId} (TTL: ${ttl}s)`);
      return true;
    } catch (error) {
      console.error('❌ Redis setChallenge error:', error.message);
      return false;
    }
  }

  // Get challenge leaderboard
  async getChallengeLeaderboard(challengeId) {
    try {
      const key = `skillsprint:leaderboard:${challengeId}`;
      const cached = await this.client.get(key);
      
      if (cached) {
        console.log(`🎯 Cache HIT for challenge ${challengeId} leaderboard`);
        return {
          data: JSON.parse(cached),
          cached_at: new Date().toISOString()
        };
      }
      
      console.log(`📀 Cache MISS for challenge ${challengeId} leaderboard`);
      return null;
    } catch (error) {
      console.error('❌ Redis getChallengeLeaderboard error:', error.message);
      return null;
    }
  }

  // Set challenge leaderboard
  async setChallengeLeaderboard(challengeId, leaderboardData, ttl = 300) { // 5 min default
    try {
      const key = `skillsprint:leaderboard:${challengeId}`;
      await this.client.setEx(key, ttl, JSON.stringify(leaderboardData));
      
      console.log(`✅ Cached leaderboard for challenge ${challengeId} (${leaderboardData.length} participants, TTL: ${ttl}s)`);
      return true;
    } catch (error) {
      console.error('❌ Redis setChallengeLeaderboard error:', error.message);
      return false;
    }
  }

  // 🚀 SMART INVALIDATION FUNCTIONS

  // Invalidate specific challenge
  async invalidateChallenge(challengeId) {
    try {
      const keys = [
        `skillsprint:challenge:${challengeId}`,
        `skillsprint:leaderboard:${challengeId}`
      ];
      
      await this.client.del(keys);
      console.log(`🗑️ Invalidated cache for challenge ${challengeId} (challenge + leaderboard)`);
      return true;
    } catch (error) {
      console.error('❌ Redis invalidateChallenge error:', error.message);
      return false;
    }
  }

  // Invalidate all challenges list
  async invalidateAllChallenges() {
    try {
      await this.client.del('skillsprint:challenges:all');
      console.log('🗑️ Invalidated challenges list cache');
      return true;
    } catch (error) {
      console.error('❌ Redis invalidateAllChallenges error:', error.message);
      return false;
    }
  }

  // Invalidate all leaderboards (when global changes happen)
  async invalidateAllLeaderboards() {
    try {
      const keys = await this.client.keys('skillsprint:leaderboard:*');
      if (keys.length > 0) {
        await this.client.del(keys);
        console.log(`🗑️ Invalidated ${keys.length} leaderboard caches`);
      }
      return keys.length;
    } catch (error) {
      console.error('❌ Redis invalidateAllLeaderboards error:', error.message);
      return 0;
    }
  }
}

// STEP 5: Create cache instance
const cache = new SkillSprintCache(client);

// STEP 6: Export everything (keep your existing exports + add cache)
module.exports = { client, ensureConnected, cache };