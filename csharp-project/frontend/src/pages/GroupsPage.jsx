import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import Loading from '../components/common/Loading';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'forming', label: '🔵 Forming' },
  { key: 'active', label: '🟢 Active' },
  { key: 'pending_start', label: '🟡 Pending Start' },
  { key: 'completed', label: '⚫ Completed' },
];

const GroupsPage = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => { fetchGroups(); }, [filter]);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await api.get('/groups', { params });
      setGroups(response.data.data.groups || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching groups:', error);
      setLoading(false);
    }
  };

  const filteredGroups = groups.filter(g =>
    g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (g.description && g.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) return <Loading />;

  return (
    <div className="container" style={{ paddingTop: 28, paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: 'var(--text-primary)' }}>Browse Groups</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Find and join savings circles that match your goals</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link to="/groups/join" className="btn btn-secondary">Join with Code</Link>
          <Link to="/groups/create" className="btn btn-primary">+ Create Group</Link>
        </div>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 20 }}>
        <input
          type="text" className="form-control"
          placeholder="Search groups by name or description…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ paddingLeft: 40, fontSize: 15 }}
        />
        <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>🔍</span>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={filter === f.key ? 'btn btn-primary' : 'btn btn-secondary'}
            style={{ fontSize: 13, padding: '7px 14px' }}
          >
            {f.label}
            {f.key === 'all' && <span style={{ marginLeft: 6, opacity: 0.7 }}>({groups.length})</span>}
          </button>
        ))}
      </div>

      {/* Groups Grid */}
      {filteredGroups.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
          <h3 style={{ color: 'var(--text-primary)', marginBottom: 8 }}>No groups found</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            {searchTerm ? `No groups match "${searchTerm}"` : `No ${filter !== 'all' ? filter : ''} groups available.`}
          </p>
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="btn btn-secondary" style={{ marginTop: 16 }}>
              Clear Search
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="groups-grid">
            {filteredGroups.map((group) => (
              <div key={group._id} className="group-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <h3 style={{ flex: 1, paddingRight: 8 }}>{group.name}</h3>
                  <span className={`badge badge-${
                    group.status === 'active' ? 'success' :
                    group.status === 'forming' ? 'info' :
                    group.status === 'pending_start' ? 'warning' : 'secondary'
                  }`}>{group.status}</span>
                </div>

                <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 14, minHeight: 36, lineHeight: 1.5 }}>
                  {group.description || 'No description provided'}
                </p>

                <div className="group-card-info">
                  <div className="group-card-info-item">
                    <span>💰 Contribution</span>
                    <strong>${group.contributionAmount} {group.currency}</strong>
                  </div>
                  <div className="group-card-info-item">
                    <span>📅 Frequency</span>
                    <span style={{ textTransform: 'capitalize' }}>{group.frequency}</span>
                  </div>
                  <div className="group-card-info-item">
                    <span>👥 Members</span>
                    <span>
                      {group.filledSlots}/{group.totalSlots}
                      <span style={{ marginLeft: 6, fontSize: 12, color: group.filledSlots === group.totalSlots ? '#DC2626' : '#16A34A' }}>
                        ({group.filledSlots === group.totalSlots ? 'Full' : `${group.totalSlots - group.filledSlots} open`})
                      </span>
                    </span>
                  </div>
                  <div className="group-card-info-item">
                    <span>🎲 Payout</span>
                    <span style={{ textTransform: 'capitalize' }}>{group.payoutMethod}</span>
                  </div>
                  <div className="group-card-info-item">
                    <span>🏦 Pool Balance</span>
                    <strong style={{ color: 'var(--green-700)' }}>${group.poolBalance || 0}</strong>
                  </div>
                </div>

                <Link to={`/groups/${group._id}`} className="btn btn-primary" style={{ width: '100%', marginTop: 14 }}>
                  View Details →
                </Link>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: 28, padding: '14px', background: 'var(--green-25)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>
              Showing <strong style={{ color: 'var(--text-primary)' }}>{filteredGroups.length}</strong> of <strong style={{ color: 'var(--text-primary)' }}>{groups.length}</strong> groups
            </p>
          </div>
        </>
      )}

      {/* Info Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20, marginTop: 40 }}>
        {[
          { icon: '👥', title: 'Join a Group', desc: 'Browse groups and join one that matches your savings goals', cta: null },
          { icon: '🔑', title: 'Have a Code?', desc: 'Join a private group using an 8-character invite code', cta: { to: '/groups/join', label: 'Enter Code' } },
          { icon: '✨', title: 'Create Your Own', desc: 'Start a new ROSCA group and invite your trusted circle', cta: { to: '/groups/create', label: 'Create Group' } },
        ].map(c => (
          <div key={c.title} className="card" style={{ textAlign: 'center', padding: 28 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>{c.icon}</div>
            <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>{c.title}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6, marginBottom: c.cta ? 16 : 0 }}>{c.desc}</p>
            {c.cta && <Link to={c.cta.to} className="btn btn-primary" style={{ padding: '8px 20px' }}>{c.cta.label}</Link>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default GroupsPage;
