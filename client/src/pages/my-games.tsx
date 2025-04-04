import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Game, insertGameSchema } from "@shared/schema";
import { AppLayout } from "@/components/layout/app-layout";
import { GameCard } from "@/components/dashboard/game-card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/context/auth-context";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog, 
  DialogContent, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";

// Define the game creation schema
const createGameFormSchema = insertGameSchema.extend({
  gameDate: z.string().min(1, {
    message: "Date is required",
  }),
  gameTime: z.string().min(1, {
    message: "Time is required",
  }),
  maxPlayers: z.coerce.number().min(2, {
    message: "At least 2 players are required",
  }).max(64, {
    message: "Maximum 64 players allowed"
  }),
  entryFee: z.coerce.number().min(1, {
    message: "Minimum entry fee is $1",
  }).max(10000, {
    message: "Maximum entry fee is $10,000",
  }),
  allowRefunds: z.boolean().default(true),
});

type CreateGameFormValues = z.infer<typeof createGameFormSchema>;

interface SimpleCreateGameModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function CreateGameModal({ open, onOpenChange }: SimpleCreateGameModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Fetch game types and tournament structures
  const { data: gameTypes = [] } = useQuery<any[]>({
    queryKey: ['/api/game-types'],
  });

  const { data: tournamentStructures = [] } = useQuery<any[]>({
    queryKey: ['/api/tournament-structures'],
  });

  const form = useForm<CreateGameFormValues>({
    resolver: zodResolver(createGameFormSchema),
    defaultValues: {
      name: "",
      gameTypeId: 1,
      structureId: 1,
      location: "",
      gameDate: new Date().toISOString().split('T')[0],
      gameTime: "19:00",
      maxPlayers: 8,
      entryFee: 25,
      isPrivate: false,
      payoutStructure: "1st:100",
      allowRefunds: true,
    },
  });

  const onSubmit = async (values: CreateGameFormValues) => {
    console.log("Form submitted with values:", values);
    setIsSubmitting(true);
    
    try {
      // Combine date and time into datetime
      const datetime = new Date(`${values.gameDate}T${values.gameTime}`);
      
      // Prepare game data
      const gameData = {
        name: values.name,
        gameTypeId: values.gameTypeId,
        structureId: values.structureId,
        location: values.location,
        datetime: datetime.toISOString(),
        maxPlayers: values.maxPlayers,
        entryFee: values.entryFee,
        isPrivate: values.isPrivate,
        payoutStructure: values.payoutStructure,
        status: "scheduled",
      };

      console.log("Sending game data to server:", gameData);
      
      await apiRequest("POST", "/api/games", gameData);
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/games'] });
      queryClient.invalidateQueries({ queryKey: ['/api/games/created'] });
      queryClient.invalidateQueries({ queryKey: ['/api/games/my-games'] });
      
      toast({
        title: "Game created successfully!",
        description: "Your game has been created and is now available for players to join.",
      });
      
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error("Error creating game:", error);
      toast({
        title: "Failed to create game",
        description: "There was an error creating your game. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create a New Game</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Game Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Saturday Night Tournament" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="gameTypeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Game Type</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    defaultValue={field.value.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a game type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {gameTypes.map((type: any) => (
                        <SelectItem key={type.id} value={type.id.toString()}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="structureId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tournament Structure</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    defaultValue={field.value.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select tournament structure" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {tournamentStructures.map((structure: any) => (
                        <SelectItem key={structure.id} value={structure.id.toString()}>
                          {structure.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter venue address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="gameDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="gameTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="maxPlayers"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Players</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={2}
                        max={64}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="entryFee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Entry Fee ($)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={10000}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="isPrivate"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-4 border">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Make this game private</FormLabel>
                    <p className="text-sm text-slate-500">
                      Only people with the invitation link can join this game
                    </p>
                  </div>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="payoutStructure"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payout Structure</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., 1st:70,2nd:20,3rd:10" 
                      {...field} 
                    />
                  </FormControl>
                  <p className="text-xs text-slate-500 mt-1">
                    Enter as percentages separated by commas. Example: 1st:70,2nd:20,3rd:10
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <div className="grid grid-cols-2 gap-4 w-full">
                <Button 
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Creating Game..." : "Create Game"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function MyGames() {
  const [activeTab, setActiveTab] = useState("created");
  const [createGameModalOpen, setCreateGameModalOpen] = useState(false);
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
        <Button onClick={() => setCreateGameModalOpen(true)}>
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
              <Button onClick={() => setCreateGameModalOpen(true)}>
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

      {/* Use our component defined above directly without importing from another file */}
      <CreateGameModal
        open={createGameModalOpen}
        onOpenChange={setCreateGameModalOpen}
      />
    </AppLayout>
  );
}
