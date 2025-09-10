


import React, { useState, useEffect } from 'react';
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
  Loader2
} from 'lucide-react';

// Import your existing components
// import CreateChallenge from './CreateChallenge';
import CreateChallenge from './CreateChallenge';

const Dashboard = ({ user: propUser, onLogout }) => {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(propUser || null);
  const [notifications, setNotifications] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  // const [userProfile, setUserProfile] = useState(null);

  // Load data on component mount
  // Load data on component mount


useEffect(() => {
  // Set user data from props if available
  if (propUser) {
    setCurrentUser(propUser);
    // Ensure userId is stored for API calls
    if (propUser._id || propUser.id) {
      localStorage.setItem('userId', propUser._id || propUser.id);
    }
  }
  initializeDashboard();
}, [propUser]);


  const initializeDashboard = async () => {
    try {
      setLoading(true);
      await loadUserData();
      await loadChallenges();
      await loadNotifications();
    } catch (error) {
      console.error('Dashboard initialization error:', error);
      addNotification('error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Get auth token from localStorage
  const getAuthToken = () => {
    return localStorage.getItem('authToken') || localStorage.getItem('token');
  };

  // API call wrapper with auth
  const apiCall = async (endpoint, options = {}) => {
    const token = getAuthToken();
    const baseURL =  'https://skillsprint-production-663d.up.railway.app';
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(`${baseURL}${endpoint}`, config);
    
    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  };

  // Load user profile and stats
  const loadUserData = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        addNotification('error', 'Please log in to access dashboard');
        return;
      }

      // Get current user from token or separate endpoint
      // For now, assuming user ID is stored in localStorage or JWT decoded
      const userId = localStorage.getItem('userId'); // Adjust based on your auth implementation
      
      if (userId) {
        const profile = await apiCall(`/api/users/profile/${userId}`);
        setCurrentUser(profile);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      addNotification('error', 'Failed to load user profile');
    }
  };

  // Load all challenges
  // Load all challenges
const loadChallenges = async () => {
  try {
    const challengesData = await apiCall('/api/challenges');
    // Ensure challengesData is an array
    setChallenges(Array.isArray(challengesData) ? challengesData : []);
  } catch (error) {
    console.error('Error loading challenges:', error);
    addNotification('error', 'Failed to load challenges');
    setChallenges([]); // Set to empty array on error
  }
};
  // Load user notifications
  const loadNotifications = async () => {
    try {
      if (!currentUser) return;
      
      const notificationsData = await apiCall(`/api/notifications/${currentUser._id}`);
      setNotifications(notificationsData);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  // Join a challenge
  const joinChallenge = async (challengeId) => {
    try {
      await apiCall(`/api/challenges/${challengeId}/join`, {
        method: 'POST'
      });
      
      addNotification('success', 'Successfully joined challenge!');
      await loadChallenges(); // Reload challenges to update participation
    } catch (error) {
      console.error('Error joining challenge:', error);
      addNotification('error', 'Failed to join challenge');
    }
  };

  // Log daily progress
  const markComplete = async (challengeId) => {
    try {
      await apiCall(`/api/progress/log/${challengeId}`, {
        method: 'POST'
      });
      
      addNotification('success', 'Daily progress logged successfully!');
      await loadChallenges(); // Reload to update progress
    } catch (error) {
      console.error('Error logging progress:', error);
      addNotification('error', 'Failed to log progress');
    }
  };

  // Get user's streak for a challenge
  const getUserStreak = async (challengeId) => {
    try {
      if (!currentUser) return 0;
      
      const streakData = await apiCall(`/api/progress/streak/${currentUser._id}/${challengeId}`);
      return streakData.streak || 0;
    } catch (error) {
      console.error('Error getting streak:', error);
      return 0;
    }
  };

  // Helper function to check if user has joined a challenge
  const isUserJoined = (challenge) => {
    if (!currentUser || !challenge.participants) return false;
    return challenge.participants.some(p => p.user === currentUser._id || p.user._id === currentUser._id);
  };

  // Helper function to get user's participation data
  const getUserParticipation = (challenge) => {
    if (!currentUser || !challenge.participants) return null;
    return challenge.participants.find(p => 
      (p.user === currentUser._id) || (p.user._id === currentUser._id)
    );
  };

  // Calculate challenge status based on participation
  const getChallengeStatus = (challenge) => {
    const participation = getUserParticipation(challenge);
    if (!participation) return 'available';
    
    const daysSinceStart = Math.floor((new Date() - new Date(challenge.startDate)) / (1000 * 60 * 60 * 24));
    const progress = participation.progress || 0;
    
    if (progress >= 100) return 'completed';
    if (daysSinceStart >= challenge.duration && progress < 100) return 'failed';
    return 'active';
  };

  // Calculate dashboard stats
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

    const totalProgress = joinedChallenges.length > 0 
      ? Math.round(joinedChallenges.reduce((sum, challenge) => {
          const participation = getUserParticipation(challenge);
          return sum + (participation?.progress || 0);
        }, 0) / joinedChallenges.length)
      : 0;

    return { active, completed, failed, longestStreak, totalProgress };
  };

  const { active: activeChallenges, completed: completedChallenges, failed: failedChallenges, longestStreak, totalProgress } = getDashboardStats();

  // Notification system
  const addNotification = (type, message) => {
    const notification = {
      id: Date.now(),
      type,
      message,
      timestamp: new Date()
    };
    setNotifications(prev => [notification, ...prev.slice(0, 4)]);
    setTimeout(() => {
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
    <div style={{
      width: '100%',
      height: '8px',
      backgroundColor: '#e5e7eb',
      borderRadius: '4px',
      overflow: 'hidden'
    }}>
      <div style={{
        width: `${Math.min((current / total) * 100, 100)}%`,
        height: '100%',
        backgroundColor: color,
        borderRadius: '4px',
        transition: 'width 0.3s ease'
      }} />
    </div>
  );

  const StatCard = ({ icon, title, value, subtitle, color = '#3b82f6' }) => (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
      border: '1px solid #f1f5f9',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease'
    }}
    onMouseOver={(e) => {
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.1)';
    }}
    onMouseOut={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.05)';
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
        <div style={{
          padding: '8px',
          borderRadius: '8px',
          backgroundColor: `${color}15`,
          color: color
        }}>
          {icon}
        </div>
        <span style={{ fontSize: '0.9rem', color: '#6b7280', fontWeight: '500' }}>
          {title}
        </span>
      </div>
      <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '4px' }}>
        {value}
      </div>
      {subtitle && (
        <div style={{ fontSize: '0.85rem', color: '#9ca3af' }}>
          {subtitle}
        </div>
      )}
    </div>
  );

  const ChallengeCard = ({ challenge }) => {
    const participation = getUserParticipation(challenge);
    const status = getChallengeStatus(challenge);
    const progress = participation?.progress || 0;
    const streak = participation?.streak || 0;
    const isJoined = isUserJoined(challenge);

    const daysSinceStart = Math.floor((new Date() - new Date(challenge.startDate)) / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.max(0, challenge.duration - daysSinceStart);

    return (
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
        border: '1px solid #f1f5f9',
        position: 'relative',
        transition: 'all 0.2s ease'
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.1)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.05)';
      }}>
        
        {/* Status indicator */}
        <div style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <div style={{
            padding: '6px 12px',
            borderRadius: '16px',
            backgroundColor: `${getStatusColor(status)}15`,
            color: getStatusColor(status),
            fontSize: '0.8rem',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            textTransform: 'capitalize'
          }}>
            {getStatusIcon(status)}
            {status}
          </div>
        </div>

        {/* Challenge header */}
        <div style={{ marginBottom: '16px', paddingRight: '120px' }}>
          <h3 style={{
            fontSize: '1.2rem',
            fontWeight: 'bold',
            color: '#1f2937',
            margin: '0 0 4px 0'
          }}>
            {challenge.title}
          </h3>
          <p style={{
            color: '#6b7280',
            fontSize: '0.9rem',
            margin: 0,
            lineHeight: '1.4'
          }}>
            {challenge.description}
          </p>
        </div>

        {/* Progress section - only show for joined challenges */}
        {isJoined && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px'
            }}>
              <span style={{ fontSize: '0.9rem', color: '#4b5563', fontWeight: '500' }}>
                Progress: {Math.round(progress)}%
              </span>
              <span style={{ fontSize: '0.9rem', color: getStatusColor(status), fontWeight: '600' }}>
                {daysRemaining} days left
              </span>
            </div>
            <ProgressBar 
              current={progress} 
              total={100}
              color={getStatusColor(status)}
            />
          </div>
        )}

        {/* Stats row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '16px',
          marginBottom: '20px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              color: '#ef4444',
              marginBottom: '4px'
            }}>
              <Flame size={16} />
              <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                {isJoined ? streak : 0}
              </span>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Streak</span>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              color: '#3b82f6',
              marginBottom: '4px'
            }}>
              <Calendar size={16} />
              <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                {challenge.duration}
              </span>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Total Days</span>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              color: '#10b981',
              marginBottom: '4px'
            }}>
              <User size={16} />
              <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                {challenge.participants?.length || 0}
              </span>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Participants</span>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap'
        }}>
          {!isJoined ? (
            <button
              onClick={() => joinChallenge(challenge._id)}
              style={{
                background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                fontSize: '0.85rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'transform 0.2s ease'
              }}
              onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
              onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
            >
              <Plus size={14} />
              Join Challenge
            </button>
          ) : status === 'active' && (
            <button
              onClick={() => markComplete(challenge._id)}
              style={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                fontSize: '0.85rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'transform 0.2s ease'
              }}
              onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
              onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
            >
              <CheckCircle2 size={14} />
              Mark Complete
            </button>
          )}
          
          <button
            onClick={() => {
              // Navigate to challenge details or leaderboard
              // You can implement this based on your routing
              console.log('View leaderboard for:', challenge._id);
            }}
            style={{
              background: 'transparent',
              color: '#6b7280',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '0.85rem',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.target.style.borderColor = '#3b82f6';
              e.target.style.color = '#3b82f6';
            }}
            onMouseOut={(e) => {
              e.target.style.borderColor = '#e5e7eb';
              e.target.style.color = '#6b7280';
            }}
          >
            <Trophy size={14} />
            Leaderboard
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 size={48} style={{ color: '#3b82f6', animation: 'spin 1s linear infinite' }} />
          <p style={{ color: '#6b7280', marginTop: '16px' }}>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Header */}
      <header style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '24px 32px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{
                fontSize: '1.8rem',
                fontWeight: 'bold',
                margin: '0 0 4px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <Target size={28} />
                Challenge Tracker
              </h1>
              <p style={{ margin: 0, opacity: 0.9, fontSize: '1rem' }}>
                Welcome back, {currentUser?.name || 'User'}!
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {/* Notifications */}
              <div style={{ position: 'relative' }}>
                <button style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  borderRadius: '50%',
                  padding: '12px',
                  cursor: 'pointer',
                  color: 'white'
                }}>
                  <Bell size={20} />
                </button>
                {notifications.length > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    background: '#ef4444',
                    color: 'white',
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    fontSize: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold'
                  }}>
                    {notifications.length}
                  </span>
                )}
              </div>

              <button
                onClick={() => setShowCreateForm(true)}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px 20px',
                  cursor: 'pointer',
                  color: 'white',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'background 0.2s ease'
                }}
                onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.3)'}
                onMouseOut={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
              >
                <Plus size={18} />
                New Challenge

                {onLogout && (
  <button
    onClick={onLogout}
    style={{
      background: 'rgba(255,255,255,0.2)',
      border: 'none',
      borderRadius: '12px',
      padding: '12px 20px',
      cursor: 'pointer',
      color: 'white',
      fontWeight: '600',
      transition: 'background 0.2s ease'
    }}
    onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.3)'}
    onMouseOut={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
  >
    Logout
  </button>
)}

              </button>

              <div style={{
                background: 'rgba(255,255,255,0.2)',
                borderRadius: '50%',
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <User size={20} />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Notifications */}
      {notifications.length > 0 && (
        <div style={{
          position: 'fixed',
          top: '120px',
          right: '32px',
          zIndex: 200,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          maxWidth: '400px'
        }}>
          {notifications.map(notification => (
            <div key={notification.id} style={{
              background: notification.type === 'success' ? '#10b981' : 
                         notification.type === 'error' ? '#ef4444' : '#3b82f6',
              color: 'white',
              padding: '16px 20px',
              borderRadius: '12px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
              fontSize: '0.9rem',
              fontWeight: '500',
              animation: 'slideInRight 0.3s ease-out'
            }}>
              {notification.message}
            </div>
          ))}
        </div>
      )}

      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px' }}>
        {/* Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '24px',
          marginBottom: '40px'
        }}>
          <StatCard
            icon={<Activity size={20} />}
            title="Active Challenges"
            value={activeChallenges}
            subtitle={`${failedChallenges} failed, ${completedChallenges} completed`}
            color="#10b981"
          />
          <StatCard
            icon={<Flame size={20} />}
            title="Longest Streak"
            value={`${longestStreak} days`}
            subtitle="Personal best record"
            color="#ef4444"
          />
          <StatCard
          icon={<Trophy size={20} />}
          title="Available Challenges"
          value={Array.isArray(challenges) ? challenges.length : 0}
          subtitle={`${Array.isArray(challenges) ? challenges.filter(c => !isUserJoined(c)).length : 0} available to join`}
          color="#f59e0b"
          />
          <StatCard
            icon={<TrendingUp size={20} />}
            title="Average Progress"
            value={`${totalProgress}%`}
            subtitle="Across all joined challenges"
            color="#3b82f6"
          />
        </div>

        {/* Challenges Section */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px'
          }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: '#1f2937',
              margin: 0
            }}>
              All Challenges
            </h2>
            <div style={{
              display: 'flex',
              gap: '8px',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                {challenges.length} total challenges
              </span>
            </div>
          </div>

          {/* Challenges Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
            gap: '24px'
          }}>
            {challenges.map(challenge => (
              <ChallengeCard key={challenge._id} challenge={challenge} />
            ))}
          </div>

          {challenges.length === 0 && (
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '60px 40px',
              textAlign: 'center',
              boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
              border: '1px solid #f1f5f9'
            }}>
              <Target size={48} style={{ color: '#d1d5db', marginBottom: '16px' }} />
              <h3 style={{
                fontSize: '1.2rem',
                fontWeight: 'bold',
                color: '#1f2937',
                margin: '0 0 8px 0'
              }}>
                No challenges available
              </h3>
              <p style={{
                color: '#6b7280',
                marginBottom: '24px',
                fontSize: '0.9rem'
              }}>
                Create your first challenge to get started!
              </p>
              <button
                onClick={() => setShowCreateForm(true)}
                style={{
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px 24px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  margin: '0 auto',
                  transition: 'transform 0.2s ease'
                }}
                onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
              >
                <Plus size={18} />
                Create Challenge
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Create Challenge Modal - Replace this with your CreateChallenge component */}
      {showCreateForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '30px',
            width: '100%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 25px 50px rgba(0,0,0,0.25)'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: '#1f2937',
                margin: 0
              }}>
                Create New Challenge
              </h3>
              <button
                onClick={() => setShowCreateForm(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '8px',
                  borderRadius: '8px',
                  color: '#6b7280'
                }}
              >
                ✕
              </button>
            </div>
            <CreateChallenge />

            <button
              onClick={() => setShowCreateForm(false)}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                padding: '16px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
                        >
                          Close for Demo
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            };
            
            export default Dashboard;