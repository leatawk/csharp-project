import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../api/axios';
import { toast } from 'react-toastify';
import Loading from '../common/Loading';

const JoinGroup = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [inviteCode, setInviteCode] = useState(searchParams.get('code') || '');
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [guarantorUserId, setGuarantorUserId] = useState('');
  const [hasGuarantor, setHasGuarantor] = useState(false);

  useEffect(() => {
    // If invite code in URL, automatically verify it
    if (searchParams.get('code')) {
      verifyInviteCode(searchParams.get('code'));
    }
  }, [searchParams]);

  const verifyInviteCode = async (code) => {
    if (!code || code.length !== 8) {
      toast.error('Invalid invite code format');
      return;
    }

    setVerifying(true);
    try {
      // Search for group by invite code
      const response = await api.get('/groups', { 
        params: { inviteCode: code } 
      });
      
      const groups = response.data.data.groups || [];
      
      if (groups.length === 0) {
        toast.error('Invalid invite code');
        setGroup(null);
      } else {
        setGroup(groups[0]);
        toast.success('Group found!');
      }
    } catch (error) {
      console.error('Error verifying invite code:', error);
      toast.error('Failed to verify invite code');
      setGroup(null);
    } finally {
      setVerifying(false);
    }
  };

  const handleVerify = (e) => {
    e.preventDefault();
    verifyInviteCode(inviteCode);
  };

  const handleJoin = async () => {
    if (!group) {
      toast.error('Please verify invite code first');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        inviteCode: inviteCode,
      };

      if (hasGuarantor && guarantorUserId) {
        payload.guarantorUserId = guarantorUserId;
      }

      await api.post(`/memberships/join/${group._id}`, payload);
      
      toast.success('Join request submitted successfully!');
      navigate(`/groups/${group._id}`);
    } catch (error) {
      console.error('Error joining group:', error);
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ paddingTop: '30px', maxWidth: '700px' }}>
      <h1>Join Group with Invite Code</h1>

      <div className="card" style={{ marginTop: '30px' }}>
        {!group ? (
          <>
            <h3>Enter Invite Code</h3>
            <p style={{ color: '#666', marginBottom: '20px' }}>
              Enter the 8-character invite code you received to join a private group.
            </p>

            <form onSubmit={handleVerify}>
              <div className="form-group">
                <label>Invite Code</label>
                <input
                  type="text"
                  className="form-control"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="ABCD1234"
                  maxLength={8}
                  style={{ 
                    letterSpacing: '2px', 
                    fontFamily: 'monospace',
                    fontSize: '18px',
                    textAlign: 'center'
                  }}
                  required
                />
                <small style={{ color: '#666' }}>
                  Enter the 8-character code exactly as provided
                </small>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={verifying || inviteCode.length !== 8}
                style={{ width: '100%' }}
              >
                {verifying ? 'Verifying...' : 'Verify Code'}
              </button>
            </form>

            <div style={{ marginTop: '30px', textAlign: 'center' }}>
              <p style={{ color: '#666' }}>Don't have an invite code?</p>
              <button 
                onClick={() => navigate('/groups')}
                className="btn btn-secondary"
              >
                Browse Public Groups
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ 
              backgroundColor: '#d4edda', 
              padding: '15px', 
              borderRadius: '4px',
              marginBottom: '20px',
              border: '1px solid #c3e6cb'
            }}>
              <strong style={{ color: '#155724' }}>✓ Valid Invite Code</strong>
              <p style={{ color: '#155724', margin: '5px 0 0 0' }}>
                You can now join this group
              </p>
            </div>

            <h2>{group.name}</h2>
            <p style={{ color: '#666', marginTop: '10px' }}>
              {group.description || 'No description'}
            </p>

            <div style={{ 
              backgroundColor: '#f8f9fa', 
              padding: '20px', 
              borderRadius: '8px',
              marginTop: '20px'
            }}>
              <h3 style={{ fontSize: '18px', marginBottom: '15px' }}>Group Details</h3>
              
              <div style={{ display: 'grid', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666' }}>Contribution Amount:</span>
                  <strong>${group.contributionAmount} {group.currency}</strong>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666' }}>Frequency:</span>
                  <strong>{group.frequency}</strong>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666' }}>Available Slots:</span>
                  <strong>{group.totalSlots - group.filledSlots} of {group.totalSlots}</strong>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666' }}>Payout Method:</span>
                  <strong>{group.payoutMethod}</strong>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666' }}>Duration:</span>
                  <strong>{group.duration} cycles</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666' }}>Grace Period:</span>
                  <strong>{group.gracePeriodDays} days</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666' }}>Late Penalty:</span>
                  <strong>{group.latePenaltyPercent}%</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666' }}>Status:</span>
                  <span className={`badge badge-${
                    group.status === 'forming' ? 'info' : 
                    group.status === 'active' ? 'success' : 
                    'secondary'
                  }`}>
                    {group.status}
                  </span>
                </div>
              </div>
            </div>

            {group.requiresGuarantor && (
              <div style={{ marginTop: '20px' }}>
                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={hasGuarantor}
                      onChange={(e) => setHasGuarantor(e.target.checked)}
                      style={{ marginRight: '10px' }}
                    />
                    I have a guarantor
                  </label>
                </div>

                {hasGuarantor && (
                  <div className="form-group">
                    <label>Guarantor User ID (optional)</label>
                    <input
                      type="text"
                      className="form-control"
                      value={guarantorUserId}
                      onChange={(e) => setGuarantorUserId(e.target.value)}
                      placeholder="Enter guarantor's user ID"
                    />
                    <small style={{ color: '#666' }}>
                      If you have a guarantor, enter their user ID
                    </small>
                  </div>
                )}
              </div>
            )}

            <div style={{ 
              backgroundColor: '#fff3cd', 
              padding: '15px', 
              borderRadius: '4px',
              marginTop: '20px',
              border: '1px solid #ffeaa7'
            }}>
              <strong style={{ color: '#856404' }}>⚠ Important</strong>
              <ul style={{ color: '#856404', margin: '10px 0 0 20px' }}>
                <li>You commit to paying ${group.contributionAmount} {group.frequency}</li>
                <li>Late payments incur a {group.latePenaltyPercent}% penalty</li>
                <li>Your trust score will be affected by payment behavior</li>
                <li>Admin approval may be required before joining</li>
              </ul>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '30px' }}>
              <button 
                onClick={handleJoin}
                className="btn btn-success"
                disabled={loading}
                style={{ flex: 1 }}
              >
                {loading ? 'Joining...' : 'Join This Group'}
              </button>
              <button 
                onClick={() => setGroup(null)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default JoinGroup;