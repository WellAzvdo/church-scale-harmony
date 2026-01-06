import React from 'react';
import { Share, Plus, Smartphone } from 'lucide-react';

const IOSInstallScreen: React.FC = () => {
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
        <div className="bg-muted/50 rounded-lg p-4 mb-6 w-full">
          <h2 className="font-semibold text-foreground mb-4">
            Instale o aplicativo no seu iPhone
          </h2>
          
          <div className="space-y-4 text-left">
            {/* Step 1 */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-primary font-bold text-sm">1</span>
              </div>
              <div className="flex-1">
                <p className="text-sm text-foreground">
                  Toque no ícone de <strong>Compartilhar</strong>
                </p>
                <div className="mt-2 flex items-center justify-center bg-muted rounded-lg p-3">
                  <Share className="w-6 h-6 text-primary" />
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-primary font-bold text-sm">2</span>
              </div>
              <div className="flex-1">
                <p className="text-sm text-foreground">
                  Role para baixo e toque em <strong>"Adicionar à Tela de Início"</strong>
                </p>
                <div className="mt-2 flex items-center gap-2 bg-muted rounded-lg p-3">
                  <div className="w-6 h-6 border-2 border-muted-foreground rounded flex items-center justify-center">
                    <Plus className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <span className="text-sm text-muted-foreground">Adicionar à Tela de Início</span>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-primary font-bold text-sm">3</span>
              </div>
              <div className="flex-1">
                <p className="text-sm text-foreground">
                  Toque em <strong>"Adicionar"</strong> no canto superior direito
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Safari Indicator */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          <span>Use o Safari para melhor experiência</span>
        </div>
      </div>
    </div>
  );
};

export default IOSInstallScreen;
