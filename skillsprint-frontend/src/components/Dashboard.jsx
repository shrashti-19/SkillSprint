import React, { useState, useEffect } from 'react';
import { LogOut, Code, Trophy, Calendar, User, ChevronRight } from 'lucide-react';
import api from '../config/api';

const Dashboard = ({ user, onLogout }) => {
  const [challenges, setChallenges] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch challenges and user stats
      const [challengesRes, statsRes] = await Promise.all([
        api.get('/challenges'),
        api.get('/users/stats')
      ]);
      
      setChallenges(challengesRes.data);
      setUserStats(statsRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSolveChallenge = async (challengeId) => {
    try {
      await api.post(`/challenges/${challengeId}/solve`);
      // Refresh data
      fetchDashboardData();
      alert('Challenge marked as solved! 🎉');
    } catch (error) {
      console.error('Error solving challenge:', error);
      alert('Error solving challenge. Please try again.');
    }
  };

  if (loading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        fontSize: '1.2rem'
      }}>
        Loading your dashboard...
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      {/* Header */}
      <div style={{
        background: 'rgba(255,255,255,0.1)',
        borderRadius: '20px',
        padding: '20px',
        marginBottom: '30px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        color: 'white'
      }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>
            Welcome back, {user.name}!
          </h1>
          <p style={{ margin: '5px 0 0 0', opacity: 0.8 }}>
            Ready for today's coding challenge?
          </p>
        </div>
        <button
          onClick={onLogout}
          style={{
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            borderRadius: '12px',
            padding: '12px 16px',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '1rem'
          }}
        >
          <LogOut size={20} />
          Logout
        </button>
      </div>

      {/* Stats Cards */}
      {userStats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginBottom: '30px'
        }}>
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '16px',
            padding: '20px',
            color: 'white',
            textAlign: 'center'
          }}>
            <Trophy size={24} style={{ marginBottom: '8px' }} />
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
              {userStats.totalSolved || 0}
            </div>
            <div style={{ opacity: 0.8 }}>Challenges Solved</div>
          </div>
          
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '16px',
            padding: '20px',
            color: 'white',
            textAlign: 'center'
          }}>
            <Calendar size={24} style={{ marginBottom: '8px' }} />
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
              {userStats.currentStreak || 0}
            </div>
            <div style={{ opacity: 0.8 }}>Day Streak</div>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '16px',
            padding: '20px',
            color: 'white',
            textAlign: 'center'
          }}>
            <User size={24} style={{ marginBottom: '8px' }} />
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
              #{userStats.rank || 'N/A'}
            </div>
            <div style={{ opacity: 0.8 }}>Global Rank</div>
          </div>
        </div>
      )}

      {/* Challenges List */}
      <div style={{
        background: 'rgba(255,255,255,0.1)',
        borderRadius: '20px',
        padding: '30px'
      }}>
        <h2 style={{
          color: 'white',
          fontSize: '1.5rem',
          fontWeight: 'bold',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Code size={24} />
          Available Challenges
        </h2>

        {challenges.length === 0 ? (
          <div style={{
            textAlign: 'center',
            color: 'rgba(255,255,255,0.8)',
            padding: '40px'
          }}>
            No challenges available yet. Check back soon!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {challenges.map((challenge) => (
              <div
                key={challenge._id}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  padding: '20px',
                  transition: 'all 0.3s',
                  cursor: 'pointer',
                  border: '1px solid rgba(255,255,255,0.2)'
                }}
                onMouseOver={(e) => {
                  e.target.style.background = 'rgba(255,255,255,0.2)';
                }}
                onMouseOut={(e) => {
                  e.target.style.background = 'rgba(255,255,255,0.1)';
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '10px'
                }}>
                  <h3 style={{
                    color: 'white',
                    fontSize: '1.2rem',
                    fontWeight: '600',
                    margin: 0
                  }}>
                    {challenge.title}
                  </h3>
                  <span style={{
                    background: challenge.difficulty === 'Easy' ? '#10b981' :
                               challenge.difficulty === 'Medium' ? '#f59e0b' : '#ef4444',
                    color: 'white',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    fontWeight: '500'
                  }}>
                    {challenge.difficulty}
                  </span>
                </div>
                
                <p style={{
                  color: 'rgba(255,255,255,0.8)',
                  margin: '0 0 15px 0',
                  lineHeight: '1.5'
                }}>
                  {challenge.description}
                </p>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: 'rgba(255,255,255,0.7)',
                    fontSize: '0.9rem'
                  }}>
                    <Trophy size={16} />
                    {challenge.points} points
                  </div>
                  
                  <button
                    onClick={() => handleSolveChallenge(challenge._id)}
                    style={{
                      background: 'rgba(255,255,255,0.2)',
                      border: '1px solid rgba(255,255,255,0.3)',
                      borderRadius: '8px',
                      padding: '8px 16px',
                      color: 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.9rem',
                      transition: 'all 0.3s'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.background = 'rgba(255,255,255,0.3)';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.background = 'rgba(255,255,255,0.2)';
                    }}
                  >
                    Solve
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;