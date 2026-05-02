import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import Loading from '../common/Loading';

const statusBadge = (status) => {
  const map = {
    open: 'badge-warning',
    under_review: 'badge-info',
    resolved: 'badge-success',
    closed: 'badge-secondary',
    escalated: 'badge-danger',
  };
  return map[status] || 'badge-secondary';
};

const statusLabel = (status) => status?.replace(/_/g, ' ')?.replace(/\b\w/g, l => l.toUpperCase()) || status;

const Disputes = () => {
  const { user } = useAuth();
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newDispute, setNewDispute] = useState({
    groupId: '',
    type: 'missed_payment',
    description: '',
  });

  const mockDisputes = [
    {
      _id: 'd1',
      type: 'missed_payment',
      status: 'open',
      description: 'Member failed to make their monthly contribution on the due date. This is the second occurrence this quarter.',
      groupName: 'Downtown Savings Circle',
      respondent: { firstName: 'Marcus', lastName: 'Williams' },
      createdAt: new Date(Date.now() - 172800000),
      updatedAt: new Date(Date.now() - 86400000),
      evidence: [],
      adminNote: '',
    },
    {
      _id: 'd2',
      type: 'payout_dispute',
      status: 'under_review',
      description: 'The payout was sent to the wrong account. I have not received my funds after 5 business days.',
      groupName: 'Family Trust Fund',
      respondent: { firstName: 'Admin', lastName: 'Panel' },
      createdAt: new Date(Date.now() - 432000000),
      updatedAt: new Date(Date.now() - 43200000),
      evidence: ['bank_statement.pdf'],
      adminNote: 'Transaction being traced with payment processor.',
    },
    {
      _id: 'd3',
      type: 'member_behavior',
      status: 'resolved',
      description: 'Member was repeatedly unresponsive and failed to attend group meetings.',
      groupName: 'Tech Workers Pool',
      respondent: { firstName: 'David', lastName: 'Chen' },
      createdAt: new Date(Date.now() - 864000000),
      updatedAt: new Date(Date.now() - 259200000),
      evidence: [],
      adminNote: 'Dispute resolved. Member has been issued a formal warning.',
    },
    {
      _id: 'd4',
      type: 'missed_payment',
      status: 'escalated',
      description: 'Three consecutive missed payments despite multiple reminders sent via the platform.',
      groupName: 'Neighborhood ROSCAs',
      respondent: { firstName: 'Amara', lastName: 'Osei' },
      createdAt: new Date(Date.now() - 1296000000),
      updatedAt: new Date(Date.now() - 604800000),
      evidence: ['payment_history.pdf', 'chat_log.txt'],
      adminNote: 'Escalated to senior review team. Member trust score suspended.',
    },
  ];

  useEffect(() => {
    setTimeout(() => {
      setDisputes(mockDisputes);
      setLoading(false);
    }, 500);
  }, []);

  const filteredDisputes = disputes.filter(d =>
    filter === 'all' ? true : d.status === filter
  );

  const handleSubmit = async () => {
    if (!newDispute.description.trim()) {
      setError('Please describe the dispute.');
      return;
    }
    setSubmitting(true);
    setError('');
    // Simulate API call
    await new Promise(res => setTimeout(res, 800));
    const created = {
      _id: `d_${Date.now()}`,
      ...newDispute,
      groupName: 'My Group',
      status: 'open',
      respondent: { firstName: 'Group', lastName: 'Admin' },
      createdAt: new Date(),
      updatedAt: new Date(),
      evidence: [],
      adminNote: '',
    };
    setDisputes(prev => [created, ...prev]);
    setSubmitting(false);
    setShowModal(false);
    setSuccess('Dispute submitted successfully. Our team will review it shortly.');
    setNewDispute({ groupId: '', type: 'missed_payment', description: '' });
    setTimeout(() => setSuccess(''), 5000);
  };

  const formatDate = (date) => new Date(date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  });

  const typeLabel = (type) => ({
    missed_payment: 'Missed Payment',
    payout_dispute: 'Payout Dispute',
    member_behavior: 'Member Behavior',
    fraud: 'Fraud',
    other: 'Other',
  }[type] || type);

  const filterTabs = [
    { key: 'all', label: 'All' },
    { key: 'open', label: 'Open' },
    { key: 'under_review', label: 'Under Review' },
    { key: 'escalated', label: 'Escalated' },
    { key: 'resolved', label: 'Resolved' },
  ];

  if (loading) return <Loading />;

  return (
    <div style={{ padding: '28px 0' }}>
      <div className="container">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
          <div className="dashboard-header" style={{ marginBottom: 0 }}>
            <h1>Disputes</h1>
            <p>Manage and track group disputes</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            + File a Dispute
          </button>
        </div>

        {success && <div className="alert alert-success">{success}</div>}

        {/* Stats Row */}
        <div className="stats-grid" style={{ marginBottom: 24 }}>
          {[
            { label: 'Total Disputes', value: disputes.length, color: 'var(--green-800)' },
            { label: 'Open', value: disputes.filter(d => d.status === 'open').length, color: '#D97706' },
            { label: 'Under Review', value: disputes.filter(d => d.status === 'under_review').length, color: '#1D4ED8' },
            { label: 'Resolved', value: disputes.filter(d => d.status === 'resolved').length, color: 'var(--green-700)' },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <h3>{s.label}</h3>
              <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {filterTabs.map(tab => (
            <button
              key={tab.key}
              className={`btn ${filter === tab.key ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter(tab.key)}
              style={{ fontSize: 13, padding: '7px 16px' }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Disputes List */}
        {filteredDisputes.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '48px 20px' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>◑</div>
            <p style={{ color: 'var(--text-muted)' }}>No disputes found for this filter.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {filteredDisputes.map(dispute => (
              <div
                key={dispute._id}
                className="card"
                style={{
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  borderLeft: `4px solid ${
                    dispute.status === 'open' ? '#F59E0B' :
                    dispute.status === 'under_review' ? '#3B82F6' :
                    dispute.status === 'resolved' ? 'var(--green-700)' :
                    dispute.status === 'escalated' ? '#DC2626' :
                    'var(--border)'
                  }`,
                }}
                onClick={() => setSelectedDispute(selectedDispute?._id === dispute._id ? null : dispute)}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                      <span style={{
                        fontFamily: "'Playfair Display', serif",
                        fontSize: 16, fontWeight: 700, color: 'var(--text-primary)',
                      }}>
                        {typeLabel(dispute.type)}
                      </span>
                      <span className={`badge ${statusBadge(dispute.status)}`}>
                        {statusLabel(dispute.status)}
                      </span>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 10, lineHeight: 1.5 }}>
                      {dispute.description.length > 120
                        ? dispute.description.slice(0, 120) + '...'
                        : dispute.description}
                    </p>
                    <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                        <strong style={{ color: 'var(--text-secondary)' }}>Group:</strong> {dispute.groupName}
                      </span>
                      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                        <strong style={{ color: 'var(--text-secondary)' }}>Against:</strong> {dispute.respondent.firstName} {dispute.respondent.lastName}
                      </span>
                      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                        Filed: {formatDate(dispute.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div style={{ fontSize: 20, color: 'var(--text-muted)', flexShrink: 0 }}>
                    {selectedDispute?._id === dispute._id ? '▲' : '▼'}
                  </div>
                </div>

                {/* Expanded Detail */}
                {selectedDispute?._id === dispute._id && (
                  <div style={{
                    marginTop: 20, paddingTop: 20,
                    borderTop: '1px solid var(--border)',
                  }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                          Full Description
                        </div>
                        <p style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.6 }}>
                          {dispute.description}
                        </p>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                          Evidence ({dispute.evidence.length})
                        </div>
                        {dispute.evidence.length > 0 ? (
                          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {dispute.evidence.map((f, i) => (
                              <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                                <span style={{ color: 'var(--green-700)' }}>◈</span>
                                <span style={{ color: 'var(--text-secondary)' }}>{f}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No evidence attached</p>
                        )}
                      </div>
                      {dispute.adminNote && (
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                            Admin Note
                          </div>
                          <div style={{
                            background: 'var(--green-50)',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '10px 14px',
                            fontSize: 13,
                            color: 'var(--text-primary)',
                            lineHeight: 1.5,
                          }}>
                            {dispute.adminNote}
                          </div>
                        </div>
                      )}
                    </div>
                    <div style={{ marginTop: 16, fontSize: 12, color: 'var(--text-muted)' }}>
                      Last updated: {formatDate(dispute.updatedAt)}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* File Dispute Modal */}
        {showModal && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: 24,
          }}>
            <div style={{
              background: 'white', borderRadius: 'var(--radius-xl)',
              padding: 36, maxWidth: 520, width: '100%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
              animation: 'fadeInUp 0.2s ease',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: 'var(--green-800)' }}>
                  File a Dispute
                </h2>
                <button
                  onClick={() => { setShowModal(false); setError(''); }}
                  style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  ×
                </button>
              </div>

              {error && <div className="alert alert-danger">{error}</div>}

              <div className="form-group">
                <label>Dispute Type</label>
                <select
                  className="form-control"
                  value={newDispute.type}
                  onChange={e => setNewDispute(p => ({ ...p, type: e.target.value }))}
                >
                  <option value="missed_payment">Missed Payment</option>
                  <option value="payout_dispute">Payout Dispute</option>
                  <option value="member_behavior">Member Behavior</option>
                  <option value="fraud">Fraud</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  className="form-control"
                  placeholder="Describe the dispute in detail. Include dates, amounts, and any relevant context..."
                  rows={5}
                  value={newDispute.description}
                  onChange={e => setNewDispute(p => ({ ...p, description: e.target.value }))}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{
                background: 'var(--green-50)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '12px 14px',
                fontSize: 13, color: 'var(--text-secondary)',
                marginBottom: 20,
              }}>
                ◉ Disputes are reviewed within 3–5 business days. False or abusive disputes may affect your trust score.
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button className="btn btn-secondary" onClick={() => { setShowModal(false); setError(''); }}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Dispute'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default Disputes;
