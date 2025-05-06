
import React from 'react';
import { Outlet } from 'react-router-dom';
import BottomNavigation from './BottomNavigation';

const AppLayout: React.FC = () => {
  return (
    <div className="app-container bg-background min-h-screen">
      <main className="flex-1 overflow-auto pb-16">
        <Outlet />
      </main>
      <BottomNavigation />
    </div>
  );
};

export default AppLayout;
