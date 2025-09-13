import { useState, useEffect } from 'react';
import type { User } from '../firebase/types';
import { useMemory } from '../src/hooks/useMemory';

interface AuthUser extends User {
    role: 'trainer' | 'player' | 'admin';
    name: string;
    avatar?: string;
}

interface AuthState {
    user: AuthUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
}

export const useAuth = () => {
    const { captureAuthEvent } = useMemory({ enabled: true, autoCapture: false });
    const [authState, setAuthState] = useState<AuthState>({
        user: null,
        isAuthenticated: false,
        isLoading: true,
        error: null
    });

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await fetch('/api/auth/session');
                if (!response.ok) {
                    throw new Error('Authentication failed');
                }
                
                const data = await response.json();
                setAuthState({
                    user: data.user,
                    isAuthenticated: true,
                    isLoading: false,
                    error: null
                });
                // Capture successful login
                captureAuthEvent('login_success', { userId: data.user.id });
            } catch (error) {
                setAuthState({
                    user: null,
                    isAuthenticated: false,
                    isLoading: false,
                    error: error instanceof Error ? error.message : 'Authentication failed'
                });
                // Capture login failure
                captureAuthEvent('login_failure', { error: error instanceof Error ? error.message : 'Unknown error' });
            }
        };

        checkAuth();
    }, []);

    const login = async (email: string, password: string) => {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (!response.ok) {
                throw new Error('Login failed');
            }

            const data = await response.json();
            setAuthState({
                user: data.user,
                isAuthenticated: true,
                isLoading: false,
                error: null
            });

            return true;
        } catch (error) {
            setAuthState(prev => ({
                ...prev,
                error: error instanceof Error ? error.message : 'Login failed'
            }));
            return false;
        }
    };

    const logout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            setAuthState({
                user: null,
                isAuthenticated: false,
                isLoading: false,
                error: null
            });
            return true;
        } catch (error) {
            setAuthState(prev => ({
                ...prev,
                error: error instanceof Error ? error.message : 'Logout failed'
            }));
            return false;
        }
    };

    return {
        ...authState,
        login,
        logout
    };
}; 