
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Members from "./pages/Members";
import Departments from "./pages/Departments";
import Schedules from "./pages/Schedules";
import Settings from "./pages/Settings";
import UserSettings from "./pages/UserSettings";
import AppLayout from "./components/layout/AppLayout";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import React, { useEffect } from "react";
import { processSchedulesForNotifications, initializeNotifications } from "./services/NotificationService";

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
                
                <Route element={<AppLayout />}>
                  <Route path="/members" element={
                    <ProtectedRoute requiredPermission="view_all">
                      <Members />
                    </ProtectedRoute>
                  } />
                  <Route path="/departments" element={
                    <ProtectedRoute requiredPermission="view_all">
                      <Departments />
                    </ProtectedRoute>
                  } />
                  <Route path="/schedules" element={
                    <ProtectedRoute requiredPermission="view_own_schedules">
                      <Schedules />
                    </ProtectedRoute>
                  } />
                  <Route path="/settings" element={
                    <ProtectedRoute requiredPermission="manage_all">
                      <Settings />
                    </ProtectedRoute>
                  } />
                  <Route path="/profile" element={
                    <ProtectedRoute requiredPermission="view_personal_settings">
                      <UserSettings />
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
