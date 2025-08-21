# SkillSprint Backend 🚀

A gamified learning platform that helps users build consistent habits through streak tracking and social challenges.

## 🎯 Project Overview

SkillSprint transforms traditional habit tracking into an engaging, social experience using behavioral psychology and gamification mechanics. Users can create or join challenges, track daily progress, and maintain streaks to build lasting skills.

## ✨ Current Features

### 🔐 Authentication System
- User registration and login
- JWT token-based authentication
- Password hashing with bcrypt
- Protected routes with middleware

### 🎯 Challenge Management
- Create learning challenges (coding, reading, fitness, etc.)
- Join existing challenges
- Track participants and their progress
- Role-based access (challenge creators vs participants)

### 📈 Progress Tracking & Gamification
- **Daily streak tracking** - Consecutive day calculations
- **Activity logging** - Secure daily check-ins with duplicate prevention
- **Progress percentage** - Visual progress indicators
- **Streak psychology** - Automatic streak resets to maintain engagement

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: bcrypt for password hashing
- **API Testing**: Postman

## 📊 Database Schema

### User Model
```javascript
{
  name: String (required),
  email: String (unique, required),
  password: String (hashed, required),
  challengesJoined: [ObjectId] // References to Challenge documents
}
```

### Challenge Model
```javascript
{
  title: String (required),
  description: String,
  duration: Number, // days
  startDate: Date,
  createdBy: ObjectId, // User reference
  participants: [{
    user: ObjectId, // User reference
    progress: Number, // percentage completed
    streak: Number, // consecutive days
    lastActivityDate: Date // for streak calculations
  }]
}
```

## 🔗 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Challenges
- `POST /api/challenges` - Create new challenge (protected)
- `GET /api/challenges` - Get all challenges
- `POST /api/challenges/:id/join` - Join a challenge (protected)

### Progress Tracking
- `POST /api/progress/log/:challengeId` - Log daily activity (protected)
- `GET /api/progress/streak/:userId/:challengeId` - Get user's streak data

## 🧠 Key Algorithms Implemented

### Streak Calculation Logic
```javascript
// Consecutive day tracking with automatic reset
if (lastActivity === yesterday) {
  streak += 1; // Continue streak
} else {
  streak = 1; // Reset streak (gamification psychology)
}
```

### Anti-Cheat System
- Prevents multiple check-ins per day
- Date-based validation using timezone-normalized comparisons
- Maintains data integrity for fair competition

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Installation
```bash
# Clone repository
git clone <your-repo-url>
cd skillsprint-backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret

# Start development server
npm start
```

### Environment Variables
```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
PORT=5000
```

## 🧪 Testing

### Using Postman
1. Register a new user: `POST /api/auth/register`
2. Login to get JWT token: `POST /api/auth/login`
3. Create a challenge: `POST /api/challenges`
4. Join the challenge: `POST /api/challenges/:id/join`
5. Log daily activity: `POST /api/progress/log/:challengeId`
6. Check streak progress: `GET /api/progress/streak/:userId/:challengeId`

### Example API Responses

**Successful Activity Log:**
```json
{
  "message": "Daily activity logged successfully! 🎉",
  "streak": 2,
  "progress": 2,
  "challengeTitle": "21 Days Coding Challenge"
}
```

**Streak Data Retrieval:**
```json
{
  "streak": 2,
  "progress": 2,
  "lastActivity": "2025-08-21T00:00:00.000Z",
  "challengeTitle": "21 Days Coding Challenge"
}
```

## 🎯 What Makes This Special

### Beyond Basic CRUD
- **Behavioral Psychology**: Uses streak mechanics to increase user retention
- **Algorithm Implementation**: Custom consecutive-day calculation logic
- **Gamification Design**: Progress tracking with milestone potential
- **Social Features Ready**: Built for community engagement and competition

### Technical Highlights
- **Clean Architecture**: Separated controllers, routes, and models
- **Error Handling**: Comprehensive error responses and validation
- **Security Focused**: JWT authentication, password hashing, input validation
- **Performance Conscious**: Designed with caching and optimization in mind

## 🚧 Coming Next 

### Phase 2: Performance Optimization
- [ ] LRU Cache implementation for frequent queries
- [ ] Database indexing for improved query performance
- [ ] API rate limiting with sliding window algorithm

### Phase 3: Advanced Features  
- [ ] Leaderboard system with ranking algorithms
- [ ] Milestone achievements (7-day, 30-day rewards)
- [ ] Social features (friend challenges, progress sharing)

### Phase 4: Production Ready
- [ ] Google Cloud deployment
- [ ] Real-time notifications
- [ ] Advanced security hardening
- [ ] Comprehensive monitoring and logging

## 📈 Performance Metrics

*Will be updated as  implement optimization features*

- Current API response time: ~200-300ms
- Target after optimization: <50ms
- Database queries: Direct MongoDB calls
- Target after caching: 80% cache hit rate

## 🤝 Contributing

This is a learning project focused on demonstrating full-stack development skills, algorithm implementation, and production-ready practices.


**Built with 💻 and ☕ for demonstrating production-ready development skills**