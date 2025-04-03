import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { AuthForm } from "@/components/ui/auth-form";
import { User } from "@shared/schema";

export default function AuthPage() {
  const [_, navigate] = useLocation();
  
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ['/api/auth/session'],
    retry: false,
    onError: () => {}
  });
  
  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);
  
  const handleAuthSuccess = () => {
    navigate("/dashboard");
  };
  
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      {!isLoading && !user && (
        <AuthForm onSuccess={handleAuthSuccess} />
      )}
    </div>
  );
}
