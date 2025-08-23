/**
 * Priority Queue Implementation for Smart Notification Scheduling
 * 
 * How it works:
 * 1. Users with higher streaks get higher priority
 * 2. Users about to lose streaks get EMERGENCY priority
 * 3. Uses Min-Heap for efficient O(log n) operations
 * 4. Automatically schedules notifications by priority
 */

class PriorityQueue{
    constructor(){
        this.heap = [];
    }

    //parent index
    getParentIndex(index){
        return Math.floor((index-1)/2);
    }

    //left child index
    getLeftChildIndex(index){
        return 2*index+1;
    }

    //right child index
    getRightChildIndex(index){
        return 2*index+2;
    }

    swap(index1, index2){
        [this.heap[index1], this.heap[index2]] = this.heap[index2], this.heap[index1];

    }

    //adding notification in priority queue
    enqueue(notification){
        this.heap.push(notification);
        this.heapifyUp();
        console.log(`Added notification with priority ${notification.priority} for user ${notification.userId}`);
        
    }

    //getting highest priority notification
    dequeue(){
        if(this.heap.length ==0) return null;

        if(this.heap.length===1){
            return this.heap.pop();
        }

        const highestPriority = this.heap[0];
        this.heap[0] = this.heap.pop();
        this.heapifyDown();
    
        console.log(`Processing highest priority notification: ${highestPriority.message}`);
        return highestPriority;
    }

     // Move element up to maintain heap property
  heapifyUp() {
    let index = this.heap.length - 1;
    
    while (index > 0) {
      const parentIndex = this.getParentIndex(index);
      
      // Min heap: parent should have lower priority number (higher actual priority)
      if (this.heap[parentIndex].priority <= this.heap[index].priority) {
        break;
      }
      
      this.swap(parentIndex, index);
      index = parentIndex;
    }
  }

   // Move element down to maintain heap property
  heapifyDown() {
    let index = 0;
    
    while (this.getLeftChildIndex(index) < this.heap.length) {
      const leftChildIndex = this.getLeftChildIndex(index);
      const rightChildIndex = this.getRightChildIndex(index);
      
      let smallestIndex = leftChildIndex;
      
      if (rightChildIndex < this.heap.length && 
          this.heap[rightChildIndex].priority < this.heap[leftChildIndex].priority) {
        smallestIndex = rightChildIndex;
      }
      
      if (this.heap[index].priority <= this.heap[smallestIndex].priority) {
        break;
      }
      
      this.swap(index, smallestIndex);
      index = smallestIndex;
    }
  }

  peek(){
    return this.heap.length>0 ? this.heap[0] : null;
  }

  //get queue size
  size(){
    return this.heap.length;
  }

  isEmpty(){
    return this.heap.length==0;
  }

  getAllNotifications(){
    return [...this.heap].sort((a,b)=>a.priority-b.priority);
  }
  
  //clearing all notifications
  clear(){
    this.heap = [];
  }

  
  
}

//notification priority calcultor
class NotificationPriorityCalculator{
    /**
   * Calculate priority for a user's notification
   * Lower number = Higher priority (min heap)
   */

    static calculatePriority(userStreak, daysSinceLastActivity){
        // EMERGENCY: User about to lose streak (hasn't been active for 1+ days)
        if(daysSinceLastActivity>=1){
            return 1; //highest priority
        }

        // HIGH: Long streak users (7+ days) - keep them engaged!
        if(userStreak>=7){
            return Math.max(2,10-userStreak); //priority 2-9
        }

        // MEDIUM: Regular users (3-6 day streaks)
        if (userStreak >= 3) {
          return 10 + (7 - userStreak); // Priority 11-14
        }

        //LOW : new users (1-2 day streaks)
        return 15+ (3-userStreak) //priority list 16-17
    }

    /**
   * Create notification object with calculated priority
   */

    static createNotification(userId, userStreak, daysSinceLastActivity, challengeTitle){
        const priority = this.calculatePriority(userStreak,daysSinceLastActivity);
        let message, type;

        if(daysSinceLastActivity>=1){
            message = `🚨 Don't lose your ${userStreak}-day streak in "${challengeTitle}"! Check in now!`;
            type = 'EMERGENCY'
        }else if (userStreak >= 7) {
            message = `🔥 Amazing ${userStreak}-day streak! Keep the momentum going in "${challengeTitle}"!`;
            type = 'MOTIVATION';
        }else if(userStreak>=3){
            message = `💪 You're on a ${userStreak}-day roll! Time for today's "${challengeTitle}" activity!`;
            type = 'REMINDER';
        }else{
            message = `🌟 Day ${userStreak + 1} awaits! Continue your "${challengeTitle}" journey!`;
            type = 'ENCOURAGEMENT';
        }

        return{
            userId,
            priority,
            message,
            type,

            userStreak,
            daysSinceLastActivity,
            challengeTitle,
            scheduledTime: new Date(),
            processed: false
        };

    }
}

//exporting singleton instance

const notificationQueue = new PriorityQueue();

module.exports = {
    PriorityQueue,
    NotificationPriorityCalculator,
    notificationQueue
};

