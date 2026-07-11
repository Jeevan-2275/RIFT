import React, { useState } from 'react'
import { Link } from 'react-router-dom'

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('nagesh@rift.io');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return setError("Please enter credentials.");
    
    setError('');
    setIsSubmitting(true);

    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      setIsSubmitting(false);

      if (res.ok) {
        onLoginSuccess(data.token, data.user);
      } else {
        setError(data.error || "Authentication failed.");
      }
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
      setError("Cannot reach Express authentication server.");
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '80vh',
      width: '100vw',
      position: 'fixed',
      top: 0,
      left: 0,
      background: 'var(--bg-color)',
      backgroundImage: 'var(--bg-grid)',
      backgroundSize: '30px 30px'
    }}>
      <div className="panel-card" style={{ width: '400px', border: '2px solid var(--color-blue)', boxShadow: 'var(--glow-blue)' }}>
        <div className="panel-header">
          <div className="panel-title" style={{ color: 'var(--color-blue)' }}>🪪 SECURE SIGN-IN CONSOLE</div>
        </div>
        <div className="panel-body">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            <div style={{ textAlign: 'center', marginBottom: '10px' }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold', fontFamily: 'var(--font-tech)', letterSpacing: '1px', textShadow: 'var(--glow-blue)' }}>
                AI PASSPORT CONTROL
              </div>
              <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Y2K AUTONOMOUS AGENT VERIFICATION</span>
            </div>

            {error && (
              <div style={{
                background: 'rgba(255,0,119,0.12)',
                color: 'var(--color-pink)',
                border: '1px solid var(--color-pink)',
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)'
              }}>
                ✕ ERROR: {error}
              </div>
            )}

            <div className="sandbox-input-group">
              <label className="sandbox-label">Developer Email</label>
              <input 
                type="email" 
                className="form-input" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="sandbox-input-group">
              <label className="sandbox-label">Security Access Password</label>
              <input 
                type="password" 
                className="form-input" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button 
              type="submit" 
              className="sandbox-button" 
              disabled={isSubmitting}
              style={{
                background: 'linear-gradient(180deg, #5de3ff 0%, #0084ff 100%)',
                boxShadow: 'var(--glow-blue)',
                border: '2px solid #fff',
                marginTop: '10px'
              }}
            >
              {isSubmitting ? 'AUTHENTICATING...' : 'ACCESS CONSOLE'}
            </button>

            <div style={{ fontSize: '11px', textAlign: 'center', marginTop: '10px', color: 'var(--text-secondary)' }}>
              New Security Officer?{' '}
              <Link to="/register" style={{ color: 'var(--color-blue)', textDecoration: 'none', fontWeight: 'bold' }}>
                Register Account
              </Link>
            </div>
            
          </form>
        </div>
      </div>
    </div>
  )
}
