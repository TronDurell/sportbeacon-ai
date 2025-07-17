// Secure API Service with CSRF Protection and Authentication
import { auth } from '../lib/firebase';

// CSRF token management
class CSRFManager {
  private static instance: CSRFManager;
  private csrfToken: string | null = null;
  private tokenExpiry: number = 0;

  static getInstance(): CSRFManager {
    if (!CSRFManager.instance) {
      CSRFManager.instance = new CSRFManager();
    }
    return CSRFManager.instance;
  }

  async getCSRFToken(): Promise<string> {
    // Check if token is still valid (1 hour expiry)
    if (this.csrfToken && Date.now() < this.tokenExpiry) {
      return this.csrfToken;
    }

    // Generate new CSRF token
    const token = this.generateToken();
    this.csrfToken = token;
    this.tokenExpiry = Date.now() + (60 * 60 * 1000); // 1 hour

    return token;
  }

  private generateToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  validateToken(token: string): boolean {
    return this.csrfToken === token;
  }
}

// Input validation utilities
class InputValidator {
  static sanitizeString(input: string): string {
    if (typeof input !== 'string') {
      throw new Error('Input must be a string');
    }
    // Basic XSS prevention
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validateUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  static validateObject(obj: any, schema: Record<string, string>): boolean {
    for (const [key, type] of Object.entries(schema)) {
      if (!(key in obj)) {
        throw new Error(`Missing required field: ${key}`);
      }
      if (typeof obj[key] !== type) {
        throw new Error(`Invalid type for ${key}: expected ${type}, got ${typeof obj[key]}`);
      }
    }
    return true;
  }
}

// Secure API service
class SecureApiService {
  private baseUrl: string;
  private csrfManager: CSRFManager;

  constructor() {
    this.baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
    this.csrfManager = CSRFManager.getInstance();
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
    };

    // Add CSRF token
    const csrfToken = await this.csrfManager.getCSRFToken();
    headers['X-CSRF-Token'] = csrfToken;

    // Add authentication token
    const user = auth.currentUser;
    if (user) {
      try {
        const token = await user.getIdToken();
        headers['Authorization'] = `Bearer ${token}`;
      } catch (error) {
        // Continue without auth token, let server handle 401
      }
    }

    return headers;
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = await this.getAuthHeaders();

    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `API request failed: ${response.status} ${response.statusText} - ${errorData.message || 'Unknown error'}`
      );
    }

    return response.json();
  }

  // Town Rec API methods
  async submitSiblingPairingRequest(data: {
    parentId: string;
    siblingIds: string[];
    leagueId: string;
    preferences: Record<string, any>;
  }): Promise<{ requestId: string; status: string }> {
    // Validate input
    InputValidator.validateObject(data, {
      parentId: 'string',
      siblingIds: 'object',
      leagueId: 'string',
      preferences: 'object'
    });

    if (!Array.isArray(data.siblingIds) || data.siblingIds.length === 0) {
      throw new Error('siblingIds must be a non-empty array');
    }

    // Sanitize string inputs
    const sanitizedData = {
      ...data,
      parentId: InputValidator.sanitizeString(data.parentId),
      leagueId: InputValidator.sanitizeString(data.leagueId),
    };

    return this.request('/town-rec/sibling-pairing', {
      method: 'POST',
      body: JSON.stringify(sanitizedData),
    });
  }

  async submitAgeOverrideRequest(data: {
    playerId: string;
    parentId: string;
    leagueId: string;
    reason: string;
    supportingDocs?: string[];
  }): Promise<{ requestId: string; status: string }> {
    // Validate input
    InputValidator.validateObject(data, {
      playerId: 'string',
      parentId: 'string',
      leagueId: 'string',
      reason: 'string'
    });

    // Sanitize string inputs
    const sanitizedData = {
      ...data,
      playerId: InputValidator.sanitizeString(data.playerId),
      parentId: InputValidator.sanitizeString(data.parentId),
      leagueId: InputValidator.sanitizeString(data.leagueId),
      reason: InputValidator.sanitizeString(data.reason),
    };

    return this.request('/town-rec/age-override', {
      method: 'POST',
      body: JSON.stringify(sanitizedData),
    });
  }

  async getWaitlistStatus(playerId: string): Promise<{
    position: number;
    estimatedWaitTime: string;
    status: string;
  }> {
    // Validate input
    if (!InputValidator.validateUUID(playerId)) {
      throw new Error('Invalid player ID format');
    }

    const sanitizedPlayerId = InputValidator.sanitizeString(playerId);
    return this.request(`/town-rec/waitlist/${sanitizedPlayerId}`);
  }

  async updatePlayerProfile(data: {
    playerId: string;
    updates: Record<string, any>;
  }): Promise<{ success: boolean; message: string }> {
    // Validate input
    InputValidator.validateObject(data, {
      playerId: 'string',
      updates: 'object'
    });

    const sanitizedData = {
      ...data,
      playerId: InputValidator.sanitizeString(data.playerId),
    };

    return this.request(`/players/${sanitizedData.playerId}/profile`, {
      method: 'PUT',
      body: JSON.stringify(sanitizedData.updates),
    });
  }

  // Generic CRUD operations
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Export singleton instance
export const apiService = new SecureApiService();

// Export utilities for external use
export const getCSRFToken = () => CSRFManager.getInstance().getCSRFToken();
export const validateInput = InputValidator; 