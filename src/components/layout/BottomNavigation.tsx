
import React from 'react';
import { NavLink } from 'react-router-dom';
import { Users, Calendar, Layers, Settings, User, UserCheck, Shield } from 'lucide-react';
import { useAuth, Permission } from '@/contexts/AuthContext';

const BottomNavigation: React.FC = () => {
  const { checkPermission } = useAuth();
  
  // Check different permissions for navigation items
  const canViewAllMembers = checkPermission(Permission.VIEW_ALL);
  const canViewAllDepartments = checkPermission(Permission.VIEW_ALL);
  const canManageAll = checkPermission(Permission.MANAGE_ALL);
  const canApproveUsers = checkPermission(Permission.APPROVE_USERS);
  const canManageUserRoles = checkPermission(Permission.MANAGE_USER_ROLES);

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border shadow-lg">
      <div className="flex items-center justify-around h-16">
        {/* Only show Members navigation if user has permission */}
        {canViewAllMembers && (
          <NavItem to="/members" icon={<Users className="h-5 w-5" />} label="Membros" />
        )}
        
        {/* Only show Departments navigation if user has permission */}
        {canViewAllDepartments && (
          <NavItem to="/departments" icon={<Layers className="h-5 w-5" />} label="Departamentos" />
        )}
        
        {/* Everyone can see their schedules */}
        <NavItem to="/schedules" icon={<Calendar className="h-5 w-5" />} label="Escalas" />
        
        {/* Show user approval link if user has permission */}
        {canApproveUsers && (
          <NavItem to="/user-approval" icon={<UserCheck className="h-5 w-5" />} label="Aprovações" />
        )}
        
        {/* Show user management link if user has permission */}
        {canManageUserRoles && (
          <NavItem to="/user-management" icon={<Shield className="h-5 w-5" />} label="Usuários" />
        )}
        
        {/* Show admin settings or user profile based on permissions */}
        {canManageAll ? (
          <NavItem to="/settings" icon={<Settings className="h-5 w-5" />} label="Configurações" />
        ) : (
          <NavItem to="/profile" icon={<User className="h-5 w-5" />} label="Perfil" />
        )}
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

export default BottomNavigation;
