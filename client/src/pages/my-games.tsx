import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Game } from "@shared/schema";
import { AppLayout } from "@/components/layout/app-layout";
import { GameCard } from "@/components/dashboard/game-card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/context/auth-context";

export default function MyGames() {
  const [activeTab, setActiveTab] = useState("created");
  const { user } = useAuth();

  // Fetch games created by user
  const { data: createdGames = [], isLoading: isLoadingCreated } = useQuery<Game[]>({
    queryKey: ['/api/games/created'],
    enabled: !!user?.id
  });

  // Fetch games participated in
  const { data: participatedGames = [], isLoading: isLoadingParticipated } = useQuery<Game[]>({
    queryKey: ['/api/games/my-games'],
    enabled: !!user?.id
  });

  return (
    <AppLayout 
      title="My Games" 
      actions={
        <Button onClick={() => window.location.href = "/create-game"}>
          Create Game
        </Button>
      }
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-6">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="created">Games I Created</TabsTrigger>
          <TabsTrigger value="participated">Games I Joined</TabsTrigger>
        </TabsList>
        
        <TabsContent value="created" className="mt-0">
          {isLoadingCreated ? (
            <div className="text-center p-8">Loading your created games...</div>
          ) : createdGames.length === 0 ? (
            <div className="text-center p-8 bg-white shadow rounded-lg">
              <h3 className="text-lg font-medium text-slate-900 mb-2">You haven't created any games</h3>
              <p className="text-slate-500 mb-4">Start creating your own tournaments and competitions!</p>
              <Button onClick={() => window.location.href = "/create-game"}>
                Create Your First Game
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 mb-8 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
              {createdGames.map(game => (
                <GameCard
                  key={game.id}
                  game={game}
                  organizerName={user?.fullName || "You"}
                />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="participated" className="mt-0">
          {isLoadingParticipated ? (
            <div className="text-center p-8">Loading games you've joined...</div>
          ) : participatedGames.length === 0 ? (
            <div className="text-center p-8 bg-white shadow rounded-lg">
              <h3 className="text-lg font-medium text-slate-900 mb-2">You haven't joined any games</h3>
              <p className="text-slate-500 mb-4">Explore available games and start competing!</p>
              <Button onClick={() => window.location.href = "/dashboard"}>
                Find Games to Join
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 mb-8 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
              {participatedGames.map(game => (
                <GameCard
                  key={game.id}
                  game={game}
                  organizerName="Game Master"
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
