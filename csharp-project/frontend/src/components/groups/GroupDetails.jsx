import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import Loading from '../common/Loading';
import { toast } from 'react-toastify';

const GroupDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetchGroupDetails();
  }, [id]);

  const fetchGroupDetails = async () => {
    try {
      setLoading(true);
      const [groupResponse, membersResponse] = await Promise.all([
        api.get(`/groups/${id}`),
        api.get(`/memberships/group/${id}`)
      ]);

      const groupData = groupResponse.data.data.group;
      const membersData = membersResponse.data.data.memberships || [];

      setGroup(groupData);
      setMembers(membersData);

      // Check if current user is member or admin
      const userMembership = membersData.find(m => m.userId._id === user._id);
      setIsMember(!!userMembership);
      setIsAdmin(userMembership?.role === 'admin' || userMembership?.role === 'co_admin');

      setLoading(false);
    } catch (error) {
      console.error('Error fetching group details:', error);
      setLoading(false);
      toast.error('Failed to load group details');
    }
  };

  const handleJoinGroup = async () => {
    try {
      await api.post(`/memberships/join/${id}`);
      toast.success('Join request submitted successfully!');
      fetchGroupDetails();
    } catch (error) {
      console.error('Error joining group:', error);
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (!group) {
    return (
      <div className="container" style={{ paddingTop: '30px' }}>
        <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
          <h3>Group not found</h3>
          <button onClick={() => navigate('/groups')} className="btn btn-primary" style={{ marginTop: '20px' }}>
            Back to Groups
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '30px' }}>
      <button onClick={() => navigate('/groups')} className="btn btn-secondary" style={{ marginBottom: '20px' }}>
        ← Back to Groups
      </button>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
          <div>
            <h1>{group.name}</h1>
            <span className={`badge badge-${
              group.status === 'active' ? 'success' : 
              group.status === 'forming' ? 'info' : 
              'secondary'
            }`}>
              {group.status}
            </span>
          </div>
          
          {!isMember && group.status === 'forming' && (
            <button onClick={handleJoinGroup} className="btn btn-primary">
              Join Group
            </button>
          )}
        </div>

        <p style={{ marginTop: '20px', color: '#666' }}>
          {group.description || 'No description available'}
        </p>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '20px',
          marginTop: '30px'
        }}>
          <div>
            <h4 style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>Contribution Amount</h4>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--green-700)' }}>
              ${group.contributionAmount} {group.currency}
            </p>
          </div>

          <div>
            <h4 style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>Frequency</h4>
            <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{group.frequency}</p>
          </div>

          <div>
            <h4 style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>Members</h4>
            <p style={{ fontSize: '24px', fontWeight: 'bold' }}>
              {group.filledSlots}/{group.totalSlots}
            </p>
          </div>

          <div>
            <h4 style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>Payout Method</h4>
            <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{group.payoutMethod}</p>
          </div>

          <div>
            <h4 style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>Duration</h4>
            <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{group.duration} cycles</p>
          </div>

          <div>
            <h4 style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>Pool Balance</h4>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--green-700)' }}>
              ${group.poolBalance || 0}
            </p>
          </div>
        </div>
      </div>

      <div className="card">
        <h2>Members ({members.length})</h2>
        {members.length === 0 ? (
          <p style={{ color: '#666', textAlign: 'center', padding: '40px' }}>No members yet</p>
        ) : (
          <table style={{ width: '100%', marginTop: '20px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #ddd', textAlign: 'left' }}>
                <th style={{ padding: '10px' }}>Name</th>
                <th style={{ padding: '10px' }}>Role</th>
                <th style={{ padding: '10px' }}>Slot</th>
                <th style={{ padding: '10px' }}>Status</th>
                <th style={{ padding: '10px' }}>Joined</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member._id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '10px' }}>
                    {member.userId.firstName} {member.userId.lastName}
                  </td>
                  <td style={{ padding: '10px' }}>
                    <span className={`badge ${member.role === 'admin' ? 'badge-success' : 'badge-info'}`}>
                      {member.role}
                    </span>
                  </td>
                  <td style={{ padding: '10px' }}>{member.slotNumber}</td>
                  <td style={{ padding: '10px' }}>
                    <span className={`badge badge-${member.status === 'active' ? 'success' : 'warning'}`}>
                      {member.status}
                    </span>
                  </td>
                  <td style={{ padding: '10px' }}>
                    {new Date(member.joinedAt || member.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default GroupDetails;