import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import Loading from '../common/Loading';

const GroupList = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, active, forming, completed

  useEffect(() => {
    fetchGroups();
  }, [filter]);

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

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="container" style={{ paddingTop: '30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1>Browse Groups</h1>
        <Link to="/groups/create" className="btn btn-primary">
          Create New Group
        </Link>
      </div>

      {/* Filter Tabs */}
      <div style={{ marginBottom: '30px', display: 'flex', gap: '10px' }}>
        <button
          className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFilter('all')}
        >
          All Groups
        </button>
        <button
          className={`btn ${filter === 'forming' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFilter('forming')}
        >
          Forming
        </button>
        <button
          className={`btn ${filter === 'active' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFilter('active')}
        >
          Active
        </button>
        <button
          className={`btn ${filter === 'completed' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFilter('completed')}
        >
          Completed
        </button>
      </div>

      {groups.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
          <h3>No groups found</h3>
          <p style={{ color: '#666', marginTop: '10px' }}>
            {filter === 'all' 
              ? 'There are no groups available yet.' 
              : `There are no ${filter} groups available.`}
          </p>
        </div>
      ) : (
        <div className="groups-grid">
          {groups.map((group) => (
            <div key={group._id} className="group-card">
              <h3>{group.name}</h3>
              <p style={{ color: '#666', fontSize: '14px', marginBottom: '15px' }}>
                {group.description || 'No description'}
              </p>

              <div className="group-card-info">
                <div className="group-card-info-item">
                  <span>Status:</span>
                  <span className={`badge badge-${
                    group.status === 'active' ? 'success' : 
                    group.status === 'forming' ? 'info' : 
                    'secondary'
                  }`}>
                    {group.status}
                  </span>
                </div>
                <div className="group-card-info-item">
                  <span>Contribution:</span>
                  <strong>${group.contributionAmount} {group.currency}</strong>
                </div>
                <div className="group-card-info-item">
                  <span>Frequency:</span>
                  <span>{group.frequency}</span>
                </div>
                <div className="group-card-info-item">
                  <span>Members:</span>
                  <span>{group.filledSlots}/{group.totalSlots}</span>
                </div>
                <div className="group-card-info-item">
                  <span>Payout Method:</span>
                  <span>{group.payoutMethod}</span>
                </div>
              </div>

              <Link 
                to={`/groups/${group._id}`} 
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '15px' }}
              >
                View Details
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GroupList;