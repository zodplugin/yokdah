import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import api from './api';

interface AuthContextType {
  token: string | null;
  user: any | null;
  isLoading: boolean;
  signIn: (token: string, user: any) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (user: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const loadSession = async () => {
      try {
        const savedToken = await SecureStore.getItemAsync('token');
        const savedUser = await SecureStore.getItemAsync('user');

        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
          api.setToken(savedToken);
        }
      } catch (e) {
        console.error('Failed to load session:', e);
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();
    api.setOnUnauthorized(() => {
       signOut();
    });
  }, []);

  const signIn = async (newToken: string, newUser: any) => {
    try {
      setToken(newToken);
      setUser(newUser);
      api.setToken(newToken);
      await SecureStore.setItemAsync('token', newToken);
      await SecureStore.setItemAsync('user', JSON.stringify(newUser));
    } catch (e) {
      console.error('Failed to save session:', e);
    }
  };

  const signOut = async () => {
    try {
      setToken(null);
      setUser(null);
      api.clearToken();
      await SecureStore.deleteItemAsync('token');
      await SecureStore.deleteItemAsync('user');
    } catch (e) {
      console.error('Failed to clear session:', e);
    }
  };

  const updateUser = async (newUser: any) => {
    try {
      setUser(newUser);
      await SecureStore.setItemAsync('user', JSON.stringify(newUser));
    } catch (e) {
      console.error('Failed to update user session:', e);
    }
  };

  return (
    <AuthContext.Provider value={{ token, user, isLoading, signIn, signOut, updateUser }}>
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
