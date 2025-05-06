
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Member, Position } from '@/lib/models';
import * as storage from '@/lib/storage';

interface MemberFormProps {
  member: Member | null;
  onSave: (memberData: Partial<Member>) => void;
  onCancel: () => void;
}

const MemberForm: React.FC<MemberFormProps> = ({ member, onSave, onCancel }) => {
  const [name, setName] = useState(member?.name || '');
  const [email, setEmail] = useState(member?.email || '');
  const [phone, setPhone] = useState(member?.phone || '');
  const [notes, setNotes] = useState(member?.notes || '');
  const [positions, setPositions] = useState<Position[]>([]);
  const [selectedPositions, setSelectedPositions] = useState<Position[]>(member?.positions || []);
  
  useEffect(() => {
    const loadPositions = async () => {
      try {
        const allPositions = await storage.getPositions();
        setPositions(allPositions);
      } catch (error) {
        console.error('Error loading positions:', error);
      }
    };
    
    loadPositions();
  }, []);
  
  const handleSave = () => {
    onSave({
      name,
      email,
      phone,
      notes,
      positions: selectedPositions
    });
  };
  
  const handleTogglePosition = (position: Position) => {
    setSelectedPositions(prev => {
      const isSelected = prev.some(p => p.id === position.id);
      
      if (isSelected) {
        return prev.filter(p => p.id !== position.id);
      } else {
        return [...prev, position];
      }
    });
  };
  
  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {member ? 'Editar Membro' : 'Adicionar Membro'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome completo"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@exemplo.com"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(00) 00000-0000"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="positions">Funções</Label>
            <div className="border rounded-md p-3 space-y-2 max-h-40 overflow-y-auto">
              {positions.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhuma função disponível. Adicione funções primeiro.
                </p>
              ) : (
                positions.map(position => (
                  <div key={position.id} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`position-${position.id}`}
                      checked={selectedPositions.some(p => p.id === position.id)}
                      onChange={() => handleTogglePosition(position)}
                      className="mr-2"
                    />
                    <label 
                      htmlFor={`position-${position.id}`}
                      className="text-sm cursor-pointer"
                    >
                      {position.name}
                    </label>
                  </div>
                ))
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Informações adicionais..."
              rows={3}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!name.trim()}
            className="bg-primary hover:bg-primary-medium"
          >
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MemberForm;
