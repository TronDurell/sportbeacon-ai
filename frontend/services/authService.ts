import { fetchWithAuth } from './api';

export interface AuthToken {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface PlayerSession {
    id: string;
    email: string;
    name: string;
    avatar?: string;
}

class AuthService {
    private readonly TOKEN_KEY = 'sb_auth_token';
    private readonly SESSION_KEY = 'sb_player_session';
    private refreshTimeout: NodeJS.Timeout | null = null;

    constructor() {
        // Set up token refresh on initialization
        const token = this.getStoredToken();
        if (token) {
            this.scheduleTokenRefresh(token);
        }
    }

    async login(credentials: LoginCredentials): Promise<PlayerSession> {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials),
        });

        if (!response.ok) {
            throw new Error('Login failed');
        }

        const { token, player } = await response.json();
        this.setToken(token);
        this.setSession(player);
        this.scheduleTokenRefresh(token);

        return player;
    }

    async logout(): Promise<void> {
        try {
            await fetchWithAuth('/api/auth/logout', {
                method: 'POST',
            });
        } finally {
            this.clearAuth();
        }
    }

    async refreshToken(): Promise<void> {
        const currentToken = this.getStoredToken();
        if (!currentToken?.refreshToken) {
            throw new Error('No refresh token available');
        }

        try {
            const response = await fetch('/api/auth/refresh', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken: currentToken.refreshToken }),
            });

            if (!response.ok) {
                throw new Error('Token refresh failed');
            }

            const { token } = await response.json();
            this.setToken(token);
            this.scheduleTokenRefresh(token);
        } catch (error) {
            this.clearAuth();
            throw error;
        }
    }

    getStoredToken(): AuthToken | null {
        const tokenStr = localStorage.getItem(this.TOKEN_KEY);
        return tokenStr ? JSON.parse(tokenStr) : null;
    }

    getSession(): PlayerSession | null {
        const sessionStr = localStorage.getItem(this.SESSION_KEY);
        return sessionStr ? JSON.parse(sessionStr) : null;
    }

    isAuthenticated(): boolean {
        const token = this.getStoredToken();
        if (!token) return false;

        // Check if token is expired
        const expirationTime = new Date(token.expiresIn).getTime();
        return expirationTime > Date.now();
    }

    private setToken(token: AuthToken): void {
        localStorage.setItem(this.TOKEN_KEY, JSON.stringify(token));
    }

    private setSession(session: PlayerSession): void {
        localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
    }

    private clearAuth(): void {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.SESSION_KEY);
        if (this.refreshTimeout) {
            clearTimeout(this.refreshTimeout);
            this.refreshTimeout = null;
        }
    }

    private scheduleTokenRefresh(token: AuthToken): void {
        if (this.refreshTimeout) {
            clearTimeout(this.refreshTimeout);
        }

        const expirationTime = new Date(token.expiresIn).getTime();
        const now = Date.now();
        const timeUntilExpiry = expirationTime - now;
        
        // Refresh 5 minutes before expiry
        const refreshTime = timeUntilExpiry - (5 * 60 * 1000);
        
        if (refreshTime > 0) {
            this.refreshTimeout = setTimeout(() => {
                this.refreshToken();
            }, refreshTime);
        }
    }
}

export const authService = new AuthService(); 