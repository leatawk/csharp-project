import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import Loading from '../common/Loading';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentGroups, setRecentGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchDashboardData(); }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const groupsResponse = await api.get('/groups/my/all');
      const groups = groupsResponse.data.data.groups || [];
      const activeGroups = groups.filter(g => g.status === 'active').length;
      const totalContributions = groups.reduce((sum, g) => sum + (g.totalCollected || 0), 0);
      const pendingPayouts = groups.filter(g => g.status === 'active' && !g.hasReceivedPayout).length;
      setStats({
        activeGroups, totalGroups: groups.length,
        totalContributions, pendingPayouts,
        trustScore: user?.trustProfile?.score || 50
      });
      setRecentGroups(groups.slice(0, 3));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  if (loading) return <Loading />;

  const statCards = [
    { label: 'Active Groups', value: stats?.activeGroups || 0, icon: '◉', color: 'var(--green-700)' },
    { label: 'Total Groups', value: stats?.totalGroups || 0, icon: '⬡', color: 'var(--green-600)' },
    { label: 'Contributions', value: `$${stats?.totalContributions || 0}`, icon: '◈', color: '#1D4ED8' },
    { label: 'Trust Score', value: stats?.trustScore || 50, icon: '★', color: '#D97706' },
  ];

  return (
    <div className="dashboard">
      <div className="container">
        <div className="dashboard-header">
          <h1>Welcome back, {user?.firstName}! 👋</h1>
          <p>Here's an overview of your ROSCA activities</p>
        </div>

        <div className="stats-grid">
          {statCards.map(s => (
            <div key={s.label} className="stat-card">
              <h3>{s.label}</h3>
              <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* My Groups */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: 'var(--text-primary)' }}>My Groups</h2>
            <Link to="/groups/create" className="btn btn-primary">+ Create Group</Link>
          </div>

          {recentGroups.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>👥</div>
              <p style={{ marginBottom: 16 }}>You haven't joined any groups yet.</p>
              <Link to="/groups" className="btn btn-primary">Browse Groups</Link>
            </div>
          ) : (
            <div className="groups-grid">
              {recentGroups.map((group) => (
                <div key={group._id} className="group-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
                    <h3>{group.name}</h3>
                    <span className={`badge badge-${group.status === 'active' ? 'success' : 'info'}`}>{group.status}</span>
                  </div>
                  <div className="group-card-info">
                    <div className="group-card-info-item">
                      <span>Contribution</span>
                      <strong>${group.contributionAmount} {group.currency}</strong>
                    </div>
                    <div className="group-card-info-item">
                      <span>Members</span>
                      <span>{group.filledSlots}/{group.totalSlots}</span>
                    </div>
                    <div className="group-card-info-item">
                      <span>Frequency</span>
                      <span style={{ textTransform: 'capitalize' }}>{group.frequency}</span>
                    </div>
                  </div>
                  <Link to={`/groups/${group._id}`} className="btn btn-primary" style={{ width: '100%', marginTop: 12 }}>
                    View Details →
                  </Link>
                </div>
              ))}
            </div>
          )}

          {recentGroups.length > 0 && (
            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <Link to="/groups" className="btn btn-secondary">View All Groups</Link>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, marginBottom: 20, color: 'var(--text-primary)' }}>Quick Actions</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            {[
              { to: '/contributions', label: 'Contributions', primary: true },
              { to: '/payouts', label: 'Payouts', primary: true },
              { to: '/groups', label: 'Browse Groups', primary: true },
              { to: '/profile', label: 'Edit Profile', primary: false },
            ].map(a => (
              <Link key={a.to} to={a.to} className={`btn ${a.primary ? 'btn-primary' : 'btn-secondary'}`}>
                {a.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
