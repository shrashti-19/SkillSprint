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

const ChallengeCreateForm = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: 7,
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);

  const getAuthToken = () => {
    return localStorage.getItem('authToken') || localStorage.getItem('token');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('User not authenticated.');
      }
      
      const baseURL = 'https://skillsprint-production-663d.up.railway.app';
      const response = await fetch(`${baseURL}/api/challenges`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to create challenge' }));
        throw new Error(errorData.message || 'Failed to create challenge');
      }

      const newChallenge = await response.json();
      console.log('Challenge created:', newChallenge);
      // Pass the new challenge data to the parent component
      onSuccess(newChallenge);
    } catch (error) {
      console.error('Error creating challenge:', error);
      setFormError(error.message || 'An unexpected error occurred.');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="form-modal-overlay">
      <div className="form-modal">
        <div className="form-modal-header">
          <h2>Create New Challenge</h2>
          <button onClick={onClose} className="form-close-button">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="form-content">
          <label className="form-label">
            Title
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Daily Yoga"
              required
              className="form-input"
            />
          </label>
          <label className="form-label">
            Description
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Briefly describe the challenge goal."
              required
              className="form-textarea"
            />
          </label>
          <label className="form-label">
            Duration (Days)
            <input
              type="number"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              min="1"
              required
              className="form-input"
            />
          </label>
          {formError && <p className="form-error">{formError}</p>}
          <div className="form-actions">
            <button type="submit" className="form-submit-button" disabled={formLoading}>
              {formLoading ? (
                <>
                  <Loader2 size={16} className="spinner" /> Creating...
                </>
              ) : (
                <>
                  <Plus size={16} /> Create
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

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
    const initialLoad = async () => {
      // If a user is passed as a prop, use that; otherwise, try to load from backend
      if (propUser) {
        localStorage.setItem('userId', propUser._id || propUser.id);
        localStorage.setItem('authToken', propUser.token);
        setCurrentUser(propUser);
      }
      
      await initializeDashboard();
    };

    initialLoad();

    return () => {
        if (notificationTimeoutRef.current) {
            clearTimeout(notificationTimeoutRef.current);
        }
    };
}, [propUser]);


  const initializeDashboard = async () => {
    setLoading(true);
    setNetworkError(null);
    try {
        const user = await loadUserData();
        if (user) {
            await Promise.allSettled([
                loadChallenges(),
                loadNotifications(user)
            ]);
        }
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
            return null;
        }
        const userId = localStorage.getItem('userId');
        if (userId) {
            const response = await apiCall(`/api/users/profile/${userId}`);
            const profileData = response.data;
            const user = profileData?.user || profileData;
            setCurrentUser(user);
            return user;
        }
        return null;
    } catch (error) {
        console.error('Error loading user data:', error);
        addNotification('error', 'Failed to load user profile');
        return null;
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

  const loadNotifications = async (user) => {
    try {
      if (!user?._id) return;
      const notificationsData = await apiCall(`/api/notifications/${user._id}`);
      setNotifications(Array.isArray(notificationsData) ? notificationsData : []);
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
      await initializeDashboard();
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
      await initializeDashboard();
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
    <div className="progressBarContainer">
      <div 
        className="progressBar"
        style={{
          width: `${Math.min((current / total) * 100, 100)}%`,
          background: `linear-gradient(90deg, ${color}, ${color}dd)`
        }} 
      />
    </div>
  );

  const StatCard = ({ icon, title, value, color = '#3b82f6', subtitle }) => (
    <div className="statCard" style={{ '--card-color': color }}>
      <div className="statIcon">{icon}</div>
      <div className="statContent">
        <div className="statTitle">{title}</div>
        <div className="statValue">{value}</div>
        {subtitle && <div className="statSubtitle">{subtitle}</div>}
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
            className={`actionButton joinButton`}
          >
            {isLoading ? <Loader2 size={16} className="spinner" /> : <Plus size={16} />}
            {isLoading ? 'Joining...' : 'Join Challenge'}
          </button>
        );
      } else if (status === 'active') {
        return (
          <button
            onClick={() => markComplete(challenge._id)}
            disabled={isLoading}
            className={`actionButton completeButton`}
          >
            {isLoading ? <Loader2 size={16} className="spinner" /> : <CheckCircle2 size={16} />}
            {isLoading ? 'Logging...' : 'Mark Complete'}
          </button>
        );
      }
    };
  
    return (
      <div className="challengeCard" style={{ '--card-color': getStatusColor(status) }}>
        <div className="challengeHeader">
          <h3 className="challengeTitle">{challenge.title}</h3>
          <div className="statusIndicator">
            {getStatusIcon(status)}
            <span>{status}</span>
          </div>
        </div>
        <p className="challengeDescription">{challenge.description}</p>
  
        {isJoined && (
          <div className="challengeProgress">
            <div className="progressHeader">
              <span>Progress: {Math.round(progress)}%</span>
              <span className="daysRemaining">
                <Clock size={12} />
                {daysRemaining} days left
              </span>
            </div>
            <ProgressBar current={progress} total={100} color={getStatusColor(status)} />
          </div>
        )}
  
        <div className="challengeStats">
          <div className="statItem">
            <div className="statIconAndValue">
              <Flame size={18} />
              <span>{isJoined ? streak : 0}</span>
            </div>
            <span className="statLabel">Day Streak</span>
          </div>
          <div className="statItem">
            <div className="statIconAndValue">
              <Calendar size={18} />
              <span>{challenge.duration}</span>
            </div>
            <span className="statLabel">Total Days</span>
          </div>
          <div className="statItem">
            <div className="statIconAndValue">
              <User size={18} />
              <span>{challenge.participants?.length || 0}</span>
            </div>
            <span className="statLabel">Participants</span>
          </div>
        </div>
  
        <div className="challengeActions">
          {actionButton()}
          <button
            onClick={() => console.log('View leaderboard for:', challenge._id)}
            className="leaderboardButton"
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
      <div className="loadingContainer">
        <div className="spinner" />
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboardContainer">
      <style>{`
        body {
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol';
          background-color: #f3f4f6;
          color: #1f2937;
        }

        .dashboardContainer {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          padding: 2rem;
        }

        .header {
          background-color: #fff;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
          padding: 1.5rem 2rem;
          margin-bottom: 2rem;
        }

        .headerContent {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .logoAndGreeting {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .logo {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1f2937;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin: 0;
        }

        .greeting {
          font-size: 1.125rem;
          color: #4b5563;
          margin: 0;
        }

        .headerActions {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .headerButton {
          background-color: #f3f4f6;
          border: none;
          border-radius: 9999px;
          padding: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #4b5563;
          cursor: pointer;
          transition: background-color 0.2s, transform 0.2s;
        }

        .headerButton:hover {
          background-color: #e5e7eb;
          transform: translateY(-2px);
        }

        .ctaButton {
          background-color: #3b82f6;
          color: #fff;
          padding: 0.75rem 1.25rem;
          border-radius: 9999px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .ctaButton:hover {
          background-color: #2563eb;
          transform: translateY(-2px);
        }

        .logoutButton {
          background-color: #ef4444;
          color: #fff;
        }

        .logoutButton:hover {
          background-color: #dc2626;
        }

        .notificationWrapper {
          position: relative;
        }

        .notificationBadge {
          position: absolute;
          top: -5px;
          right: -5px;
          background-color: #ef4444;
          color: #fff;
          font-size: 0.75rem;
          font-weight: 700;
          border-radius: 9999px;
          padding: 0.25rem 0.5rem;
        }

        .userAvatar {
          background-color: #9ca3af;
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 9999px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-weight: 600;
        }

        .mainContent {
          flex-grow: 1;
        }

        .statGrid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .statCard {
          background-color: #fff;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
          padding: 1.5rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          border-left: 5px solid var(--card-color);
        }

        .statIcon {
          background-color: var(--card-color);
          opacity: 0.1;
          width: 3rem;
          height: 3rem;
          border-radius: 9999px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--card-color);
        }

        .statContent {
          display: flex;
          flex-direction: column;
        }

        .statTitle {
          font-size: 0.875rem;
          color: #6b7280;
        }

        .statValue {
          font-size: 2rem;
          font-weight: 700;
          color: #1f2937;
        }

        .statSubtitle {
          font-size: 0.75rem;
          color: #9ca3af;
        }

        .sectionHeader {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .sectionHeader h2 {
          font-size: 1.5rem;
          font-weight: 600;
          color: #1f2937;
          margin: 0;
        }

        .refreshButton {
          background: #fff;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          padding: 0.5rem 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .refreshButton:hover {
          background-color: #f9fafb;
        }

        .challengeGrid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .challengeCard {
          background-color: #fff;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          border-left: 5px solid var(--card-color);
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .challengeCard:hover {
          transform: translateY(-5px);
          box-shadow: 0 6px 10px rgba(0, 0, 0, 0.1);
        }

        .challengeHeader {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
        }

        .challengeTitle {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1f2937;
          margin: 0;
        }

        .statusIndicator {
          background-color: var(--card-color);
          color: #fff;
          font-size: 0.75rem;
          font-weight: 600;
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          display: flex;
          align-items: center;
          gap: 0.25rem;
          text-transform: capitalize;
        }

        .challengeDescription {
          font-size: 0.875rem;
          color: #4b5563;
          flex-grow: 1;
          margin: 0;
        }

        .challengeProgress {
          margin-top: auto;
        }

        .progressHeader {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.875rem;
          color: #4b5563;
          margin-bottom: 0.5rem;
        }

        .daysRemaining {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          color: #6b7280;
        }

        .progressBarContainer {
          width: 100%;
          background-color: #e5e7eb;
          border-radius: 9999px;
          height: 8px;
          overflow: hidden;
        }

        .progressBar {
          height: 100%;
          border-radius: 9999px;
          transition: width 0.5s ease-in-out;
        }

        .challengeStats {
          display: flex;
          justify-content: space-between;
          gap: 1rem;
          padding-top: 1rem;
          border-top: 1px solid #e5e7eb;
        }

        .statItem {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .statIconAndValue {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-weight: 600;
          color: #4b5563;
        }

        .statLabel {
          font-size: 0.75rem;
          color: #9ca3af;
        }

        .challengeActions {
          display: flex;
          gap: 0.75rem;
          margin-top: 1rem;
        }

        .actionButton {
          flex-grow: 1;
          border: none;
          padding: 0.75rem;
          border-radius: 9999px;
          color: #fff;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s, transform 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .joinButton {
          background-color: #3b82f6;
        }

        .joinButton:hover {
          background-color: #2563eb;
          transform: translateY(-2px);
        }

        .completeButton {
          background-color: #10b981;
        }

        .completeButton:hover {
          background-color: #059669;
          transform: translateY(-2px);
        }

        .leaderboardButton {
          flex-grow: 1;
          background-color: #fff;
          border: 1px solid #d1d5db;
          border-radius: 9999px;
          padding: 0.75rem;
          color: #4b5563;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: background-color 0.2s;
        }

        .leaderboardButton:hover {
          background-color: #f3f4f6;
        }

        .loadingContainer {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          font-size: 1.25rem;
          color: #6b7280;
        }

        .spinner {
          animation: spin 1s linear infinite;
          border: 4px solid #f3f4f6;
          border-top: 4px solid #3b82f6;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          margin-bottom: 1rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .networkError {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          padding: 1.5rem;
          background-color: #fef2f2;
          color: #991b1b;
          border: 1px solid #fca5a5;
          border-radius: 8px;
          margin-bottom: 2rem;
        }
        
        .retryButton {
          background-color: #ef4444;
          color: #fff;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 9999px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: background-color 0.2s;
        }

        .retryButton:hover {
          background-color: #dc2626;
        }

        .notificationList {
          position: fixed;
          top: 1rem;
          right: 1rem;
          z-index: 100;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .notificationItem {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background-color: #fff;
          padding: 1rem;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          border-left: 4px solid;
          width: 300px;
          animation: slideIn 0.5s ease-out;
        }

        .notificationItem.success {
          border-color: #10b981;
          color: #065f46;
        }

        .notificationItem.success .notificationIcon {
          color: #10b981;
        }
        
        .notificationItem.error {
          border-color: #ef4444;
          color: #991b1b;
        }

        .notificationItem.error .notificationIcon {
          color: #ef4444;
        }

        .notificationIcon {
          flex-shrink: 0;
        }

        .notificationMessage {
          flex-grow: 1;
          margin: 0;
          font-size: 0.875rem;
        }

        .closeNotification {
          background: none;
          border: none;
          color: inherit;
          cursor: pointer;
        }

        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .noChallenges {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          gap: 1rem;
          padding: 4rem 2rem;
          background-color: #f9fafb;
          border-radius: 12px;
          color: #6b7280;
        }

        .noChallenges p {
          margin: 0;
        }

        .noChallenges a {
          color: #3b82f6;
          text-decoration: underline;
        }

        /* Modal Styles */
        .form-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 50;
        }

        .form-modal {
          background-color: white;
          padding: 2rem;
          border-radius: 12px;
          width: 90%;
          max-width: 500px;
          box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          transform: scale(0.95);
          animation: zoomIn 0.3s forwards;
        }

        @keyframes zoomIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        .form-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 1rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .form-modal-header h2 {
          font-size: 1.25rem;
          font-weight: 600;
          margin: 0;
        }

        .form-close-button {
          background: none;
          border: none;
          color: #9ca3af;
          cursor: pointer;
          transition: color 0.2s;
        }

        .form-close-button:hover {
          color: #6b7280;
        }

        .form-label {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          color: #4b5563;
        }

        .form-input, .form-textarea {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 1rem;
          transition: border-color 0.2s;
        }

        .form-input:focus, .form-textarea:focus {
          outline: none;
          border-color: #3b82f6;
        }

        .form-textarea {
          resize: vertical;
          min-height: 100px;
        }

        .form-error {
          color: #ef4444;
          font-size: 0.875rem;
          text-align: center;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
        }

        .form-submit-button {
          background-color: #10b981;
          color: white;
          border: none;
          border-radius: 9999px;
          padding: 0.75rem 1.5rem;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .form-submit-button:hover:not(:disabled) {
          background-color: #059669;
        }

        .form-submit-button:disabled {
          background-color: #a1a1aa;
          cursor: not-allowed;
        }
      `}</style>
      <header className="header">
        <div className="headerContent">
          <div className="logoAndGreeting">
            <h1 className="logo">
              <Target size={32} />
              SkillSprint
            </h1>
            <p className="greeting">
              Welcome back, {currentUser?.name || 'User'}! 🚀
            </p>
          </div>
          <div className="headerActions">
            <div className="notificationWrapper">
              <button className="headerButton">
                <Bell size={20} />
              </button>
              {notifications.length > 0 && (
                <span className="notificationBadge">{notifications.length}</span>
              )}
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className={`headerButton ctaButton`}
            >
              <Plus size={18} />
              New Challenge
            </button>
            {onLogout && (
              <button onClick={onLogout} className={`headerButton logoutButton`}>
                <LogOut size={18} />
                Logout
              </button>
            )}
            <div className="userAvatar">
              <User size={20} />
            </div>
          </div>
        </div>
      </header>

      <div className="mainContent">
        {networkError && (
          <div className="networkError">
            <AlertCircle size={24} />
            <p>{networkError}</p>
            <button onClick={initializeDashboard} className="retryButton">
              <RefreshCcw size={16} />
              Retry
            </button>
          </div>
        )}

        {/* Notifications list */}
        <div className="notificationList">
          {notifications.map((n) => (
            <div key={n.id} className={`notificationItem ${n.type}`}>
              <div className="notificationIcon">
                {n.type === 'success' && <CheckCircle2 size={20} />}
                {n.type === 'error' && <XCircle size={20} />}
              </div>
              <p className="notificationMessage">{n.message}</p>
              <button onClick={() => setNotifications(prev => prev.filter(item => item.id !== n.id))} className="closeNotification">
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
        
        {/* Dashboard Stats Section */}
        <div className="statGrid">
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
        
        <div className="sectionHeader">
          <h2>Your Challenges</h2>
          <button onClick={() => initializeDashboard()} className="refreshButton">
            <RefreshCcw size={16} />
          </button>
        </div>

        <div className="challengeGrid">
          {challenges.length > 0 ? (
            challenges.map((challenge) => (
              <ChallengeCard key={challenge._id} challenge={challenge} />
            ))
          ) : (
            <div className="noChallenges">
              <LayoutDashboard size={48} color="#d1d5db" />
              <p>No challenges found. Why not <a href="#" onClick={() => setShowCreateForm(true)}>create a new one</a>?</p>
            </div>
          )}
        </div>
      </div>
      
      {showCreateForm && (
        <ChallengeCreateForm 
          onClose={() => setShowCreateForm(false)} 
          onSuccess={(newChallenge) => {
            // Optimistically add the new challenge to the state for immediate display
            setChallenges(prev => [newChallenge, ...prev]);
            setShowCreateForm(false);
            addNotification('success', 'Challenge created successfully!');
            // Refresh all data in the background to ensure consistency
            initializeDashboard();
          }} 
        />
      )}
    </div>
  );
};

export default Dashboard;
