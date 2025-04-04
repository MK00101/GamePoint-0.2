import { useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { AuthForm } from "@/components/ui/auth-form";
import { Loader2, Trophy, Users, Award } from "lucide-react";

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
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center px-4">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-sm text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center px-4">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-sm text-slate-600">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex flex-col md:flex-row items-center justify-center px-4 py-8">
      <div className="w-full max-w-md md:w-1/2 md:pr-8 mb-8 md:mb-0">
        <div className="text-center md:text-left mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent mb-4">
            GameOn
          </h1>
          <p className="text-slate-600 mb-6">
            Your platform for organizing and participating in competitive gaming tournaments with real-world prizes.
          </p>
          
          <div className="hidden md:block">
            <div className="grid grid-cols-1 gap-4 mt-8">
              <div className="flex items-start p-4 bg-white rounded-lg shadow-sm">
                <Trophy className="h-6 w-6 text-primary mr-3 flex-shrink-0" />
                <div>
                  <h3 className="font-medium">Create & Host Games</h3>
                  <p className="text-sm text-slate-500">Organize your own tournaments with custom rules and prize pools</p>
                </div>
              </div>
              
              <div className="flex items-start p-4 bg-white rounded-lg shadow-sm">
                <Users className="h-6 w-6 text-primary mr-3 flex-shrink-0" />
                <div>
                  <h3 className="font-medium">Join Competitions</h3>
                  <p className="text-sm text-slate-500">Find and participate in games that match your interests and skill level</p>
                </div>
              </div>
              
              <div className="flex items-start p-4 bg-white rounded-lg shadow-sm">
                <Award className="h-6 w-6 text-primary mr-3 flex-shrink-0" />
                <div>
                  <h3 className="font-medium">Win Real Prizes</h3>
                  <p className="text-sm text-slate-500">Compete for real cash prizes and track your earnings over time</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="w-full max-w-md md:w-1/2">
        <AuthForm onSuccess={handleAuthSuccess} />
      </div>
    </div>
  );
}
