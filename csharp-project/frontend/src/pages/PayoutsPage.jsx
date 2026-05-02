import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import Loading from '../components/common/Loading';
import { format } from 'date-fns';

const STATUS_BADGE = { completed:'success', processing:'info', ready_for_payout:'warning', pending:'secondary', cancelled:'danger' };

const PayoutsPage = () => {
  const [payouts, setPayouts] = useState([]);
  const [allPayouts, setAllPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => { fetchPayouts(); }, []);
  useEffect(() => {
    if (filter === 'received') setPayouts(allPayouts.filter(p => p.status === 'completed'));
    else if (filter === 'pending') setPayouts(allPayouts.filter(p => p.status !== 'completed'));
    else setPayouts(allPayouts);
  }, [filter, allPayouts]);

  const fetchPayouts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/payouts/my');
      const data = response.data.data.payouts || [];
      setAllPayouts(data);
      setPayouts(data);
      setLoading(false);
    } catch (e) { setLoading(false); }
  };

  if (loading) return <Loading />;

  const totalReceived = allPayouts.filter(p => p.status === 'completed').reduce((s, p) => s + (p.netPayout || 0), 0);
  const pendingCount = allPayouts.filter(p => p.status !== 'completed').length;
  const completedCount = allPayouts.filter(p => p.status === 'completed').length;

  return (
    <div className="container" style={{ paddingTop: 28, paddingBottom: 40 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize: 28, color:'var(--text-primary)' }}>My Payouts</h1>
        <p style={{ color:'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Track all payouts from your savings circles</p>
      </div>

      {/* Summary stats */}
      <div className="stats-grid" style={{ marginBottom: 28 }}>
        {[
          { label:'Total Received', value:`$${totalReceived.toFixed(2)}`, color:'var(--green-700)' },
          { label:'Completed Payouts', value: completedCount, color:'var(--green-800)' },
          { label:'Pending Payouts', value: pendingCount, color:'#D97706' },
          { label:'Total Payouts', value: allPayouts.length, color:'#1D4ED8' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <h3>{s.label}</h3>
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display:'flex', gap: 8, marginBottom: 20, flexWrap:'wrap' }}>
        {[
          { key:'all', label:`All (${allPayouts.length})` },
          { key:'received', label:`✓ Received (${completedCount})` },
          { key:'pending', label:`⏳ Pending (${pendingCount})` },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={filter === f.key ? 'btn btn-primary' : 'btn btn-secondary'}
            style={{ fontSize: 13, padding:'7px 14px' }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {payouts.length === 0 ? (
        <div className="card" style={{ textAlign:'center', padding:'60px 20px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>💸</div>
          <h3 style={{ color:'var(--text-primary)', marginBottom: 8 }}>No payouts found</h3>
          <p style={{ color:'var(--text-muted)', fontSize: 14 }}>
            {filter === 'all' ? 'You have not received any payouts yet.' : `No ${filter} payouts.`}
          </p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow:'hidden' }}>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', minWidth: 600 }}>
              <thead>
                <tr style={{ background:'var(--green-25)', borderBottom:'2px solid var(--border)' }}>
                  {['Group','Cycle','Net Payout','Date','Status','Ref'].map(h => (
                    <th key={h} style={{ padding:'14px 16px', textAlign:'left', fontSize: 12, fontWeight: 700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em', whiteSpace:'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payouts.map((p, i) => (
                  <tr key={p._id} style={{ borderBottom:'1px solid var(--border)', background: i % 2 === 0 ? 'white' : 'var(--green-25)' }}>
                    <td style={{ padding:'14px 16px' }}>
                      <strong style={{ color:'var(--text-primary)', fontSize: 14 }}>{p.groupId?.name || 'Unknown Group'}</strong>
                    </td>
                    <td style={{ padding:'14px 16px' }}>
                      <span className="badge badge-info">Cycle {p.cycleNumber}</span>
                    </td>
                    <td style={{ padding:'14px 16px' }}>
                      <strong style={{ fontSize: 16, color:'var(--green-700)' }}>
                        ${p.netPayout?.toFixed(2) || '0.00'}
                      </strong>
                    </td>
                    <td style={{ padding:'14px 16px', fontSize: 13, color:'var(--text-secondary)', whiteSpace:'nowrap' }}>
                      {p.payoutActualDate
                        ? format(new Date(p.payoutActualDate), 'MMM dd, yyyy')
                        : format(new Date(p.createdAt), 'MMM dd, yyyy')}
                    </td>
                    <td style={{ padding:'14px 16px' }}>
                      <span className={`badge badge-${STATUS_BADGE[p.status] || 'secondary'}`}>
                        {p.status?.replace(/_/g,' ')}
                      </span>
                    </td>
                    <td style={{ padding:'14px 16px' }}>
                      {p.payout?.processorTransactionId ? (
                        <span style={{ fontSize: 12, color:'var(--text-muted)', fontFamily:'monospace' }}>
                          {p.payout.processorTransactionId.slice(0, 10)}…
                        </span>
                      ) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding:'14px 16px', borderTop:'1px solid var(--border)', background:'var(--green-25)', textAlign:'center' }}>
            <p style={{ color:'var(--text-muted)', fontSize: 13, margin: 0 }}>
              Showing <strong style={{ color:'var(--text-primary)' }}>{payouts.length}</strong> payouts
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayoutsPage;
