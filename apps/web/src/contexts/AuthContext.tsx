"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import api from "@/lib/api";

interface User {
  id: string;
  email: string;
  displayName: string;
  age: number;
  gender: "male" | "female" | "prefer-not-to-say";
  photo?: string;
  vibeTags: string[];
  genderPreference: "any" | "female" | "male";
  ageMin: number;
  ageMax: number;
  defaultGroupSize: string;
  reliabilityScore: number;
  ratingAvg: number;
  ratingCount: number;
  isVerified: boolean;
  eventsAttended: number;
  whatsappNumber: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithToken: (token: string, user: User) => void;
  register: (email: string, whatsappNumber: string) => Promise<{ token: string }>;
  completeOnboarding: (data: OnboardingData) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

interface OnboardingData {
  displayName: string;
  age: number;
  gender: "male" | "female" | "prefer-not-to-say";
  vibeTags: string[];
  genderPreference?: "any" | "female" | "male";
  ageMin?: number;
  ageMax?: number;
  defaultGroupSize?: string;
  photo?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const storedToken = localStorage.getItem("token");
    const cachedUser = localStorage.getItem("cachedUser");

    if (storedToken) {
      // Sync cookie for middleware with better format
      const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString();
      document.cookie = `token=${storedToken}; path=/; max-age=604800; expires=${expires}`;
      setToken(storedToken);
      api.setToken(storedToken);

      // Use cached user data if available to reduce API calls
      if (cachedUser) {
        try {
          setUser(JSON.parse(cachedUser) as User);
          setLoading(false);
          return;
        } catch {
          localStorage.removeItem("cachedUser");
        }
      }

      try {
        const data = await api.get<{ user?: User }>("/api/auth/me");
        setUser(data.user || null);
        // Cache user data
        if (data.user) {
          localStorage.setItem("cachedUser", JSON.stringify(data.user));
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("cachedUser");
        document.cookie = "token=; path=/; max-age=0; expires=" + new Date(0).toUTCString();
        api.clearToken();
        setToken(null);
        setUser(null);
      }
    }
    setLoading(false);
  };

  const login = async (email: string, password: string) => {
    // For dev/testing - using complete-onboarding flow
    const data = await api.post<{ token: string; user?: User }>("/api/auth/register", {
      email,
      whatsappNumber: password, // Using password as whatsapp for testing
    });
    setTokenWithCookie(data.token);
    if (data.user) {
      setUser(data.user as User);
    }
    return data;
  };

  const loginWithToken = (token: string, partialUser: Partial<User>) => {
    // Patch user data with default values for missing fields
    const user: User = {
      id: partialUser.id || '',
      email: partialUser.email || '',
      displayName: partialUser.displayName || '',
      age: partialUser.age || 0,
      gender: partialUser.gender || 'prefer-not-to-say',
      photo: partialUser.photo || undefined,
      vibeTags: partialUser.vibeTags || [],
      genderPreference: partialUser.genderPreference || 'any',
      ageMin: partialUser.ageMin || 18,
      ageMax: partialUser.ageMax || 50,
      defaultGroupSize: partialUser.defaultGroupSize || 'flexible',
      reliabilityScore: partialUser.reliabilityScore || 100,
      ratingAvg: partialUser.ratingAvg || 0,
      ratingCount: partialUser.ratingCount || 0,
      isVerified: partialUser.isVerified || false,
      eventsAttended: partialUser.eventsAttended || 0,
      whatsappNumber: partialUser.whatsappNumber || '',
      isOnboardingComplete: partialUser.isOnboardingComplete || false,
    };

    setTokenWithCookie(token);
    setUser(user);
    setLoading(false);

    // Cache user data to reduce API calls
    localStorage.setItem("cachedUser", JSON.stringify(user));
  };

  const setTokenWithCookie = (token: string) => {
    localStorage.setItem("token", token);
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `token=${token}; path=/; max-age=604800; expires=${expires}`;
    setToken(token);
    api.setToken(token);
  };

  const register = async (email: string, whatsappNumber: string) => {
    const data = await api.post<{ token: string; user?: User }>("/api/auth/register", {
      email,
      whatsappNumber,
    });
    setTokenWithCookie(data.token);
    return data;
  };

  const completeOnboarding = async (data: OnboardingData) => {
    const response = await api.post<{ token: string; user?: User }>(
      "/api/auth/complete-onboarding",
      data
    );
    setTokenWithCookie(response.token);
    if (response.user) {
      setUser(response.user as User);
    } else {
      await refreshUser();
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("cachedUser");
    document.cookie = "token=; path=/; max-age=0; expires=" + new Date(0).toUTCString();
    api.clearToken();
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    const data = await api.get<{ user?: User }>("/api/auth/me");
    setUser(data.user || null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user,
        login,
        loginWithToken,
        register,
        completeOnboarding,
        logout,
        refreshUser,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
