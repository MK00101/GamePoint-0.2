import { createContext, useContext, ReactNode, useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
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
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const queryClient = useQueryClient();

  // Fetch session on component mount
  useEffect(() => {
    async function fetchSession() {
      try {
        setIsLoading(true);
        const response = await fetch('/api/auth/session', {
          credentials: 'include',
        });
        
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Error fetching session:", error);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSession();
  }, []);

  async function login(username: string, password: string) {
    try {
      setIsLoading(true);
      const response = await apiRequest("POST", "/api/auth/login", { username, password });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed. Please check your credentials.');
      }
      
      // Fetch user data after successful login
      const sessionResponse = await fetch('/api/auth/session', {
        credentials: 'include',
      });
      
      if (sessionResponse.ok) {
        const userData = await sessionResponse.json();
        setUser(userData);
        setIsAuthenticated(true);
      } else {
        throw new Error('Failed to retrieve user session after login');
      }
    } catch (error: any) {
      console.error("Login error:", error);
      throw new Error(error.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  async function register(userData: any) {
    try {
      setIsLoading(true);
      const response = await apiRequest("POST", "/api/auth/register", userData);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed. Please try again.');
      }
      
      // Fetch user data after successful registration
      const sessionResponse = await fetch('/api/auth/session', {
        credentials: 'include',
      });
      
      if (sessionResponse.ok) {
        const userData = await sessionResponse.json();
        setUser(userData);
        setIsAuthenticated(true);
      } else {
        throw new Error('Failed to get user session after registration');
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      throw new Error(error.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  async function logout() {
    try {
      await apiRequest("POST", "/api/auth/logout", {});
      setUser(null);
      setIsAuthenticated(false);
      queryClient.clear();
      
      // Use direct window location change for reliable redirect
      window.location.href = "/";
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }

  // Create context value object
  const value: AuthContextType = {
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
