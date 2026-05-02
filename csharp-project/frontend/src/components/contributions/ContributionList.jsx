import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import Loading from '../common/Loading';
import { format } from 'date-fns';

const ContributionList = () => {
  const navigate = useNavigate();
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, completed, late

  useEffect(() => {
    fetchContributions();
  }, [filter]);

  const fetchContributions = async () => {
    try {
      setLoading(true);
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await api.get('/contributions/my', { params });
      setContributions(response.data.data.contributions || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching contributions:', error);
      setLoading(false);
    }
  };

  const handlePayContribution = (contributionId) => {
    navigate(`/contributions/pay/${contributionId}`);
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="container" style={{ paddingTop: '30px' }}>
      <h1>My Contributions</h1>

      {/* Filter Tabs */}
      <div style={{ marginTop: '30px', marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <button
          className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button
          className={`btn ${filter === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFilter('pending')}
        >
          Pending
        </button>
        <button
          className={`btn ${filter === 'completed' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFilter('completed')}
        >
          Completed
        </button>
        <button
          className={`btn ${filter === 'late' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFilter('late')}
        >
          Late
        </button>
      </div>

      {contributions.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
          <h3>No contributions found</h3>
          <p style={{ color: '#666', marginTop: '10px' }}>
            {filter === 'all' 
              ? 'You have no contributions yet.' 
              : `You have no ${filter} contributions.`}
          </p>
        </div>
      ) : (
        <div className="card">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #ddd', textAlign: 'left' }}>
                <th style={{ padding: '10px' }}>Group</th>
                <th style={{ padding: '10px' }}>Cycle</th>
                <th style={{ padding: '10px' }}>Amount</th>
                <th style={{ padding: '10px' }}>Due Date</th>
                <th style={{ padding: '10px' }}>Status</th>
                <th style={{ padding: '10px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {contributions.map((contribution) => (
                <tr key={contribution._id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '10px' }}>
                    {contribution.groupId?.name || 'Unknown Group'}
                  </td>
                  <td style={{ padding: '10px' }}>{contribution.cycleNumber}</td>
                  <td style={{ padding: '10px' }}>
                    <strong>${contribution.amount.expected}</strong>
                    {contribution.amount.penalty > 0 && (
                      <span style={{ color: '#dc3545', fontSize: '12px', display: 'block' }}>
                        +${contribution.amount.penalty} penalty
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '10px' }}>
                    {format(new Date(contribution.dueDate), 'MMM dd, yyyy')}
                  </td>
                  <td style={{ padding: '10px' }}>
                    <span className={`badge badge-${
                      contribution.status === 'completed' ? 'success' :
                      contribution.status === 'pending' ? 'warning' :
                      contribution.status === 'late' ? 'danger' :
                      'info'
                    }`}>
                      {contribution.status}
                    </span>
                  </td>
                  <td style={{ padding: '10px' }}>
                    {(contribution.status === 'pending' || contribution.status === 'late') && (
                      <button
                        className="btn btn-primary"
                        style={{ padding: '5px 15px', fontSize: '14px' }}
                        onClick={() => handlePayContribution(contribution._id)}
                      >
                        Pay Now
                      </button>
                    )}
                    {contribution.status === 'completed' && (
                      <span style={{ color: 'var(--green-700)' }}>✓ Paid</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ContributionList;