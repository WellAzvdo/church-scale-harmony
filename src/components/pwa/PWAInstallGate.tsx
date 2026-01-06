import React from 'react';
import { usePWA } from '@/hooks/usePWA';
import AndroidInstallScreen from './AndroidInstallScreen';
import IOSInstallScreen from './IOSInstallScreen';

interface PWAInstallGateProps {
  children: React.ReactNode;
}

const PWAInstallGate: React.FC<PWAInstallGateProps> = ({ children }) => {
  const { isStandalone, isMobile, isIOS, isAndroid, canInstall, promptInstall } = usePWA();

  // Desktop users: no blocking
  if (!isMobile) {
    return <>{children}</>;
  }

  // Already running as installed PWA
  if (isStandalone) {
    return <>{children}</>;
  }

  // iOS: Show instruction screen
  if (isIOS) {
    return <IOSInstallScreen />;
  }

  // Android: Show install prompt screen
  if (isAndroid) {
    return <AndroidInstallScreen onInstall={promptInstall} canInstall={canInstall} />;
  }

  // Other mobile devices: Allow access
  return <>{children}</>;
};

export default PWAInstallGate;
