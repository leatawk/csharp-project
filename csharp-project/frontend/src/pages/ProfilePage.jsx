import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import Loading from '../components/common/Loading';
import { format } from 'date-fns';

const TABS = [
  { key: 'profile', label: '👤 Profile' },
  { key: 'payment-methods', label: '💳 Payment Methods' },
  { key: 'security', label: '🔒 Security' },
];

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const [profileData, setProfileData] = useState({ firstName:'', lastName:'', displayName:'', phone:'' });
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [newPaymentMethod, setNewPaymentMethod] = useState({
    type: 'card',
    card: { lastFour:'', brand:'visa', expiryMonth:'', expiryYear:'' }
  });
  const [passwordData, setPasswordData] = useState({ currentPassword:'', newPassword:'', confirmPassword:'' });
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        displayName: user.displayName || '',
        phone: user.phone || '',
      });
    }
    fetchPaymentMethods();
  }, [user]);

  const fetchPaymentMethods = async () => {
    try {
      const r = await api.get('/users/payment-methods');
      setPaymentMethods(r.data.data.paymentMethods || []);
    } catch (e) {}
  };

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await api.put('/users/profile', profileData);
      updateUser(r.data.data.user);
      showSuccess('Profile updated successfully!');
    } catch (e) {}
    setLoading(false);
  };

  const handleAddPaymentMethod = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/users/payment-methods', newPaymentMethod);
      showSuccess('Payment method added!');
      fetchPaymentMethods();
      setShowAddPayment(false);
      setNewPaymentMethod({ type:'card', card:{ lastFour:'', brand:'visa', expiryMonth:'', expiryYear:'' } });
    } catch (e) {}
    setLoading(false);
  };

  const handleRemovePaymentMethod = async (methodId) => {
    if (!window.confirm('Remove this payment method?')) return;
    try {
      await api.delete(`/users/payment-methods/${methodId}`);
      showSuccess('Payment method removed.');
      fetchPaymentMethods();
    } catch (e) {}
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError('');
    if (passwordData.newPassword !== passwordData.confirmPassword) return setPasswordError('Passwords do not match');
    if (passwordData.newPassword.length < 8) return setPasswordError('Password must be at least 8 characters');
    setLoading(true);
    try {
      await api.put('/users/change-password', { currentPassword: passwordData.currentPassword, newPassword: passwordData.newPassword });
      showSuccess('Password updated successfully!');
      setPasswordData({ currentPassword:'', newPassword:'', confirmPassword:'' });
    } catch (e) { setPasswordError('Failed to update password. Check your current password.'); }
    setLoading(false);
  };

  const trustScore = user?.trustProfile?.score || 50;
  const initials = `${user?.firstName?.charAt(0)||''}${user?.lastName?.charAt(0)||''}`;

  return (
    <div className="container" style={{ paddingTop: 28, paddingBottom: 40 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize: 28, color:'var(--text-primary)' }}>Profile</h1>
        <p style={{ color:'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Manage your account settings and preferences</p>
      </div>

      {successMsg && (
        <div className="alert alert-success" style={{ marginBottom: 20 }}>✓ {successMsg}</div>
      )}

      {/* Profile Hero Card */}
      <div className="card" style={{ marginBottom: 24, background:'linear-gradient(135deg, var(--green-900) 0%, var(--green-800) 100%)', border:'none' }}>
        <div style={{ display:'flex', alignItems:'center', gap: 20, flexWrap:'wrap' }}>
          <div style={{
            width: 72, height: 72, borderRadius:'50%',
            background:'linear-gradient(135deg, var(--green-500), var(--green-400))',
            color:'white', display:'flex', alignItems:'center', justifyContent:'center',
            fontSize: 26, fontWeight: 700, flexShrink: 0,
            boxShadow:'0 4px 16px rgba(0,0,0,0.3)',
          }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize: 22, fontWeight: 700, color:'white' }}>
              {user?.firstName} {user?.lastName}
            </div>
            <div style={{ color:'rgba(255,255,255,0.65)', fontSize: 14, marginTop: 2 }}>{user?.email}</div>
            <div style={{ display:'flex', alignItems:'center', gap: 12, marginTop: 12, flexWrap:'wrap' }}>
              <div style={{ color:'var(--green-300, #6EE7A0)', fontSize: 13, fontWeight: 600 }}>
                Trust Score: {trustScore}/100
              </div>
              <span className={`badge badge-${user?.kycVerification?.status === 'verified' ? 'success' : 'warning'}`}>
                {user?.kycVerification?.status === 'verified' ? '✓ Verified' : 'Unverified'}
              </span>
            </div>
            {/* Trust bar */}
            <div style={{ marginTop: 10, height: 4, background:'rgba(255,255,255,0.15)', borderRadius: 2, overflow:'hidden', maxWidth: 200 }}>
              <div style={{ width:`${trustScore}%`, height:'100%', background:'var(--green-400)', borderRadius: 2, transition:'width 0.5s' }} />
            </div>
          </div>
          <div style={{ textAlign:'right', color:'rgba(255,255,255,0.5)', fontSize: 13 }}>
            Member since {user?.createdAt ? format(new Date(user.createdAt), 'MMM yyyy') : 'N/A'}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap: 0, marginBottom: 20, borderBottom:'2px solid var(--border)', overflowX:'auto' }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            style={{
              background:'none', border:'none', cursor:'pointer',
              padding:'12px 20px', fontSize: 14, fontWeight: 600, whiteSpace:'nowrap',
              color: activeTab === t.key ? 'var(--green-800)' : 'var(--text-muted)',
              borderBottom: activeTab === t.key ? '2px solid var(--green-700)' : '2px solid transparent',
              marginBottom: -2, transition:'all 0.2s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="card">
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize: 20, marginBottom: 24, color:'var(--text-primary)' }}>Personal Information</h2>
          <form onSubmit={handleProfileSubmit}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>First Name</label>
                <input type="text" className="form-control" value={profileData.firstName}
                  onChange={e => setProfileData({...profileData, firstName: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input type="text" className="form-control" value={profileData.lastName}
                  onChange={e => setProfileData({...profileData, lastName: e.target.value})} required />
              </div>
            </div>
            <div className="form-group">
              <label>Display Name</label>
              <input type="text" className="form-control" value={profileData.displayName}
                onChange={e => setProfileData({...profileData, displayName: e.target.value})}
                placeholder="How others see you" />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input type="tel" className="form-control" value={profileData.phone}
                onChange={e => setProfileData({...profileData, phone: e.target.value})}
                placeholder="+96112345678" />
            </div>
            <div className="form-group">
              <label>Email <span style={{ color:'var(--text-light)', fontWeight:400, textTransform:'none' }}>(cannot be changed)</span></label>
              <input type="email" className="form-control" value={user?.email || ''} disabled
                style={{ background:'var(--green-25)', cursor:'not-allowed' }} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: 8 }}>
              {loading ? 'Saving…' : 'Save Changes'}
            </button>
          </form>
        </div>
      )}

      {/* Payment Methods Tab */}
      {activeTab === 'payment-methods' && (
        <div className="card">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 24, flexWrap:'wrap', gap: 12 }}>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize: 20, color:'var(--text-primary)' }}>Payment Methods</h2>
            <button onClick={() => setShowAddPayment(!showAddPayment)} className="btn btn-primary">
              {showAddPayment ? 'Cancel' : '+ Add Method'}
            </button>
          </div>

          {showAddPayment && (
            <form onSubmit={handleAddPaymentMethod} style={{
              background:'var(--green-25)', borderRadius:'var(--radius-lg)',
              padding: 20, marginBottom: 24, border:'1px solid var(--border)'
            }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color:'var(--text-primary)' }}>Add New Payment Method</h3>
              <div className="form-group">
                <label>Type</label>
                <select className="form-control" value={newPaymentMethod.type}
                  onChange={e => setNewPaymentMethod({...newPaymentMethod, type: e.target.value})}>
                  <option value="card">Credit/Debit Card</option>
                  <option value="bank_account">Bank Account</option>
                  <option value="mobile_money">Mobile Money</option>
                </select>
              </div>
              {newPaymentMethod.type === 'card' && (
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label>Last 4 digits</label>
                    <input type="text" className="form-control" maxLength={4}
                      value={newPaymentMethod.card.lastFour}
                      onChange={e => setNewPaymentMethod({...newPaymentMethod, card:{...newPaymentMethod.card, lastFour:e.target.value}})}
                      required placeholder="1234" />
                  </div>
                  <div className="form-group">
                    <label>Brand</label>
                    <select className="form-control" value={newPaymentMethod.card.brand}
                      onChange={e => setNewPaymentMethod({...newPaymentMethod, card:{...newPaymentMethod.card, brand:e.target.value}})}>
                      <option value="visa">Visa</option>
                      <option value="mastercard">Mastercard</option>
                      <option value="amex">Amex</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Expiry (MM/YYYY)</label>
                    <div style={{ display:'flex', gap: 6 }}>
                      <input type="number" className="form-control" min="1" max="12"
                        value={newPaymentMethod.card.expiryMonth}
                        onChange={e => setNewPaymentMethod({...newPaymentMethod, card:{...newPaymentMethod.card, expiryMonth:e.target.value}})}
                        placeholder="MM" required />
                      <input type="number" className="form-control" min={new Date().getFullYear()}
                        value={newPaymentMethod.card.expiryYear}
                        onChange={e => setNewPaymentMethod({...newPaymentMethod, card:{...newPaymentMethod.card, expiryYear:e.target.value}})}
                        placeholder="YYYY" required />
                    </div>
                  </div>
                </div>
              )}
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Adding…' : 'Add Payment Method'}
              </button>
            </form>
          )}

          {paymentMethods.length === 0 ? (
            <div style={{ textAlign:'center', padding:'48px 20px', color:'var(--text-muted)' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>💳</div>
              <p>No payment methods added yet</p>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap: 12 }}>
              {paymentMethods.map(method => (
                <div key={method._id} style={{
                  padding: '16px 20px', border:'1px solid var(--border)', borderRadius:'var(--radius-md)',
                  display:'flex', justifyContent:'space-between', alignItems:'center',
                  background: method.isDefault ? 'var(--green-25)' : 'white',
                  borderColor: method.isDefault ? 'var(--green-600)' : 'var(--border)',
                  flexWrap:'wrap', gap: 12,
                }}>
                  <div>
                    <div style={{ display:'flex', alignItems:'center', gap: 10 }}>
                      <strong style={{ fontSize: 15, color:'var(--text-primary)' }}>
                        {method.type === 'card' ? '💳' : method.type === 'bank_account' ? '🏦' : '📱'}
                        {' '}
                        {method.type === 'card' && method.card
                          ? `${method.card.brand} •••• ${method.card.lastFour}`
                          : method.type === 'bank_account' && method.bankAccount
                          ? `${method.bankAccount.bankName} •••• ${method.bankAccount.lastFour}`
                          : 'Payment Method'}
                      </strong>
                      {method.isDefault && <span className="badge badge-success">Default</span>}
                    </div>
                    {method.type === 'card' && method.card && (
                      <div style={{ fontSize: 13, color:'var(--text-muted)', marginTop: 4 }}>
                        Expires {method.card.expiryMonth}/{method.card.expiryYear}
                      </div>
                    )}
                  </div>
                  <button onClick={() => handleRemovePaymentMethod(method._id)} className="btn btn-danger" style={{ padding:'6px 14px', fontSize: 13 }}>
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
          <div className="card">
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize: 20, marginBottom: 24, color:'var(--text-primary)' }}>Change Password</h2>
            {passwordError && <div className="alert alert-danger">{passwordError}</div>}
            <form onSubmit={handlePasswordChange}>
              <div className="form-group">
                <label>Current Password</label>
                <input type="password" className="form-control" value={passwordData.currentPassword}
                  onChange={e => setPasswordData({...passwordData, currentPassword:e.target.value})} required />
              </div>
              <div className="form-group">
                <label>New Password</label>
                <input type="password" className="form-control" value={passwordData.newPassword}
                  onChange={e => setPasswordData({...passwordData, newPassword:e.target.value})} required minLength={8} />
                <small style={{ color:'var(--text-muted)', fontSize: 12 }}>Minimum 8 characters</small>
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <input type="password" className="form-control" value={passwordData.confirmPassword}
                  onChange={e => setPasswordData({...passwordData, confirmPassword:e.target.value})} required />
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Updating…' : 'Update Password'}
              </button>
            </form>
          </div>

          <div className="card" style={{ background:'var(--green-25)', border:'1px solid var(--border)' }}>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize: 20, marginBottom: 20, color:'var(--text-primary)' }}>Trust Profile</h2>
            <div style={{ display:'flex', flexDirection:'column', gap: 14 }}>
              {[
                { label:'Trust Score', value:`${trustScore}/100`, valueColor:'var(--green-700)', extra:(
                  <div style={{ marginTop: 8, height: 6, background:'var(--border)', borderRadius: 3, overflow:'hidden' }}>
                    <div style={{ width:`${trustScore}%`, height:'100%', background:'linear-gradient(90deg, var(--green-700), var(--green-500))', borderRadius: 3, transition:'width 0.5s' }} />
                  </div>
                )},
                { label:'Verification Status', value: user?.kycVerification?.status === 'verified' ? '✓ Verified' : 'Not Verified',
                  valueColor: user?.kycVerification?.status === 'verified' ? 'var(--green-700)' : '#D97706' },
                { label:'Member Since', value: user?.createdAt ? format(new Date(user.createdAt), 'MMMM yyyy') : 'N/A' },
                { label:'Email', value: user?.email },
              ].map(item => (
                <div key={item.label}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ color:'var(--text-muted)', fontSize: 14 }}>{item.label}</span>
                    <strong style={{ color: item.valueColor || 'var(--text-primary)', fontSize: 14 }}>{item.value}</strong>
                  </div>
                  {item.extra}
                  <div style={{ height: 1, background:'var(--border)', marginTop: 12 }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
