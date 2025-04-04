import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, calculatePrizeDistribution } from "@/lib/utils";
import { Game } from "@shared/schema";
import { CreditCard, AlertCircle, CheckCircle, ArrowLeft } from "lucide-react";

// Initialize Stripe
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error("Missing Stripe public key. Please set VITE_STRIPE_PUBLIC_KEY environment variable.");
}

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

// Payment Form Component
const PaymentForm = ({ 
  gameId,
  amount,
  onSuccess 
}: { 
  gameId: number;
  amount: number;
  onSuccess: () => void;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast } = useToast();
  const [_, navigate] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    
    try {
      // Confirm payment
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + "/payment/success?gameId=" + gameId,
        },
        redirect: "if_required",
      });

      if (error) {
        setErrorMessage(error.message || "Payment failed. Please try again.");
        toast({
          title: "Payment Failed",
          description: error.message || "There was a problem processing your payment.",
          variant: "destructive",
        });
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        // If we got here, it means the payment was confirmed without a redirect
        // Let's notify the server
        await apiRequest("POST", "/api/confirm-payment", {
          paymentIntentId: paymentIntent.id,
          gameId
        });
        
        toast({
          title: "Payment Successful!",
          description: "Your payment has been processed successfully.",
        });
        
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: [`/api/games/${gameId}`] });
        queryClient.invalidateQueries({ queryKey: [`/api/games/${gameId}/participants`] });
        queryClient.invalidateQueries({ queryKey: ['/api/games/my-games'] });
        
        onSuccess();
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred.");
      toast({
        title: "Error",
        description: err.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-6">
        <PaymentElement />
      </div>
      
      {errorMessage && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
      
      <Button 
        type="submit" 
        className="w-full" 
        disabled={!stripe || isProcessing}
      >
        {isProcessing ? "Processing..." : `Pay ${formatCurrency(amount)}`}
      </Button>
    </form>
  );
};

// Payment Success Component
const PaymentSuccess = ({ gameId }: { gameId: number }) => {
  const [_, navigate] = useLocation();
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">
          <CheckCircle className="h-12 w-12 mx-auto text-success-500 mb-4" />
          Payment Successful!
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-center mb-6">
          Your payment has been processed successfully. You are now registered for the game.
        </p>
        <div className="flex flex-col space-y-2">
          <Button onClick={() => navigate(`/games/${gameId}`)}>
            View Game Details
          </Button>
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            Return to Dashboard
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Main Payment Page Component
export default function PaymentPage() {
  const [match, params] = useRoute("/payment/:gameId");
  const [successMatch] = useRoute("/payment/success");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [amount, setAmount] = useState<number>(0);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  
  // Get the gameId from the URL or from query params in case of success
  const gameId = match && params ? parseInt(params.gameId) : 
                 successMatch ? parseInt(new URLSearchParams(window.location.search).get("gameId") || "0") : 0;
  
  // Fetch game details
  const { data: game, isLoading: isLoadingGame } = useQuery<Game>({
    queryKey: [`/api/games/${gameId}`],
    enabled: !!gameId && !successMatch,
  });
  
  // Join game and create payment intent when the component loads
  useEffect(() => {
    if (!gameId || successMatch || paymentSuccess) return;
    
    const initializePayment = async () => {
      try {
        // First, attempt to join the game
        try {
          await apiRequest("POST", `/api/games/${gameId}/join`, {});
          console.log("Successfully joined game or already a participant");
        } catch (error: any) {
          // If the error is that the user already joined, that's fine, continue
          // Otherwise, display the error and return
          if (!error.message.includes("Already joined")) {
            toast({
              title: "Error Joining Game",
              description: error.message,
              variant: "destructive",
            });
            return;
          }
        }
        
        // Then create the payment intent
        const response = await apiRequest("POST", "/api/create-payment-intent", { gameId });
        const data = await response.json();
        
        setClientSecret(data.clientSecret);
        setAmount(data.amount);
        
        // Invalidate relevant queries to refresh data
        queryClient.invalidateQueries({ queryKey: [`/api/games/${gameId}`] });
        queryClient.invalidateQueries({ queryKey: [`/api/games/${gameId}/participants`] });
        queryClient.invalidateQueries({ queryKey: ['/api/games/my-games'] });
        
      } catch (error: any) {
        toast({
          title: "Error",
          description: "Failed to initialize payment. " + error.message,
          variant: "destructive",
        });
      }
    };
    
    initializePayment();
  }, [gameId, successMatch, paymentSuccess]);
  
  const handlePaymentSuccess = () => {
    setPaymentSuccess(true);
  };
  
  const prizeDistribution = game ? calculatePrizeDistribution(game.prizePool) : null;
  
  if (successMatch || paymentSuccess) {
    return (
      <AppLayout title="Payment Successful">
        <PaymentSuccess gameId={gameId} />
      </AppLayout>
    );
  }
  
  if (isLoadingGame || !game) {
    return (
      <AppLayout title="Processing Payment">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }
  
  return (
    <AppLayout 
      title="Payment"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Game Details</CardTitle>
            </CardHeader>
            <CardContent>
              <h3 className="text-lg font-semibold">{game.name}</h3>
              <p className="text-sm text-muted-foreground mb-4">Game on {new Date(game.datetime).toLocaleString()}</p>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Date</span>
                  <span>{new Date(game.datetime).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Time</span>
                  <span>{new Date(game.datetime).toLocaleTimeString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Location</span>
                  <span>{game.location}</span>
                </div>
                <div className="flex justify-between">
                  <span>Players</span>
                  <span>{game.currentPlayers}/{game.maxPlayers}</span>
                </div>
                <Separator className="my-4" />
                <div className="flex justify-between font-medium">
                  <span>Entry Fee</span>
                  <span className="text-lg">{formatCurrency(game.entryFee)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Prize Distribution</CardTitle>
              <CardDescription>
                Here's how the prize pool will be distributed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Total Prize Pool</span>
                  <span className="font-medium text-success-600">{formatCurrency(game.prizePool)}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm">Platform Fee (10%)</span>
                  <span>{prizeDistribution ? formatCurrency(prizeDistribution.platformFee) : '-'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Game Master (5%)</span>
                  <span>{prizeDistribution ? formatCurrency(prizeDistribution.gameMasterFee) : '-'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Promoters (10%)</span>
                  <span>{prizeDistribution ? formatCurrency(prizeDistribution.promotersFee) : '-'}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="font-medium">Winners (75%)</span>
                  <span className="font-medium text-success-600">
                    {prizeDistribution ? formatCurrency(prizeDistribution.winnersPrize) : '-'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="mr-2 h-5 w-5" />
              Secure Payment
            </CardTitle>
            <CardDescription>
              Your payment is secured by Stripe
            </CardDescription>
          </CardHeader>
          <CardContent>
            {clientSecret ? (
              <Elements 
                stripe={stripePromise} 
                options={{
                  clientSecret,
                  appearance: {
                    theme: 'stripe',
                    variables: {
                      colorPrimary: '#4f46e5',
                      borderRadius: '6px',
                    },
                  },
                }}
              >
                <PaymentForm 
                  gameId={gameId} 
                  amount={amount} 
                  onSuccess={handlePaymentSuccess} 
                />
              </Elements>
            ) : (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-start">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate(`/games/${gameId}`)}
              className="flex items-center text-xs"
            >
              <ArrowLeft className="mr-1 h-3 w-3" />
              Return to game details
            </Button>
          </CardFooter>
        </Card>
      </div>
    </AppLayout>
  );
}