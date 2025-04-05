import { useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { AuthForm } from "@/components/ui/auth-form";
import { Loader2, Trophy, Users, Award, CreditCard, Shield, Globe } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Badge } from "@/components/ui/badge";

export default function AuthPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const isMobile = useIsMobile();
  
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
          <div className="mb-2">
            <Badge variant="outline" className="bg-white px-3 py-1 text-xs font-medium">Join the community</Badge>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent mb-4">
            GameOn
          </h1>
          <p className="text-slate-600 text-lg mb-6">
            The #1 platform for organizing and participating in competitive gaming tournaments with real-world prizes.
          </p>
          
          <div className="hidden md:block">
            <div className="grid grid-cols-1 gap-4 mt-8">
              <div className="flex items-start p-4 bg-white rounded-lg shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                <div className="bg-primary/10 p-2 rounded-full mr-3 flex-shrink-0">
                  <Trophy className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Create & Host Games</h3>
                  <p className="text-sm text-slate-500">Organize your own tournaments with custom rules and prize pools</p>
                </div>
              </div>
              
              <div className="flex items-start p-4 bg-white rounded-lg shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                <div className="bg-primary/10 p-2 rounded-full mr-3 flex-shrink-0">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Join Competitions</h3>
                  <p className="text-sm text-slate-500">Find and participate in games that match your interests and skill level</p>
                </div>
              </div>
              
              <div className="flex items-start p-4 bg-white rounded-lg shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                <div className="bg-primary/10 p-2 rounded-full mr-3 flex-shrink-0">
                  <Award className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Win Real Prizes</h3>
                  <p className="text-sm text-slate-500">Compete for real cash prizes and track your earnings over time</p>
                </div>
              </div>
              
              <div className="flex items-start p-4 bg-white rounded-lg shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                <div className="bg-primary/10 p-2 rounded-full mr-3 flex-shrink-0">
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Secure Payments</h3>
                  <p className="text-sm text-slate-500">Integrated payment processing with Stripe for safe and reliable transactions</p>
                </div>
              </div>
              
              <div className="flex items-start p-4 bg-white rounded-lg shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                <div className="bg-primary/10 p-2 rounded-full mr-3 flex-shrink-0">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Fair Play Guaranteed</h3>
                  <p className="text-sm text-slate-500">Transparent rules and automated prize distribution system</p>
                </div>
              </div>
            </div>
            
            <div className="mt-8 text-center">
              <p className="text-sm text-slate-500 mb-2">Join thousands of players nationwide</p>
              <div className="flex items-center justify-center space-x-4">
                <Globe className="h-4 w-4 text-slate-400" />
                <span className="text-xs text-slate-400">Available in all 50 states</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="w-full max-w-md md:w-1/2">
        <AuthForm onSuccess={handleAuthSuccess} />
        
        {isMobile && (
          <div className="mt-8">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col items-center p-3 bg-white rounded-lg shadow-sm border border-slate-100">
                <Trophy className="h-5 w-5 text-primary mb-1" />
                <p className="text-xs text-center">Create & Host Games</p>
              </div>
              
              <div className="flex flex-col items-center p-3 bg-white rounded-lg shadow-sm border border-slate-100">
                <Users className="h-5 w-5 text-primary mb-1" />
                <p className="text-xs text-center">Join Competitions</p>
              </div>
              
              <div className="flex flex-col items-center p-3 bg-white rounded-lg shadow-sm border border-slate-100">
                <Award className="h-5 w-5 text-primary mb-1" />
                <p className="text-xs text-center">Win Real Prizes</p>
              </div>
              
              <div className="flex flex-col items-center p-3 bg-white rounded-lg shadow-sm border border-slate-100">
                <CreditCard className="h-5 w-5 text-primary mb-1" />
                <p className="text-xs text-center">Secure Payments</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
