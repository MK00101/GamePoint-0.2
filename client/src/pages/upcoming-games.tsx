import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Game } from "@shared/schema";
import { AppLayout } from "@/components/layout/app-layout";
import { GameCard } from "@/components/dashboard/game-card";
import { Button } from "@/components/ui/button";
import { CreateGameModal } from "@/components/modals/create-game-modal";
import { JoinGameModal } from "@/components/modals/join-game-modal";
import { useAuth } from "@/context/auth-context";
import { Calendar } from "lucide-react";

export default function UpcomingGames() {
  const [createGameModalOpen, setCreateGameModalOpen] = useState(false);
  const [joinGameModalOpen, setJoinGameModalOpen] = useState(false);
  const { user } = useAuth();

  // Fetch upcoming games
  const { data: upcomingGames = [], isLoading } = useQuery<Game[]>({
    queryKey: ['/api/games', { status: 'scheduled' }],
    enabled: !!user?.id
  });

  // Filter games by date
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);
  
  const todayGames = upcomingGames.filter(game => {
    const gameDate = new Date(game.datetime);
    gameDate.setHours(0, 0, 0, 0);
    return gameDate.getTime() === today.getTime();
  });
  
  const tomorrowGames = upcomingGames.filter(game => {
    const gameDate = new Date(game.datetime);
    gameDate.setHours(0, 0, 0, 0);
    return gameDate.getTime() === tomorrow.getTime();
  });
  
  const thisWeekGames = upcomingGames.filter(game => {
    const gameDate = new Date(game.datetime);
    gameDate.setHours(0, 0, 0, 0);
    return gameDate > today && gameDate < nextWeek && 
           gameDate.getTime() !== tomorrow.getTime();
  });
  
  const laterGames = upcomingGames.filter(game => {
    const gameDate = new Date(game.datetime);
    gameDate.setHours(0, 0, 0, 0);
    return gameDate >= nextWeek;
  });

  return (
    <AppLayout 
      title="Upcoming Games"
      actions={
        <div className="space-x-3">
          <Button
            variant="outline"
            onClick={() => setJoinGameModalOpen(true)}
          >
            Join Game
          </Button>
          <Button onClick={() => setCreateGameModalOpen(true)}>
            Create Game
          </Button>
        </div>
      }
    >
      {isLoading ? (
        <div className="text-center p-8">Loading upcoming games...</div>
      ) : upcomingGames.length === 0 ? (
        <div className="text-center p-8 bg-white shadow rounded-lg">
          <Calendar className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="text-lg font-medium text-slate-900 mt-2 mb-2">No upcoming games</h3>
          <p className="text-slate-500 mb-4">There are no scheduled games available at the moment.</p>
          <div className="flex justify-center space-x-4">
            <Button
              variant="outline"
              onClick={() => setJoinGameModalOpen(true)}
            >
              Join Game
            </Button>
            <Button onClick={() => setCreateGameModalOpen(true)}>
              Create Game
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Today's Games */}
          {todayGames.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Today</h2>
              <div className="grid gap-6 mb-8 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                {todayGames.map(game => (
                  <GameCard
                    key={game.id}
                    game={game}
                    organizerName="Game Master"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Tomorrow's Games */}
          {tomorrowGames.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Tomorrow</h2>
              <div className="grid gap-6 mb-8 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                {tomorrowGames.map(game => (
                  <GameCard
                    key={game.id}
                    game={game}
                    organizerName="Game Master"
                  />
                ))}
              </div>
            </div>
          )}

          {/* This Week's Games */}
          {thisWeekGames.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-4">This Week</h2>
              <div className="grid gap-6 mb-8 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                {thisWeekGames.map(game => (
                  <GameCard
                    key={game.id}
                    game={game}
                    organizerName="Game Master"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Later Games */}
          {laterGames.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Coming Up</h2>
              <div className="grid gap-6 mb-8 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                {laterGames.map(game => (
                  <GameCard
                    key={game.id}
                    game={game}
                    organizerName="Game Master"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <CreateGameModal
        open={createGameModalOpen}
        onOpenChange={setCreateGameModalOpen}
      />
      <JoinGameModal
        open={joinGameModalOpen}
        onOpenChange={setJoinGameModalOpen}
        userId={user?.id}
      />
    </AppLayout>
  );
}
