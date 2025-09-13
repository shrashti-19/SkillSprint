import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar, 
  Target, 
  TrendingUp, 
  Award, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Play, 
  BarChart3,
  Zap,
  Trophy,
  Flame,
  Plus,
  Bell,
  User,
  Activity,
  AlertCircle,
  Pause,
  Loader2,
  LogOut,
  X,
  RefreshCcw,
  LayoutDashboard
} from 'lucide-react';
import ChallengeCreateForm from './ChallengeCreateForm'; // Assuming you have this component
import styles from './Dashboard.module.css'; // Importing a CSS module for cleaner styling

const Dashboard = ({ user: propUser, onLogout }) => {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(propUser || null);
  const [notifications, setNotifications] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const [networkError, setNetworkError] = useState(null);
  const notificationTimeoutRef = useRef(null);

  useEffect(() => {
    // We already get the user as a prop, so no need to fetch it again
    // unless we need fresh data. We will rely on initializeDashboard to do that.
    
    // Store userId if available
    if (propUser && (propUser._id || propUser.id)) {
        localStorage.setItem('userId', propUser._id || propUser.id);
    }

    // Initialize the dashboard to fetch all data
    initializeDashboard();

    return () => {
        if (notificationTimeoutRef.current) {
            clearTimeout(notificationTimeoutRef.current);
        }
    };
}, [propUser]); // Keep propUser in the dependency array

  const initializeDashboard = async () => {
    try {
      setLoading(true);
      setNetworkError(null);
      await Promise.all([
        loadUserData(),
        loadChallenges(),
        loadNotifications()
      ]);
    } catch (error) {
      console.error('Dashboard initialization error:', error);
      setNetworkError('Failed to load dashboard data. Please check your connection.');
      addNotification('error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getAuthToken = () => {
    return localStorage.getItem('authToken') || localStorage.getItem('token');
  };

  const apiCall = async (endpoint, options = {}) => {
    const token = getAuthToken();
    const baseURL = 'https://skillsprint-production-663d.up.railway.app';
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(`${baseURL}${endpoint}`, config);
      
      if (!response.ok) {
        let errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(`API call failed: ${response.status} - ${errorData.message}`);
      }
      
      const text = await response.text();
      return text ? JSON.parse(text) : {};
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error - please check your internet connection');
      }
      throw error;
    }
  };

  const loadUserData = async () => {
    try {
        const token = getAuthToken();
        if (!token) {
            addNotification('error', 'Please log in to access dashboard');
            return;
        }
        const userId = localStorage.getItem('userId');
        if (userId) {
            const response = await apiCall(`/api/users/profile/${userId}`);
            // NEW: Access the data field from the response
            const profileData = response.data;
            setCurrentUser(profileData.user); // The user object is inside profileData.user
        }
    } catch (error) {
        console.error('Error loading user data:', error);
        addNotification('error', 'Failed to load user profile');
    }
};

  const loadChallenges = async () => {
    try {
      const challengesData = await apiCall('/api/challenges');
      setChallenges(Array.isArray(challengesData) ? challengesData : []);
    } catch (error) {
      console.error('Error loading challenges:', error);
      addNotification('error', 'Failed to load challenges');
      setChallenges([]);
    }
  };

  const loadNotifications = async () => {
    try {
      if (!currentUser) return;
      const notificationsData = await apiCall(`/api/notifications/${currentUser._id}`);
      setNotifications(notificationsData);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const joinChallenge = async (challengeId) => {
    setActionLoading(prev => ({ ...prev, [challengeId]: true }));
    try {
      await apiCall(`/api/challenges/${challengeId}/join`, {
        method: 'POST'
      });
      addNotification('success', 'Successfully joined challenge! 🎉');
      await initializeDashboard(); // Re-fetch all data to ensure dashboard is up-to-date
    } catch (error) {
      console.error('Error joining challenge:', error);
      addNotification('error', error.message || 'Failed to join challenge');
    } finally {
      setActionLoading(prev => ({ ...prev, [challengeId]: false }));
    }
  };

  const markComplete = async (challengeId) => {
    setActionLoading(prev => ({ ...prev, [`complete_${challengeId}`]: true }));
    try {
      await apiCall(`/api/progress/log/${challengeId}`, {
        method: 'POST'
      });
      addNotification('success', 'Daily progress logged! Keep the streak alive! 🔥');
      await initializeDashboard(); // Re-fetch all data
    } catch (error) {
      console.error('Error logging progress:', error);
      addNotification('error', error.message || 'Failed to log progress');
    } finally {
      setActionLoading(prev => ({ ...prev, [`complete_${challengeId}`]: false }));
    }
  };

  const isUserJoined = (challenge) => {
    if (!currentUser || !challenge.participants) return false;
    return challenge.participants.some(p => p.user?._id === currentUser._id || p.user === currentUser._id);
  };

  const getUserParticipation = (challenge) => {
    if (!currentUser || !challenge.participants) return null;
    return challenge.participants.find(p => p.user?._id === currentUser._id || p.user === currentUser._id);
  };

  const getChallengeStatus = (challenge) => {
    const participation = getUserParticipation(challenge);
    if (!participation) return 'available';
    const progress = participation.progress || 0;
    const daysPassed = Math.floor((new Date() - new Date(challenge.startDate)) / (1000 * 60 * 60 * 24));
    
    if (progress >= 100) return 'completed';
    if (daysPassed >= challenge.duration) {
      return 'failed';
    }
    return 'active';
  };

  const getDashboardStats = () => {
    const challengesArray = Array.isArray(challenges) ? challenges : [];
    const joinedChallenges = challengesArray.filter(c => isUserJoined(c));
    const active = joinedChallenges.filter(c => getChallengeStatus(c) === 'active').length;
    const completed = joinedChallenges.filter(c => getChallengeStatus(c) === 'completed').length;
    const failed = joinedChallenges.filter(c => getChallengeStatus(c) === 'failed').length;
    const longestStreak = joinedChallenges.reduce((max, challenge) => {
      const participation = getUserParticipation(challenge);
      return Math.max(max, participation?.streak || 0);
    }, 0);
    const totalChallenges = joinedChallenges.length;
    const successRate = totalChallenges > 0 ? Math.round((completed / totalChallenges) * 100) : 0;
    return { active, completed, failed, longestStreak, totalChallenges, successRate };
  };

  const { active: activeChallenges, completed: completedChallenges, failed: failedChallenges, longestStreak, totalChallenges, successRate } = getDashboardStats();

  const addNotification = (type, message) => {
    const notification = { id: Date.now(), type, message };
    setNotifications(prev => [notification, ...prev.filter(n => n.type !== type).slice(0, 4)]);
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }
    notificationTimeoutRef.current = setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'completed': return '#3b82f6';
      case 'failed': return '#ef4444';
      case 'available': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <Play size={16} />;
      case 'completed': return <CheckCircle2 size={16} />;
      case 'failed': return <XCircle size={16} />;
      case 'available': return <Plus size={16} />;
      default: return <Clock size={16} />;
    }
  };

  const ProgressBar = ({ current, total, color = '#3b82f6' }) => (
    <div className={styles.progressBarContainer}>
      <div 
        className={styles.progressBar}
        style={{
          width: `${Math.min((current / total) * 100, 100)}%`,
          background: `linear-gradient(90deg, ${color}, ${color}dd)`
        }} 
      />
    </div>
  );

  const StatCard = ({ icon, title, value, color = '#3b82f6', subtitle }) => (
    <div className={styles.statCard} style={{ '--card-color': color }}>
      <div className={styles.statIcon}>{icon}</div>
      <div className={styles.statContent}>
        <div className={styles.statTitle}>{title}</div>
        <div className={styles.statValue}>{value}</div>
        {subtitle && <div className={styles.statSubtitle}>{subtitle}</div>}
      </div>
    </div>
  );

  const ChallengeCard = ({ challenge }) => {
    const participation = getUserParticipation(challenge);
    const status = getChallengeStatus(challenge);
    const progress = participation?.progress || 0;
    const streak = participation?.streak || 0;
    const isJoined = isUserJoined(challenge);
    const daysPassed = Math.floor((new Date() - new Date(challenge.startDate)) / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.max(0, challenge.duration - daysPassed);
    const isLoading = actionLoading[challenge._id] || actionLoading[`complete_${challenge._id}`];
  
    const actionButton = () => {
      if (!isJoined) {
        return (
          <button
            onClick={() => joinChallenge(challenge._id)}
            disabled={isLoading}
            className={`${styles.actionButton} ${styles.joinButton}`}
          >
            {isLoading ? <Loader2 size={16} className={styles.spinner} /> : <Plus size={16} />}
            {isLoading ? 'Joining...' : 'Join Challenge'}
          </button>
        );
      } else if (status === 'active') {
        return (
          <button
            onClick={() => markComplete(challenge._id)}
            disabled={isLoading}
            className={`${styles.actionButton} ${styles.completeButton}`}
          >
            {isLoading ? <Loader2 size={16} className={styles.spinner} /> : <CheckCircle2 size={16} />}
            {isLoading ? 'Logging...' : 'Mark Complete'}
          </button>
        );
      }
    };
  
    return (
      <div className={styles.challengeCard} style={{ '--card-color': getStatusColor(status) }}>
        <div className={styles.challengeHeader}>
          <h3 className={styles.challengeTitle}>{challenge.title}</h3>
          <div className={styles.statusIndicator}>
            {getStatusIcon(status)}
            <span>{status}</span>
          </div>
        </div>
        <p className={styles.challengeDescription}>{challenge.description}</p>
  
        {isJoined && (
          <div className={styles.challengeProgress}>
            <div className={styles.progressHeader}>
              <span>Progress: {Math.round(progress)}%</span>
              <span className={styles.daysRemaining}>
                <Clock size={12} />
                {daysRemaining} days left
              </span>
            </div>
            <ProgressBar current={progress} total={100} color={getStatusColor(status)} />
          </div>
        )}
  
        <div className={styles.challengeStats}>
          <div className={styles.statItem}>
            <div className={styles.statIconAndValue}>
              <Flame size={18} />
              <span>{isJoined ? streak : 0}</span>
            </div>
            <span className={styles.statLabel}>Day Streak</span>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statIconAndValue}>
              <Calendar size={18} />
              <span>{challenge.duration}</span>
            </div>
            <span className={styles.statLabel}>Total Days</span>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statIconAndValue}>
              <User size={18} />
              <span>{challenge.participants?.length || 0}</span>
            </div>
            <span className={styles.statLabel}>Participants</span>
          </div>
        </div>
  
        <div className={styles.challengeActions}>
          {actionButton()}
          <button
            onClick={() => console.log('View leaderboard for:', challenge._id)}
            className={styles.leaderboardButton}
          >
            <Trophy size={16} />
            Leaderboard
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className={styles.dashboardContainer}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.logoAndGreeting}>
            <h1 className={styles.logo}>
              <Target size={32} />
              SkillSprint
            </h1>
            <p className={styles.greeting}>
              Welcome back, {currentUser?.name || 'User'}! 🚀
            </p>
          </div>
          <div className={styles.headerActions}>
            <div className={styles.notificationWrapper}>
              <button className={styles.headerButton}>
                <Bell size={20} />
              </button>
              {notifications.length > 0 && (
                <span className={styles.notificationBadge}>{notifications.length}</span>
              )}
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className={`${styles.headerButton} ${styles.ctaButton}`}
            >
              <Plus size={18} />
              New Challenge
            </button>
            {onLogout && (
              <button onClick={onLogout} className={`${styles.headerButton} ${styles.logoutButton}`}>
                <LogOut size={18} />
                Logout
              </button>
            )}
            <div className={styles.userAvatar}>
              <User size={20} />
            </div>
          </div>
        </div>
      </header>

      <div className={styles.mainContent}>
        {networkError && (
          <div className={styles.networkError}>
            <AlertCircle size={24} />
            <p>{networkError}</p>
            <button onClick={initializeDashboard} className={styles.retryButton}>
              <RefreshCcw size={16} />
              Retry
            </button>
          </div>
        )}

        {/* Notifications list */}
        <div className={styles.notificationList}>
          {notifications.map((n) => (
            <div key={n.id} className={`${styles.notificationItem} ${styles[n.type]}`}>
              <div className={styles.notificationIcon}>
                {n.type === 'success' && <CheckCircle2 size={20} />}
                {n.type === 'error' && <XCircle size={20} />}
              </div>
              <p className={styles.notificationMessage}>{n.message}</p>
              <button onClick={() => setNotifications(prev => prev.filter(item => item.id !== n.id))} className={styles.closeNotification}>
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
        
        {/* Dashboard Stats Section */}
        <div className={styles.statGrid}>
          <StatCard
            icon={<Activity size={24} />}
            title="Active Challenges"
            value={activeChallenges}
            color="#3b82f6"
          />
          <StatCard
            icon={<Award size={24} />}
            title="Challenges Completed"
            value={completedChallenges}
            color="#10b981"
          />
          <StatCard
            icon={<Flame size={24} />}
            title="Longest Streak"
            value={`${longestStreak} days`}
            color="#ef4444"
          />
          <StatCard
            icon={<BarChart3 size={24} />}
            title="Success Rate"
            value={`${successRate}%`}
            color="#f59e0b"
          />
        </div>
        
        <div className={styles.sectionHeader}>
          <h2>Your Challenges</h2>
          <button onClick={() => loadChallenges()} className={styles.refreshButton}>
            <RefreshCcw size={16} />
          </button>
        </div>

        <div className={styles.challengeGrid}>
          {challenges.length > 0 ? (
            challenges.map((challenge) => (
              <ChallengeCard key={challenge._id} challenge={challenge} />
            ))
          ) : (
            <div className={styles.noChallenges}>
              <LayoutDashboard size={48} color="#d1d5db" />
              <p>No challenges found. Why not <a href="#" onClick={() => setShowCreateForm(true)}>create a new one</a>?</p>
            </div>
          )}
        </div>
      </div>
      
      {showCreateForm && (
        <ChallengeCreateForm 
          onClose={() => setShowCreateForm(false)} 
          onSuccess={() => {
            setShowCreateForm(false);
            addNotification('success', 'Challenge created successfully!');
            initializeDashboard();
          }} 
        />
      )}
    </div>
  );
};

export default Dashboard;