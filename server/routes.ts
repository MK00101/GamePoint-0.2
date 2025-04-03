import type { Express, Request, Response } from "express";
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

  // Configure passport local strategy
  passport.use(new LocalStrategy(
    async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) {
          return done(null, false, { message: 'Incorrect username' });
        }
        if (user.password !== password) { // In production, use proper password hashing
          return done(null, false, { message: 'Incorrect password' });
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

  // Auth Routes
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
      
      const user = await storage.createUser(userData);
      
      // Strip password from response
      const { password, ...userResponse } = user;
      
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: 'Failed to log in after registration' });
        }
        return res.status(201).json(userResponse);
      });
      
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid user data', errors: err.errors });
      }
      return res.status(500).json({ message: 'Failed to register user' });
    }
  });

  app.post('/api/auth/login', passport.authenticate('local'), (req: Request, res: Response) => {
    const { password, ...user } = req.user as any;
    res.json(user);
  });

  app.post('/api/auth/logout', (req: Request, res: Response) => {
    req.logout(() => {
      res.status(200).json({ message: 'Logged out successfully' });
    });
  });

  app.get('/api/auth/session', (req: Request, res: Response) => {
    if (req.isAuthenticated()) {
      const { password, ...user } = req.user as any;
      return res.json(user);
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
      const userId = (req.user as any).id;
      const gameData = insertGameSchema.parse({
        ...req.body,
        gameMasterId: userId
      });
      
      // Validate entry fee
      if (gameData.entryFee < 1 || gameData.entryFee > 10000) {
        return res.status(400).json({ message: 'Entry fee must be between $1 and $10,000' });
      }
      
      const game = await storage.createGame(gameData);
      res.status(201).json(game);
    } catch (err) {
      if (err instanceof z.ZodError) {
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
      const gameId = parseInt(req.params.id);
      const userId = (req.user as any).id;
      const referredBy = req.body.referredBy;
      
      const game = await storage.getGame(gameId);
      if (!game) {
        return res.status(404).json({ message: 'Game not found' });
      }
      
      // Check if game is full
      if (game.currentPlayers >= game.maxPlayers) {
        return res.status(400).json({ message: 'Game is full' });
      }
      
      // Check if user already joined
      const existingParticipant = await storage.getGameParticipant(gameId, userId);
      if (existingParticipant) {
        return res.status(400).json({ message: 'Already joined this game' });
      }
      
      const participantData = insertGameParticipantSchema.parse({
        gameId,
        userId,
        referredBy: referredBy || null
      });
      
      const participant = await storage.createGameParticipant(participantData);
      
      // If referred, create a referral record
      if (referredBy) {
        const referralData = insertReferralSchema.parse({
          referrerId: referredBy,
          referredUserId: userId,
          gameId
        });
        
        await storage.createReferral(referralData);
      }
      
      res.status(201).json(participant);
    } catch (err) {
      if (err instanceof z.ZodError) {
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

  const httpServer = createServer(app);
  return httpServer;
}
