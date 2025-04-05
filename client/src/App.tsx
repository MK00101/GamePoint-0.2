import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import AuthPage from "@/pages/auth";
import Home from "@/pages/home";
import GameDetails from "@/pages/game-details";
import MyGames from "@/pages/my-games";
import CreateGame from "@/pages/create-game";
import UpcomingGames from "@/pages/upcoming-games";
import Earnings from "@/pages/earnings";
import Profile from "@/pages/profile";
import Payment from "@/pages/payment";
import Notifications from "@/pages/notifications";
import Settings from "@/pages/settings";
import { AuthProvider } from "@/context/auth-context";
import { ProtectedRoute } from "./lib/protected-route";

// Router with protected and public routes
function AppRouter() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={Home} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/games/:id" component={GameDetails} />
      <Route path="/upcoming" component={UpcomingGames} />
      
      {/* Protected routes */}
      <ProtectedRoute path="/dashboard" component={Dashboard} />
      <ProtectedRoute path="/my-games" component={MyGames} />
      <ProtectedRoute path="/create-game" component={CreateGame} />
      <ProtectedRoute path="/earnings" component={Earnings} />
      <ProtectedRoute path="/profile" component={Profile} />
      <ProtectedRoute path="/payment/:gameId" component={Payment} />
      <ProtectedRoute path="/payment/success" component={Payment} />
      <ProtectedRoute path="/notifications" component={Notifications} />
      <ProtectedRoute path="/settings" component={Settings} />
      
      {/* Fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppRouter />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
