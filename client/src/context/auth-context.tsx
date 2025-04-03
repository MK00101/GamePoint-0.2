import { createContext, useContext, ReactNode, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { User } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [_, navigate] = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Fetch current user session
  const { 
    data: user, 
    isLoading,
    refetch 
  } = useQuery<User | null>({
    queryKey: ['/api/auth/session'],
    retry: false,
    onSuccess: (data) => {
      if (data) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    },
    onError: () => {
      setIsAuthenticated(false);
    }
  });

  async function login(username: string, password: string) {
    try {
      await apiRequest("POST", "/api/auth/login", { username, password });
      await refetch();
    } catch (error) {
      throw error;
    }
  }

  async function register(userData: any) {
    try {
      await apiRequest("POST", "/api/auth/register", userData);
      await refetch();
    } catch (error) {
      throw error;
    }
  }

  async function logout() {
    try {
      await apiRequest("POST", "/api/auth/logout", {});
      setIsAuthenticated(false);
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }

  // Provide authentication context value
  const value = {
    user,
    isLoading,
    login,
    register,
    logout,
    isAuthenticated
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
