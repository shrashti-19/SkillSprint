// utils/LeaderboardHeap.js

class MaxHeap {
  constructor() {
    this.heap = [];
    this.userIndexMap = new Map(); // userId -> heap index for O(1) lookup
  }

  // Get parent index
  getParentIndex(index) {
    return Math.floor((index - 1) / 2);
  }

  // Get left child index
  getLeftChildIndex(index) {
    return 2 * index + 1;
  }

  // Get right child index  
  getRightChildIndex(index) {
    return 2 * index + 2;
  }

  // Swap two elements and update index map
  swap(index1, index2) {
    // Update index map
    this.userIndexMap.set(this.heap[index1].userId, index2);
    this.userIndexMap.set(this.heap[index2].userId, index1);
    
    // Swap elements
    [this.heap[index1], this.heap[index2]] = [this.heap[index2], this.heap[index1]];
  }

  // Bubble up (when inserting or increasing value)
  bubbleUp(index) {
    while (index > 0) {
      const parentIndex = this.getParentIndex(index);
      
      // If current streak >= parent streak, stop
      if (this.heap[index].currentStreak <= this.heap[parentIndex].currentStreak) {
        break;
      }
      
      this.swap(index, parentIndex);
      index = parentIndex;
    }
  }

  // Bubble down (when extracting max or decreasing value)
  bubbleDown(index) {
    while (this.getLeftChildIndex(index) < this.heap.length) {
      const leftChild = this.getLeftChildIndex(index);
      const rightChild = this.getRightChildIndex(index);
      
      // Find largest among current, left child, right child
      let largest = index;
      
      if (leftChild < this.heap.length && 
          this.heap[leftChild].currentStreak > this.heap[largest].currentStreak) {
        largest = leftChild;
      }
      
      if (rightChild < this.heap.length && 
          this.heap[rightChild].currentStreak > this.heap[largest].currentStreak) {
        largest = rightChild;
      }
      
      // If current is largest, heap property satisfied
      if (largest === index) {
        break;
      }
      
      this.swap(index, largest);
      index = largest;
    }
  }

  // Insert or update user
  insertOrUpdate(user) {
    const existingIndex = this.userIndexMap.get(user.userId);
    
    if (existingIndex !== undefined) {
      // User exists - update streak
      const oldStreak = this.heap[existingIndex].currentStreak;
      this.heap[existingIndex] = user;
      
      // Rebalance based on streak change
      if (user.currentStreak > oldStreak) {
        this.bubbleUp(existingIndex);
      } else if (user.currentStreak < oldStreak) {
        this.bubbleDown(existingIndex);
      }
    } else {
      // New user - insert at end and bubble up
      const newIndex = this.heap.length;
      this.heap.push(user);
      this.userIndexMap.set(user.userId, newIndex);
      this.bubbleUp(newIndex);
    }
  }

  // Get top N users (without removing them)
  getTopN(n = 10) {
    // Create copy of heap and extract top N
    const tempHeap = new MaxHeap();
    tempHeap.heap = [...this.heap];
    tempHeap.userIndexMap = new Map(this.userIndexMap);
    
    const result = [];
    const maxResults = Math.min(n, tempHeap.heap.length);
    
    for (let i = 0; i < maxResults; i++) {
      if (tempHeap.heap.length === 0) break;
      result.push(tempHeap.extractMax());
    }
    
    return result;
  }

  // Extract maximum (removes from heap)
  extractMax() {
    if (this.heap.length === 0) return null;
    if (this.heap.length === 1) {
      const max = this.heap.pop();
      this.userIndexMap.delete(max.userId);
      return max;
    }
    
    const max = this.heap[0];
    const last = this.heap.pop();
    
    this.heap[0] = last;
    this.userIndexMap.set(last.userId, 0);
    this.userIndexMap.delete(max.userId);
    
    this.bubbleDown(0);
    return max;
  }

  // Get current size
  size() {
    return this.heap.length;
  }

  // Check if user exists
  hasUser(userId) {
    return this.userIndexMap.has(userId);
  }

  // Get user's current position (1-indexed)
  getUserPosition(userId) {
    if (!this.hasUser(userId)) return -1;
    
    const userIndex = this.userIndexMap.get(userId);
    const userStreak = this.heap[userIndex].currentStreak;
    
    let position = 1;
    for (let i = 0; i < this.heap.length; i++) {
      if (this.heap[i].currentStreak > userStreak) {
        position++;
      }
    }
    
    return position;
  }
}

// Leaderboard Manager
class LeaderboardManager {
  constructor() {
    this.challengeHeaps = new Map(); // challengeId -> MaxHeap
  }

  // Get or create heap for challenge
  getHeap(challengeId) {
    if (!this.challengeHeaps.has(challengeId)) {
      this.challengeHeaps.set(challengeId, new MaxHeap());
    }
    return this.challengeHeaps.get(challengeId);
  }

  // Update user's position in leaderboard
  updateUserPosition(challengeId, userData) {
    const heap = this.getHeap(challengeId);
    const userEntry = {
      userId: userData.userId,
      username: userData.username,
      currentStreak: userData.currentStreak,
      totalActiveDays: userData.totalActiveDays || 0,
      lastActivity: userData.lastActivity
    };
    
    heap.insertOrUpdate(userEntry);
    
    return {
      position: heap.getUserPosition(userData.userId),
      totalParticipants: heap.size()
    };
  }

  // Get leaderboard for challenge
  getLeaderboard(challengeId, limit = 10) {
    const heap = this.getHeap(challengeId);
    const topUsers = heap.getTopN(limit);
    
    return topUsers.map((user, index) => ({
      rank: index + 1,
      userId: user.userId,
      username: user.username,
      currentStreak: user.currentStreak,
      totalActiveDays: user.totalActiveDays,
      lastActivity: user.lastActivity
    }));
  }

  // Get user's stats in challenge
  getUserStats(challengeId, userId) {
    const heap = this.getHeap(challengeId);
    
    if (!heap.hasUser(userId)) {
      return null;
    }

    return {
      position: heap.getUserPosition(userId),
      totalParticipants: heap.size()
    };
  }

  // Remove challenge leaderboard (cleanup)
  removeChallenge(challengeId) {
    this.challengeHeaps.delete(challengeId);
  }
}

// Export singleton instance
const leaderboardManager = new LeaderboardManager();

module.exports = {
  MaxHeap,
  LeaderboardManager,
  leaderboardManager
};