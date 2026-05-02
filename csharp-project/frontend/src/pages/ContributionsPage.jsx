import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Loading from '../components/common/Loading';
import { format } from 'date-fns';

const FILTERS = [
  { key: 'all', label: 'All', statKey: 'total' },
  { key: 'pending', label: '⏳ Pending', statKey: 'pending' },
  { key: 'completed', label: '✓ Completed', statKey: 'completed' },
  { key: 'late', label: '⚠️ Late', statKey: 'late' },
  { key: 'missed', label: '❌ Missed', statKey: 'missed' },
];

const STATUS_BADGE = { completed:'success', completed_late:'success', pending:'warning', scheduled:'info', late:'danger', missed:'danger', defaulted:'danger' };
const STATUS_LABEL = { completed:'✓ Paid', completed_late:'✓ Paid Late', pending:'⏳ Pending', scheduled:'📅 Scheduled', late:'⚠️ Late', missed:'❌ Missed', defaulted:'❌ Defaulted' };

const ContributionsPage = () => {
  const navigate = useNavigate();
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [stats, setStats] = useState({ total:0, pending:0, completed:0, late:0, missed:0, totalPaid:0, totalPending:0 });

  useEffect(() => { fetchContributions(); }, []);

  const fetchContributions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/contributions/my');
      const all = response.data.data.contributions || [];
      setContributions(all);
      setStats({
        total: all.length,
        pending: all.filter(c => c.status === 'pending' || c.status === 'scheduled').length,
        completed: all.filter(c => c.status === 'completed' || c.status === 'completed_late').length,
        late: all.filter(c => c.status === 'late').length,
        missed: all.filter(c => c.status === 'missed' || c.status === 'defaulted').length,
        totalPaid: all.filter(c => c.status === 'completed' || c.status === 'completed_late').reduce((s,c) => s + (c.amount.paid || 0), 0),
        totalPending: all.filter(c => ['pending','scheduled','late'].includes(c.status)).reduce((s,c) => s + (c.amount.expected || 0), 0),
      });
      setLoading(false);
    } catch (e) { setLoading(false); }
  };

  const filtered = contributions.filter(c => {
    if (filter === 'all') return true;
    if (filter === 'pending') return c.status === 'pending' || c.status === 'scheduled';
    if (filter === 'completed') return c.status === 'completed' || c.status === 'completed_late';
    if (filter === 'late') return c.status === 'late';
    if (filter === 'missed') return c.status === 'missed' || c.status === 'defaulted';
    return true;
  });

  if (loading) return <Loading />;

  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <div className="container" style={{ paddingTop: 28, paddingBottom: 40 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize: 28, color:'var(--text-primary)' }}>My Contributions</h1>
        <p style={{ color:'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Track and manage all your savings contributions</p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {[
          { label:'Total Contributions', value: stats.total, color:'var(--green-800)' },
          { label:'Total Paid', value:`$${stats.totalPaid.toFixed(2)}`, color:'var(--green-700)' },
          { label:'Pending Amount', value:`$${stats.totalPending.toFixed(2)}`, color:'#D97706' },
          { label:'Completion Rate', value:`${completionRate}%`, color: completionRate >= 80 ? 'var(--green-700)' : '#DC2626' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <h3>{s.label}</h3>
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display:'flex', gap: 8, marginBottom: 20, flexWrap:'wrap' }}>
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={filter === f.key ? 'btn btn-primary' : 'btn btn-secondary'}
            style={{ fontSize: 13, padding:'7px 14px' }}
          >
            {f.label}
            <span style={{ marginLeft: 6, opacity: 0.7 }}>({stats[f.statKey]})</span>
          </button>
        ))}
      </div>

      {/* Empty state */}
      {filtered.length === 0 ? (
        <div className="card" style={{ textAlign:'center', padding:'60px 20px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>💳</div>
          <h3 style={{ color:'var(--text-primary)', marginBottom: 8 }}>No contributions found</h3>
          <p style={{ color:'var(--text-muted)', fontSize: 14 }}>
            {filter === 'all' ? 'Join a group to start contributing!' : `No ${filter} contributions.`}
          </p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow:'hidden' }}>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', minWidth: 700 }}>
              <thead>
                <tr style={{ background:'var(--green-25)', borderBottom:'2px solid var(--border)' }}>
                  {['Group','Cycle','Amount','Due Date','Grace Period','Status','Action'].map(h => (
                    <th key={h} style={{ padding:'14px 16px', textAlign:'left', fontSize: 12, fontWeight: 700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em', whiteSpace:'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => {
                  const isOverdue = new Date() > new Date(c.gracePeriodEnds);
                  const isPending = c.status === 'pending' || c.status === 'scheduled';
                  const isLate = c.status === 'late';
                  const isDone = c.status === 'completed' || c.status === 'completed_late';
                  return (
                    <tr key={c._id} style={{
                      borderBottom:'1px solid var(--border)',
                      background: isOverdue && isPending ? '#FFFBEB' : i % 2 === 0 ? 'white' : 'var(--green-25)',
                      transition:'background 0.15s',
                    }}>
                      <td style={{ padding:'14px 16px' }}>
                        <strong style={{ color:'var(--text-primary)', fontSize: 14 }}>{c.groupId?.name || 'Unknown Group'}</strong>
                      </td>
                      <td style={{ padding:'14px 16px' }}>
                        <span className="badge badge-info">Cycle {c.cycleNumber}</span>
                      </td>
                      <td style={{ padding:'14px 16px' }}>
                        <strong style={{ fontSize: 15, color:'var(--text-primary)' }}>${c.amount.expected}</strong>
                        {c.amount.penalty > 0 && <div style={{ color:'#DC2626', fontSize: 11, marginTop: 2 }}>+${c.amount.penalty} penalty</div>}
                        {isDone && <div style={{ color:'var(--green-700)', fontSize: 11, marginTop: 2 }}>Paid: ${c.amount.paid}</div>}
                      </td>
                      <td style={{ padding:'14px 16px', fontSize: 13, color:'var(--text-secondary)', whiteSpace:'nowrap' }}>
                        {format(new Date(c.dueDate), 'MMM dd, yyyy')}
                      </td>
                      <td style={{ padding:'14px 16px' }}>
                        <div style={{ fontSize: 13, color:'var(--text-secondary)', whiteSpace:'nowrap' }}>
                          {format(new Date(c.gracePeriodEnds), 'MMM dd, yyyy')}
                        </div>
                        {isOverdue && isPending && (
                          <div style={{ color:'#DC2626', fontSize: 11, fontWeight: 600, marginTop: 2 }}>⚠️ Overdue</div>
                        )}
                      </td>
                      <td style={{ padding:'14px 16px' }}>
                        <span className={`badge badge-${STATUS_BADGE[c.status] || 'secondary'}`}>
                          {STATUS_LABEL[c.status] || c.status}
                        </span>
                      </td>
                      <td style={{ padding:'14px 16px' }}>
                        {(isPending || isLate) && (
                          <button
                            className="btn btn-primary"
                            style={{ padding:'6px 14px', fontSize: 13 }}
                            onClick={() => navigate(`/contributions/pay/${c._id}`)}
                          >
                            Pay Now
                          </button>
                        )}
                        {isDone && <span style={{ color:'var(--green-700)', fontSize: 13, fontWeight: 600 }}>✓ Paid</span>}
                        {c.payment?.processorTransactionId && (
                          <div style={{ fontSize: 11, color:'var(--text-muted)', marginTop: 4 }}>
                            ID: {c.payment.processorTransactionId.slice(0, 8)}…
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ padding:'14px 16px', borderTop:'1px solid var(--border)', background:'var(--green-25)', textAlign:'center' }}>
            <p style={{ color:'var(--text-muted)', fontSize: 13, margin: 0 }}>
              Showing <strong style={{ color:'var(--text-primary)' }}>{filtered.length}</strong> contributions
            </p>
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="card" style={{ marginTop: 24, background:'var(--green-25)', border:'1px solid var(--border)' }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color:'var(--text-primary)' }}>💡 Quick Tips</h3>
        <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.9, color:'var(--text-secondary)', fontSize: 14 }}>
          <li>Pay before the grace period ends to avoid penalties</li>
          <li>Set up auto-payment to never miss a contribution</li>
          <li>Late payments affect your trust score negatively</li>
          <li>On-time payments earn +0.5 trust score per payment</li>
        </ul>
      </div>
    </div>
  );
};

export default ContributionsPage;
