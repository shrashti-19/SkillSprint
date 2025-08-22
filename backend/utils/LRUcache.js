

class LRUCache {
  constructor(capacity = 50) {
    this.capacity = capacity;
    this.cache = new Map();
  }

  get(key) {
    if (this.cache.has(key)) {
      // Move to end (most recently used)
      const value = this.cache.get(key);
      this.cache.delete(key);
      this.cache.set(key, value);
      
      console.log(`🎯 Cache HIT for user: ${key}`);
      return value;
    }
    
    console.log(`❌ Cache MISS for user: ${key}`);
    return null;
  }

  set(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      // Remove least recently used (first item)
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
      console.log(`🗑️ Evicted user from cache: ${firstKey}`);
    }

    this.cache.set(key, value);
    console.log(`✅ Cached user profile: ${key}`);
  }

  getStats() {
    return {
      size: this.cache.size,
      capacity: this.capacity,
      utilization: `${((this.cache.size / this.capacity) * 100).toFixed(1)}%`
    };
  }
}

// Export singleton instance
const userProfileCache = new LRUCache(50);
module.exports = userProfileCache;