
import React from 'react';
import { NavLink } from 'react-router-dom';
import { Users, Calendar, Layers, Settings } from 'lucide-react';

export const BottomNavigation: React.FC = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border shadow-lg">
      <div className="flex items-center justify-around h-16">
        <NavItem to="/members" icon={<Users className="h-5 w-5" />} label="Membros" />
        <NavItem to="/departments" icon={<Layers className="h-5 w-5" />} label="Departamentos" />
        <NavItem to="/schedules" icon={<Calendar className="h-5 w-5" />} label="Escalas" />
        <NavItem to="/settings" icon={<Settings className="h-5 w-5" />} label="Configurações" />
      </div>
    </nav>
  );
};

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label }) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex flex-col items-center justify-center w-full h-full ${
          isActive ? 'text-primary-deep' : 'text-muted-foreground'
        }`
      }
    >
      {icon}
      <span className="text-xs mt-1">{label}</span>
    </NavLink>
  );
};
