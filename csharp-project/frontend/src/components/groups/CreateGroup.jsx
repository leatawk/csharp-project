import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { toast } from 'react-toastify';

const CreateGroup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    contributionAmount: '',
    currency: 'USD',
    frequency: 'monthly',
    totalSlots: '',
    duration: '',
    payoutMethod: 'fixed',
    visibility: 'public',
    gracePeriodDays: 3,
    latePenaltyPercent: 5,
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post('/groups', {
        ...formData,
        contributionAmount: parseFloat(formData.contributionAmount),
        totalSlots: parseInt(formData.totalSlots),
        duration: parseInt(formData.duration),
        gracePeriodDays: parseInt(formData.gracePeriodDays),
        latePenaltyPercent: parseFloat(formData.latePenaltyPercent),
      });

      toast.success('Group created successfully!');
      navigate(`/groups/${response.data.data.group._id}`);
    } catch (error) {
      console.error('Error creating group:', error);
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ paddingTop: '30px', maxWidth: '800px' }}>
      <h1>Create New Group</h1>

      <div className="card" style={{ marginTop: '30px' }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Group Name *</label>
            <input
              type="text"
              name="name"
              className="form-control"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Enter group name"
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              className="form-control"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              placeholder="Brief description of the group"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="form-group">
              <label>Contribution Amount *</label>
              <input
                type="number"
                name="contributionAmount"
                className="form-control"
                value={formData.contributionAmount}
                onChange={handleChange}
                required
                min="1"
                step="0.01"
                placeholder="100"
              />
            </div>

            <div className="form-group">
              <label>Currency *</label>
              <select
                name="currency"
                className="form-control"
                value={formData.currency}
                onChange={handleChange}
                required
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="LBP">LBP</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="form-group">
              <label>Frequency *</label>
              <select
                name="frequency"
                className="form-control"
                value={formData.frequency}
                onChange={handleChange}
                required
              >
                <option value="weekly">Weekly</option>
                <option value="biweekly">Bi-weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            <div className="form-group">
              <label>Payout Method *</label>
              <select
                name="payoutMethod"
                className="form-control"
                value={formData.payoutMethod}
                onChange={handleChange}
                required
              >
                <option value="fixed">Fixed Order</option>
                <option value="random">Random</option>
                <option value="bidding">Bidding</option>
                <option value="lottery">Lottery</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="form-group">
              <label>Total Slots *</label>
              <input
                type="number"
                name="totalSlots"
                className="form-control"
                value={formData.totalSlots}
                onChange={handleChange}
                required
                min="2"
                max="50"
                placeholder="10"
              />
              <small style={{ color: '#666' }}>Number of members (2-50)</small>
            </div>

            <div className="form-group">
              <label>Duration (Cycles) *</label>
              <input
                type="number"
                name="duration"
                className="form-control"
                value={formData.duration}
                onChange={handleChange}
                required
                min="1"
                placeholder="10"
              />
              <small style={{ color: '#666' }}>Total number of payout cycles</small>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="form-group">
              <label>Grace Period (Days)</label>
              <input
                type="number"
                name="gracePeriodDays"
                className="form-control"
                value={formData.gracePeriodDays}
                onChange={handleChange}
                min="0"
                max="30"
              />
            </div>

            <div className="form-group">
              <label>Late Penalty (%)</label>
              <input
                type="number"
                name="latePenaltyPercent"
                className="form-control"
                value={formData.latePenaltyPercent}
                onChange={handleChange}
                min="0"
                max="100"
                step="0.1"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Visibility *</label>
            <select
              name="visibility"
              className="form-control"
              value={formData.visibility}
              onChange={handleChange}
              required
            >
              <option value="public">Public - Anyone can see and join</option>
              <option value="private">Private - Only visible to members</option>
              <option value="invite_only">Invite Only - Requires invite code</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '30px' }}>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Group'}
            </button>
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={() => navigate('/groups')}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroup;