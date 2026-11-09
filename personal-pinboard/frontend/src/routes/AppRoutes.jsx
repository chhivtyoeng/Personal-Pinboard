import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';

// Public Landing Page
import LandingPage from '../pages/LandingPage';

// Auth Pages
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import ForgotPassword from '../pages/auth/ForgotPassword';
import ResetPassword from '../pages/auth/ResetPassword';

// Legal Pages
import TermsPage from '../pages/legal/TermsPage';
import PrivacyPage from '../pages/legal/PrivacyPage';

// User Pages
import Dashboard from '../pages/user/Dashboard';
import Pins from '../pages/user/Pins';
import CreatePin from '../pages/user/CreatePin';
import EditPin from '../pages/user/EditPin';
import PinDetails from '../pages/user/PinDetails';
import Favorites from '../pages/user/Favorites';
import Categories from '../pages/user/Categories';
import Boards from '../pages/user/Boards';
import Profile from '../pages/user/Profile';
import Settings from '../pages/user/Settings';

// Admin Pages
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminUsers from '../pages/admin/Users';
import ManagePins from '../pages/admin/ManagePins';
import Reports from '../pages/admin/Reports';
import ManageCategories from '../pages/admin/ManageCategories';
import AdminSettings from '../pages/admin/AdminSettings';

// Route Guards
import ProtectedRoute from './ProtectedRoute';
import AdminRoute from './AdminRoute';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Landing Page */}
      <Route path="/" element={<LandingPage />} />

      {/* Public Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Public Legal Routes */}
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />

      {/* Main Application with App Layout - Requires Login */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/pins" element={<Pins />} />
        <Route path="/pins/create" element={<CreatePin />} />
        <Route path="/pins/:id" element={<PinDetails />} />
        <Route path="/pins/edit/:id" element={<EditPin />} />
        <Route path="/pins/:id/edit" element={<EditPin />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/boards" element={<Boards />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/:id" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />

        {/* Protected Admin Routes */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <AdminRoute>
              <AdminUsers />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/pins"
          element={
            <AdminRoute>
              <ManagePins />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <AdminRoute>
              <Reports />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/categories"
          element={
            <AdminRoute>
              <ManageCategories />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/tags"
          element={
            <AdminRoute>
              <ManageCategories defaultTab="tags" />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <AdminRoute>
              <AdminSettings />
            </AdminRoute>
          }
        />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/pins" replace />} />
    </Routes>
  );
}
