import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Resolve localhost for different platforms
export const getBaseUrl = () => {
  if (__DEV__) {
    const debuggerHost = Constants.expoConfig?.hostUri;
    const localhost = debuggerHost?.split(':')[0] || 'localhost';

    // 10.0.2.2 is usually the host for Android emulators
    // For iOS and physical devices, the local IP is needed
    return Platform.OS === 'android' ? `http://${localhost}:3001` : `http://${localhost}:3001`;
  }
  // Production URL (change as needed)
  return 'https://api.gasin.com';
};

const BASE_URL = getBaseUrl();

class ApiClient {
  private token: string | null = null;
  private onUnauthorized: (() => void) | null = null;

  setToken(token: string) {
    this.token = token;
  }

  clearToken() {
    this.token = null;
  }

  setOnUnauthorized(callback: () => void) {
    this.onUnauthorized = callback;
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${BASE_URL}${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 10000); // 10s timeout

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });
      clearTimeout(id);

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401 && this.onUnauthorized) {
          this.onUnauthorized();
        }
        throw data;
      }

      return data as T;
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async patch<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

const api = new ApiClient();
export default api;
