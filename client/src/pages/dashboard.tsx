import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { User, Game } from "@shared/schema";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { StatsCard } from "@/components/dashboard/stats-card";
import { GameCard } from "@/components/dashboard/game-card";
import { ReferralSection } from "@/components/dashboard/referral-section";
import { CreateGameModal } from "@/components/modals/create-game-modal";
import { JoinGameModal } from "@/components/modals/join-game-modal";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/utils";
import { DollarSign, Zap, Users } from "lucide-react";
import { useLocation } from "wouter";

export default function Dashboard() {
  const [_, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("upcoming");
  const [createGameModalOpen, setCreateGameModalOpen] = useState(false);
  const [joinGameModalOpen, setJoinGameModalOpen] = useState(false);

  // Fetch current user
  const { data: user, isLoading: isLoadingUser } = useQuery<User | null>({
    queryKey: ['/api/auth/session'],
    onError: () => {
      navigate("/auth");
    }
  });

  // Fetch earnings
  const { data: earnings } = useQuery({
    queryKey: ['/api/earnings'],
    enabled: !!user
  });

  // Fetch referrals
  const { data: referrals } = useQuery({
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

  if (isLoadingUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    navigate("/auth");
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Mobile Navigation */}
      <MobileNav user={user} />

      {/* Sidebar for Desktop */}
      <Sidebar user={user} />

      {/* Main Content */}
      <div className="md:pl-64 flex flex-col flex-1">
        <main className="flex-1 pb-16 md:pb-6">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {/* Page Header */}
              <div className="md:flex md:items-center md:justify-between mb-6">
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl font-bold leading-7 text-slate-900 sm:text-3xl sm:truncate">
                    Dashboard
                  </h1>
                </div>
                <div className="mt-4 flex md:mt-0 md:ml-4">
                  <Button
                    variant="outline"
                    onClick={() => setJoinGameModalOpen(true)}
                  >
                    Join Game
                  </Button>
                  <Button
                    onClick={() => setCreateGameModalOpen(true)}
                    className="ml-3"
                  >
                    Create Game
                  </Button>
                </div>
              </div>

              {/* Stats Section */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
                <StatsCard
                  icon={<DollarSign className="h-6 w-6 text-success-600" />}
                  iconBgColor="bg-success-100"
                  iconColor="text-success-600"
                  title="Total Earnings"
                  value={formatCurrency(earnings?.total || 0)}
                  linkText="View earnings history"
                  linkHref="/earnings"
                />

                <StatsCard
                  icon={<Zap className="h-6 w-6 text-secondary-600" />}
                  iconBgColor="bg-secondary-100"
                  iconColor="text-secondary-600"
                  title="Games Created"
                  value={createdGames.length}
                  linkText="View all created games"
                  linkHref="/my-games"
                />

                <StatsCard
                  icon={<Users className="h-6 w-6 text-warning-600" />}
                  iconBgColor="bg-warning-100"
                  iconColor="text-warning-600"
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
                      <Button onClick={() => setCreateGameModalOpen(true)}>
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

              {/* Referrals Section */}
              <ReferralSection
                username={user.username}
                totalReferrals={referrals?.total || 0}
                totalEarnings={referrals?.totalEarnings || 0}
              />
            </div>
          </div>
        </main>
      </div>

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
    </div>
  );
}
