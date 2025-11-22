// src/app/models/layout.tsx
import { Header } from '@/components/ar-explorer/header';

export default function ModelsLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex h-svh w-full flex-col bg-background text-foreground">
            <Header />
            <main className="flex-1 overflow-auto p-4 md:p-8">
                {children}
            </main>
        </div>
    );
}
