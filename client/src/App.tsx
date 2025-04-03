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
import UpcomingGames from "@/pages/upcoming-games";
import Earnings from "@/pages/earnings";
import Profile from "@/pages/profile";
import { AuthProvider } from "@/context/auth-context";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/games/:id" component={GameDetails} />
      <Route path="/my-games" component={MyGames} />
      <Route path="/upcoming" component={UpcomingGames} />
      <Route path="/earnings" component={Earnings} />
      <Route path="/profile" component={Profile} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
