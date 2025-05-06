
import React, { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { Member } from '@/lib/models';
import * as storage from '@/lib/storage';
import { generateId } from '@/lib/scheduleUtils';
import MemberForm from '@/components/members/MemberForm';

const Members: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      const loadedMembers = await storage.getMembers();
      setMembers(loadedMembers);
    } catch (error) {
      console.error('Error loading members:', error);
      toast({
        title: "Erro ao carregar membros",
        description: "Não foi possível carregar a lista de membros.",
        variant: "destructive",
      });
    }
  };

  const handleAddMember = () => {
    setEditingMember(null);
    setIsFormOpen(true);
  };

  const handleEditMember = (member: Member) => {
    setEditingMember(member);
    setIsFormOpen(true);
  };

  const handleDeleteMember = async (memberId: string) => {
    try {
      await storage.deleteMember(memberId);
      toast({
        title: "Membro excluído",
        description: "O membro foi excluído com sucesso.",
      });
      loadMembers();
    } catch (error) {
      console.error('Error deleting member:', error);
      toast({
        title: "Erro ao excluir membro",
        description: "Não foi possível excluir o membro.",
        variant: "destructive",
      });
    }
  };

  const handleSaveMember = async (memberData: Partial<Member>) => {
    try {
      const now = Date.now();
      let member: Member;
      
      if (editingMember) {
        member = {
          ...editingMember,
          ...memberData,
          updatedAt: now,
          syncStatus: 'pending'
        } as Member;
      } else {
        member = {
          id: generateId(),
          name: memberData.name || '',
          email: memberData.email,
          phone: memberData.phone,
          positions: memberData.positions || [],
          notes: memberData.notes,
          createdAt: now,
          updatedAt: now,
          syncStatus: 'pending'
        };
      }
      
      await storage.saveMember(member);
      setIsFormOpen(false);
      toast({
        title: editingMember ? "Membro atualizado" : "Membro adicionado",
        description: editingMember 
          ? "As informações do membro foram atualizadas com sucesso." 
          : "Novo membro adicionado com sucesso.",
      });
      loadMembers();
    } catch (error) {
      console.error('Error saving member:', error);
      toast({
        title: "Erro ao salvar membro",
        description: "Não foi possível salvar as informações do membro.",
        variant: "destructive",
      });
    }
  };

  const filteredMembers = members.filter(member => 
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (member.email && member.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (member.phone && member.phone.includes(searchQuery))
  );

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-primary-deep">Membros</h1>
        <Button 
          onClick={handleAddMember} 
          className="bg-primary hover:bg-primary-medium"
        >
          <Plus className="h-4 w-4 mr-2" /> Adicionar
        </Button>
      </div>

      <div className="mb-6 relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar membros..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {filteredMembers.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Nenhum membro encontrado.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMembers.map((member) => (
            <Card key={member.id}>
              <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg font-semibold">{member.name}</CardTitle>
                  <div className="flex space-x-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleEditMember(member)}
                    >
                      <Edit className="h-4 w-4 text-primary" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDeleteMember(member.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                {member.email && <p className="text-sm text-muted-foreground">{member.email}</p>}
                {member.phone && <p className="text-sm text-muted-foreground">{member.phone}</p>}
                {member.positions && member.positions.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground">Funções:</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {member.positions.map((position) => (
                        <span 
                          key={position.id} 
                          className="text-xs bg-secondary px-2 py-0.5 rounded-full"
                        >
                          {position.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {isFormOpen && (
        <MemberForm
          member={editingMember}
          onSave={handleSaveMember}
          onCancel={() => setIsFormOpen(false)}
        />
      )}
    </div>
  );
};

export default Members;
