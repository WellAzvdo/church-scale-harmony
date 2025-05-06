
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext';
import { Member } from '@/lib/models';
import * as storage from '@/lib/storage';

const UserSettings: React.FC = () => {
  const { user, logout } = useAuth();
  const [member, setMember] = useState<Member | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const loadMemberData = async () => {
      if (user?.memberId) {
        try {
          const members = await storage.getMembers();
          const foundMember = members.find(m => m.id === user.memberId);
          
          if (foundMember) {
            setMember(foundMember);
            setName(foundMember.name || '');
            setEmail(foundMember.email || '');
            setPhone(foundMember.phone || '');
          }
        } catch (error) {
          console.error('Error loading member data:', error);
          toast({
            title: "Erro ao carregar dados",
            description: "Não foi possível carregar seus dados.",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };
    
    loadMemberData();
  }, [user]);

  const handleSaveProfile = async () => {
    if (!member) return;
    
    try {
      setIsLoading(true);
      
      const updatedMember: Member = {
        ...member,
        name,
        email,
        phone,
        updatedAt: Date.now(),
        syncStatus: 'pending'
      };
      
      await storage.saveMember(updatedMember);
      setMember(updatedMember);
      
      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram atualizadas com sucesso.",
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar suas informações.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 pb-20">
      <h1 className="text-2xl font-bold text-primary-deep mb-6">Configurações do Usuário</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Seu Perfil</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="text-sm font-medium text-gray-700 block mb-1">
                Nome
              </label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
                disabled={isLoading}
              />
            </div>
            
            <div>
              <label htmlFor="email" className="text-sm font-medium text-gray-700 block mb-1">
                E-mail
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu-email@exemplo.com"
                disabled={isLoading}
              />
            </div>
            
            <div>
              <label htmlFor="phone" className="text-sm font-medium text-gray-700 block mb-1">
                Telefone
              </label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(00) 00000-0000"
                disabled={isLoading}
              />
            </div>
            
            <Button 
              onClick={handleSaveProfile} 
              className="w-full bg-primary hover:bg-primary-medium"
              disabled={isLoading}
            >
              {isLoading ? 'Salvando...' : 'Salvar Perfil'}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-center">
        <Button 
          onClick={logout} 
          variant="outline"
          className="border-destructive text-destructive hover:bg-destructive hover:text-white"
          disabled={isLoading}
        >
          Sair da Conta
        </Button>
      </div>
    </div>
  );
};

export default UserSettings;
