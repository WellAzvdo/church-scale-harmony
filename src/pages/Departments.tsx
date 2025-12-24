
import React, { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { Department } from '@/lib/models';
import * as storage from '@/lib/storage';
import { generateId } from '@/lib/scheduleUtils';
import DepartmentForm from '@/components/departments/DepartmentForm';
import { logger } from '@/lib/logger';

const Departments: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      const loadedDepartments = await storage.getDepartments();
      setDepartments(loadedDepartments);
    } catch (error) {
      logger.error('Error loading departments:', error);
      toast({
        title: "Erro ao carregar departamentos",
        description: "Não foi possível carregar a lista de departamentos.",
        variant: "destructive",
      });
    }
  };

  const handleAddDepartment = () => {
    setEditingDepartment(null);
    setIsFormOpen(true);
  };

  const handleEditDepartment = (department: Department) => {
    setEditingDepartment(department);
    setIsFormOpen(true);
  };

  const handleDeleteDepartment = async (departmentId: string) => {
    try {
      await storage.deleteDepartment(departmentId);
      toast({
        title: "Departamento excluído",
        description: "O departamento foi excluído com sucesso.",
      });
      loadDepartments();
    } catch (error) {
      logger.error('Error deleting department:', error);
      toast({
        title: "Erro ao excluir departamento",
        description: "Não foi possível excluir o departamento.",
        variant: "destructive",
      });
    }
  };

  const handleSaveDepartment = async (departmentData: Partial<Department>) => {
    try {
      const now = Date.now();
      let department: Department;
      
      if (editingDepartment) {
        department = {
          ...editingDepartment,
          ...departmentData,
          updatedAt: now,
          syncStatus: 'pending'
        } as Department;
      } else {
        department = {
          id: generateId(),
          name: departmentData.name || '',
          description: departmentData.description,
          color: departmentData.color || '#3a7ca5',
          positions: departmentData.positions || [],
          createdAt: now,
          updatedAt: now,
          syncStatus: 'pending'
        };
      }
      
      await storage.saveDepartment(department);
      setIsFormOpen(false);
      toast({
        title: editingDepartment ? "Departamento atualizado" : "Departamento adicionado",
        description: editingDepartment 
          ? "As informações do departamento foram atualizadas com sucesso." 
          : "Novo departamento adicionado com sucesso.",
      });
      loadDepartments();
    } catch (error) {
      logger.error('Error saving department:', error);
      toast({
        title: "Erro ao salvar departamento",
        description: "Não foi possível salvar as informações do departamento.",
        variant: "destructive",
      });
    }
  };

  const filteredDepartments = departments.filter(department => 
    department.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (department.description && department.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-primary-deep">Departamentos</h1>
        <Button 
          onClick={handleAddDepartment} 
          className="bg-primary hover:bg-primary-medium"
        >
          <Plus className="h-4 w-4 mr-2" /> Adicionar
        </Button>
      </div>

      <div className="mb-6 relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar departamentos..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {filteredDepartments.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Nenhum departamento encontrado.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDepartments.map((department) => (
            <Card key={department.id}>
              <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center">
                    <div 
                      className="w-4 h-4 rounded-full mr-2" 
                      style={{ backgroundColor: department.color }}
                    />
                    <CardTitle className="text-lg font-semibold">{department.name}</CardTitle>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleEditDepartment(department)}
                    >
                      <Edit className="h-4 w-4 text-primary" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDeleteDepartment(department.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                {department.description && (
                  <p className="text-sm text-muted-foreground">{department.description}</p>
                )}
                {department.positions && department.positions.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground">Funções:</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {department.positions.map((position) => (
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
        <DepartmentForm
          department={editingDepartment}
          onSave={handleSaveDepartment}
          onCancel={() => setIsFormOpen(false)}
        />
      )}
    </div>
  );
};

export default Departments;
