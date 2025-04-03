import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertGameSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { calculatePrizeDistribution, calculatePrizePool, payoutStructureOptions } from "@/lib/utils";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { GameType, TournamentStructure } from "@shared/schema";

type CreateGameStep = 1 | 2 | 3;

interface StepIndicatorProps {
  currentStep: CreateGameStep;
}

function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center">
        <div className="flex items-center relative">
          <div className={`rounded-full transition duration-500 ease-in-out h-12 w-12 py-3 border-2 ${
            currentStep >= 1 ? "bg-secondary-600 border-secondary-600 text-white" : "border-slate-300 text-slate-500"
          } flex items-center justify-center`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="absolute top-0 -ml-10 text-center mt-16 w-32 text-xs font-medium text-secondary-600">
            Game Details
          </div>
        </div>
        <div className={`flex-auto border-t-2 transition duration-500 ease-in-out ${
          currentStep >= 2 ? "border-secondary-600" : "border-slate-300"
        }`}></div>
        <div className="flex items-center relative">
          <div className={`rounded-full transition duration-500 ease-in-out h-12 w-12 py-3 border-2 ${
            currentStep >= 2 ? "bg-secondary-600 border-secondary-600 text-white" : "border-slate-300 text-slate-500"
          } flex items-center justify-center`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div className="absolute top-0 -ml-10 text-center mt-16 w-32 text-xs font-medium text-slate-500">
            Prize Setup
          </div>
        </div>
        <div className={`flex-auto border-t-2 transition duration-500 ease-in-out ${
          currentStep >= 3 ? "border-secondary-600" : "border-slate-300"
        }`}></div>
        <div className="flex items-center relative">
          <div className={`rounded-full transition duration-500 ease-in-out h-12 w-12 py-3 border-2 ${
            currentStep >= 3 ? "bg-secondary-600 border-secondary-600 text-white" : "border-slate-300 text-slate-500"
          } flex items-center justify-center`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="absolute top-0 -ml-10 text-center mt-16 w-32 text-xs font-medium text-slate-500">
            Confirm
          </div>
        </div>
      </div>
    </div>
  );
}

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
  const [currentStep, setCurrentStep] = useState<CreateGameStep>(1);
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

  const handleNext = () => {
    if (currentStep === 1) {
      // Validate first step fields
      form.trigger(["name", "gameTypeId", "structureId", "location", "gameDate", "gameTime", "maxPlayers", "isPrivate"]);
      
      const hasErrors = !!form.formState.errors.name || 
                        !!form.formState.errors.gameTypeId ||
                        !!form.formState.errors.structureId ||
                        !!form.formState.errors.location ||
                        !!form.formState.errors.gameDate ||
                        !!form.formState.errors.gameTime ||
                        !!form.formState.errors.maxPlayers;
      
      if (!hasErrors) {
        setCurrentStep(2);
      }
    } else if (currentStep === 2) {
      // Validate second step fields
      form.trigger(["entryFee", "payoutStructure", "allowRefunds"]);
      
      const hasErrors = !!form.formState.errors.entryFee ||
                        !!form.formState.errors.payoutStructure;
      
      if (!hasErrors) {
        setCurrentStep(3);
      }
    } else if (currentStep === 3) {
      form.handleSubmit(onSubmit)();
    }
  };

  const handleBack = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
    } else if (currentStep === 3) {
      setCurrentStep(2);
    }
  };

  const resetModal = () => {
    setCurrentStep(1);
    form.reset();
  };

  const onSubmit = async (values: CreateGameFormValues) => {
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

      await apiRequest("POST", "/api/games", gameData);
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/games'] });
      
      toast({
        title: "Game created successfully!",
        description: "Your game has been created and is now available for players to join.",
      });
      
      onOpenChange(false);
      resetModal();
    } catch (error) {
      toast({
        title: "Failed to create game",
        description: "There was an error creating your game. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    resetModal();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create a New Game</DialogTitle>
        </DialogHeader>
        
        <StepIndicator currentStep={currentStep} />
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Step 1: Game Details */}
            {currentStep === 1 && (
              <>
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
              </>
            )}
            
            {/* Step 2: Prize Setup */}
            {currentStep === 2 && (
              <>
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
                
                <div className="rounded-md bg-slate-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-3 flex-1 md:flex md:justify-between">
                      <p className="text-sm text-slate-700">
                        Based on {watchMaxPlayers} players with ${watchEntryFee} entry fee, the total prize pool will be <strong>${prizePool}</strong>
                      </p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-slate-700 mb-2">Prize Distribution</h4>
                  <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">Platform Fee (10%)</span>
                      <span className="text-sm font-medium text-slate-900">${distribution.platformFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">Game Master (5%)</span>
                      <span className="text-sm font-medium text-slate-900">${distribution.gameMasterFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">Promoters (10%)</span>
                      <span className="text-sm font-medium text-slate-900">${distribution.promotersFee.toFixed(2)}</span>
                    </div>
                    <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                      <span className="text-sm font-medium text-slate-700">Winners (75%)</span>
                      <span className="text-sm font-bold text-success-600">${distribution.winnersPrize.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                
                <FormField
                  control={form.control}
                  name="payoutStructure"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Winner Payout Structure</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select payout structure" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {payoutStructureOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
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
                  name="allowRefunds"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Allow refunds for canceled games</FormLabel>
                        <p className="text-sm text-slate-500">
                          Players will be refunded if the game is canceled
                        </p>
                      </div>
                    </FormItem>
                  )}
                />
              </>
            )}
            
            {/* Step 3: Confirmation */}
            {currentStep === 3 && (
              <>
                <div className="rounded-md bg-slate-50 p-4">
                  <h4 className="text-md font-medium text-slate-900 mb-3">Game Summary</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-500">Game Type:</span>
                      <span className="text-sm font-medium text-slate-900">
                        {gameTypes.find(t => t.id === form.getValues("gameTypeId"))?.name || "Unknown"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-500">Game Name:</span>
                      <span className="text-sm font-medium text-slate-900">{form.getValues("name")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-500">Tournament Structure:</span>
                      <span className="text-sm font-medium text-slate-900">
                        {tournamentStructures.find(s => s.id === form.getValues("structureId"))?.name || "Unknown"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-500">Location:</span>
                      <span className="text-sm font-medium text-slate-900">{form.getValues("location")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-500">Date & Time:</span>
                      <span className="text-sm font-medium text-slate-900">
                        {new Date(`${form.getValues("gameDate")}T${form.getValues("gameTime")}`).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-500">Players:</span>
                      <span className="text-sm font-medium text-slate-900">{form.getValues("maxPlayers")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-500">Private Game:</span>
                      <span className="text-sm font-medium text-slate-900">{form.getValues("isPrivate") ? "Yes" : "No"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-500">Entry Fee:</span>
                      <span className="text-sm font-medium text-slate-900">${form.getValues("entryFee")} per player</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-500">Total Prize Pool:</span>
                      <span className="text-sm font-medium text-success-600">${prizePool}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-500">Winner Prize:</span>
                      <span className="text-sm font-medium text-success-600">${distribution.winnersPrize.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="rounded-md bg-green-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-800">
                        Your game is ready to be created! Review the details above and click 'Create Game' to continue.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </form>
        </Form>
        
        <DialogFooter className="flex justify-between">
          {currentStep > 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={isSubmitting}
            >
              Back
            </Button>
          )}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleNext}
              disabled={isSubmitting}
            >
              {currentStep === 3
                ? isSubmitting
                  ? "Creating..."
                  : "Create Game"
                : "Next"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
