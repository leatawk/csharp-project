import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Sidebar = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  const menuItems = [
    { path: '/dashboard', icon: '⬡', label: 'Dashboard' },
    { path: '/groups', icon: '◉', label: 'Groups' },
    { path: '/contributions', icon: '◈', label: 'Contributions' },
    { path: '/payouts', icon: '◎', label: 'Payouts' },
    { path: '/messages', icon: '◐', label: 'Messages' },
    { path: '/disputes', icon: '◑', label: 'Disputes' },
    { path: '/profile', icon: '◍', label: 'Profile' },
    ...(user?.role === 'admin' ? [{ path: '/admin', icon: '⊞', label: 'Admin Panel' }] : []),
  ];

  const initials = `${user?.firstName?.charAt(0) || ''}${user?.lastName?.charAt(0) || ''}`;
  const trustScore = user?.trustProfile?.score || 50;

  return (
    <aside style={{
      width: collapsed ? '64px' : '240px',
      backgroundColor: 'var(--green-900)',
      minHeight: 'calc(100vh - 60px)',
      position: 'fixed',
      left: 0,
      top: '60px',
      overflowY: 'auto',
      overflowX: 'hidden',
      transition: 'width 0.25s ease',
      zIndex: 100,
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'rgba(255,255,255,0.5)', padding: '12px',
          display: 'flex', justifyContent: collapsed ? 'center' : 'flex-end',
          fontSize: 16, transition: 'color 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.color = 'white'}
        onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
      >
        {collapsed ? '→' : '←'}
      </button>

      <div style={{ padding: collapsed ? '0 8px' : '0 16px', flex: 1 }}>
        {/* User Avatar */}
        {!collapsed && (
          <div style={{
            background: 'rgba(255,255,255,0.06)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px',
            marginBottom: '20px',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--green-600), var(--green-400))',
                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, fontWeight: 700, flexShrink: 0,
                boxShadow: '0 2px 8px rgba(13,92,58,0.4)',
              }}>
                {initials}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ color: 'white', fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.firstName} {user?.lastName}
                </div>
                <div style={{ color: 'var(--green-400)', fontSize: 12, marginTop: 2 }}>
                  Trust: {trustScore}/100
                </div>
                {/* Trust score bar */}
                <div style={{ marginTop: 6, height: 3, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ width: `${trustScore}%`, height: '100%', background: 'var(--green-400)', borderRadius: 2, transition: 'width 0.5s' }} />
                </div>
              </div>
            </div>
          </div>
        )}

        {collapsed && (
          <div style={{
            width: 40, height: 40, borderRadius: '50%', margin: '0 auto 16px',
            background: 'linear-gradient(135deg, var(--green-600), var(--green-400))',
            color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 700,
          }}>
            {initials}
          </div>
        )}

        {/* Nav Items */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              title={collapsed ? item.label : undefined}
              style={{
                display: 'flex', alignItems: 'center',
                gap: collapsed ? 0 : 12,
                justifyContent: collapsed ? 'center' : 'flex-start',
                padding: collapsed ? '10px' : '10px 14px',
                color: isActive(item.path) ? 'white' : 'rgba(255,255,255,0.6)',
                textDecoration: 'none',
                borderRadius: 'var(--radius-md)',
                backgroundColor: isActive(item.path) ? 'rgba(255,255,255,0.12)' : 'transparent',
                borderLeft: isActive(item.path) ? '2px solid var(--green-400)' : '2px solid transparent',
                transition: 'all 0.2s',
                fontSize: 14,
                fontWeight: isActive(item.path) ? 600 : 400,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
              }}
              onMouseEnter={e => { if (!isActive(item.path)) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)'; }}
              onMouseLeave={e => { if (!isActive(item.path)) e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
              {!collapsed && item.label}
            </Link>
          ))}
        </nav>

        {/* Quick Stats */}
        {!collapsed && (
          <div style={{
            marginTop: 24, padding: '14px',
            background: 'rgba(255,255,255,0.04)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
              Quick Stats
            </div>
            {[
              { label: 'Active Groups', val: '3', color: 'var(--green-400)' },
              { label: 'Pending', val: '2', color: '#FBBF24' },
              { label: 'Messages', val: '5', color: '#60A5FA' },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12 }}>{s.label}</span>
                <span style={{ color: s.color, fontSize: 13, fontWeight: 700 }}>{s.val}</span>
              </div>
            ))}
          </div>
        )}

        {/* Help */}
        {!collapsed && (
          <div style={{
            marginTop: 16, padding: '14px',
            background: 'rgba(26,122,78,0.15)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(77,200,138,0.2)',
          }}>
            <div style={{ color: 'var(--green-400)', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Need Help?</div>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, lineHeight: 1.5, marginBottom: 10 }}>
              Check our docs or contact support
            </p>
            <Link to="/help" style={{
              display: 'inline-block', padding: '5px 12px',
              background: 'var(--green-700)', color: 'white',
              textDecoration: 'none', borderRadius: 'var(--radius-sm)',
              fontSize: 12, fontWeight: 600,
            }}>
              View Docs
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
