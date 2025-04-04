import { useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { AuthForm } from "@/components/ui/auth-form";
import { Loader2 } from "lucide-react";

export default function AuthPage() {
  const { isAuthenticated, isLoading } = useAuth();
  
  // If authenticated, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      window.location.href = "/dashboard"; // Use direct window location for reliable redirect
    }
  }, [isAuthenticated, isLoading]);
  
  const handleAuthSuccess = () => {
    window.location.href = "/dashboard"; // Use direct window location for reliable redirect
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600 mb-4" />
          <p className="text-sm text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600 mb-4" />
          <p className="text-sm text-slate-600">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <AuthForm onSuccess={handleAuthSuccess} />
    </div>
  );
}
