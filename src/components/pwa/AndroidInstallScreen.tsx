import React from 'react';
import { Download, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AndroidInstallScreenProps {
  onInstall: () => void;
  canInstall: boolean;
}

const AndroidInstallScreen: React.FC<AndroidInstallScreenProps> = ({ onInstall, canInstall }) => {
  return (
    <div className="fixed inset-0 z-[9999] bg-background flex flex-col items-center justify-center p-6">
      <div className="flex flex-col items-center text-center max-w-sm">
        {/* App Icon */}
        <div className="w-24 h-24 bg-primary rounded-2xl flex items-center justify-center mb-6 shadow-lg">
          <Smartphone className="w-12 h-12 text-primary-foreground" />
        </div>

        {/* App Name */}
        <h1 className="text-2xl font-bold text-foreground mb-2">Igreja App</h1>
        <p className="text-muted-foreground mb-8">Gerenciamento de Escalas</p>

        {/* Instructions */}
        <div className="bg-muted/50 rounded-lg p-4 mb-8 w-full">
          <h2 className="font-semibold text-foreground mb-3">Instale o aplicativo</h2>
          <p className="text-sm text-muted-foreground">
            Para uma experiência completa, instale o aplicativo no seu dispositivo. 
            É rápido e não ocupa muito espaço.
          </p>
        </div>

        {/* Install Button */}
        <Button 
          onClick={onInstall}
          disabled={!canInstall}
          className="w-full py-6 text-lg gap-2"
          size="lg"
        >
          <Download className="w-5 h-5" />
          Instalar Aplicativo
        </Button>

        {!canInstall && (
          <p className="text-xs text-muted-foreground mt-4 text-center">
            Aguarde, preparando instalação...
          </p>
        )}
      </div>
    </div>
  );
};

export default AndroidInstallScreen;
