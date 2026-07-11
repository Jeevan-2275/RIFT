import React, { useState, useEffect } from 'react'

export default function Permissions({ token }) {
  const [passports, setPassports] = useState([]);
  const [selectedPassportId, setSelectedPassportId] = useState('');
  const [rules, setRules] = useState([]);
  
  // Rule Editor Form State
  const [targetResource, setTargetResource] = useState('');
  const [allowedActions, setAllowedActions] = useState({
    GET: true,
    POST: false,
    PUT: false,
    DELETE: false
  });
  const [dailyLimitUSD, setDailyLimitUSD] = useState(50);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const fetchPassports = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/passports', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPassports(data.filter(p => p.status === 'active'));
        if (data.length > 0) {
          setSelectedPassportId(data[0].id);
        }
      }
    } catch (err) {
      console.error("Error loading passports:", err);
    }
  };

  const fetchRules = async (passportId) => {
    if (!passportId) return;
    try {
      const res = await fetch(`http://localhost:5000/api/permissions/${passportId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRules(data);
      }
    } catch (err) {
      console.error("Error loading permissions:", err);
    }
  };

  useEffect(() => {
    fetchPassports();
  }, [token]);

  useEffect(() => {
    if (selectedPassportId) {
      fetchRules(selectedPassportId);
    }
  }, [selectedPassportId]);

  const handleActionCheckbox = (verb) => {
    setAllowedActions(prev => ({
      ...prev,
      [verb]: !prev[verb]
    }));
  };

  const handleSubmitRule = async (e) => {
    e.preventDefault();
    if (!targetResource) return setError("Please specify target resource domain.");
    if (!selectedPassportId) return setError("Please select an active passport.");

    setError('');
    setSuccess('');

    const verbs = Object.keys(allowedActions).filter(verb => allowedActions[verb]);
    if (verbs.length === 0) return setError("Select at least one allowed HTTP verb.");

    try {
      const res = await fetch('http://localhost:5000/api/permissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          passportId: selectedPassportId,
          targetResource,
          allowedActions: verbs,
          dailyLimitUSD
        })
      });

      if (res.ok) {
        setSuccess(`Rules updated successfully for ${targetResource}!`);
        setTargetResource('');
        fetchRules(selectedPassportId);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to update permission rules.");
      }
    } catch (err) {
      console.error(err);
      setError("Network sync failed.");
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Selector Row */}
      <div className="panel-card" style={{ padding: '16px 20px', border: '2px solid rgba(0, 240, 255, 0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <label className="sandbox-label" style={{ fontSize: '13px', margin: 0 }}>Configure Target Agent:</label>
          <select 
            className="form-input" 
            value={selectedPassportId}
            onChange={(e) => setSelectedPassportId(e.target.value)}
            style={{ width: '260px', background: '#03050a', border: '2px solid var(--color-blue)', color: 'var(--color-blue)', fontWeight: 'bold' }}
          >
            {passports.map(p => (
              <option key={p.id} value={p.id}>{p.agentName} ({p.id})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Forms & Table Split */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px', alignItems: 'start' }}>
        
        {/* Permission Rules Form Creator */}
        <div className="panel-card" style={{ border: '2px solid rgba(0, 255, 102, 0.25)' }}>
          <div className="panel-header">
            <div className="panel-title" style={{ color: 'var(--color-green)' }}>⚔️ MANAGE ACCESS RULE</div>
          </div>
          <div className="panel-body">
            <form onSubmit={handleSubmitRule} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {error && <div className="badge blocked" style={{ padding: '6px' }}>✕ {error}</div>}
              {success && <div className="badge clean" style={{ padding: '6px' }}>✓ {success}</div>}

              <div className="sandbox-input-group">
                <label className="sandbox-label">Target Resource Domain</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. stripe.com"
                  value={targetResource}
                  onChange={(e) => setTargetResource(e.target.value)}
                  required
                />
              </div>

              <div className="sandbox-input-group">
                <label className="sandbox-label">Allowed Action Verbs</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '4px' }}>
                  {Object.keys(allowedActions).map(verb => (
                    <label key={verb} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
                      <input 
                        type="checkbox" 
                        checked={allowedActions[verb]} 
                        onChange={() => handleCheckboxChange(verb)} // wait, it should be handleActionCheckbox
                        style={{ cursor: 'pointer' }}
                      />
                      {verb}
                    </label>
                  ))}
                </div>
              </div>

              {/* Slider for limits */}
              <div className="wallet-limit-controller" style={{ marginTop: '8px' }}>
                <div className="range-label-row">
                  <span className="sandbox-label">Daily Sum Limit</span>
                  <strong style={{ color: '#fff' }}>${dailyLimitUSD} USD</strong>
                </div>
                <input 
                  type="range" 
                  className="range-slider" 
                  min="0" 
                  max="200" 
                  step="10"
                  value={dailyLimitUSD} 
                  onChange={(e) => setDailyLimitUSD(parseInt(e.target.value))}
                />
                <span style={{ fontSize: '9px', color: 'var(--text-secondary)' }}>
                  Set to $0 to disable financial transactions.
                </span>
              </div>

              <button 
                type="submit" 
                className="sandbox-button"
                style={{ marginTop: '10px' }}
              >
                APPLY RULES
              </button>

            </form>
          </div>
        </div>

        {/* Rules Table */}
        <div className="panel-card" style={{ border: '2px solid rgba(0, 240, 255, 0.2)' }}>
          <div className="panel-header">
            <div className="panel-title">📜 Configured Access Control List (ACL)</div>
          </div>
          <div className="panel-body" style={{ padding: 0 }}>
            {rules.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '12px' }}>
                No custom permission profiles defined for this passport.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Resource Target</th>
                    <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Verbs Approved</th>
                    <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Daily Budget Sum</th>
                    <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Rules Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rules.map((rule) => (
                    <tr key={rule.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 'bold', fontFamily: 'var(--font-mono)' }}>
                        {rule.targetResource}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {rule.allowedActions.map(verb => (
                            <span key={verb} className="badge clean" style={{ fontSize: '8px', padding: '1px 5px' }}>
                              {verb}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)' }}>
                        {rule.dailyLimitUSD > 0 ? (
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '2px' }}>
                              <span>${rule.spentTodayUSD.toFixed(2)} spent</span>
                              <span>Limit: ${rule.dailyLimitUSD}</span>
                            </div>
                            <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                              <div style={{ 
                                width: `${Math.min(100, (rule.spentTodayUSD / rule.dailyLimitUSD) * 100)}%`, 
                                height: '100%', 
                                background: 'var(--color-blue)' 
                              }}></div>
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>No Budget Allowed</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span className="badge clean">
                          {rule.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>

    </div>
  )

  // Minor fix for referencing wrong checkbox helper inside map
  function handleCheckboxChange(verb) {
    handleActionCheckbox(verb);
  }
}
