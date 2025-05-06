
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // For demo purposes, use simple validation
    if (!username || !password) {
      setError('Por favor, preencha todos os campos');
      return;
    }
    
    // In a real app, you'd authenticate with a server
    // For now, we'll just simulate a successful login
    navigate('/members');
  };
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-b from-primary-light to-white">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-deep">Igreja App</h1>
          <p className="text-gray-600 mt-2">Gerenciamento de Escalas</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="bg-red-100 p-3 rounded-md text-red-700 text-sm">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <label htmlFor="username" className="text-sm font-medium text-gray-700">
              Usuário
            </label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full"
              placeholder="Digite seu usuário"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-gray-700">
              Senha
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full"
              placeholder="Digite sua senha"
            />
          </div>
          
          <Button type="submit" className="w-full bg-primary hover:bg-primary-medium">
            Entrar
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Login;
