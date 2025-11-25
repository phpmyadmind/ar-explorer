'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { config } from '@/lib/config';
import { Loader2 } from 'lucide-react';

interface AuthContextType {
    token: string | null;
    loading: boolean;
    error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchToken = async () => {
            setLoading(true);
            try {
                // 1. Check if token exists in localStorage
                const storedToken = localStorage.getItem('ar_token');
                if (storedToken) {
                    setToken(storedToken);
                    return;
                }

                // 2. If not, fetch a new service token from the backend
                const response = await fetch(`${config.apiUrl}/api/auth/token`, {
                    method: 'POST',
                });
                
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Failed to fetch service token');
                }

                // 3. Store the new token
                localStorage.setItem('ar_token', data.token);
                setToken(data.token);

            } catch (err: any) {
                setError(err.message);
                console.error("Authentication Error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchToken();
    }, []);

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <div className="text-center">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="mt-4 text-muted-foreground">Initializing session...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background p-4">
                <div className="max-w-md rounded-lg border border-destructive bg-destructive/10 p-6 text-center text-destructive">
                    <h2 className="text-lg font-semibold">Authentication Error</h2>
                    <p className="mt-2 text-sm">{error}</p>
                    <p className="mt-4 text-xs">Please ensure the backend server is running and accessible.</p>
                </div>
            </div>
        );
    }
    
    return (
        <AuthContext.Provider value={{ token, loading, error }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
