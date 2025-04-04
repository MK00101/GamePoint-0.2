import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { User, Game } from "@shared/schema";
import { AppLayout } from "@/components/layout/app-layout";
import { StatsCard } from "@/components/dashboard/stats-card";
import { GameCard } from "@/components/dashboard/game-card";
import { ReferralSection } from "@/components/dashboard/referral-section";
import { CreateGameModal } from "@/components/modals/create-game-modal";
import { JoinGameModal } from "@/components/modals/join-game-modal";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { 
  DollarSign, 
  Trophy, 
  Users, 
  CalendarDays,
  PlusCircle,
  UserPlus,
  ArrowUpRight,
  Loader2
} from "lucide-react";
import { useLocation } from "wouter";

export default function Dashboard() {
  const [_, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("upcoming");
  const [createGameModalOpen, setCreateGameModalOpen] = useState(false);
  const [joinGameModalOpen, setJoinGameModalOpen] = useState(false);

  // Fetch current user
  const { data: user } = useQuery<User | null>({
    queryKey: ['/api/auth/session']
  });

  // Fetch earnings
  const { data: earnings = { total: 0 } } = useQuery<{ total: number }>({
    queryKey: ['/api/earnings'],
    enabled: !!user
  });

  // Fetch referrals
  const { data: referrals = { total: 0, totalEarnings: 0 } } = useQuery<{ total: number, totalEarnings: number }>({
    queryKey: ['/api/referrals'],
    enabled: !!user
  });

  // Fetch user's upcoming games
  const { data: myGames = [], isLoading: isLoadingGames } = useQuery<Game[]>({
    queryKey: ['/api/games/my-games'],
    enabled: !!user
  });

  // Fetch games created by user
  const { data: createdGames = [] } = useQuery<Game[]>({
    queryKey: ['/api/games/created'],
    enabled: !!user
  });

  // Fetch available games
  const { data: availableGames = [] } = useQuery<Game[]>({
    queryKey: ['/api/games', { status: 'scheduled' }],
    enabled: !!user
  });

  // Fetch past games
  const { data: pastGames = [] } = useQuery<Game[]>({
    queryKey: ['/api/games', { status: 'completed' }],
    enabled: !!user
  });

  const lastMonthEarnings = 150; // In a real app, this would come from the API
  const earningsTrend = {
    value: "+12%",
    isPositive: true
  };

  // Action buttons for the header
  const actionButtons = (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={() => setJoinGameModalOpen(true)}
      >
        <UserPlus className="h-4 w-4" />
        <span>Join Game</span>
      </Button>
      <Button
        size="sm"
        className="gap-1.5"
        onClick={() => setCreateGameModalOpen(true)}
      >
        <PlusCircle className="h-4 w-4" />
        <span>Create Game</span>
      </Button>
    </>
  );

  return (
    <AppLayout 
      title="Dashboard" 
      subtitle="Welcome back! Here's an overview of your gaming activity."
      actions={actionButtons}
    >
      {/* Stats Section */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-10">
        <StatsCard
          icon={<DollarSign className="h-6 w-6 text-green-600" />}
          iconBgColor="bg-green-100"
          iconColor="text-green-600"
          title="Total Earnings"
          value={formatCurrency(earnings.total)}
          linkText="View earnings history"
          linkHref="/earnings"
          trend={earningsTrend}
        />

        <StatsCard
          icon={<Trophy className="h-6 w-6 text-primary-600" />}
          iconBgColor="bg-primary-100"
          iconColor="text-primary-600"
          title="Games Created"
          value={createdGames.length}
          linkText="View all created games"
          linkHref="/my-games"
        />

        <StatsCard
          icon={<CalendarDays className="h-6 w-6 text-amber-600" />}
          iconBgColor="bg-amber-100"
          iconColor="text-amber-600"
          title="Upcoming Games"
          value={myGames.filter(g => g.status === 'scheduled').length}
          linkText="View your upcoming games"
          linkHref="/upcoming"
        />
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="sm:hidden">
          <label htmlFor="tabs" className="sr-only">
            Select a tab
          </label>
          <select
            id="tabs"
            name="tabs"
            className="block w-full rounded-md border-slate-300 focus:border-primary-500 focus:ring-primary-500"
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value)}
          >
            <option value="upcoming">My Upcoming Games</option>
            <option value="available">Available Games</option>
            <option value="past">Past Games</option>
          </select>
        </div>
        <div className="hidden sm:block">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3 h-auto p-1 bg-slate-100 rounded-xl">
              <TabsTrigger 
                value="upcoming"
                className="rounded-lg py-2.5 data-[state=active]:bg-white data-[state=active]:text-primary-700 data-[state=active]:shadow-sm"
              >
                My Upcoming
              </TabsTrigger>
              <TabsTrigger 
                value="available"
                className="rounded-lg py-2.5 data-[state=active]:bg-white data-[state=active]:text-primary-700 data-[state=active]:shadow-sm"
              >
                Available Games
              </TabsTrigger>
              <TabsTrigger 
                value="past"
                className="rounded-lg py-2.5 data-[state=active]:bg-white data-[state=active]:text-primary-700 data-[state=active]:shadow-sm"
              >
                Past Games
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Games Sections */}
      <Tabs value={activeTab} className="w-full">
        <TabsContent value="upcoming" className="mt-4">
          {isLoadingGames ? (
            <div className="grid gap-6 mb-8 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="animate-pulse">
                      <div className="h-48 bg-slate-200"></div>
                      <div className="p-4">
                        <div className="h-4 bg-slate-200 rounded-full w-3/4 mb-2"></div>
                        <div className="h-4 bg-slate-200 rounded-full w-1/2 mb-4"></div>
                        <div className="flex justify-between">
                          <div className="h-8 bg-slate-200 rounded-full w-1/4"></div>
                          <div className="h-8 bg-slate-200 rounded-full w-1/4"></div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : myGames.filter(g => g.status === 'scheduled').length === 0 ? (
            <Card className="border-dashed border-2 border-slate-200 bg-white/50">
              <CardContent className="flex flex-col items-center justify-center text-center p-10">
                <div className="rounded-full bg-primary-50 p-3 mb-4">
                  <CalendarDays className="h-8 w-8 text-primary-500" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-2">No upcoming games</h3>
                <p className="text-slate-500 mb-6 max-w-md">You don't have any upcoming games. Join an existing game or create your own!</p>
                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    onClick={() => setJoinGameModalOpen(true)}
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Join Game
                  </Button>
                  <Button onClick={() => setCreateGameModalOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Game
                  </Button>
                </div>
              </CardContent>
            </Card>
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

        <TabsContent value="available" className="mt-4">
          {availableGames.length === 0 ? (
            <Card className="border-dashed border-2 border-slate-200 bg-white/50">
              <CardContent className="flex flex-col items-center justify-center text-center p-10">
                <div className="rounded-full bg-amber-50 p-3 mb-4">
                  <Trophy className="h-8 w-8 text-amber-500" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-2">No available games</h3>
                <p className="text-slate-500 mb-6 max-w-md">There are no games available right now. Be the first to create one!</p>
                <Button onClick={() => setCreateGameModalOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Game
                </Button>
              </CardContent>
            </Card>
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

        <TabsContent value="past" className="mt-4">
          {pastGames.length === 0 ? (
            <Card className="border-dashed border-2 border-slate-200 bg-white/50">
              <CardContent className="flex flex-col items-center justify-center text-center p-10">
                <div className="rounded-full bg-slate-100 p-3 mb-4">
                  <ArrowUpRight className="h-8 w-8 text-slate-500" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-2">No past games</h3>
                <p className="text-slate-500 mb-6 max-w-md">You haven't participated in any completed games yet. Start by joining a game!</p>
                <Button 
                  variant="outline"
                  onClick={() => setJoinGameModalOpen(true)}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Join Game
                </Button>
              </CardContent>
            </Card>
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

      {/* Referrals Section */}
      <ReferralSection
        username={user?.username || ""}
        totalReferrals={referrals.total}
        totalEarnings={referrals.totalEarnings}
      />

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
