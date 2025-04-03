import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Game, GameType } from "@shared/schema";
import { formatCurrency, formatDateTime } from "@/lib/utils";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Calendar } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface GameItemProps {
  game: Game;
  gameType?: GameType;
  organizerName?: string;
  onClick: (game: Game) => void;
}

function GameItem({ game, gameType, organizerName, onClick }: GameItemProps) {
  // Determine the badge color based on game type
  const getBadgeColor = (type?: string) => {
    switch (type?.toLowerCase()) {
      case "basketball":
        return "bg-success-100 text-success-800";
      case "soccer":
        return "bg-warning-100 text-warning-800";
      case "tennis":
        return "bg-slate-100 text-slate-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  return (
    <div 
      className="rounded-lg border border-slate-200 p-4 hover:border-secondary-300 hover:bg-slate-50 cursor-pointer"
      onClick={() => onClick(game)}
    >
      <div className="flex justify-between items-start">
        <div>
          <span className={cn(
            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mb-1",
            getBadgeColor(gameType?.name)
          )}>
            {gameType?.name || "Other"}
          </span>
          <h4 className="text-sm font-medium text-slate-900">{game.name}</h4>
          <p className="text-xs text-slate-500 mt-1">By {organizerName || "Game Master"} • {game.currentPlayers}/{game.maxPlayers} players</p>
          <div className="flex items-center text-xs text-slate-500 mt-2">
            <MapPin className="h-4 w-4 mr-1 text-slate-400" />
            {game.location}
          </div>
          <div className="flex items-center text-xs text-slate-500 mt-1">
            <Calendar className="h-4 w-4 mr-1 text-slate-400" />
            {formatDateTime(game.datetime)}
          </div>
        </div>
        <div className="text-right">
          <span className="text-sm font-bold text-slate-900">${game.entryFee}</span>
          <p className="text-xs text-slate-500">entry fee</p>
          <span className="block text-xs font-medium text-success-600 mt-3">{formatCurrency(game.prizePool)} prize</span>
        </div>
      </div>
    </div>
  );
}

interface JoinGameModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId?: number;
  referrerId?: number;
}

export function JoinGameModal({ open, onOpenChange, userId, referrerId }: JoinGameModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [isJoining, setIsJoining] = useState(false);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const { toast } = useToast();

  // Fetch available games
  const { data: games = [], isLoading } = useQuery<Game[]>({
    queryKey: ['/api/games', { status: 'scheduled' }],
  });

  // Fetch game types
  const { data: gameTypes = [] } = useQuery<GameType[]>({
    queryKey: ['/api/game-types'],
  });

  const filteredGames = games.filter(game => {
    const matchesSearch = searchQuery === "" ||
      game.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      game.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = selectedFilter === "all" ||
      (gameTypes.find(type => type.id === game.gameTypeId)?.name.toLowerCase() === selectedFilter);
    
    return matchesSearch && matchesFilter;
  });

  const handleGameClick = (game: Game) => {
    setSelectedGame(game);
  };

  const handleJoinGame = async () => {
    if (!selectedGame || !userId) return;
    
    setIsJoining(true);
    try {
      await apiRequest("POST", `/api/games/${selectedGame.id}/join`, {
        referredBy: referrerId
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/games'] });
      queryClient.invalidateQueries({ queryKey: ['/api/games/my-games'] });
      
      toast({
        title: "Successfully joined game!",
        description: `You have joined "${selectedGame.name}"`,
      });
      
      onOpenChange(false);
      setSelectedGame(null);
    } catch (error) {
      toast({
        title: "Failed to join game",
        description: "There was an error joining the game. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsJoining(false);
    }
  };

  const getGameType = (typeId: number) => {
    return gameTypes.find(type => type.id === typeId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Join a Game</DialogTitle>
        </DialogHeader>

        {/* Search Box */}
        <div className="mb-5">
          <label htmlFor="search" className="block text-sm font-medium text-slate-700 mb-1">Find a game</label>
          <div className="relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <Input 
              type="text" 
              id="search" 
              placeholder="Search by name, location, or game type"
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Filter Options */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setSelectedFilter("all")}
            className={cn(
              "inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium",
              selectedFilter === "all" 
                ? "bg-secondary-100 text-secondary-800" 
                : "bg-slate-100 text-slate-800 hover:bg-slate-200"
            )}
          >
            All Games
          </button>
          {gameTypes.map(type => (
            <button
              key={type.id}
              onClick={() => setSelectedFilter(type.name.toLowerCase())}
              className={cn(
                "inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium",
                selectedFilter === type.name.toLowerCase()
                  ? "bg-secondary-100 text-secondary-800"
                  : "bg-slate-100 text-slate-800 hover:bg-slate-200"
              )}
            >
              {type.name}
            </button>
          ))}
        </div>

        {/* Game List */}
        {isLoading ? (
          <div className="text-center py-4">Loading available games...</div>
        ) : filteredGames.length === 0 ? (
          <div className="text-center py-4 text-slate-500">
            No games found matching your criteria
          </div>
        ) : (
          <ScrollArea className="max-h-80">
            <div className="space-y-3">
              {filteredGames.map(game => (
                <GameItem
                  key={game.id}
                  game={game}
                  gameType={getGameType(game.gameTypeId)}
                  organizerName="Game Master"
                  onClick={handleGameClick}
                />
              ))}
            </div>
          </ScrollArea>
        )}

        <DialogFooter>
          <Button
            onClick={() => onOpenChange(false)}
            variant="outline"
          >
            Cancel
          </Button>
          {selectedGame && (
            <Button
              onClick={handleJoinGame}
              disabled={isJoining || !userId}
            >
              {isJoining ? "Joining..." : `Join for $${selectedGame.entryFee}`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
