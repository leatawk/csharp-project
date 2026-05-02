import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import PrivateRoute from './components/auth/PrivateRoute';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import HomePage from './pages/HomePage';
import Dashboard from './components/dashboard/Dashboard';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';
import GroupsPage from './pages/GroupsPage';
import ContributionsPage from './pages/ContributionsPage';
import GroupList from './components/groups/GroupList';
import GroupDetails from './components/groups/GroupDetails';
import CreateGroup from './components/groups/CreateGroup';
import JoinGroup from './components/groups/JoinGroup';
import ContributionList from './components/contributions/ContributionList';
import PayContribution from './components/contributions/PayContribution';
import PayoutsPage from './pages/PayoutsPage';
import Messages from './components/messages/Messages'
import Disputes from './components/disputes/Disputes'
import AdminPanel from './components/admin/AdminPanel'
import './App.css';

const SIDEBAR_WIDTH = 240;

const AppShell = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const offset = isMobile ? 0 : (sidebarCollapsed ? 64 : SIDEBAR_WIDTH);

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={{
        marginLeft: offset,
        width: `calc(100% - ${offset}px)`,
        minHeight: 'calc(100vh - 60px)',
        transition: 'margin-left 0.25s ease, width 0.25s ease',
      }}>
        {children}
      </div>
    </div>
  );
};

const ProtectedPage = ({ children }) => (
  <PrivateRoute><AppShell>{children}</AppShell></PrivateRoute>
);

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<ProtectedPage><Dashboard /></ProtectedPage>} />
          <Route path="/groups" element={<ProtectedPage><GroupsPage /></ProtectedPage>} />
          <Route path="/groups/create" element={<ProtectedPage><CreateGroup /></ProtectedPage>} />
          <Route path="/groups/join" element={<ProtectedPage><JoinGroup /></ProtectedPage>} />
          <Route path="/groups/:id" element={<ProtectedPage><GroupDetails /></ProtectedPage>} />
          <Route path="/contributions" element={<ProtectedPage><ContributionsPage /></ProtectedPage>} />
          <Route path="/contributions/pay/:id" element={<ProtectedPage><PayContribution /></ProtectedPage>} />
          <Route path="/payouts" element={<ProtectedPage><PayoutsPage /></ProtectedPage>} />
          <Route path="/profile" element={<ProtectedPage><ProfilePage /></ProtectedPage>} />
          <Route path="/404" element={<NotFoundPage />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/disputes" element={<Disputes />} />
          <Route path="/admin" element={<AdminPanel />} />
        </Routes>
      </div>
    </AuthProvider>
  );
}

export default App;
