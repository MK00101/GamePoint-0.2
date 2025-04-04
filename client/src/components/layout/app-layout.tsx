import { ReactNode, useEffect } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { useAuth } from "@/context/auth-context";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";

interface AppLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function AppLayout({ children, title, subtitle, actions }: AppLayoutProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [_, navigate] = useLocation();

  // Use useEffect for navigation to avoid issues during render
  useEffect(() => {
    // Only redirect if auth check is complete and user is not authenticated
    if (!isLoading && !isAuthenticated) {
      // Using a single-time navigation
      const timer = setTimeout(() => {
        navigate("/auth");
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isLoading, isAuthenticated]);

  // Loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600 mb-4" />
          <p className="text-sm text-slate-600">Loading your game data...</p>
        </div>
      </div>
    );
  }

  // Return early if not authenticated (redirection will happen in useEffect)
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600 mb-4" />
          <p className="text-sm text-slate-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      {/* Mobile Navigation */}
      <MobileNav user={user} />

      {/* Sidebar for Desktop */}
      <Sidebar user={user} />

      {/* Main Content */}
      <div className="md:pl-64 flex flex-col flex-1">
        <main className="flex-1 pb-16 md:pb-6">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {/* Page Header */}
              <div className="md:flex md:items-center md:justify-between mb-8">
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl font-bold leading-7 text-slate-900 sm:text-3xl bg-gradient-to-r from-primary-700 to-primary-900 bg-clip-text text-transparent">
                    {title}
                  </h1>
                  {subtitle && (
                    <p className="mt-1 text-sm text-slate-500 sm:text-base">
                      {subtitle}
                    </p>
                  )}
                </div>
                {actions && (
                  <div className="mt-4 flex space-x-3 md:mt-0 md:ml-4">
                    {actions}
                  </div>
                )}
              </div>

              {/* Page Content */}
              <div className="animate-in fade-in duration-500">
                {children}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
