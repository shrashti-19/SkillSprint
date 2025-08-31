import React, { useState, useEffect } from 'react';
import { Trophy, Target, Calendar, LogOut } from 'lucide-react';
import api from '../config/api';

const Dashboard = ({ user, onLogout }) => {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChallenges();
  }, []);

  const fetchChallenges = async () => {
    try {
      const response = await api.get('/challenges');
      setChallenges(response.data.challenges || []);
    } catch (error) {
      console.error('Error fetching challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      {/* Header */}
      <div style={{
        background: 'white',
        padding: '1rem 2rem',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{ color: '#333', margin: 0 }}>SkillSprint Dashboard</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span>Welcome, {user.name}!</span>
          <button
            onClick={onLogout}
            style={{
              padding: '0.5rem 1rem',
              background: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ padding: '2rem' }}>
        {/* Stats Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '10px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Trophy style={{ color: '#ffd700' }} size={24} />
              <h3 style={{ margin: 0, color: '#333' }}>Total Challenges</h3>
            </div>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, color: '#667eea' }}>
              {challenges.length}
            </p>
          </div>

          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '10px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Target style={{ color: '#28a745' }} size={24} />
              <h3 style={{ margin: 0, color: '#333' }}>Active Goals</h3>
            </div>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, color: '#28a745' }}>
              {challenges.filter(c => c.participants?.some(p => p.user === user.id)).length}
            </p>
          </div>

          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '10px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Calendar style={{ color: '#ff6b6b' }} size={24} />
              <h3 style={{ margin: 0, color: '#333' }}>Current Streak</h3>
            </div>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, color: '#ff6b6b' }}>
              7 days
            </p>
          </div>
        </div>

        {/* Challenges List */}
        <div style={{
          background: 'white',
          borderRadius: '10px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          padding: '1.5rem'
        }}>
          <h2 style={{ marginTop: 0, color: '#333' }}>Available Challenges</h2>
          
          {loading ? (
            <p>Loading challenges...</p>
          ) : challenges.length === 0 ? (
            <p>No challenges available. Create your first challenge!</p>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {challenges.slice(0, 5).map((challenge, index) => (
                <div
                  key={challenge._id || index}
                  style={{
                    padding: '1rem',
                    border: '1px solid #e9ecef',
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#333' }}>
                      {challenge.title || `Challenge ${index + 1}`}
                    </h4>
                    <p style={{ margin: 0, color: '#666' }}>
                      {challenge.description || 'No description available'}
                    </p>
                  </div>
                  <button
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#667eea',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer'
                    }}
                  >
                    Join
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;