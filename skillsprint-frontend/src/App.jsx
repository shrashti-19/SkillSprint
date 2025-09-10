// import React, { useState, useEffect } from 'react';
// import Login from './components/Login';
// import Dashboard from './components/Dashboard';

// function App() {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     // Check if user is already logged in
//     const token = localStorage.getItem('token');
//     const savedUser = localStorage.getItem('user');
    
//     if (token && savedUser && savedUser !== 'undefined') {
//       try {
//         setUser(JSON.parse(savedUser));
//       } catch (error) {
//         console.error('Error parsing saved user:', error);
//         // Clear invalid data
//         localStorage.removeItem('token');
//         localStorage.removeItem('user');
//       }
//     }
//     setLoading(false);
//   }, []);

//   const handleLogin = (userData) => {
//     setUser(userData);
//   };

//   const handleLogout = () => {
//     localStorage.removeItem('token');
//     localStorage.removeItem('user');
//     setUser(null);
//   };

//   if (loading) {
//     return (
//       <div style={{
//         height: '100vh',
//         display: 'flex',
//         alignItems: 'center',
//         justifyContent: 'center',
//         fontSize: '1.2rem'
//       }}>
//         Loading...
//       </div>
//     );
//   }

//   return (
//     <>
//       {user ? (
//         <Dashboard user={user} onLogout={handleLogout} />
//       ) : (
//         <Login onLogin={handleLogin} />
//       )}
//     </>
//   );
// }

// export default App;


import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser && savedUser !== 'undefined') {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        
        // Ensure userId is stored for Dashboard compatibility
        if (parsedUser._id || parsedUser.id) {
          localStorage.setItem('userId', parsedUser._id || parsedUser.id);
        }
        
        // Ensure both token formats are available
        localStorage.setItem('authToken', token);
        localStorage.setItem('token', token);
        
      } catch (error) {
        console.error('Error parsing saved user:', error);
        // Clear invalid data
        localStorage.removeItem('token');
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        localStorage.removeItem('userId');
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    console.log('Login successful, user data:', userData);
    
    // Store user data
    setUser(userData);
    
    // Ensure proper token storage (Login component uses 'token')
    const token = userData.token;
    localStorage.setItem('token', token);
    localStorage.setItem('authToken', token); // Dashboard expects this
    
    // Store user ID for Dashboard compatibility
    if (userData._id || userData.id) {
      localStorage.setItem('userId', userData._id || userData.id);
    }
    
    // Store full user object
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    // Clear all stored data
    localStorage.removeItem('token');
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('userId');
    setUser(null);
  };

  if (loading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.2rem',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f4f6',
            borderTop: '4px solid #667eea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          Loading SkillSprint...
        </div>
      </div>
    );
  }

  return (
    <>
      {user ? (
        <Dashboard user={user} onLogout={handleLogout} />
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </>
  );
}

export default App;