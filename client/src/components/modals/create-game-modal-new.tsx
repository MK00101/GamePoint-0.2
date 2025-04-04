import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertGameSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { calculatePrizeDistribution, calculatePrizePool } from "@/lib/utils";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { GameType, TournamentStructure } from "@shared/schema";

// Define the game creation schema based on our shared schema
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

interface CreateGameModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateGameModal({ open, onOpenChange }: CreateGameModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Fetch game types and tournament structures
  const { data: gameTypes = [] } = useQuery<GameType[]>({
    queryKey: ['/api/game-types'],
  });

  const { data: tournamentStructures = [] } = useQuery<TournamentStructure[]>({
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

  // Calculate prize pool and distribution
  const watchEntryFee = form.watch("entryFee");
  const watchMaxPlayers = form.watch("maxPlayers");
  const prizePool = calculatePrizePool(watchEntryFee || 0, watchMaxPlayers || 0);
  const distribution = calculatePrizeDistribution(prizePool);

  const resetModal = () => {
    form.reset();
  };

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
      const response = await apiRequest("POST", "/api/games", gameData);
      console.log("Server response:", response);
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/games'] });
      queryClient.invalidateQueries({ queryKey: ['/api/games/created'] });
      queryClient.invalidateQueries({ queryKey: ['/api/games/my-games'] });
      
      toast({
        title: "Game created successfully!",
        description: "Your game has been created and is now available for players to join.",
      });
      
      onOpenChange(false);
      resetModal();
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
                      {gameTypes.map((type) => (
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
                      {tournamentStructures.map((structure) => (
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
            
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <FormField
                control={form.control}
                name="gameDate"
                render={({ field }) => (
                  <FormItem className="sm:col-span-3">
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
                  <FormItem className="sm:col-span-3">
                    <FormLabel>Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="maxPlayers"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of Players/Teams</FormLabel>
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
                  <FormLabel>Entry Fee per Player ($1 - $10,000)</FormLabel>
                  <FormControl>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-slate-500 sm:text-sm">$</span>
                      </div>
                      <Input
                        type="number"
                        min={1}
                        max={10000}
                        className="pl-7 pr-12"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="isPrivate"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-4">
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

            <div className="rounded-md bg-slate-50 p-4">
              <div className="flex">
                <div className="ml-3 flex-1">
                  <p className="text-sm text-slate-700">
                    Based on {watchMaxPlayers} players with ${watchEntryFee} entry fee, the total prize pool will be <strong>${prizePool}</strong>
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
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
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}