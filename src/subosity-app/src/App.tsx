import React, { useState, useEffect } from 'react';
import { ToastProvider } from './ToastContext';
import { ThemeProvider } from './ThemeContext';
import { AuthProvider } from './AuthContext';
import { AlertsProvider } from './AlertsContext';
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navigation from './components/Navigation'
import Footer from './components/Footer'
import Dashboard from './pages/Dashboard'
import MySubscriptions from './pages/MySubscriptions'
import About from './pages/About'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import Login from './pages/auth/Login'
import Signup from './pages/auth/Signup'
import ForgotPassword from './pages/auth/ForgotPassword'
import ChangePassword from './pages/auth/ChangePassword'
import Profile from './pages/auth/Profile'
import Preferences from './pages/auth/Preferences'
import SubscriptionDetail from './pages/SubscriptionDetail'
import { supabase } from './supabaseClient';
import Home from './pages/Home';
import Pricing from './pages/Pricing';
import ProtectedRoute from './components/ProtectedRoute';
import CalendarPage from './pages/CalendarPage';

const AppContent: React.FC = () => {

    return (
        <div className="d-flex flex-column min-vh-100">
            <Navigation
            />
            <main className="flex-grow-1">
                <Routes>
                    <Route path="/" element={<Dashboard />} />
                    {/* <Route path="/about" element={<About />} /> */}
                    <Route path="/privacy" element={<Privacy />} />
                    <Route path="/terms" element={<Terms />} />
                    {/* <Route path="/pricing" element={<Pricing />} /> */}

                    {/* Protected Routes */}
                    <Route path="/dashboard" element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    } />
                    <Route path="/mysubscriptions" element={
                        <ProtectedRoute>
                            <MySubscriptions />
                        </ProtectedRoute>
                    } />
                    <Route path="/subscription/:id" element={
                        <ProtectedRoute>
                            <SubscriptionDetail />
                        </ProtectedRoute>
                    } />
                    <Route path="/calendar" element={
                        <ProtectedRoute>
                            <CalendarPage />
                        </ProtectedRoute>
                    } />
                    <Route path="/profile" element={
                        <ProtectedRoute>
                            <Profile />
                        </ProtectedRoute>
                    } />
                    <Route path="/preferences" element={
                        <ProtectedRoute>
                            <Preferences />
                        </ProtectedRoute>
                    } />

                    {/* Auth Routes */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/change-password" element={<ChangePassword />} />
                </Routes>
            </main>
            <Footer />
        </div>
    );
};

const App: React.FC = () => {
    return (
        <BrowserRouter>
            <ToastProvider>
                <AuthProvider>
                    <ThemeProvider>
                        <AlertsProvider>
                            <AppContent />
                        </AlertsProvider>
                    </ThemeProvider>
                </AuthProvider>
            </ToastProvider>
        </BrowserRouter>
    );
};

export default App;