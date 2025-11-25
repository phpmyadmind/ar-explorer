'use client';

import { Box, Settings, Grid3x3, LogOut } from 'lucide-react';
import type { FC } from 'react';
import { ThemeSwitcher } from './theme-switcher';
import Link from 'next/link';
import { Button } from '../ui/button';
import { useRouter } from 'next/navigation';

export const Header: FC = () => {
    const router = useRouter();

    const handleLogout = () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('ar_token');
        }
        router.push('/');
    };

    return (
        <header className="flex h-16 shrink-0 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6 z-30 relative">
            <Link href="/models" className="flex items-center gap-2">
                <Box className="h-6 w-6 text-primary" />
                <h1 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
                    AR Platform
                </h1>
            </Link>
            <div className='flex items-center gap-2'>
                <Link href="/">
                    <Button variant="outline">
                        <Grid3x3 className='h-5 w-5 mr-2' />
                        AR Viewer
                    </Button>
                </Link>
                <Link href="/contents">
                    <Button variant="outline">
                        <Settings className='h-5 w-5 mr-2' />
                        Contents Panel
                    </Button>
                </Link>
                <ThemeSwitcher />
                <Button variant="ghost" size="icon" onClick={handleLogout}>
                    <LogOut className='h-5 w-5' />
                    <span className="sr-only">Log Out</span>
                </Button>
            </div>
        </header>
    );
};
