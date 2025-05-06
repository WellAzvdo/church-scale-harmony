
import React, { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { syncAll, isOnline } from '@/lib/sync';
import * as storage from '@/lib/storage';

const Settings: React.FC = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnlineStatus, setIsOnlineStatus] = useState<boolean | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const online = await isOnline();
      setIsOnlineStatus(online);
      
      if (!online) {
        toast({
          title: "Sem conexão",
          description: "Você está offline. A sincronização não é possível.",
          variant: "destructive",
        });
        return;
      }
      
      await syncAll();
      toast({
        title: "Sincronização concluída",
        description: "Todos os dados foram sincronizados com sucesso.",
      });
    } catch (error) {
      console.error('Error syncing data:', error);
      toast({
        title: "Erro na sincronização",
        description: "Ocorreu um problema durante a sincronização.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCheckConnection = async () => {
    try {
      const online = await isOnline();
      setIsOnlineStatus(online);
      toast({
        title: online ? "Online" : "Offline",
        description: online 
          ? "Você está conectado à internet." 
          : "Você está offline."
      });
    } catch (error) {
      console.error('Error checking connection:', error);
    }
  };

  const handleClearData = async () => {
    setIsDeleting(true);
    try {
      await storage.clearAllData();
      toast({
        title: "Dados limpos",
        description: "Todos os dados foram removidos com sucesso.",
      });
    } catch (error) {
      console.error('Error clearing data:', error);
      toast({
        title: "Erro ao limpar dados",
        description: "Ocorreu um problema ao limpar os dados.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-4 pb-20">
      <h1 className="text-2xl font-bold text-primary-deep mb-6">Configurações</h1>
      
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Sincronização</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Status da Conexão</p>
                <p className="text-sm text-muted-foreground">Verifique sua conexão com a internet</p>
              </div>
              <Button 
                variant="outline" 
                onClick={handleCheckConnection}
              >
                Verificar
              </Button>
            </div>
            
            {isOnlineStatus !== null && (
              <div className={`p-2 rounded ${isOnlineStatus ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                <p>{isOnlineStatus ? '✓ Online' : '× Offline'}</p>
              </div>
            )}
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Sincronizar Dados</p>
                <p className="text-sm text-muted-foreground">Sincronize todos os dados com o servidor</p>
              </div>
              <Button 
                onClick={handleSync}
                disabled={isSyncing}
                className="bg-primary hover:bg-primary-medium"
              >
                {isSyncing ? "Sincronizando..." : "Sincronizar"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configurações Gerais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="notifications" className="font-medium">
                  Notificações
                </Label>
                <p className="text-sm text-muted-foreground">Receba alertas sobre escalas</p>
              </div>
              <Switch id="notifications" defaultChecked={true} />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="darkMode" className="font-medium">
                  Tema Escuro
                </Label>
                <p className="text-sm text-muted-foreground">Mudar para tema escuro</p>
              </div>
              <Switch id="darkMode" defaultChecked={false} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Zona de Perigo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Cuidado! As ações abaixo podem resultar em perda permanente de dados.
              </p>
              
              <Button 
                variant="destructive" 
                onClick={handleClearData}
                disabled={isDeleting}
                className="w-full"
              >
                {isDeleting ? "Limpando dados..." : "Limpar Todos os Dados"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
