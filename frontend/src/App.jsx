
import React, { useState, useEffect } from 'react';

function App() {

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      width: '100vw',
      margin: 0,
      padding: 0,
      overflow: 'hidden',
      fontFamily: 'sans-serif'
    }}>

      {/* form panel */}
      <div style={{

        flex: isMobile ? '0 0 100%' : '0 0 40%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: isMobile ? '0 30px' : '0 60px',
        boxSizing: 'border-box',
        backgroundColor: '#ffffff'
      }}>
        <h1 style={{ fontSize: isMobile ? '32px' : '48px', color: '#1a2b3c', marginBottom: '10px' }}>
          Get Started Now
        </h1>

        <form style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Name</label>
            <input type="text" placeholder="Enter your name" style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }} />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Email address</label>
            <input type="email" placeholder="Enter your email" style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }} />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Password</label>
            <input type="password" placeholder="Password" style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }} />
          </div>

          <button style={{
            backgroundColor: '#2d5a27',
            color: 'white',
            padding: '14px',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            cursor: 'pointer',
            marginTop: '10px'
          }}>
            Signup
          </button>
        </form>

        {/* text under the button */}
        <p style={{ textAlign: 'center', marginTop: '20px', color: '#666', fontSize: '14px' }}>
          Have an account? <a href="/login" style={{ color: '#2d5a27', textDecoration: 'none', fontWeight: '600' }}>Sign in</a>
        </p>
      </div>

      {/* map */}
      {!isMobile && (
        <div style={{
          flex: '0 0 60%',
          height: '100%'
        }}>
          <img
            src="/map-image.png"
            alt="Kyiv Map"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block'
            }}
          />
        </div>
      )}
    </div>
  );
}

export default App;
