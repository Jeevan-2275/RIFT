import React, { useState, useEffect, useRef } from 'react'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts'

export default function Dashboard({ token }) {
  const [logs, setLogs] = useState([]);
  const logsEndRef = useRef(null);

  // Mock Recharts chart telemetry data
  const chartData = [
    { name: '06:00', requests: 12 },
    { name: '07:00', requests: 28 },
    { name: '08:00', requests: 45 },
    { name: '09:00', requests: 30 },
    { name: '10:00', requests: 75 },
    { name: '11:00', requests: 98 },
    { name: '12:00', requests: 62 }
  ];

  const fetchLogs = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/activity', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (err) {
      console.error("Error loading activity logs:", err);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 1500);
    return () => clearInterval(interval);
  }, [token]);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const handleClearLogs = async () => {
    try {
      await fetch('http://localhost:5000/api/activity/clear', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setLogs([]);
    } catch (err) {
      console.error("Error clearing logs:", err);
    }
  };

  const handleLogClick = (log) => {
    alert(`AI GUARDIAN TELEMETRY SUMMARY:\n\nTimestamp: ${log.timestamp}\nRequest: ${log.actionRequested}\nRisk Score: ${log.riskScore}/100 [${log.riskLevel}]\nDecision: ${log.decision.toUpperCase()}\n\nDetails:\n${log.actionDetail}\n\nGuardian Reasoning:\n${log.geminiReasoning}`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* 2-Column Split: Telemetry Chart & Radar indicator */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        
        {/* Recharts Casing */}
        <div className="panel-card" style={{ border: '2px solid rgba(0, 240, 255, 0.25)' }}>
          <div className="panel-header">
            <div className="panel-title" style={{ color: 'var(--color-blue)' }}>📈 GATEWAY TRAFFIC LATENCY INDEX</div>
          </div>
          <div className="panel-body" style={{ height: '180px', padding: '10px 20px 10px 10px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorBlue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-blue)" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="var(--color-blue)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={9} />
                <YAxis stroke="var(--text-secondary)" fontSize={9} />
                <Tooltip contentStyle={{ background: '#0a0d17', borderColor: 'var(--color-blue)', color: '#fff', fontSize: '11px' }} />
                <Area type="monotone" dataKey="requests" stroke="var(--color-blue)" fillOpacity={1} fill="url(#colorBlue)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Security Radar Indicator Casing */}
        <div className="panel-card" style={{ border: '2px solid rgba(0, 255, 102, 0.25)' }}>
          <div className="panel-header">
            <div className="panel-title" style={{ color: 'var(--color-green)' }}>🛡️ AI PASSPORT VALIDATOR TELEMETRY</div>
          </div>
          <div className="panel-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', height: '180px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '32px', color: 'var(--color-green)', fontWeight: 'bold', fontFamily: 'var(--font-tech)', textShadow: 'var(--glow-green)' }}>
                100%
              </div>
              <span style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>ATTENUATION HEALTH</span>
            </div>
            
            <div style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', height: '80px' }}></div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '32px', color: 'var(--color-blue)', fontWeight: 'bold', fontFamily: 'var(--font-tech)', textShadow: 'var(--glow-blue)' }}>
                &lt; 35ms
              </div>
              <span style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>VERIFICATION LATENCY</span>
            </div>
          </div>
        </div>

      </div>

      {/* Sockets logs activity timeline console */}
      <div className="panel-card logs-panel" style={{ height: '380px' }}>
        <div className="panel-header">
          <div className="panel-title">📟 Live Firewall Activity Stream</div>
          <button className="badge clean" style={{ cursor: 'pointer', background: 'transparent' }} onClick={handleClearLogs}>
            Clear Terminal
          </button>
        </div>
        <div className="panel-body" style={{ height: 'calc(100% - 50px)', paddingBottom: '20px' }}>
          <div className="logs-scroll">
            {logs.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '12px', padding: '40px' }}>
                Waiting for incoming agent activities telemetry logs...
              </div>
            ) : (
              logs.map((log) => (
                <div 
                  key={log.id} 
                  className={`log-entry status-${log.status}`}
                  onClick={() => handleLogClick(log)}
                >
                  <div className="log-meta">
                    <span>[{log.timestamp}]</span>
                    <span>Agent: {log.agent}</span>
                  </div>
                  <div className="log-header-row">
                    <span className="log-message">{log.message}</span>
                    <span className={`badge ${
                      log.status === 'clean' ? 'clean' : log.status === 'blocked' ? 'blocked' : 'pending'
                    }`}>
                      {log.status === 'clean' ? 'VERIFIED' : log.status === 'blocked' ? 'BLOCKED' : 'HOLD'}
                    </span>
                  </div>
                </div>
              ))
            )}
            <div ref={logsEndRef} />
          </div>
        </div>
      </div>

    </div>
  )
}
