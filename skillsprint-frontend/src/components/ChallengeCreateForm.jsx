import React, { useState } from 'react';
import { Plus, Target, Calendar, FileText, X } from 'lucide-react';

const ChallengeCreateForm = ({ onClose, onChallengeCreated }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    difficulty: 'Easy',
    duration: 7,
    points: 10
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Real API call using your backend
  const createChallengeAPI = async (data) => {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    const baseURL = 'https://skillsprint-production-663d.up.railway.app';
    
    const response = await fetch(`${baseURL}/api/challenges`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  };

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
      console.log('Creating challenge:', formData);
      
      // Use real API call to your backend
      const response = await createChallengeAPI(formData);
      
      console.log('Challenge created successfully:', response);
      
      // Call parent callback to refresh challenges list
      if (onChallengeCreated) {
        onChallengeCreated(response);
      }
      
      // Close the modal
      if (onClose) {
        onClose();
      }
      
    } catch (err) {
      console.error('Error creating challenge:', err);
      
      // Better error handling
      let errorMessage = 'Failed to create challenge';
      
      if (err.message.includes('401')) {
        errorMessage = 'Please log in to create challenges';
      } else if (err.message.includes('400')) {
        errorMessage = 'Invalid challenge data. Please check your inputs.';
      } else if (err.message.includes('500')) {
        errorMessage = 'Server error. Please try again later.';
      } else if (err.message.includes('Network')) {
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

        <form onSubmit={handleSubmit}>
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
            type="submit"
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
        </form>
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

export default ChallengeCreateForm;