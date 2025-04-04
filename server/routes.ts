import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  insertGameSchema, 
  insertGameParticipantSchema,
  insertReferralSchema
} from "@shared/schema";
import { z } from "zod";
import session from "express-session";
import MemoryStore from "memorystore";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import Stripe from "stripe";
import { hashPassword, verifyPassword, sanitizeUser } from "./auth-utils";
import { rateLimit } from "express-rate-limit";

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("Missing required Stripe secret: STRIPE_SECRET_KEY");
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up sessions
  const SessionStore = MemoryStore(session);
  app.use(session({
    secret: process.env.SESSION_SECRET || 'gameonsecret',
    resave: false,
    saveUninitialized: false,
    store: new SessionStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    }),
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Set up passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure passport local strategy with secure password verification
  passport.use(new LocalStrategy(
    async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) {
          return done(null, false, { message: 'Incorrect username or password' });
        }
        
        // Verify password using secure hashing
        const isPasswordValid = await verifyPassword(user.password, password);
        if (!isPasswordValid) {
          return done(null, false, { message: 'Incorrect username or password' });
        }
        
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  ));

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Setup rate limiting for authentication routes
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 requests per window
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many login attempts, please try again later' }
  });

  // Auth Routes with rate limiting
  app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByUsername(userData.username);
      
      if (existingUser) {
        return res.status(400).json({ message: 'Username already exists' });
      }
      
      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(400).json({ message: 'Email already exists' });
      }
      
      // Hash the password before storing
      const hashedPassword = await hashPassword(userData.password);
      
      // Create user with hashed password
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword
      });
      
      // Sanitize user object for response
      const sanitizedUser = sanitizeUser(user);
      
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: 'Failed to log in after registration' });
        }
        return res.status(201).json(sanitizedUser);
      });
      
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid user data', errors: err.errors });
      }
      return res.status(500).json({ message: 'Failed to register user' });
    }
  });

  app.post('/api/auth/login', authLimiter, passport.authenticate('local'), (req: Request, res: Response) => {
    const sanitizedUser = sanitizeUser(req.user as any);
    res.json(sanitizedUser);
  });

  app.post('/api/auth/logout', (req: Request, res: Response) => {
    req.logout(() => {
      res.status(200).json({ message: 'Logged out successfully' });
    });
  });

  app.get('/api/auth/session', (req: Request, res: Response) => {
    if (req.isAuthenticated()) {
      const sanitizedUser = sanitizeUser(req.user as any);
      return res.json(sanitizedUser);
    }
    res.status(401).json({ message: 'Not authenticated' });
  });

  // Auth middleware for protected routes
  const isAuthenticated = (req: Request, res: Response, next: any) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: 'Authentication required' });
  };

  // Game Types Routes
  app.get('/api/game-types', async (req: Request, res: Response) => {
    try {
      const gameTypes = await storage.getGameTypes();
      res.json(gameTypes);
    } catch (err) {
      res.status(500).json({ message: 'Failed to fetch game types' });
    }
  });

  // Tournament Structures Routes
  app.get('/api/tournament-structures', async (req: Request, res: Response) => {
    try {
      const structures = await storage.getTournamentStructures();
      res.json(structures);
    } catch (err) {
      res.status(500).json({ message: 'Failed to fetch tournament structures' });
    }
  });

  // Games Routes
  app.get('/api/games', async (req: Request, res: Response) => {
    try {
      const status = req.query.status as string;
      
      let games;
      if (status) {
        games = await storage.getGamesByStatus(status);
      } else {
        games = await storage.getGames();
      }
      
      res.json(games);
    } catch (err) {
      res.status(500).json({ message: 'Failed to fetch games' });
    }
  });
  
  app.get('/api/games/my-games', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const games = await storage.getGamesByUser(userId);
      res.json(games);
    } catch (err) {
      res.status(500).json({ message: 'Failed to fetch user games' });
    }
  });
  
  app.get('/api/games/created', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const games = await storage.getGamesCreatedByUser(userId);
      res.json(games);
    } catch (err) {
      res.status(500).json({ message: 'Failed to fetch created games' });
    }
  });

  app.get('/api/games/:id', async (req: Request, res: Response) => {
    try {
      const gameId = parseInt(req.params.id);
      const game = await storage.getGame(gameId);
      
      if (!game) {
        return res.status(404).json({ message: 'Game not found' });
      }
      
      res.json(game);
    } catch (err) {
      res.status(500).json({ message: 'Failed to fetch game' });
    }
  });

  app.post('/api/games', isAuthenticated, async (req: Request, res: Response) => {
    try {
      console.log('Creating new game with request body:', req.body);
      const userId = (req.user as any).id;
      console.log('User ID from session:', userId);
      
      // Pre-process the datetime before validation
      let processedData = { ...req.body };
      console.log('Processing game data before validation');
      
      const gameData = insertGameSchema.parse({
        ...processedData,
        gameMasterId: userId,
        currentPlayers: 0, // Initialize with 0 players
        status: processedData.status || 'scheduled' // Default status
      });
      
      console.log('Game data validated:', gameData);
      
      // Validate entry fee
      if (gameData.entryFee < 1 || gameData.entryFee > 10000) {
        console.log('Invalid entry fee:', gameData.entryFee);
        return res.status(400).json({ message: 'Entry fee must be between $1 and $10,000' });
      }
      
      console.log('Creating game in storage');
      const game = await storage.createGame(gameData);
      console.log('Game created successfully:', game);
      
      res.status(201).json(game);
    } catch (err) {
      console.error('Error creating game:', err);
      
      if (err instanceof z.ZodError) {
        console.error('Validation errors:', JSON.stringify(err.errors));
        return res.status(400).json({ message: 'Invalid game data', errors: err.errors });
      }
      
      res.status(500).json({ message: 'Failed to create game' });
    }
  });

  app.patch('/api/games/:id/status', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const gameId = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!['scheduled', 'active', 'completed', 'cancelled', 'postponed'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }
      
      const game = await storage.getGame(gameId);
      if (!game) {
        return res.status(404).json({ message: 'Game not found' });
      }
      
      // Only game master can update status
      if (game.gameMasterId !== (req.user as any).id) {
        return res.status(403).json({ message: 'Not authorized to update this game' });
      }
      
      const updatedGame = await storage.updateGameStatus(gameId, status);
      res.json(updatedGame);
    } catch (err) {
      res.status(500).json({ message: 'Failed to update game status' });
    }
  });

  // Game Participants Routes
  app.get('/api/games/:id/participants', async (req: Request, res: Response) => {
    try {
      const gameId = parseInt(req.params.id);
      const participants = await storage.getGameParticipants(gameId);
      res.json(participants);
    } catch (err) {
      res.status(500).json({ message: 'Failed to fetch game participants' });
    }
  });

  app.post('/api/games/:id/join', isAuthenticated, async (req: Request, res: Response) => {
    try {
      console.log('Join game request received');
      const gameId = parseInt(req.params.id);
      const userId = (req.user as any).id;
      const referredBy = req.body.referredBy;
      
      console.log(`User ${userId} attempting to join game ${gameId}`);
      
      const game = await storage.getGame(gameId);
      if (!game) {
        console.log(`Game ${gameId} not found`);
        return res.status(404).json({ message: 'Game not found' });
      }
      
      console.log('Game found:', game);
      
      // Check if game is full
      if (game.currentPlayers >= game.maxPlayers) {
        console.log(`Game ${gameId} is full (${game.currentPlayers}/${game.maxPlayers})`);
        return res.status(400).json({ message: 'Game is full' });
      }
      
      // Check if user already joined
      const existingParticipant = await storage.getGameParticipant(gameId, userId);
      if (existingParticipant) {
        console.log(`User ${userId} has already joined game ${gameId}`);
        return res.status(400).json({ message: 'Already joined this game' });
      }
      
      console.log('Creating participant data');
      const participantData = {
        gameId,
        userId,
        referredBy: referredBy || null
      };
      
      console.log('Validating participant data:', participantData);
      const validatedParticipantData = insertGameParticipantSchema.parse(participantData);
      
      console.log('Creating game participant');
      const participant = await storage.createGameParticipant(validatedParticipantData);
      console.log('Participant created:', participant);
      
      // Update game's current player count
      console.log('Updating game player count');
      await storage.updateGameStatus(gameId, game.status);
      
      // If referred, create a referral record
      if (referredBy) {
        console.log(`Creating referral for user ${userId} referred by ${referredBy}`);
        const referralData = insertReferralSchema.parse({
          referrerId: referredBy,
          referredUserId: userId,
          gameId
        });
        
        await storage.createReferral(referralData);
      }
      
      console.log('Join game successful');
      res.status(201).json(participant);
    } catch (err) {
      console.error('Error joining game:', err);
      
      if (err instanceof z.ZodError) {
        console.error('Validation errors:', JSON.stringify(err.errors));
        return res.status(400).json({ message: 'Invalid participant data', errors: err.errors });
      }
      
      res.status(500).json({ message: 'Failed to join game' });
    }
  });

  // Earnings Routes
  app.get('/api/earnings', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const earnings = await storage.getUserEarnings(userId);
      const total = await storage.getTotalEarnings(userId);
      
      res.json({ earnings, total });
    } catch (err) {
      res.status(500).json({ message: 'Failed to fetch earnings' });
    }
  });

  // Referrals Routes
  app.get('/api/referrals', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const referrals = await storage.getReferralsByUser(userId);
      
      // Calculate total referral earnings
      const totalEarnings = referrals.reduce((sum, referral) => sum + referral.earnings, 0);
      
      res.json({ referrals, total: referrals.length, totalEarnings });
    } catch (err) {
      res.status(500).json({ message: 'Failed to fetch referrals' });
    }
  });

  // Stripe Payment Routes
  app.post('/api/create-payment-intent', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { gameId } = req.body;
      const userId = (req.user as any).id;
      
      if (!gameId) {
        return res.status(400).json({ message: 'Game ID is required' });
      }
      
      // Get the game to determine entry fee
      const game = await storage.getGame(parseInt(gameId));
      if (!game) {
        return res.status(404).json({ message: 'Game not found' });
      }
      
      // Check if participant exists
      const participant = await storage.getGameParticipant(parseInt(gameId), userId);
      if (!participant) {
        return res.status(400).json({ message: 'You must join the game before making a payment' });
      }
      
      // Check if already paid
      if (participant.hasPaid) {
        return res.status(400).json({ message: 'You have already paid for this game' });
      }
      
      // Create a PaymentIntent with the entry fee amount
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(game.entryFee * 100), // Convert dollars to cents
        currency: 'usd',
        metadata: {
          gameId: game.id.toString(),
          userId: userId.toString(),
          participantId: participant.id.toString()
        }
      });
      
      res.json({ 
        clientSecret: paymentIntent.client_secret,
        amount: game.entryFee
      });
    } catch (err: any) {
      res.status(500).json({ message: `Payment intent creation failed: ${err.message}` });
    }
  });
  
  app.post('/api/confirm-payment', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { paymentIntentId, gameId } = req.body;
      const userId = (req.user as any).id;
      
      if (!paymentIntentId || !gameId) {
        return res.status(400).json({ message: 'Payment intent ID and game ID are required' });
      }
      
      // Retrieve the payment intent
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      // Verify payment is complete
      if (paymentIntent.status !== 'succeeded') {
        return res.status(400).json({ message: 'Payment has not been completed' });
      }
      
      // Get the participant record
      const participant = await storage.getGameParticipant(parseInt(gameId), userId);
      if (!participant) {
        return res.status(404).json({ message: 'Participant not found' });
      }
      
      // Update payment status
      await storage.updateParticipantPaymentStatus(participant.id, true);
      
      // Update game player count
      const game = await storage.getGame(parseInt(gameId));
      if (game) {
        await storage.updateGameStatus(game.id, game.status);
      }
      
      res.json({ success: true, message: 'Payment confirmed successfully' });
    } catch (err: any) {
      res.status(500).json({ message: `Payment confirmation failed: ${err.message}` });
    }
  });

  // Stripe webhook endpoint
  app.post('/api/stripe-webhook', async (req: Request, res: Response) => {
    const payload = req.body;
    const sig = req.headers['stripe-signature'] as string;
    
    // Note: In production, you would use a webhook secret for verification
    let event;
    
    try {
      event = payload; // In production: stripe.webhooks.constructEvent(payload, sig, webhookSecret);
    } catch (err: any) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    
    // Handle the event
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      
      // Extract metadata
      const { gameId, userId, participantId } = paymentIntent.metadata;
      
      if (gameId && userId && participantId) {
        try {
          // Update participant payment status
          await storage.updateParticipantPaymentStatus(parseInt(participantId), true);
          
          // Update game player count
          const game = await storage.getGame(parseInt(gameId));
          if (game) {
            await storage.updateGameStatus(game.id, game.status);
          }
        } catch (error) {
          console.error('Error processing webhook payment:', error);
        }
      }
    }
    
    res.json({ received: true });
  });

  const httpServer = createServer(app);
  return httpServer;
}
