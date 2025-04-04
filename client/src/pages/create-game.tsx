import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { insertGameSchema } from "@shared/schema";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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

export default function CreateGame() {
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
      
      // Redirect back to my games page
      window.location.href = "/my-games";
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
    <AppLayout title="Create New Game">
      <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            </div>
            
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            
            <div className="flex justify-end space-x-4">
              <Button 
                type="button"
                variant="outline"
                onClick={() => window.location.href = "/my-games"}
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
      </div>
    </AppLayout>
  );
}