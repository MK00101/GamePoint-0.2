import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { useAuth } from "@/context/auth-context";
import { formatCurrency, formatDateTime, calculatePrizeDistribution } from "@/lib/utils";
import { Game, GameType, TournamentStructure, User } from "@shared/schema";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { JoinGameModal } from "@/components/modals/join-game-modal";
import { MapPin, Calendar, Users, Trophy, AlertCircle, Tag } from "lucide-react";

export default function GameDetails() {
  const [_, params] = useRoute("/games/:id");
  const gameId = parseInt(params?.id || "0");
  const { user } = useAuth();
  const { toast } = useToast();
  const [joinGameModalOpen, setJoinGameModalOpen] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  // Fetch game details
  const { data: game, isLoading: isLoadingGame } = useQuery<Game>({
    queryKey: [`/api/games/${gameId}`],
    enabled: !!gameId,
  });

  // Fetch game type
  const { data: gameTypes = [] } = useQuery<GameType[]>({
    queryKey: ['/api/game-types'],
  });

  // Fetch tournament structure
  const { data: tournamentStructures = [] } = useQuery<TournamentStructure[]>({
    queryKey: ['/api/tournament-structures'],
  });

  // Fetch game participants
  const { data: participants = [], isLoading: isLoadingParticipants } = useQuery<any[]>({
    queryKey: [`/api/games/${gameId}/participants`],
    enabled: !!gameId,
  });

  // Fetch game master (creator)
  const { data: gameMaster } = useQuery<User>({
    queryKey: [`/api/users/${game?.gameMasterId}`],
    enabled: !!game?.gameMasterId,
  });

  // Check if current user has already joined
  const hasJoined = participants.some((p) => p.userId === user?.id);

  const gameType = gameTypes.find(t => t.id === game?.gameTypeId);
  const structure = tournamentStructures.find(s => s.id === game?.structureId);
  
  // Calculate prize distributions
  const prizeDistribution = game ? calculatePrizeDistribution(game.prizePool) : null;

  // Calculate progress
  const progress = game ? (game.currentPlayers / game.maxPlayers) * 100 : 0;
  const spotsLeft = game ? game.maxPlayers - game.currentPlayers : 0;

  const joinGame = async () => {
    if (!game || !user) return;
    
    // Redirect to payment page directly
    window.location.href = `/payment/${game.id}`;
  };

  // Get badge color based on game type
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

  // Get status badge color
  const getStatusBadgeColor = (status?: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      case "active":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-purple-100 text-purple-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "postponed":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  if (isLoadingGame) {
    return (
      <AppLayout title="Game Details">
        <div className="flex justify-center items-center h-64">
          <p>Loading game details...</p>
        </div>
      </AppLayout>
    );
  }

  if (!game) {
    return (
      <AppLayout title="Game Not Found">
        <div className="text-center py-12">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <h2 className="mt-4 text-lg font-medium">Game not found</h2>
          <p className="mt-2 text-sm text-gray-500">The game you're looking for doesn't exist or has been removed.</p>
          <Button className="mt-6" onClick={() => window.history.back()}>
            Go Back
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout 
      title={game.name}
      actions={
        !hasJoined && game.status === 'scheduled' && (
          <Button
            onClick={joinGame}
            disabled={isJoining || game.currentPlayers >= game.maxPlayers}
          >
            {isJoining ? "Processing..." : `Join & Pay - ${formatCurrency(game.entryFee)}`}
          </Button>
        )
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Info Column */}
        <div className="md:col-span-2 space-y-6">
          {/* Game Info Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-wrap gap-2 mb-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getBadgeColor(gameType?.name)}`}>
                  {gameType?.name || "Other"}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(game.status)}`}>
                  {game.status.charAt(0).toUpperCase() + game.status.slice(1)}
                </span>
                {game.isPrivate && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                    Private
                  </span>
                )}
              </div>

              <h2 className="text-xl font-bold text-slate-900 mb-4">{game.name}</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-slate-400" />
                  <span className="text-sm text-slate-600">{game.location}</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-slate-400" />
                  <span className="text-sm text-slate-600">{formatDateTime(game.datetime)}</span>
                </div>
                <div className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-slate-400" />
                  <span className="text-sm text-slate-600">
                    {game.currentPlayers}/{game.maxPlayers} players joined
                  </span>
                </div>
                <div className="flex items-center">
                  <Trophy className="h-5 w-5 mr-2 text-slate-400" />
                  <span className="text-sm text-slate-600">
                    {structure?.name || "Unknown format"}
                  </span>
                </div>
                <div className="flex items-center">
                  <Tag className="h-5 w-5 mr-2 text-slate-400" />
                  <span className="text-sm text-slate-600">
                    Entry Fee: {formatCurrency(game.entryFee)}
                  </span>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-medium text-slate-700 mb-2">Registration Status</h3>
                <Progress value={progress} className="h-2.5 mb-1" />
                <div className="flex justify-between text-xs text-slate-500">
                  <span>
                    {game.currentPlayers}/{game.maxPlayers} players joined
                  </span>
                  <span>{spotsLeft} spots left</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Organizer & Participants Card */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-medium text-slate-900 mb-4">Game Master</h3>
              <div className="flex items-center mb-6">
                <div className="h-10 w-10 rounded-full bg-secondary-200 flex items-center justify-center text-secondary-600 font-bold text-lg">
                  {gameMaster?.fullName?.charAt(0) || "G"}
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-900">{gameMaster?.fullName || "Game Master"}</p>
                  <p className="text-xs text-slate-500">{gameMaster?.username || ""}</p>
                </div>
              </div>

              <h3 className="text-lg font-medium text-slate-900 mb-4">Participants</h3>
              {isLoadingParticipants ? (
                <p>Loading participants...</p>
              ) : participants.length === 0 ? (
                <p className="text-sm text-slate-500">No participants have joined yet.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {participants.map((participant) => (
                    <div key={participant.id} className="flex items-center border rounded-md p-3">
                      <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-medium">
                        {participant.userId.toString().charAt(0)}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-slate-900">Player {participant.userId}</p>
                        <p className="text-xs text-slate-500">Joined {new Date(participant.joinedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-6">
          {/* Prize Pool Card */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-medium text-slate-900 mb-4">Prize Pool</h3>
              <div className="text-3xl font-bold text-success-600 mb-6">
                {formatCurrency(game.prizePool)}
              </div>

              <h4 className="text-sm font-medium text-slate-700 mb-2">Prize Distribution</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Platform Fee (10%)</span>
                  <span className="text-sm font-medium text-slate-900">
                    {prizeDistribution ? formatCurrency(prizeDistribution.platformFee) : '-'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Game Master (5%)</span>
                  <span className="text-sm font-medium text-slate-900">
                    {prizeDistribution ? formatCurrency(prizeDistribution.gameMasterFee) : '-'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Promoters (10%)</span>
                  <span className="text-sm font-medium text-slate-900">
                    {prizeDistribution ? formatCurrency(prizeDistribution.promotersFee) : '-'}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-700">Winners (75%)</span>
                  <span className="text-sm font-bold text-success-600">
                    {prizeDistribution ? formatCurrency(prizeDistribution.winnersPrize) : '-'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions Card */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-medium text-slate-900 mb-4">Actions</h3>
              <div className="space-y-3">
                {!hasJoined && game.status === 'scheduled' && (
                  <Button 
                    onClick={joinGame} 
                    className="w-full"
                    disabled={isJoining || game.currentPlayers >= game.maxPlayers}
                  >
                    {isJoining ? "Processing..." : `Join & Pay - ${formatCurrency(game.entryFee)}`}
                  </Button>
                )}
                
                {hasJoined && game.status === 'scheduled' && (
                  <div className="space-y-4">
                    <div className="bg-green-50 p-4 rounded-md">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-green-800">
                            You have successfully joined this game!
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Payment button for joined users */}
                    {hasJoined && !participants.find(p => p.userId === user?.id)?.hasPaid && (
                      <Button 
                        className="w-full" 
                        onClick={() => window.location.href = `/payment/${game.id}`}
                      >
                        Pay Entry Fee - {formatCurrency(game.entryFee)}
                      </Button>
                    )}
                    
                    {/* Payment confirmation for users who already paid */}
                    {hasJoined && participants.find(p => p.userId === user?.id)?.hasPaid && (
                      <div className="bg-blue-50 p-4 rounded-md">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-blue-800">
                              Payment completed! You're all set for this game.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => window.navigator.share?.({
                    title: game.name,
                    text: `Join me for ${game.name} on GameOn!`,
                    url: window.location.href
                  })}
                >
                  Share This Game
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <JoinGameModal
        open={joinGameModalOpen}
        onOpenChange={setJoinGameModalOpen}
        userId={user?.id}
      />
    </AppLayout>
  );
}
