import React from 'react';
import { Link } from 'wouter';
import { Button } from '../components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-4">
      <div className="font-serif text-8xl font-bold text-muted-foreground/20 mb-4">404</div>
      <h1 className="text-2xl font-serif font-semibold mb-4">Страница не найдена</h1>
      <p className="text-muted-foreground max-w-md mb-8">
        Возможно, этот раздел был перенесен в архив или у вас нет прав для его просмотра.
      </p>
      <Link href="/">
        <Button>Вернуться в клуб</Button>
      </Link>
    </div>
  );
}
