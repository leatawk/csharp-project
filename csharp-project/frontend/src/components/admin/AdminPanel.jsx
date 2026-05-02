import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import Loading from '../common/Loading';

// ─── Sub-section components ───────────────────────────────────────────────────

const SectionHeader = ({ title, subtitle }) => (
  <div className="dashboard-header" style={{ marginBottom: 20 }}>
    <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: 'var(--text-primary)' }}>{title}</h2>
    {subtitle && <p>{subtitle}</p>}
  </div>
);

// ─── Overview Panel ───────────────────────────────────────────────────────────

const OverviewPanel = ({ stats }) => (
  <div>
    <SectionHeader title="Platform Overview" subtitle="Live snapshot of all system activity" />
    <div className="stats-grid">
      {[
        { label: 'Total Users', value: stats.totalUsers, icon: '◉', color: 'var(--green-800)' },
        { label: 'Active Groups', value: stats.activeGroups, icon: '⬡', color: 'var(--green-600)' },
        { label: 'Total Volume', value: `$${stats.totalVolume.toLocaleString()}`, icon: '◈', color: '#1D4ED8' },
        { label: 'Open Disputes', value: stats.openDisputes, icon: '◑', color: '#D97706' },
        { label: 'Pending KYC', value: stats.pendingKyc, icon: '◍', color: '#7C3AED' },
        { label: 'Avg Trust Score', value: stats.avgTrustScore, icon: '★', color: '#059669' },
      ].map(s => (
        <div key={s.label} className="stat-card">
          <h3>{s.label}</h3>
          <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
        </div>
      ))}
    </div>

    {/* Recent activity */}
    <div className="card">
      <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, marginBottom: 18 }}>Recent Activity</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {[
          { icon: '◉', text: 'New user registered: Kwame Asante', time: '2m ago', color: 'var(--green-700)' },
          { icon: '◈', text: 'Contribution of $250 recorded in "Downtown Circle"', time: '15m ago', color: '#1D4ED8' },
          { icon: '◑', text: 'Dispute #D-0047 escalated by admin', time: '1h ago', color: '#D97706' },
          { icon: '⬡', text: 'New group created: "Eastside Savings Pool"', time: '2h ago', color: 'var(--green-600)' },
          { icon: '◍', text: 'KYC approved for Sarah Johnson', time: '3h ago', color: '#059669' },
          { icon: '★', text: 'Payout of $1,500 completed in "Family Trust"', time: '5h ago', color: '#7C3AED' },
        ].map((a, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '12px 0',
            borderBottom: i < 5 ? '1px solid var(--border)' : 'none',
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: `${a.color}15`, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontSize: 16, flexShrink: 0, color: a.color,
            }}>
              {a.icon}
            </div>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 14, color: 'var(--text-primary)' }}>{a.text}</span>
            </div>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', flexShrink: 0 }}>{a.time}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ─── Users Panel ──────────────────────────────────────────────────────────────

const UsersPanel = () => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const mockUsers = [
    { _id: 'u1', firstName: 'Sarah', lastName: 'Johnson', email: 'sarah@email.com', role: 'user', status: 'active', trustScore: 87, kyc: 'approved', joinedAt: '2024-01-15' },
    { _id: 'u2', firstName: 'Marcus', lastName: 'Williams', email: 'marcus@email.com', role: 'user', status: 'active', trustScore: 92, kyc: 'approved', joinedAt: '2024-02-01' },
    { _id: 'u3', firstName: 'Amara', lastName: 'Osei', email: 'amara@email.com', role: 'user', status: 'suspended', trustScore: 45, kyc: 'pending', joinedAt: '2024-03-10' },
    { _id: 'u4', firstName: 'David', lastName: 'Chen', email: 'david@email.com', role: 'admin', status: 'active', trustScore: 95, kyc: 'approved', joinedAt: '2023-11-20' },
    { _id: 'u5', firstName: 'Fatima', lastName: 'Al-Hassan', email: 'fatima@email.com', role: 'user', status: 'active', trustScore: 78, kyc: 'pending', joinedAt: '2024-04-05' },
    { _id: 'u6', firstName: 'James', lastName: 'Okonkwo', email: 'james@email.com', role: 'user', status: 'inactive', trustScore: 60, kyc: 'rejected', joinedAt: '2024-01-28' },
  ];

  const filtered = mockUsers.filter(u => {
    const matchSearch = `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' ? true : u.status === filter;
    return matchSearch && matchFilter;
  });

  const kycBadge = { approved: 'badge-success', pending: 'badge-warning', rejected: 'badge-danger' };
  const statusBadge = { active: 'badge-success', suspended: 'badge-danger', inactive: 'badge-secondary' };

  return (
    <div>
      <SectionHeader title="User Management" subtitle="View, search and manage all platform users" />

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          className="form-control"
          placeholder="Search users..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 280, fontSize: 13 }}
        />
        {['all', 'active', 'suspended', 'inactive'].map(f => (
          <button
            key={f}
            className={`btn ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter(f)}
            style={{ fontSize: 13, padding: '7px 14px', textTransform: 'capitalize' }}
          >
            {f === 'all' ? 'All' : f}
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--green-25)', borderBottom: '2px solid var(--border)' }}>
                {['User', 'Email', 'Role', 'Status', 'KYC', 'Trust', 'Joined', 'Actions'].map(h => (
                  <th key={h} style={{
                    padding: '12px 16px', textAlign: 'left',
                    fontSize: 11, fontWeight: 700, color: 'var(--text-muted)',
                    textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => (
                <tr key={u._id} style={{
                  borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none',
                  transition: 'background 0.15s',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--green-25)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'white'}
                >
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--green-600), var(--green-400))',
                        color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 700, flexShrink: 0,
                      }}>
                        {u.firstName.charAt(0)}{u.lastName.charAt(0)}
                      </div>
                      <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                        {u.firstName} {u.lastName}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-secondary)' }}>{u.email}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span className={`badge ${u.role === 'admin' ? 'badge-info' : 'badge-secondary'}`}>{u.role}</span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span className={`badge ${statusBadge[u.status]}`}>{u.status}</span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span className={`badge ${kycBadge[u.kyc]}`}>{u.kyc}</span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 50, height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ width: `${u.trustScore}%`, height: '100%', background: 'var(--green-600)', borderRadius: 2 }} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>{u.trustScore}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{u.joinedAt}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-secondary" style={{ fontSize: 11, padding: '4px 10px' }}>View</button>
                      {u.status === 'active' ? (
                        <button className="btn btn-danger" style={{ fontSize: 11, padding: '4px 10px' }}>Suspend</button>
                      ) : (
                        <button className="btn btn-success" style={{ fontSize: 11, padding: '4px 10px' }}>Restore</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ─── Groups Panel ─────────────────────────────────────────────────────────────

const GroupsPanel = () => {
  const [filter, setFilter] = useState('all');
  const mockGroups = [
    { _id: 'g1', name: 'Downtown Savings Circle', status: 'active', members: '8/10', amount: 500, frequency: 'monthly', totalCollected: 4000, createdAt: '2024-01-10' },
    { _id: 'g2', name: 'Family Trust Fund', status: 'active', members: '5/6', amount: 1000, frequency: 'monthly', totalCollected: 5000, createdAt: '2024-02-15' },
    { _id: 'g3', name: 'Tech Workers Pool', status: 'completed', members: '12/12', amount: 250, frequency: 'biweekly', totalCollected: 6000, createdAt: '2023-08-01' },
    { _id: 'g4', name: 'Neighborhood ROSCAs', status: 'paused', members: '7/8', amount: 300, frequency: 'monthly', totalCollected: 2100, createdAt: '2024-03-20' },
    { _id: 'g5', name: 'Eastside Savings Pool', status: 'forming', members: '3/10', amount: 400, frequency: 'monthly', totalCollected: 0, createdAt: '2024-04-01' },
  ];

  const filtered = mockGroups.filter(g => filter === 'all' ? true : g.status === filter);
  const statusBadge = { active: 'badge-success', completed: 'badge-info', paused: 'badge-warning', forming: 'badge-secondary' };

  return (
    <div>
      <SectionHeader title="Group Management" subtitle="Monitor all ROSCA groups on the platform" />

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {['all', 'active', 'forming', 'paused', 'completed'].map(f => (
          <button
            key={f}
            className={`btn ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter(f)}
            style={{ fontSize: 13, padding: '7px 14px', textTransform: 'capitalize' }}
          >
            {f === 'all' ? 'All' : f}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {filtered.map(group => (
          <div key={group._id} className="card" style={{ padding: '18px 22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 'var(--radius-md)',
                  background: 'linear-gradient(135deg, var(--green-800), var(--green-600))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontSize: 20, flexShrink: 0,
                }}>⬡</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 4 }}>{group.name}</div>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Members: <strong style={{ color: 'var(--text-secondary)' }}>{group.members}</strong></span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Amount: <strong style={{ color: 'var(--text-secondary)' }}>${group.amount}</strong></span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Frequency: <strong style={{ color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{group.frequency}</strong></span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Created: <strong style={{ color: 'var(--text-secondary)' }}>{group.createdAt}</strong></span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Collected</div>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: 'var(--green-800)' }}>
                    ${group.totalCollected.toLocaleString()}
                  </div>
                </div>
                <span className={`badge ${statusBadge[group.status]}`}>{group.status}</span>
                <button className="btn btn-secondary" style={{ fontSize: 12, padding: '6px 12px' }}>Manage →</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Disputes Panel ───────────────────────────────────────────────────────────

const DisputesPanel = () => {
  const mockDisputes = [
    { _id: 'd1', type: 'Missed Payment', status: 'open', group: 'Downtown Savings Circle', filer: 'Sarah Johnson', respondent: 'Marcus Williams', date: '2024-04-08' },
    { _id: 'd2', type: 'Payout Dispute', status: 'under_review', group: 'Family Trust Fund', filer: 'Amara Osei', respondent: 'Admin', date: '2024-04-03' },
    { _id: 'd3', type: 'Member Behavior', status: 'escalated', group: 'Neighborhood ROSCAs', filer: 'David Chen', respondent: 'James Okonkwo', date: '2024-03-28' },
    { _id: 'd4', type: 'Missed Payment', status: 'resolved', group: 'Tech Workers Pool', filer: 'Fatima Al-Hassan', respondent: 'David Chen', date: '2024-03-15' },
  ];

  const statusBadge = { open: 'badge-warning', under_review: 'badge-info', escalated: 'badge-danger', resolved: 'badge-success' };
  const statusLabel = s => s.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  return (
    <div>
      <SectionHeader title="Disputes Management" subtitle="Review and resolve platform disputes" />

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--green-25)', borderBottom: '2px solid var(--border)' }}>
                {['Type', 'Group', 'Filed By', 'Against', 'Status', 'Date', 'Actions'].map(h => (
                  <th key={h} style={{
                    padding: '12px 16px', textAlign: 'left',
                    fontSize: 11, fontWeight: 700, color: 'var(--text-muted)',
                    textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mockDisputes.map((d, i) => (
                <tr key={d._id}
                  style={{ borderBottom: i < mockDisputes.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--green-25)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'white'}
                >
                  <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{d.type}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-secondary)' }}>{d.group}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-secondary)' }}>{d.filer}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-secondary)' }}>{d.respondent}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span className={`badge ${statusBadge[d.status]}`}>{statusLabel(d.status)}</span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{d.date}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-secondary" style={{ fontSize: 11, padding: '4px 10px' }}>Review</button>
                      {d.status !== 'resolved' && (
                        <button className="btn btn-success" style={{ fontSize: 11, padding: '4px 10px' }}>Resolve</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ─── Settings Panel ───────────────────────────────────────────────────────────

const SettingsPanel = () => {
  const [settings, setSettings] = useState({
    platformName: 'ROSCA - Esusu',
    maxGroupSize: 20,
    minTrustScore: 40,
    kycRequired: true,
    maintenanceMode: false,
    maxContribution: 10000,
    disputeWindowDays: 7,
  });

  return (
    <div>
      <SectionHeader title="Platform Settings" subtitle="Configure global platform parameters" />

      <div className="card">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Platform Name</label>
            <input className="form-control" value={settings.platformName} onChange={e => setSettings(p => ({ ...p, platformName: e.target.value }))} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Max Group Size</label>
            <input className="form-control" type="number" value={settings.maxGroupSize} onChange={e => setSettings(p => ({ ...p, maxGroupSize: +e.target.value }))} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Min Trust Score to Join</label>
            <input className="form-control" type="number" value={settings.minTrustScore} onChange={e => setSettings(p => ({ ...p, minTrustScore: +e.target.value }))} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Max Contribution Amount ($)</label>
            <input className="form-control" type="number" value={settings.maxContribution} onChange={e => setSettings(p => ({ ...p, maxContribution: +e.target.value }))} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Dispute Window (days)</label>
            <input className="form-control" type="number" value={settings.disputeWindowDays} onChange={e => setSettings(p => ({ ...p, disputeWindowDays: +e.target.value }))} />
          </div>
        </div>

        <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { key: 'kycRequired', label: 'Require KYC Verification', desc: 'Users must complete identity verification before joining groups.' },
            { key: 'maintenanceMode', label: 'Maintenance Mode', desc: 'Temporarily disable the platform for non-admin users.' },
          ].map(toggle => (
            <div key={toggle.key} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '14px 18px', background: 'var(--green-25)',
              borderRadius: 'var(--radius-md)', border: '1px solid var(--border)',
              gap: 16,
            }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{toggle.label}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{toggle.desc}</div>
              </div>
              <button
                onClick={() => setSettings(p => ({ ...p, [toggle.key]: !p[toggle.key] }))}
                style={{
                  width: 48, height: 26, borderRadius: 13,
                  background: settings[toggle.key] ? 'var(--green-700)' : 'var(--border)',
                  border: 'none', cursor: 'pointer', position: 'relative',
                  transition: 'background 0.2s', flexShrink: 0,
                }}
              >
                <div style={{
                  position: 'absolute', top: 3,
                  left: settings[toggle.key] ? 25 : 3,
                  width: 20, height: 20, borderRadius: '50%',
                  background: 'white', transition: 'left 0.2s',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                }} />
              </button>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button className="btn btn-secondary">Discard Changes</button>
          <button className="btn btn-primary">Save Settings</button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Admin Component ─────────────────────────────────────────────────────

const AdminPanel = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [stats] = useState({
    totalUsers: 248,
    activeGroups: 34,
    totalVolume: 187500,
    openDisputes: 6,
    pendingKyc: 12,
    avgTrustScore: 74,
  });

  useEffect(() => {
    setTimeout(() => setLoading(false), 400);
  }, []);

  // Guard: only admin
  if (user?.role !== 'admin') {
    return (
      <div style={{ padding: '48px 0' }}>
        <div className="container">
          <div className="card" style={{ textAlign: 'center', padding: '64px 24px' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>⊞</div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", color: 'var(--green-800)', marginBottom: 10 }}>Access Restricted</h2>
            <p style={{ color: 'var(--text-muted)' }}>You do not have permission to view the admin panel.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) return <Loading />;

  const tabs = [
    { key: 'overview', label: 'Overview', icon: '⬡' },
    { key: 'users', label: 'Users', icon: '◉' },
    { key: 'groups', label: 'Groups', icon: '◈' },
    { key: 'disputes', label: 'Disputes', icon: '◑' },
    { key: 'settings', label: 'Settings', icon: '◍' },
  ];

  return (
    <div style={{ padding: '28px 0' }}>
      <div className="container">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
          <div className="dashboard-header" style={{ marginBottom: 0 }}>
            <h1>Admin Panel</h1>
            <p>Manage the entire ROSCA platform</p>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'var(--green-50)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)', padding: '8px 14px',
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: '#22C55E', boxShadow: '0 0 6px #22C55E',
            }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--green-700)' }}>System Operational</span>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', gap: 0,
          background: 'white',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)',
          marginBottom: 28,
          overflow: 'hidden',
          boxShadow: 'var(--shadow-sm)',
          flexWrap: 'wrap',
        }}>
          {tabs.map((tab, i) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                flex: '1 1 auto',
                padding: '13px 16px',
                background: activeTab === tab.key ? 'var(--green-800)' : 'transparent',
                color: activeTab === tab.key ? 'white' : 'var(--text-secondary)',
                border: 'none',
                borderRight: i < tabs.length - 1 ? '1px solid var(--border)' : 'none',
                cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 14, fontWeight: activeTab === tab.key ? 600 : 400,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 8, transition: 'all 0.2s', whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => { if (activeTab !== tab.key) e.currentTarget.style.background = 'var(--green-25)'; }}
              onMouseLeave={e => { if (activeTab !== tab.key) e.currentTarget.style.background = 'transparent'; }}
            >
              <span style={{ fontSize: 16 }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Panel Content */}
        {activeTab === 'overview' && <OverviewPanel stats={stats} />}
        {activeTab === 'users' && <UsersPanel />}
        {activeTab === 'groups' && <GroupsPanel />}
        {activeTab === 'disputes' && <DisputesPanel />}
        {activeTab === 'settings' && <SettingsPanel />}
      </div>
    </div>
  );
};

export default AdminPanel;
