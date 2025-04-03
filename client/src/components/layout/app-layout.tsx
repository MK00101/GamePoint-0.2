import { ReactNode } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { useAuth } from "@/context/auth-context";
import { useLocation } from "wouter";

interface AppLayoutProps {
  children: ReactNode;
  title: string;
  actions?: ReactNode;
}

export function AppLayout({ children, title, actions }: AppLayoutProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [_, navigate] = useLocation();

  // Redirect to auth page if not authenticated
  if (!isLoading && !isAuthenticated) {
    navigate("/auth");
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
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
              <div className="md:flex md:items-center md:justify-between mb-6">
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl font-bold leading-7 text-slate-900 sm:text-3xl sm:truncate">
                    {title}
                  </h1>
                </div>
                {actions && (
                  <div className="mt-4 flex md:mt-0 md:ml-4">
                    {actions}
                  </div>
                )}
              </div>

              {/* Page Content */}
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
