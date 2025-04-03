import { Game, GameType } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { MapPin, Calendar } from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

interface GameCardProps {
  game: Game;
  gameType?: GameType;
  organizerName?: string;
}

export function GameCard({ game, gameType, organizerName }: GameCardProps) {
  const spotsLeft = game.maxPlayers - game.currentPlayers;
  const progress = (game.currentPlayers / game.maxPlayers) * 100;

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
    <Card className="shadow overflow-hidden">
      <CardContent className="p-5">
        <div className="flex justify-between items-center mb-3">
          <span
            className={cn(
              "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
              getBadgeColor(gameType?.name)
            )}
          >
            {gameType?.name || "Other"}
          </span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
            {formatCurrency(game.entryFee)} Entry
          </span>
        </div>
        <h3 className="text-lg leading-6 font-medium text-slate-900 mb-1">
          {game.name}
        </h3>
        <p className="text-sm text-slate-500 mb-3">
          Organized by {organizerName || "Game Master"}
        </p>
        <div className="flex items-center text-sm text-slate-500 mb-4">
          <MapPin className="h-5 w-5 mr-1 text-slate-400" />
          {game.location}
        </div>
        <div className="flex items-center text-sm text-slate-500 mb-4">
          <Calendar className="h-5 w-5 mr-1 text-slate-400" />
          {formatDateTime(game.datetime)}
        </div>
        <Progress value={progress} className="h-2.5 mb-1" />
        <div className="flex justify-between text-xs text-slate-500 mb-4">
          <span>
            {game.currentPlayers}/{game.maxPlayers} players joined
          </span>
          <span>{spotsLeft} spots left</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-slate-900 font-medium">Prize Pool:</span>
            <span className="text-success-600 font-bold ml-1">
              {formatCurrency(game.prizePool)}
            </span>
          </div>
          <Link
            href={`/games/${game.id}`}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-secondary-600 hover:bg-secondary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary-500"
          >
            View Details
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
