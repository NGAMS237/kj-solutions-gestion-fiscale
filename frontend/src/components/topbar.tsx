'use client';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from './theme-provider';

export function Topbar({ title }: { title: string }) {
  const { theme, toggle } = useTheme();
  return (
    <header className="sticky top-0 z-10 bg-[rgb(var(--bg))]/80 backdrop-blur border-b border-[rgb(var(--border))]">
      <div className="px-6 py-3 flex items-center justify-between">
        <h1 className="text-lg font-semibold">{title}</h1>
        <button onClick={toggle} className="btn-ghost" aria-label="Basculer thème">
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>
    </header>
  );
}
