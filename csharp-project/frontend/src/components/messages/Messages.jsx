import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import Loading from '../common/Loading';

const Messages = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef(null);

  // Mock data for UI demonstration
  const mockConversations = [
    {
      _id: '1',
      participant: { _id: 'u2', firstName: 'Sarah', lastName: 'Johnson', trustProfile: { score: 87 } },
      groupName: 'Downtown Savings Circle',
      lastMessage: { text: 'When is the next payout scheduled?', createdAt: new Date(Date.now() - 3600000) },
      unreadCount: 2,
    },
    {
      _id: '2',
      participant: { _id: 'u3', firstName: 'Marcus', lastName: 'Williams', trustProfile: { score: 92 } },
      groupName: 'Family Trust Fund',
      lastMessage: { text: 'I sent the contribution this morning ✓', createdAt: new Date(Date.now() - 86400000) },
      unreadCount: 0,
    },
    {
      _id: '3',
      participant: { _id: 'u4', firstName: 'Amara', lastName: 'Osei', trustProfile: { score: 75 } },
      groupName: 'Neighborhood ROSCAs',
      lastMessage: { text: 'Let me check with the group admin.', createdAt: new Date(Date.now() - 172800000) },
      unreadCount: 1,
    },
    {
      _id: '4',
      participant: { _id: 'u5', firstName: 'David', lastName: 'Chen', trustProfile: { score: 95 } },
      groupName: 'Tech Workers Pool',
      lastMessage: { text: 'Great, see you at the next meeting!', createdAt: new Date(Date.now() - 259200000) },
      unreadCount: 0,
    },
  ];

  const mockMessages = {
    '1': [
      { _id: 'm1', sender: { _id: 'u2', firstName: 'Sarah' }, text: 'Hi! I had a question about the group.', createdAt: new Date(Date.now() - 7200000) },
      { _id: 'm2', sender: { _id: user?._id || 'me', firstName: user?.firstName }, text: 'Of course! What would you like to know?', createdAt: new Date(Date.now() - 7000000) },
      { _id: 'm3', sender: { _id: 'u2', firstName: 'Sarah' }, text: 'When is the next payout scheduled?', createdAt: new Date(Date.now() - 3600000) },
    ],
    '2': [
      { _id: 'm4', sender: { _id: 'u3', firstName: 'Marcus' }, text: 'Hey, just wanted to confirm my contribution.', createdAt: new Date(Date.now() - 90000000) },
      { _id: 'm5', sender: { _id: user?._id || 'me', firstName: user?.firstName }, text: 'Thanks for the heads up!', createdAt: new Date(Date.now() - 89000000) },
      { _id: 'm6', sender: { _id: 'u3', firstName: 'Marcus' }, text: 'I sent the contribution this morning ✓', createdAt: new Date(Date.now() - 86400000) },
    ],
  };

  useEffect(() => {
    // Simulate API fetch
    setTimeout(() => {
      setConversations(mockConversations);
      setLoading(false);
    }, 500);
  }, []);

  useEffect(() => {
    if (activeConv) {
      const msgs = mockMessages[activeConv._id] || [];
      setMessages(msgs);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [activeConv]);

  const handleSend = async () => {
    if (!newMessage.trim() || !activeConv) return;
    setSending(true);
    const msg = {
      _id: `m_${Date.now()}`,
      sender: { _id: user?._id || 'me', firstName: user?.firstName },
      text: newMessage,
      createdAt: new Date(),
    };
    setMessages(prev => [...prev, msg]);
    setNewMessage('');
    setSending(false);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  const formatTime = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString();
  };

  const getInitials = (firstName = '', lastName = '') =>
    `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

  const filteredConvs = conversations.filter(c =>
    `${c.participant.firstName} ${c.participant.lastName} ${c.groupName}`
      .toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <Loading />;

  return (
    <div style={{ padding: '28px 0' }}>
      <div className="container">
        {/* Header */}
        <div className="dashboard-header">
          <h1>Messages</h1>
          <p>Communicate with your group members</p>
        </div>

        {/* Messages Layout */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: activeConv ? '320px 1fr' : '1fr',
          gap: 0,
          background: 'white',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-sm)',
          minHeight: 560,
          overflow: 'hidden',
        }}>

          {/* Conversations List */}
          <div style={{
            borderRight: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
          }}>
            {/* Search */}
            <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', background: 'var(--green-25)' }}>
              <input
                className="form-control"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ fontSize: 13 }}
              />
            </div>

            {/* Conv list */}
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {filteredConvs.length === 0 ? (
                <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>◐</div>
                  <p style={{ fontSize: 14 }}>No conversations yet.</p>
                </div>
              ) : (
                filteredConvs.map(conv => {
                  const isActive = activeConv?._id === conv._id;
                  return (
                    <div
                      key={conv._id}
                      onClick={() => setActiveConv(conv)}
                      style={{
                        padding: '14px 16px',
                        cursor: 'pointer',
                        borderBottom: '1px solid var(--border)',
                        background: isActive ? 'var(--green-50)' : 'white',
                        borderLeft: isActive ? '3px solid var(--green-700)' : '3px solid transparent',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--green-25)'; }}
                      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'white'; }}
                    >
                      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        {/* Avatar */}
                        <div style={{
                          width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
                          background: `linear-gradient(135deg, var(--green-600), var(--green-400))`,
                          color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 14, fontWeight: 700,
                          boxShadow: '0 2px 6px rgba(13,92,58,0.2)',
                        }}>
                          {getInitials(conv.participant.firstName, conv.participant.lastName)}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>
                              {conv.participant.firstName} {conv.participant.lastName}
                            </span>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                              {formatTime(conv.lastMessage.createdAt)}
                            </span>
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--green-700)', fontWeight: 500, marginTop: 1 }}>
                            {conv.groupName}
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                            <span style={{
                              fontSize: 13, color: 'var(--text-muted)', overflow: 'hidden',
                              textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '160px',
                            }}>
                              {conv.lastMessage.text}
                            </span>
                            {conv.unreadCount > 0 && (
                              <span style={{
                                background: 'var(--green-700)', color: 'white',
                                borderRadius: '50%', width: 18, height: 18,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 10, fontWeight: 700, flexShrink: 0,
                              }}>
                                {conv.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Chat Area */}
          {activeConv ? (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {/* Chat Header */}
              <div style={{
                padding: '14px 20px',
                borderBottom: '1px solid var(--border)',
                background: 'var(--green-25)',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--green-600), var(--green-400))',
                  color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 700,
                }}>
                  {getInitials(activeConv.participant.firstName, activeConv.participant.lastName)}
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 15 }}>
                    {activeConv.participant.firstName} {activeConv.participant.lastName}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {activeConv.groupName} · Trust Score: {activeConv.participant.trustProfile?.score || 0}/100
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 12, minHeight: 320 }}>
                {messages.map(msg => {
                  const isMe = msg.sender._id === (user?._id || 'me');
                  return (
                    <div key={msg._id} style={{
                      display: 'flex',
                      justifyContent: isMe ? 'flex-end' : 'flex-start',
                    }}>
                      <div style={{
                        maxWidth: '68%',
                        background: isMe ? 'var(--green-800)' : 'var(--green-50)',
                        color: isMe ? 'white' : 'var(--text-primary)',
                        borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        padding: '10px 14px',
                        boxShadow: 'var(--shadow-sm)',
                        border: isMe ? 'none' : '1px solid var(--border)',
                      }}>
                        <p style={{ fontSize: 14, lineHeight: 1.5, margin: 0 }}>{msg.text}</p>
                        <p style={{
                          fontSize: 11, marginTop: 4, marginBottom: 0,
                          color: isMe ? 'rgba(255,255,255,0.6)' : 'var(--text-muted)',
                          textAlign: 'right',
                        }}>
                          {formatTime(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div style={{
                padding: '14px 20px',
                borderTop: '1px solid var(--border)',
                background: 'var(--green-25)',
                display: 'flex',
                gap: 10,
                alignItems: 'flex-end',
              }}>
                <textarea
                  className="form-control"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  rows={1}
                  style={{ resize: 'none', minHeight: 42, lineHeight: 1.5, fontSize: 14 }}
                />
                <button
                  className="btn btn-primary"
                  onClick={handleSend}
                  disabled={sending || !newMessage.trim()}
                  style={{ height: 42, padding: '0 18px', flexShrink: 0 }}
                >
                  {sending ? '...' : 'Send →'}
                </button>
              </div>
            </div>
          ) : (
            <div style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-muted)', padding: 48, textAlign: 'center',
            }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>◐</div>
              <h3 style={{ fontFamily: "'Playfair Display', serif", color: 'var(--text-primary)', marginBottom: 8 }}>
                Your Messages
              </h3>
              <p style={{ fontSize: 14 }}>Select a conversation to start messaging your group members.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
