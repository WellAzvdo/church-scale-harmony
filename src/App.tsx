
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import React, { useEffect } from "react";
import { processSchedulesForNotifications, initializeNotifications } from "./services/NotificationService";

// Pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ResetPassword from "./pages/ResetPassword";
import Members from "./pages/Members";
import Departments from "./pages/Departments";
import Schedules from "./pages/Schedules";
import Settings from "./pages/Settings";
import UserSettings from "./pages/UserSettings";
import UserApproval from "./pages/UserApproval";
import UserManagement from "./pages/UserManagement";
import AccessDenied from "./pages/AccessDenied";
import NotFound from "./pages/NotFound";

// Components
import AppLayout from "./components/layout/AppLayout";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { Permission } from "./contexts/AuthContext";

const queryClient = new QueryClient();

const App = () => {
  // Initialize notifications when the app starts
  useEffect(() => {
    const setupNotifications = async () => {
      const initialized = await initializeNotifications();
      if (initialized) {
        await processSchedulesForNotifications();
      }
    };
    
    setupNotifications();
  }, []);

  return (
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/acesso-negado" element={<AccessDenied />} />
                
                <Route path="/" element={<AppLayout />}>
                  <Route path="/members" element={
                    <ProtectedRoute requiredPermission={Permission.VIEW_ALL}>
                      <Members />
                    </ProtectedRoute>
                  } />
                  <Route path="/departments" element={
                    <ProtectedRoute requiredPermission={Permission.VIEW_ALL}>
                      <Departments />
                    </ProtectedRoute>
                  } />
                  <Route path="/schedules" element={
                    <ProtectedRoute requiredPermission={Permission.VIEW_OWN_SCHEDULES}>
                      <Schedules />
                    </ProtectedRoute>
                  } />
                  <Route path="/settings" element={
                    <ProtectedRoute requiredPermission={Permission.MANAGE_ALL}>
                      <Settings />
                    </ProtectedRoute>
                  } />
                  <Route path="/profile" element={
                    <ProtectedRoute requiredPermission={Permission.VIEW_PERSONAL_SETTINGS}>
                      <UserSettings />
                    </ProtectedRoute>
                  } />
                  <Route path="/user-approval" element={
                    <ProtectedRoute requiredPermission={Permission.APPROVE_USERS}>
                      <UserApproval />
                    </ProtectedRoute>
                  } />
                  <Route path="/user-management" element={
                    <ProtectedRoute requiredPermission={Permission.MANAGE_USER_ROLES}>
                      <UserManagement />
                    </ProtectedRoute>
                  } />
                </Route>
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </TooltipProvider>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </React.StrictMode>
  );
};

export default App;
