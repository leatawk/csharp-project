import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { toast } from 'react-toastify';
import Loading from '../common/Loading';
import { format } from 'date-fns';

const PayContribution = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contribution, setContribution] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchContributionDetails();
    fetchPaymentMethods();
  }, [id]);

  const fetchContributionDetails = async () => {
    try {
      const response = await api.get(`/contributions/${id}`);
      setContribution(response.data.data.contribution);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching contribution:', error);
      toast.error('Failed to load contribution details');
      navigate('/contributions');
    }
  };

  const fetchPaymentMethods = async () => {
    try {
      const response = await api.get('/users/payment-methods');
      const methods = response.data.data.paymentMethods || [];
      setPaymentMethods(methods);
      
      // Auto-select default method
      const defaultMethod = methods.find(m => m.isDefault);
      if (defaultMethod) {
        setSelectedMethod(defaultMethod._id);
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    }
  };

  const calculateTotalAmount = () => {
    if (!contribution) return 0;
    return contribution.amount.expected + (contribution.amount.penalty || 0);
  };

  const isLate = () => {
    if (!contribution) return false;
    const now = new Date();
    const gracePeriodEnd = new Date(contribution.gracePeriodEnds);
    return now > gracePeriodEnd;
  };

  const handlePayment = async () => {
    if (!selectedMethod) {
      toast.error('Please select a payment method');
      return;
    }

    setProcessing(true);
    try {
      await api.post(`/contributions/${id}/pay`, {
        paymentMethodId: selectedMethod
      });

      toast.success('Payment processed successfully!');
      navigate('/contributions');
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error(error.response?.data?.message || 'Payment failed');
      setProcessing(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (!contribution) {
    return (
      <div className="container" style={{ paddingTop: '30px' }}>
        <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
          <h3>Contribution not found</h3>
          <button 
            onClick={() => navigate('/contributions')}
            className="btn btn-primary"
            style={{ marginTop: '20px' }}
          >
            Back to Contributions
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '30px', maxWidth: '700px' }}>
      <button 
        onClick={() => navigate('/contributions')}
        className="btn btn-secondary"
        style={{ marginBottom: '20px' }}
      >
        ← Back to Contributions
      </button>

      <h1>Pay Contribution</h1>

      {/* Contribution Details */}
      <div className="card" style={{ marginTop: '30px' }}>
        <h2>Contribution Details</h2>
        
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '20px', 
          borderRadius: '8px',
          marginTop: '20px'
        }}>
          <div style={{ display: 'grid', gap: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#666' }}>Group:</span>
              <strong>{contribution.groupId?.name || 'Unknown'}</strong>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#666' }}>Cycle:</span>
              <strong>Cycle {contribution.cycleNumber}</strong>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#666' }}>Due Date:</span>
              <strong>{format(new Date(contribution.dueDate), 'MMM dd, yyyy')}</strong>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#666' }}>Grace Period Ends:</span>
              <strong>{format(new Date(contribution.gracePeriodEnds), 'MMM dd, yyyy')}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#666' }}>Status:</span>
              <span className={`badge badge-${
                isLate() ? 'danger' : 'warning'
              }`}>
                {isLate() ? 'Late' : 'Pending'}
              </span>
            </div>
          </div>
        </div>

        {isLate() && (
          <div style={{ 
            backgroundColor: '#f8d7da', 
            padding: '15px', 
            borderRadius: '4px',
            marginTop: '20px',
            border: '1px solid #f5c6cb'
          }}>
            <strong style={{ color: '#721c24' }}>⚠ Late Payment</strong>
            <p style={{ color: '#721c24', margin: '5px 0 0 0' }}>
              This payment is past the grace period. A late penalty has been applied.
            </p>
          </div>
        )}
      </div>

      {/* Payment Summary */}
      <div className="card">
        <h2>Payment Summary</h2>
        
        <div style={{ marginTop: '20px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            padding: '15px',
            borderBottom: '1px solid #eee'
          }}>
            <span>Contribution Amount:</span>
            <strong>${contribution.amount.expected.toFixed(2)}</strong>
          </div>

          {contribution.amount.penalty > 0 && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              padding: '15px',
              borderBottom: '1px solid #eee',
              color: '#dc3545'
            }}>
              <span>Late Penalty:</span>
              <strong>+${contribution.amount.penalty.toFixed(2)}</strong>
            </div>
          )}

          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            padding: '15px',
            fontSize: '20px',
            fontWeight: 'bold',
            backgroundColor: '#f8f9fa'
          }}>
            <span>Total Amount:</span>
            <span style={{ color: 'var(--green-700)' }}>
              ${calculateTotalAmount().toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Payment Method Selection */}
      <div className="card">
        <h2>Select Payment Method</h2>

        {paymentMethods.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p style={{ color: '#666', marginBottom: '20px' }}>
              No payment methods available. Please add a payment method first.
            </p>
            <button 
              onClick={() => navigate('/profile/payment-methods')}
              className="btn btn-primary"
            >
              Add Payment Method
            </button>
          </div>
        ) : (
          <div style={{ marginTop: '20px' }}>
            {paymentMethods.map((method) => (
              <div
                key={method._id}
                onClick={() => setSelectedMethod(method._id)}
                style={{
                  padding: '15px',
                  border: selectedMethod === method._id 
                    ? '2px solid var(--green-700)' 
                    : '1px solid #ddd',
                  borderRadius: '8px',
                  marginBottom: '10px',
                  cursor: 'pointer',
                  backgroundColor: selectedMethod === method._id 
                    ? '#e7f3ff' 
                    : 'white',
                  transition: 'all 0.3s'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <strong>
                        {method.type === 'card' ? '💳' : 
                         method.type === 'bank_account' ? '🏦' : '📱'}
                        {method.type === 'card' && method.card 
                          ? ` ${method.card.brand} •••• ${method.card.lastFour}`
                          : method.type === 'bank_account' && method.bankAccount
                          ? ` ${method.bankAccount.bankName} •••• ${method.bankAccount.lastFour}`
                          : method.type === 'mobile_wallet' && method.mobileWallet
                          ? ` ${method.mobileWallet.provider}`
                          : ' Payment Method'}
                      </strong>
                      {method.isDefault && (
                        <span className="badge badge-success" style={{ fontSize: '10px' }}>
                          Default
                        </span>
                      )}
                    </div>
                    {method.type === 'card' && method.card && (
                      <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                        Expires: {method.card.expiryMonth}/{method.card.expiryYear}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    {selectedMethod === method._id && (
                      <span style={{ color: 'var(--green-700)', fontSize: '20px' }}>✓</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment Button */}
      {paymentMethods.length > 0 && (
        <div className="card">
          <div style={{ 
            backgroundColor: '#fff3cd', 
            padding: '15px', 
            borderRadius: '4px',
            marginBottom: '20px',
            border: '1px solid #ffeaa7'
          }}>
            <strong style={{ color: '#856404' }}>⚠ Confirmation</strong>
            <p style={{ color: '#856404', margin: '5px 0 0 0' }}>
              By clicking "Pay Now", you authorize a charge of ${calculateTotalAmount().toFixed(2)} to your selected payment method.
            </p>
          </div>

          <button
            onClick={handlePayment}
            className="btn btn-success"
            disabled={processing || !selectedMethod}
            style={{ width: '100%', padding: '15px', fontSize: '18px' }}
          >
            {processing ? 'Processing Payment...' : `Pay $${calculateTotalAmount().toFixed(2)} Now`}
          </button>

          <button
            onClick={() => navigate('/contributions')}
            className="btn btn-secondary"
            style={{ width: '100%', marginTop: '10px' }}
            disabled={processing}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

export default PayContribution;