import { Box } from 'lucide-react';
import type { FC } from 'react';
import { ThemeSwitcher } from './theme-switcher';

export const Header: FC = () => {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6 z-10">
      <div className="flex items-center gap-2">
        <Box className="h-6 w-6 text-primary" />
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          AR Experience
        </h1>
      </div>
      <ThemeSwitcher />
    </header>
  );
};
