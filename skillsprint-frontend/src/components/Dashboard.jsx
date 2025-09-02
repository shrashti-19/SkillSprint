import React, { useState, useEffect } from 'react';
import { LogOut, Code, Trophy, Calendar, User, ChevronRight, Plus, Target, X } from 'lucide-react';

const API_BASE = 'https://skillsprint-production-663d.up.railway.app/api';

// Utility function for API calls with proper error handling
const apiCall = async (endpoint, options = {}) => {
  try {
    const token = localStorage.getItem('token');
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers
      },
      ...options
    };

    console.log(`🔄 API Call: ${config.method || 'GET'} ${API_BASE}${endpoint}`);
    const response = await fetch(`${API_BASE}${endpoint}`, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log(`✅ API Response:`, result);
    return result;
  } catch (error) {
    console.error(`❌ API Error for ${endpoint}:`, error);
    throw error;
  }
};

// Create Challenge Modal Component
const CreateChallengeModal = ({ onClose, onChallengeCreated }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    difficulty: 'Easy',
    duration: 7,
    points: 10
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (!formData.title.trim()) {
      setError('Challenge title is required');
      setLoading(false);
      return;
    }

    if (formData.duration < 1 || formData.duration > 365) {
      setError('Duration must be between 1 and 365 days');
      setLoading(false);
      return;
    }

    try {
      console.log('🎯 Creating challenge with data:', formData);
      
      // Real API call to your Railway backend
      const response = await apiCall('/challenges', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      
      console.log('🎉 Challenge created successfully:', response);
      
      // Call parent callback to refresh challenges list
      if (onChallengeCreated) {
        onChallengeCreated(response.data || response);
      }
      
      // Close the modal
      onClose();
      
    } catch (err) {
      console.error('❌ Error creating challenge:', err);
      
      // Better error handling with specific messages
      let errorMessage = 'Failed to create challenge';
      
      if (err.message.includes('401')) {
        errorMessage = 'Please log in again to create challenges';
      } else if (err.message.includes('403')) {
        errorMessage = 'You do not have permission to create challenges';
      } else if (err.message.includes('400')) {
        errorMessage = 'Invalid challenge data. Please check your inputs.';
      } else if (err.message.includes('fetch')) {
        errorMessage = 'Network error. Please check your connection.';
      } else {
        errorMessage = err.message || 'Unknown error occurred';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDifficultyChange = (difficulty) => {
    const pointsMap = {
      'Easy': 10,
      'Medium': 20,
      'Hard': 30
    };
    
    setFormData(prev => ({
      ...prev,
      difficulty,
      points: pointsMap[difficulty]
    }));
  };

  return (
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
        position: 'relative',
        boxShadow: '0 25px 50px rgba(0,0,0,0.25)'
      }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '25px'
        }}>
          <h2 style={{
            fontSize: '1.8rem',
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Target size={24} />
            Create New Challenge
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '8px',
              color: '#666',
              transition: 'all 0.3s'
            }}
            onMouseOver={(e) => e.target.style.background = '#f3f4f6'}
            onMouseOut={(e) => e.target.style.background = 'none'}
          >
            <X size={24} />
          </button>
        </div>

        {error && (
          <div style={{
            background: '#fee2e2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '20px',
            color: '#dc2626',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{
              width: '4px',
              height: '4px',
              background: '#dc2626',
              borderRadius: '50%'
            }}></span>
            {error}
          </div>
        )}

        <div>
          {/* Title */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '600',
              color: '#374151'
            }}>
              Challenge Title *
            </label>
            <input
              type="text"
              placeholder="e.g., Read 30 minutes daily"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '1rem',
                outline: 'none',
                transition: 'border-color 0.3s',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          {/* Description */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '600',
              color: '#374151'
            }}>
              Description
            </label>
            <textarea
              placeholder="Describe your challenge and what success looks like..."
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '1rem',
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          {/* Difficulty & Duration Row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '15px',
            marginBottom: '20px'
          }}>
            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
                color: '#374151'
              }}>
                Difficulty
              </label>
              <select
                value={formData.difficulty}
                onChange={(e) => handleDifficultyChange(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  outline: 'none',
                  background: 'white',
                  boxSizing: 'border-box'
                }}
              >
                <option value="Easy">Easy (10 pts)</option>
                <option value="Medium">Medium (20 pts)</option>
                <option value="Hard">Hard (30 pts)</option>
              </select>
            </div>

            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
                color: '#374151'
              }}>
                Duration (days)
              </label>
              <input
                type="number"
                min="1"
                max="365"
                value={formData.duration}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 1;
                  handleInputChange('duration', Math.max(1, Math.min(365, value)));
                }}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* Points Display */}
          <div style={{
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            borderRadius: '12px',
            padding: '15px',
            marginBottom: '25px',
            color: 'white',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>Total Reward</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
              {(formData.points * formData.duration).toLocaleString()} points
            </div>
            <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>
              {formData.points} points × {formData.duration} days
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={loading || !formData.title.trim()}
            style={{
              width: '100%',
              background: loading || !formData.title.trim() ? 
                '#9ca3af' : 'linear-gradient(135deg, #667eea, #764ba2)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              padding: '16px',
              fontSize: '1.1rem',
              fontWeight: '600',
              cursor: loading || !formData.title.trim() ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
            onMouseOver={(e) => {
              if (!loading && formData.title.trim()) {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 10px 30px rgba(102, 126, 234, 0.4)';
              }
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }}
          >
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                Creating Challenge...
              </div>
            ) : (
              <>
                <Plus size={20} />
                Create Challenge
              </>
            )}
          </button>
        </div>
      </div>
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

// Main Dashboard Component
const Dashboard = ({ user, onLogout }) => {
  const [challenges, setChallenges] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      console.log('🔄 Fetching dashboard data from Railway backend...');
      
      // Fetch challenges and user stats from your real API
      const [challengesRes, statsRes] = await Promise.all([
        apiCall('/challenges').catch(err => {
          console.warn('Challenges fetch failed:', err);
          return { data: [] };
        }),
        apiCall('/users/cache/stats').catch(err => {
          console.warn('Stats fetch failed:', err);
          return { data: { totalSolved: 0, currentStreak: 0, rank: 'N/A' } };
        })
      ]);
      
      // Handle the data based on your backend response structure
      const challengesData = challengesRes.data || challengesRes || [];
      const statsData = statsRes.data || statsRes || { totalSolved: 0, currentStreak: 0, rank: 'N/A' };
      
      console.log('✅ Processed challenges:', challengesData);
      console.log('✅ Processed stats:', statsData);
      
      setChallenges(Array.isArray(challengesData) ? challengesData : []);
      setUserStats(statsData);
      
    } catch (error) {
      console.error('❌ Critical error fetching dashboard data:', error);
      
      // Set fallback data so UI doesn't break
      setChallenges([]);
      setUserStats({ totalSolved: 0, currentStreak: 0, rank: 'N/A' });
      
      // Handle authentication errors
      if (error.message.includes('401')) {
        alert('Session expired. Please log in again.');
        onLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChallengeCreated = (newChallenge) => {
    console.log('🎉 New challenge created:', newChallenge);
    setChallenges(prev => [newChallenge, ...prev]);
    
    // Update user stats optimistically
    if (userStats) {
      setUserStats(prev => ({
        ...prev,
        totalSolved: (prev.totalSolved || 0) + 1
      }));
    }
  };

  const handleJoinChallenge = async (challengeId) => {
    setActionLoading(prev => ({ ...prev, [`join_${challengeId}`]: true }));
    
    try {
      console.log('🚀 Joining challenge:', challengeId);
      
      // Use your real API endpoint
      await apiCall(`/challenges/${challengeId}/join`, {
        method: 'POST'
      });
      
      // Refresh data after joining
      await fetchDashboardData();
      
      // Success feedback
      const challengeName = challenges.find(c => c._id === challengeId)?.title || 'Challenge';
      alert(`Successfully joined "${challengeName}"! 🎉`);
      
    } catch (error) {
      console.error('❌ Error joining challenge:', error);
      
      let errorMessage = 'Error joining challenge';
      if (error.message.includes('401')) {
        errorMessage = 'Please log in to join challenges';
        onLogout();
      } else if (error.message.includes('400')) {
        errorMessage = 'You may already be part of this challenge';
      } else if (error.message.includes('404')) {
        errorMessage = 'Challenge not found';
      }
      
      alert(errorMessage);
    } finally {
      setActionLoading(prev => ({ ...prev, [`join_${challengeId}`]: false }));
    }
  };

  const handleLogProgress = async (challengeId) => {
    setActionLoading(prev => ({ ...prev, [`progress_${challengeId}`]: true }));
    
    try {
      console.log('📝 Logging progress for challenge:', challengeId);
      
      // Use your progress logging endpoint
      await apiCall(`/progress/log/${challengeId}`, {
        method: 'POST'
      });
      
      // Refresh data after logging progress
      await fetchDashboardData();
      
      // Success feedback
      const challengeName = challenges.find(c => c._id === challengeId)?.title || 'Challenge';
      alert(`Progress logged for "${challengeName}"! 🎉`);
      
    } catch (error) {
      console.error('❌ Error logging progress:', error);
      
      let errorMessage = 'Error logging progress';
      if (error.message.includes('401')) {
        errorMessage = 'Please log in to log progress';
        onLogout();
      } else if (error.message.includes('400')) {
        errorMessage = 'You may have already logged progress today';
      } else if (error.message.includes('404')) {
        errorMessage = 'Challenge not found or you are not a participant';
      }
      
      alert(errorMessage);
    } finally {
      setActionLoading(prev => ({ ...prev, [`progress_${challengeId}`]: false }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white text-xl">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-white border-opacity-30 border-t-white rounded-full animate-spin"></div>
          Connecting to Railway backend...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 p-5">
      {/* Header */}
      <div className="bg-white bg-opacity-10 rounded-3xl p-6 mb-8 flex justify-between items-center text-white">
        <div>
          <h1 className="text-3xl font-bold mb-1">
            Welcome back, {user.name || user.username}!
          </h1>
          <p className="opacity-80">
            Ready for today's coding challenge?
          </p>
        </div>
        <button
          onClick={onLogout}
          className="bg-white bg-opacity-20 hover:bg-opacity-30 border-none rounded-xl px-4 py-3 text-white cursor-pointer flex items-center gap-2 text-base transition-all"
        >
          <LogOut size={20} />
          Logout
        </button>
      </div>

      {/* Stats Cards */}
      {userStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          <div className="bg-white bg-opacity-10 rounded-2xl p-6 text-white text-center">
            <Trophy size={24} className="mx-auto mb-2" />
            <div className="text-3xl font-bold">
              {userStats.totalSolved || 0}
            </div>
            <div className="opacity-80">Challenges Solved</div>
          </div>
          
          <div className="bg-white bg-opacity-10 rounded-2xl p-6 text-white text-center">
            <Calendar size={24} className="mx-auto mb-2" />
            <div className="text-3xl font-bold">
              {userStats.currentStreak || 0}
            </div>
            <div className="opacity-80">Day Streak</div>
          </div>

          <div className="bg-white bg-opacity-10 rounded-2xl p-6 text-white text-center">
            <User size={24} className="mx-auto mb-2" />
            <div className="text-3xl font-bold">
              #{userStats.rank || 'N/A'}
            </div>
            <div className="opacity-80">Global Rank</div>
          </div>
        </div>
      )}

      {/* Challenges List */}
      <div className="bg-white bg-opacity-10 rounded-3xl p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-white text-2xl font-bold flex items-center gap-2">
            <Code size={24} />
            Available Challenges
          </h2>
          
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-white bg-opacity-20 hover:bg-opacity-30 border border-white border-opacity-30 rounded-xl px-5 py-3 text-white cursor-pointer flex items-center gap-2 text-base font-semibold transition-all hover:-translate-y-1"
          >
            <Plus size={20} />
            Create Challenge
          </button>
        </div>

        {challenges.length === 0 ? (
          <div className="text-center text-white text-opacity-80 py-12">
            <Code size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">No challenges available yet</p>
            <p className="text-sm">Create your first challenge to get started!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {challenges.map((challenge) => {
              const challengeId = challenge._id || challenge.id;
              return (
                <div
                  key={challengeId}
                  className="bg-white bg-opacity-10 hover:bg-opacity-20 rounded-xl p-6 transition-all border border-white border-opacity-20"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-white text-xl font-semibold">
                      {challenge.title}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${
                      challenge.difficulty === 'Easy' ? 'bg-green-500' :
                      challenge.difficulty === 'Medium' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}>
                      {challenge.difficulty}
                    </span>
                  </div>
                  
                  <p className="text-white text-opacity-80 mb-4 leading-relaxed">
                    {challenge.description || 'No description provided'}
                  </p>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4 text-white text-opacity-70 text-sm">
                      <div className="flex items-center gap-1">
                        <Trophy size={16} />
                        {challenge.points || 10} points
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar size={16} />
                        {challenge.duration || 7} days
                      </div>
                      {challenge.participants && (
                        <div className="flex items-center gap-1">
                          <User size={16} />
                          {challenge.participants.length} joined
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleJoinChallenge(challengeId);
                        }}
                        disabled={actionLoading[`join_${challengeId}`]}
                        className="bg-white bg-opacity-20 hover:bg-opacity-30 border border-white border-opacity-30 rounded-lg px-4 py-2 text-white cursor-pointer flex items-center gap-1 text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {actionLoading[`join_${challengeId}`] ? (
                          <div className="w-4 h-4 border border-white border-opacity-30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                          'Join'
                        )}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLogProgress(challengeId);
                        }}
                        disabled={actionLoading[`progress_${challengeId}`]}
                        className="bg-green-500 hover:bg-green-600 rounded-lg px-4 py-2 text-white cursor-pointer flex items-center gap-1 text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {actionLoading[`progress_${challengeId}`] ? (
                          <div className="w-4 h-4 border border-white border-opacity-30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                          <>
                            Log Progress
                            <ChevronRight size={16} />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Challenge Modal */}
      {showCreateForm && (
        <CreateChallengeModal
          onClose={() => setShowCreateForm(false)}
          onChallengeCreated={handleChallengeCreated}
        />
      )}
    </div>
  );
};

export default Dashboard;