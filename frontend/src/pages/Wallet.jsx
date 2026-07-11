import React, { useState, useEffect } from 'react'

export default function Wallet({ stats, setStats }) {
  const [limit, setLimit] = useState(stats.spendingLimit);
  const [txHistory, setTxHistory] = useState([]);

  const fetchTransactions = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/transactions');
      if (res.ok) {
        const data = await res.json();
        setTxHistory(data);
      }
    } catch (err) {
      console.error("Error loading transactions:", err);
    }
  };

  useEffect(() => {
    fetchTransactions();
    const interval = setInterval(fetchTransactions, 1500);
    return () => clearInterval(interval);
  }, []);

  // Sync state limit changes from parent polling
  useEffect(() => {
    setLimit(stats.spendingLimit);
  }, [stats.spendingLimit]);

  const handleSliderChange = async (e) => {
    const val = parseFloat(e.target.value);
    setLimit(val);
    
    // Optimistically update local UI stats
    setStats(prev => ({
      ...prev,
      spendingLimit: val
    }));

    try {
      await fetch('http://localhost:5000/api/transactions/set-limit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: val })
      });
    } catch (err) {
      console.error("Error updating limit on server:", err);
    }
  };

  return (
    <div className="panel-card wallet-card" style={{ height: '530px' }}>
      <div className="panel-header">
        <div className="panel-title">💳 Agent Wallet & Safeguards</div>
        <span className="badge clean" style={{ fontSize: '12px' }}>
          Account Balance: ${stats.walletBalance.toFixed(2)}
        </span>
      </div>
      <div className="panel-body" style={{ height: 'calc(100% - 50px)', overflowY: 'auto' }}>
        
        <div className="wallet-balance-row" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '20px', marginBottom: '20px' }}>
          <div>
            <span className="wallet-label">Single-Transaction Cap</span>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Transactions exceeding this require Human approval
            </div>
          </div>
          <span className="wallet-amount" style={{ fontSize: '36px' }}>
            ${limit.toFixed(2)}
          </span>
        </div>

        <div className="wallet-limit-controller" style={{ marginBottom: '24px' }}>
          <div className="range-label-row">
            <span>$5.00</span>
            <span>$200.00</span>
          </div>
          <input 
            type="range" 
            className="range-slider" 
            min="5" 
            max="200" 
            step="5"
            value={limit} 
            onChange={handleSliderChange}
          />
        </div>

        <div className="wallet-label" style={{ marginBottom: '10px', fontSize: '12px', fontWeight: 600 }}>
          Recent Wallet Ledger Transactions
        </div>
        
        <div className="transactions-list">
          {txHistory.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', padding: '20px' }}>
              No transactions recorded yet.
            </div>
          ) : (
            txHistory.map((tx, index) => (
              <div key={index} className="transaction-item">
                <div className="tx-details">
                  <span className="tx-title">{tx.vendor}</span>
                  <span className="tx-time">{tx.timestamp}</span>
                </div>
                <span className={`tx-amount ${
                  tx.status === 'Approved' ? 'approved' : tx.status === 'Denied' ? 'denied' : 'pending'
                }`}>
                  {tx.status === 'Denied' ? '✕ Blocked' : tx.status === 'Pending' ? '🔒 Hold' : `$${tx.amount.toFixed(2)}`}
                </span>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  )
}
