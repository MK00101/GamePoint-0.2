import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Game } from "@shared/schema";
import { GameCard } from "@/components/dashboard/game-card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

interface GamesTabsProps {
  userId: number;
  onJoinGame: () => void;
  onCreateGame: () => void;
}

export function GamesTabs({ userId, onJoinGame, onCreateGame }: GamesTabsProps) {
  const [activeTab, setActiveTab] = useState("upcoming");

  // Fetch user's upcoming games
  const { data: myGames = [], isLoading: isLoadingGames } = useQuery<Game[]>({
    queryKey: ['/api/games/my-games'],
    enabled: !!userId
  });

  // Fetch available games
  const { data: availableGames = [] } = useQuery<Game[]>({
    queryKey: ['/api/games', { status: 'scheduled' }],
    enabled: !!userId
  });

  // Fetch past games
  const { data: pastGames = [] } = useQuery<Game[]>({
    queryKey: ['/api/games', { status: 'completed' }],
    enabled: !!userId
  });

  return (
    <>
      {/* Tabs */}
      <div className="mb-6">
        <div className="sm:hidden">
          <label htmlFor="tabs" className="sr-only">
            Select a tab
          </label>
          <select
            id="tabs"
            name="tabs"
            className="block w-full rounded-md border-slate-300 focus:border-secondary-500 focus:ring-secondary-500"
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value)}
          >
            <option value="upcoming">My Upcoming Games</option>
            <option value="available">Available Games</option>
            <option value="past">Past Games</option>
          </select>
        </div>
        <div className="hidden sm:block">
          <div className="border-b border-slate-200">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="-mb-px flex space-x-8">
                <TabsTrigger
                  value="upcoming"
                  className="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm data-[state=active]:border-secondary-500 data-[state=active]:text-secondary-600 border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                >
                  My Upcoming Games
                </TabsTrigger>
                <TabsTrigger
                  value="available"
                  className="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm data-[state=active]:border-secondary-500 data-[state=active]:text-secondary-600 border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                >
                  Available Games
                </TabsTrigger>
                <TabsTrigger
                  value="past"
                  className="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm data-[state=active]:border-secondary-500 data-[state=active]:text-secondary-600 border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                >
                  Past Games
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Games Sections */}
      <Tabs value={activeTab} className="w-full">
        <TabsContent value="upcoming" className="mt-0">
          {isLoadingGames ? (
            <div className="text-center p-8">Loading your games...</div>
          ) : myGames.filter(g => g.status === 'scheduled').length === 0 ? (
            <div className="text-center p-8 bg-white shadow rounded-lg">
              <h3 className="text-lg font-medium text-slate-900 mb-2">No upcoming games</h3>
              <p className="text-slate-500 mb-4">You don't have any upcoming games. Join an existing game or create your own!</p>
              <div className="flex justify-center gap-4">
                <Button
                  variant="outline"
                  onClick={onJoinGame}
                >
                  Join Game
                </Button>
                <Button onClick={onCreateGame}>
                  Create Game
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid gap-6 mb-8 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
              {myGames
                .filter(g => g.status === 'scheduled')
                .map(game => (
                  <GameCard
                    key={game.id}
                    game={game}
                    organizerName="Game Master"
                  />
                ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="available" className="mt-0">
          {availableGames.length === 0 ? (
            <div className="text-center p-8 bg-white shadow rounded-lg">
              <h3 className="text-lg font-medium text-slate-900 mb-2">No available games</h3>
              <p className="text-slate-500 mb-4">There are no games available right now. Why not create one?</p>
              <Button onClick={onCreateGame}>
                Create Game
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 mb-8 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
              {availableGames.map(game => (
                <GameCard
                  key={game.id}
                  game={game}
                  organizerName="Game Master"
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-0">
          {pastGames.length === 0 ? (
            <div className="text-center p-8 bg-white shadow rounded-lg">
              <h3 className="text-lg font-medium text-slate-900 mb-2">No past games</h3>
              <p className="text-slate-500">You haven't participated in any completed games yet.</p>
            </div>
          ) : (
            <div className="grid gap-6 mb-8 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
              {pastGames.map(game => (
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
    </>
  );
}
