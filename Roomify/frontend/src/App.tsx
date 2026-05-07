import React from 'react';  
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { GuestDirectory } from './pages/GuestDirectory';
import { Bookings } from './pages/Bookings';
import { Login } from './pages/Login';
import { ManageStaff } from './pages/ManageStaff';
import { ReceptionistPortal } from './pages/ReceptionistPortal';
import { RestaurantPOS } from './pages/RestaurantPOS';
import { AdminRooms } from './pages/AdminRooms';
import { ManagePromos } from './pages/ManagePromos';
import { ManageDining } from './pages/ManageDining';
import { ProtectedRoute } from './components/ProtectedRoute';
import { UserAuth } from './pages/UserAuth';
import { UserPortal } from './pages/UserPortal';
import { UserProtectedRoute } from './components/UserProtectedRoute';
import { LuxuryHome } from './pages/LuxuryHome';

// --- THE FRONT DOOR BOUNCER ---
// Ensures the user is logged in before loading the layout shell
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  return token ? <>{children}</> : <Navigate to="/login" replace />;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* PUBLIC ROUTES (No login required) */}
        <Route path="/login" element={<Login />} />
        <Route path="/user/login" element={<UserAuth />} />
        <Route path="/user/register" element={<UserAuth />} />

        {/* GUEST WORKSPACE */}
        <Route path="/user" element={
          <UserProtectedRoute>
            <UserPortal />
          </UserProtectedRoute>
        } />

        {/* PUBLIC HOTEL WEBSITE */}
        <Route path="/" element={<LuxuryHome />} />

        {/* PROTECTED WORKSPACE (Must be logged in to see these) */}
        <Route path="/dashboard" element={
          <PrivateRoute>
            <AppLayout />
          </PrivateRoute>
        }>
          
          {/* --- ADMIN & RECEPTIONIST ONLY --- */}
          <Route index element={
            <ProtectedRoute allowedRoles={['Admin', 'Receptionist']}>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="guest" element={
            <ProtectedRoute allowedRoles={['Admin', 'Receptionist']}>
              <GuestDirectory />
            </ProtectedRoute>
          } />
          
          <Route path="bookings" element={
            <ProtectedRoute allowedRoles={['Admin', 'Receptionist']}>
              <Bookings />
            </ProtectedRoute>
          } />
          
          <Route path="new-booking" element={
            <ProtectedRoute allowedRoles={['Admin', 'Receptionist']}>
              <ReceptionistPortal />
            </ProtectedRoute>
          } />

          {/* --- STRICTLY ADMIN ONLY --- */}
          <Route path="staff" element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <ManageStaff />
            </ProtectedRoute>
          } />
          
          <Route path="rooms" element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <AdminRooms />
            </ProtectedRoute>
          } />

          <Route path="promos" element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <ManagePromos />
            </ProtectedRoute>
          } />

          <Route path="dining" element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <ManageDining />
            </ProtectedRoute>
          } />

          {/* --- EVERYONE ALLOWED (Admin, Receptionist, Waiter) --- */}
          <Route path="pos" element={
            <ProtectedRoute allowedRoles={['Admin', 'Receptionist', 'Waiter']}>
              <RestaurantPOS />
            </ProtectedRoute>
          } />
          
          {/* If they type a weird URL inside the dashboard, send them back to the main dash */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
