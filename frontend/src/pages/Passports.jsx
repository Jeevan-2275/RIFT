import React, { useState, useEffect } from 'react'

export default function Passports({ token }) {
  const [passportsList, setPassportsList] = useState([]);
  const [agentName, setAgentName] = useState('');
  const [agentType, setAgentType] = useState('Financial Assistant');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchPassports = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/passports', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPassportsList(data);
      }
    } catch (err) {
      console.error("Error loading passports:", err);
    }
  };

  useEffect(() => {
    fetchPassports();
  }, [token]);

  const handleCreatePassport = async (e) => {
    e.preventDefault();
    if (!agentName) return setError("Agent Name is required.");

    setError('');
    setSuccess('');

    try {
      const res = await fetch('http://localhost:5000/api/passports', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ agentName, agentType })
      });

      if (res.ok) {
        setSuccess(`Cryptographic passport generated for ${agentName}!`);
        setAgentName('');
        fetchPassports();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to create passport.");
      }
    } catch (err) {
      console.error("Error creating passport:", err);
      setError("Server communications failed.");
    }
  };

  const handleRevoke = async (id, name) => {
    if (!confirm(`Are you absolutely sure you want to revoke the cryptographic passport for ${name}? This action cannot be undone.`)) return;

    try {
      const res = await fetch(`http://localhost:5000/api/passports/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        alert(`Passport for ${name} has been successfully revoked.`);
        fetchPassports();
      }
    } catch (err) {
      console.error("Error revoking passport:", err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* 2-Column Split: Form Creator & Stats list */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px', alignItems: 'start' }}>
        
        {/* Passport Form Creator */}
        <div className="panel-card" style={{ border: '2px solid rgba(0, 255, 102, 0.25)' }}>
          <div className="panel-header">
            <div className="panel-title" style={{ color: 'var(--color-green)' }}>🧬 GENERATE PASSPORT CARD</div>
          </div>
          <div className="panel-body">
            <form onSubmit={handleCreatePassport} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {error && <div className="badge blocked" style={{ padding: '6px' }}>✕ {error}</div>}
              {success && <div className="badge clean" style={{ padding: '6px' }}>✓ {success}</div>}

              <div className="sandbox-input-group">
                <label className="sandbox-label">Agent Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. TravelHelper"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  required
                />
              </div>

              <div className="sandbox-input-group">
                <label className="sandbox-label">Agent Model Class</label>
                <select 
                  className="form-input"
                  value={agentType}
                  onChange={(e) => setAgentType(e.target.value)}
                  style={{ background: '#03050a' }}
                >
                  <option value="Financial Assistant">Financial Assistant</option>
                  <option value="Web Scraper">Web Scraper</option>
                  <option value="Developer Assistant">Developer Assistant</option>
                  <option value="Scheduler Bot">Scheduler Bot</option>
                </select>
              </div>

              <button 
                type="submit" 
                className="sandbox-button"
                style={{ marginTop: '10px' }}
              >
                GENERATE SEAL
              </button>

            </form>
          </div>
        </div>

        {/* Passports Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div style={{ fontSize: '13px', textTransform: 'uppercase', fontFamily: 'var(--font-tech)', letterSpacing: '1px', color: 'var(--text-secondary)' }}>
            ACTIVE PASSPORT REGISTER LEDGER
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
            {passportsList.map((pass) => (
              <div key={pass.id} className="passport-casing" style={{
                opacity: pass.status === 'revoked' ? 0.5 : 1,
                borderColor: pass.status === 'revoked' ? 'var(--color-pink)' : 'var(--color-blue)',
                boxShadow: pass.status === 'revoked' ? 'var(--glow-pink)' : 'var(--glow-blue)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', fontFamily: 'var(--font-tech)', letterSpacing: '0.5px' }}>
                      {pass.agentName}
                    </h3>
                    <span style={{ fontSize: '10px', color: 'var(--color-blue)', textTransform: 'uppercase' }}>
                      {pass.agentType}
                    </span>
                  </div>
                  <span className={`badge ${
                    pass.status === 'active' ? 'clean' : 'blocked'
                  }`} style={{ height: 'fit-content' }}>
                    {pass.status}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '14px' }}>
                  {/* Mock Y2K Neo QR Code seal */}
                  <div style={{
                    width: '80px',
                    height: '80px',
                    background: '#050811',
                    border: `2px solid ${pass.status === 'revoked' ? 'var(--color-pink)' : 'var(--color-blue)'}`,
                    borderRadius: '8px',
                    padding: '6px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '4px'
                  }}>
                    {Array.from({ length: 16 }).map((_, i) => (
                      <div key={i} style={{
                        background: (i % 3 === 0 || i % 5 === 2) && pass.status !== 'revoked' ? 'var(--color-blue)' : 'rgba(255,255,255,0.05)',
                        borderRadius: '1px'
                      }}></div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                    <div>
                      <span style={{ color: 'var(--text-secondary)' }}>ID:</span> {pass.id}
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary)' }}>Trust Score:</span>{' '}
                      <strong style={{ 
                        color: pass.trustScore > 850 ? 'var(--color-green)' : pass.trustScore > 700 ? 'var(--color-orange)' : 'var(--color-pink)'
                      }}>
                        {pass.trustScore} / 1000
                      </strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary)' }}>Keys:</span> {pass.publicKey.substring(0, 15)}...
                    </div>
                  </div>
                </div>

                {pass.status === 'active' && (
                  <button 
                    onClick={() => handleRevoke(pass.id, pass.agentName)}
                    className="modal-btn deny" 
                    style={{ width: '100%', padding: '6px', borderRadius: '30px', fontSize: '11px' }}
                  >
                    REVOKE CRYPTO SIGNATURE
                  </button>
                )}
              </div>
            ))}
          </div>

        </div>

      </div>

    </div>
  )
}
