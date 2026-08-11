import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Navbar from './components/Navbar';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import CustomerDashboard from './pages/customer/CustomerDashboard';
import ClaimForm from './pages/customer/ClaimForm';
import MyClaims from './pages/customer/MyClaims';
import ClaimTracking from './pages/customer/ClaimTracking';
import Profile from './pages/customer/Profile';
import AdminDashboard from './pages/admin/AdminDashboard';
import ClaimsList from './pages/admin/ClaimsList';
import ClaimDetails from './pages/admin/ClaimDetails';

function ProtectedRoute({ children, role }: { children: React.ReactNode; role?: 'customer' | 'admin' }) {
  const { user } = useApp();
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to={user.role === 'admin' ? '/admin' : '/customer'} replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Customer routes */}
        <Route path="/customer" element={<ProtectedRoute role="customer"><CustomerDashboard /></ProtectedRoute>} />
        <Route path="/customer/claim-form" element={<ProtectedRoute role="customer"><ClaimForm /></ProtectedRoute>} />
        <Route path="/customer/my-claims" element={<ProtectedRoute role="customer"><MyClaims /></ProtectedRoute>} />
        <Route path="/customer/claim-tracking/:id" element={<ProtectedRoute role="customer"><ClaimTracking /></ProtectedRoute>} />
        <Route path="/customer/profile" element={<ProtectedRoute role="customer"><Profile /></ProtectedRoute>} />
        <Route path="/customer/policies" element={<ProtectedRoute role="customer"><Profile /></ProtectedRoute>} />

        {/* Admin routes */}
        <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/claims" element={<ProtectedRoute role="admin"><ClaimsList /></ProtectedRoute>} />
        <Route path="/admin/claims/:id" element={<ProtectedRoute role="admin"><ClaimDetails /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProvider>
  );
}
