import React, { useState, useEffect } from 'react'
import { Routes, Route, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { io } from 'socket.io-client'

import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Passports from './pages/Passports.jsx'
import Permissions from './pages/Permissions.jsx'
import Activity from './pages/Activity.jsx'

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  
  const [stats, setStats] = useState({
    totalPassports: 2,
    activeWarnings: 0,
    avgTrust: 885,
    pendingTransaction: null
  });

  const [policies, setPolicies] = useState({
    attestation: true,
    injection: true,
    hitl: true,
    rateLimit: true
  });

  // Auth helper
  const handleLoginSuccess = (userToken, userData) => {
    localStorage.setItem('token', userToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(userToken);
    setUser(userData);
    navigate('/');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken('');
    setUser(null);
    navigate('/login');
  };

  // Auth guard redirect
  useEffect(() => {
    if (!token && location.pathname !== '/login' && location.pathname !== '/register') {
      navigate('/login');
    } else if (token && (location.pathname === '/login' || location.pathname === '/register')) {
      navigate('/');
    }
  }, [token, location.pathname]);

  // Sockets and Stats integration
  useEffect(() => {
    if (!token) return;

    // Establish Socket connection to backend
    const socket = io('http://localhost:5000');

    socket.on('connect', () => {
      console.log('Sockets connection established to gateway');
    });

    socket.on('hold_trigger', (txHold) => {
      setStats(prev => ({
        ...prev,
        pendingTransaction: txHold
      }));
    });

    socket.on('hold_resolved', () => {
      setStats(prev => ({
        ...prev,
        pendingTransaction: null
      }));
      fetchSummary(); // Refresh stats
    });

    // Poll counts and policies
    const fetchSummary = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/analytics/summary', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setStats({
            totalPassports: data.totalPassports,
            activeWarnings: data.activeWarnings,
            avgTrust: data.avgTrust,
            pendingTransaction: data.pendingTransaction
          });
        }
      } catch (err) {
        console.error("Error fetching metrics summary:", err);
      }
    };

    const fetchPolicies = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/policies', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setPolicies(data);
        }
      } catch (err) {
        console.error("Error loading policies:", err);
      }
    };

    fetchSummary();
    fetchPolicies();

    const interval = setInterval(fetchSummary, 3000);

    return () => {
      clearInterval(interval);
      socket.disconnect();
    };
  }, [token]);

  const handleTogglePolicy = async (policyName) => {
    try {
      const res = await fetch('http://localhost:5000/api/policies/toggle', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ policyName })
      });
      if (res.ok) {
        const data = await res.json();
        setPolicies(data.policies);
      }
    } catch (err) {
      console.error("Error toggling policy:", err);
    }
  };

  const handleApprove = async () => {
    try {
      await fetch('http://localhost:5000/api/transactions/approve', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (err) {
      console.error("Error approving hold:", err);
    }
  };

  const handleDeny = async () => {
    try {
      await fetch('http://localhost:5000/api/transactions/deny', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (err) {
      console.error("Error denying hold:", err);
    }
  };

  // Render minimal Auth shell if not logged in
  if (!token) {
    return (
      <Routes>
        <Route path="/login" element={<Login onLoginSuccess={handleLoginSuccess} />} />
        <Route path="/register" element={<Register onLoginSuccess={handleLoginSuccess} />} />
        <Route path="*" element={<Login onLoginSuccess={handleLoginSuccess} />} />
      </Routes>
    );
  }

  return (
    <div className="dashboard-container">
      
      {/* Header UI Panel */}
      <header>
        <div className="logo-section">
          <div className="shield-icon">🪪</div>
          <div className="logo-text">
            <h1>AI PASSPORT</h1>
            <span>Secure Agent Identity Gateway</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav>
          <NavLink to="/" end>📟 Overview</NavLink>
          <NavLink to="/passports">📂 Agent Passports</NavLink>
          <NavLink to="/permissions">⚙️ Access Controls</NavLink>
          <NavLink to="/activity">🔍 Audit Logs</NavLink>
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
            User: <strong style={{ color: '#fff' }}>{user?.name}</strong>
          </span>
          <button 
            onClick={handleLogout} 
            className="badge blocked" 
            style={{ border: '1px solid var(--color-pink)', cursor: 'pointer', padding: '4px 10px', borderRadius: '20px' }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Statistics Hub */}
      <div className="stats-grid">
        <div className="stat-card identities">
          <span className="stat-label">Total Registered Passports</span>
          <span className="stat-value">{stats.totalPassports}</span>
          <div className="stat-change positive">
            <span>Verified</span> cryptographic seals
          </div>
        </div>
        <div className="stat-card threats">
          <span className="stat-label">Security Incident Logs</span>
          <span className="stat-value">{stats.activeWarnings}</span>
          <div className="stat-change negative">
            <span>High/Critical</span> warnings active
          </div>
        </div>
        <div className="stat-card wallet">
          <span className="stat-label">Average System Reputation</span>
          <span className="stat-value">{stats.avgTrust} / 1000</span>
          <div className="stat-change positive">
            <span>▲ Excellent</span> average trust score
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-label">Sockets Connection Status</span>
          <span className="stat-value" style={{ color: 'var(--color-green)' }}>ONLINE</span>
          <div className="stat-change positive">
            <span>Active</span> bidirectional pipeline
          </div>
        </div>
      </div>

      {/* Main Framework Grid */}
      <div className="main-grid">
        
        {/* Active Child Views */}
        <div className="main-content-column">
          <Routes>
            <Route path="/" element={<Dashboard token={token} />} />
            <Route path="/passports" element={<Passports token={token} />} />
            <Route path="/permissions" element={<Permissions token={token} />} />
            <Route path="/activity" element={<Activity token={token} />} />
          </Routes>
        </div>

        {/* Global Access Rules Sidebar */}
        <div className="sidebar-panel">
          <div className="panel-card config-card">
            <div className="panel-header">
              <div className="panel-title">🛡️ Policy Enforcement</div>
            </div>
            <div className="panel-body">
              
              <div className="config-toggle-row">
                <div className="config-info">
                  <span className="config-label">Attestation Validation</span>
                  <span className="config-desc">Verify cryptographic signatures</span>
                </div>
                <label className="switch">
                  <input 
                    type="checkbox" 
                    checked={policies.attestation} 
                    onChange={() => handleTogglePolicy('attestation')}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="config-toggle-row" style={{ marginTop: '16px' }}>
                <div className="config-info">
                  <span className="config-label">Prompt Injection Shield</span>
                  <span className="config-desc">Filter malicious override prompts</span>
                </div>
                <label className="switch">
                  <input 
                    type="checkbox" 
                    checked={policies.injection} 
                    onChange={() => handleTogglePolicy('injection')}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="config-toggle-row" style={{ marginTop: '16px' }}>
                <div className="config-info">
                  <span className="config-label">HITL Wallet Protections</span>
                  <span className="config-desc">Prompt holds for high values</span>
                </div>
                <label className="switch">
                  <input 
                    type="checkbox" 
                    checked={policies.hitl} 
                    onChange={() => handleTogglePolicy('hitl')}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="config-toggle-row" style={{ marginTop: '16px' }}>
                <div className="config-info">
                  <span className="config-label">Rate Limiter Gateway</span>
                  <span className="config-desc">Filter recursive scraping loops</span>
                </div>
                <label className="switch">
                  <input 
                    type="checkbox" 
                    checked={policies.rateLimit} 
                    onChange={() => handleTogglePolicy('rateLimit')}
                  />
                  <span className="slider"></span>
                </label>
              </div>

            </div>
          </div>
        </div>

      </div>

      {/* Real-time HITL Modal alert hold */}
      {stats.pendingTransaction && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <span>⚠️</span> SECURE GATEWAY HOLDBACK SIGNATURE
            </div>
            <div className="modal-body">
              <div className="modal-alert-desc">
                An autonomous agent has initiated an operation that exceeds preset daily transaction limits. **Human authorization required to verify and release.**
              </div>
              
              <div className="modal-details-table">
                <div className="details-row">
                  <span>Agent Name:</span>
                  <span>{stats.pendingTransaction.agentName}</span>
                </div>
                <div className="details-row">
                  <span>Destination Node:</span>
                  <span>{stats.pendingTransaction.vendor}</span>
                </div>
                <div className="details-row">
                  <span>Sum Value:</span>
                  <span style={{ color: 'var(--color-orange)', fontWeight: 'bold' }}>
                    ${stats.pendingTransaction.amount.toFixed(2)}
                  </span>
                </div>
                <div className="details-row">
                  <span>Threat Risk:</span>
                  <span style={{ color: 'var(--color-orange)' }}>
                    {stats.pendingTransaction.risk}
                  </span>
                </div>
                <div className="details-row">
                  <span>Action Description:</span>
                  <span style={{ fontSize: '10px', color: 'var(--color-blue)', maxWidth: '240px', wordBreak: 'break-all' }}>
                    {stats.pendingTransaction.detail}
                  </span>
                </div>
              </div>

              <div className="modal-buttons-row">
                <button className="modal-btn deny" onClick={handleDeny}>BLOCK ACTION</button>
                <button className="modal-btn approve" onClick={handleApprove}>RELEASE SIGNATURE</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
