import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Department, Position, Profile } from '@/lib/database.types';
import * as db from '@/services/supabaseService';
import { Trash2, Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface DepartmentFormProps {
  department: Department | null;
  onSave: (departmentData: Partial<Department>) => void;
  onCancel: () => void;
}

const DepartmentForm: React.FC<DepartmentFormProps> = ({ department, onSave, onCancel }) => {
  const [name, setName] = useState(department?.name || '');
  const [description, setDescription] = useState(department?.description || '');
  const [color, setColor] = useState(department?.color || '#3a7ca5');
  const [leaderId, setLeaderId] = useState<string | null>(department?.leader_id || null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [newPositionName, setNewPositionName] = useState('');
  const [isLoadingPositions, setIsLoadingPositions] = useState(false);
  const [isSavingPosition, setIsSavingPosition] = useState(false);
  const [availableLeaders, setAvailableLeaders] = useState<Profile[]>([]);
  const [isLoadingLeaders, setIsLoadingLeaders] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadLeaders();
    if (department?.id) {
      loadPositions(department.id);
    }
  }, [department?.id]);

  const loadLeaders = async () => {
    setIsLoadingLeaders(true);
    try {
      const leaders = await db.getAllApprovedUsers();
      setAvailableLeaders(leaders);
    } catch (error) {
      console.error('Error loading leaders:', error);
    } finally {
      setIsLoadingLeaders(false);
    }
  };

  const loadPositions = async (departmentId: string) => {
    setIsLoadingPositions(true);
    try {
      const loadedPositions = await db.getPositions(departmentId);
      setPositions(loadedPositions);
    } catch (error) {
      console.error('Error loading positions:', error);
    } finally {
      setIsLoadingPositions(false);
    }
  };
  
  const handleAddPosition = async () => {
    if (!newPositionName.trim() || !department?.id) return;
    
    setIsSavingPosition(true);
    try {
      const newPosition = await db.createPosition({
        name: newPositionName.trim(),
        department_id: department.id,
        description: null
      });
      setPositions([...positions, newPosition]);
      setNewPositionName('');
      toast({
        title: "Função adicionada",
        description: `A função "${newPositionName}" foi adicionada.`,
      });
    } catch (error) {
      console.error('Error adding position:', error);
      toast({
        title: "Erro ao adicionar função",
        description: "Não foi possível adicionar a função.",
        variant: "destructive",
      });
    } finally {
      setIsSavingPosition(false);
    }
  };
  
  const handleRemovePosition = async (positionId: string) => {
    try {
      await db.deletePosition(positionId);
      setPositions(positions.filter(p => p.id !== positionId));
      toast({
        title: "Função removida",
        description: "A função foi removida com sucesso.",
      });
    } catch (error) {
      console.error('Error removing position:', error);
      toast({
        title: "Erro ao remover função",
        description: "Não foi possível remover a função.",
        variant: "destructive",
      });
    }
  };
  
  const handleSave = () => {
    onSave({
      name,
      description: description || null,
      color,
      leader_id: leaderId
    });
  };
  
  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {department ? 'Editar Departamento' : 'Adicionar Departamento'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome do departamento"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição do departamento..."
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="leader">Líder</Label>
            <Select 
              value={leaderId || ''} 
              onValueChange={(value) => setLeaderId(value === 'none' ? null : value)}
            >
              <SelectTrigger id="leader">
                <SelectValue placeholder={isLoadingLeaders ? "Carregando..." : "Selecione um líder"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum líder</SelectItem>
                {availableLeaders.map(leader => (
                  <SelectItem key={leader.id} value={leader.id}>
                    {leader.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="color">Cor</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-12 h-10 p-1"
              />
              <Input
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="flex-1"
                placeholder="#RRGGBB"
              />
            </div>
          </div>
          
          {/* Only show positions section when editing an existing department */}
          {department?.id && (
            <div className="space-y-2">
              <Label>Funções</Label>
              <div className="border rounded-md p-3 space-y-2">
                <div className="flex items-center space-x-2">
                  <Input
                    value={newPositionName}
                    onChange={(e) => setNewPositionName(e.target.value)}
                    placeholder="Nova função"
                    className="flex-1"
                    disabled={isSavingPosition}
                  />
                  <Button 
                    type="button" 
                    onClick={handleAddPosition}
                    disabled={!newPositionName.trim() || isSavingPosition}
                  >
                    {isSavingPosition ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Adicionar'}
                  </Button>
                </div>
                
                {isLoadingPositions ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : positions.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">
                    Nenhuma função adicionada.
                  </p>
                ) : (
                  <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
                    {positions.map(position => (
                      <div 
                        key={position.id} 
                        className="flex items-center justify-between bg-secondary/50 p-2 rounded"
                      >
                        <span className="text-sm">{position.name}</span>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleRemovePosition(position.id)}
                          className="h-7 w-7 p-0"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {!department?.id && (
            <p className="text-sm text-muted-foreground">
              Salve o departamento primeiro para adicionar funções.
            </p>
          )}
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

export default DepartmentForm;