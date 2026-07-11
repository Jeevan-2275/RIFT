import React, { useState } from 'react'
import { Link } from 'react-router-dom'

export default function Register({ onLoginSuccess }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) return setError("Please fill all details.");
    
    setError('');
    setIsSubmitting(true);

    try {
      const res = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });

      const data = await res.json();
      setIsSubmitting(false);

      if (res.ok) {
        onLoginSuccess(data.token, data.user);
      } else {
        setError(data.error || "Onboarding failed.");
      }
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
      setError("Cannot reach Express database onboarding server.");
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
      <div className="panel-card" style={{ width: '400px', border: '2px solid var(--color-green)', boxShadow: 'var(--glow-green)' }}>
        <div className="panel-header">
          <div className="panel-title" style={{ color: 'var(--color-green)' }}>🪪 OFFICER REGISTRATION CONSOLE</div>
        </div>
        <div className="panel-body">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            <div style={{ textAlign: 'center', marginBottom: '10px' }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold', fontFamily: 'var(--font-tech)', letterSpacing: '1px', textShadow: 'var(--glow-green)' }}>
                CREATE OFFICER KEY
              </div>
              <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>ONBOARD NEW DEVELOPER ASSURANCE SYSTEM</span>
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
                ✕ ONBOARDING ERROR: {error}
              </div>
            )}

            <div className="sandbox-input-group">
              <label className="sandbox-label">Full Name</label>
              <input 
                type="text" 
                className="form-input" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="sandbox-input-group">
              <label className="sandbox-label">Officer Email</label>
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
                background: 'linear-gradient(180deg, #51ff9b 0%, #00b943 100%)',
                boxShadow: 'var(--glow-green)',
                border: '2px solid #fff',
                marginTop: '10px'
              }}
            >
              {isSubmitting ? 'GENERATING SECURE SCHEMAS...' : 'REGISTER OFFICER'}
            </button>

            <div style={{ fontSize: '11px', textAlign: 'center', marginTop: '10px', color: 'var(--text-secondary)' }}>
              Already registered?{' '}
              <Link to="/login" style={{ color: 'var(--color-green)', textDecoration: 'none', fontWeight: 'bold' }}>
                Sign In
              </Link>
            </div>
            
          </form>
        </div>
      </div>
    </div>
  )
}
