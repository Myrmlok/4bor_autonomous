import React, { useState } from 'react';
import { useLocation, useParams } from 'wouter';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';

export default function Register() {
  const { token } = useParams();
  const [loginName, setLoginName] = useState('');
  const [email, setEmail] = useState('');
  const { login } = useAuth();
  const [, setLocation] = useLocation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginName.trim()) {
      login(loginName);
      setLocation('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary p-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10 bg-[url('/images/hero-bg.jpg')] bg-cover bg-center"></div>
      
      <Card className="w-full max-w-md relative z-10 border-white/10 shadow-2xl">
        <div className="p-8 pb-0 text-center">
          <div className="font-serif text-2xl tracking-wider font-semibold mb-2">
            <span className="text-foreground">4BOR</span>
            <span className="text-primary ml-2">/ КЛУБ</span>
          </div>
          <p className="text-sm text-muted-foreground">Завершение регистрации</p>
          <div className="mt-2 inline-block px-2 py-1 bg-muted rounded text-[10px] font-mono text-muted-foreground">
            Token: {token?.substring(0, 8)}...
          </div>
        </div>
        
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input 
                placeholder="Придумайте логин" 
                value={loginName}
                onChange={e => setLoginName(e.target.value)}
                required
                className="h-12"
              />
            </div>
            <div>
              <Input 
                type="email"
                placeholder="Email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="h-12"
              />
            </div>
            <div>
              <Input 
                type="password"
                placeholder="Пароль" 
                required
                className="h-12"
              />
            </div>
            <Button type="submit" className="w-full h-12 text-base mt-2">
              Завершить регистрацию
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
