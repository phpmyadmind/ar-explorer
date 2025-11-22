import { Box, Settings, Grid3x3 } from 'lucide-react';
import type { FC } from 'react';
import { ThemeSwitcher } from './theme-switcher';
import Link from 'next/link';
import { Button } from '../ui/button';

export const Header: FC = () => {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6 z-30 relative">
      <Link href="/" className="flex items-center gap-2">
        <Box className="h-6 w-6 text-primary" />
        <h1 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
          AR Platform
        </h1>
      </Link>
      <div className='flex items-center gap-2'>
        <Link href="/models">
            <Button variant="outline">
                <Grid3x3 className='h-5 w-5 mr-2' />
                Select Model
            </Button>
        </Link>
        <Link href="/contents">
            <Button variant="outline" size="icon">
                <Settings className='h-5 w-5' />
                <span className="sr-only">Contents Panel</span>
            </Button>
        </Link>
        <ThemeSwitcher />
      </div>
    </header>
  );
};
