import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { AuthForm } from "@/components/ui/auth-form";
import { useAuth } from "@/context/auth-context";
import { Loader2 } from "lucide-react";

export default function AuthPage() {
  const [_, navigate] = useLocation();
  const { user, isLoading, isAuthenticated } = useAuth();
  const [redirecting, setRedirecting] = useState(false);
  
  useEffect(() => {
    // If user is authenticated, redirect to dashboard
    if (isAuthenticated && !redirecting) {
      setRedirecting(true);
      const timer = setTimeout(() => {
        navigate("/dashboard");
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, navigate, redirecting]);
  
  const handleAuthSuccess = () => {
    navigate("/dashboard");
  };
  
  if (isLoading || redirecting) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600 mb-4" />
          <p className="text-sm text-slate-600">
            {redirecting ? "Redirecting to dashboard..." : "Loading..."}
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      {!isAuthenticated && (
        <AuthForm onSuccess={handleAuthSuccess} />
      )}
    </div>
  );
}
