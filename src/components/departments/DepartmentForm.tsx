
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
import { Department, Position } from '@/lib/models';
import { generateId } from '@/lib/scheduleUtils';

interface DepartmentFormProps {
  department: Department | null;
  onSave: (departmentData: Partial<Department>) => void;
  onCancel: () => void;
}

const DepartmentForm: React.FC<DepartmentFormProps> = ({ department, onSave, onCancel }) => {
  const [name, setName] = useState(department?.name || '');
  const [description, setDescription] = useState(department?.description || '');
  const [color, setColor] = useState(department?.color || '#3a7ca5');
  const [positions, setPositions] = useState<Position[]>(department?.positions || []);
  const [newPositionName, setNewPositionName] = useState('');
  
  const handleAddPosition = () => {
    if (newPositionName.trim()) {
      const newPosition: Position = {
        id: generateId(),
        name: newPositionName.trim(),
        departmentId: department?.id || '',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        syncStatus: 'pending'
      };
      
      setPositions([...positions, newPosition]);
      setNewPositionName('');
    }
  };
  
  const handleRemovePosition = (positionId: string) => {
    setPositions(positions.filter(p => p.id !== positionId));
  };
  
  const handleSave = () => {
    onSave({
      name,
      description,
      color,
      positions
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
          
          <div className="space-y-2">
            <Label>Funções</Label>
            <div className="border rounded-md p-3 space-y-2">
              <div className="flex items-center space-x-2">
                <Input
                  value={newPositionName}
                  onChange={(e) => setNewPositionName(e.target.value)}
                  placeholder="Nova função"
                  className="flex-1"
                />
                <Button 
                  type="button" 
                  onClick={handleAddPosition}
                  disabled={!newPositionName.trim()}
                >
                  Adicionar
                </Button>
              </div>
              
              {positions.length === 0 ? (
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
