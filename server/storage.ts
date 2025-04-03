import {
  users, User, InsertUser,
  gameTypes, GameType, InsertGameType,
  tournamentStructures, TournamentStructure, InsertTournamentStructure,
  games, Game, InsertGame,
  gameParticipants, GameParticipant, InsertGameParticipant,
  referrals, Referral, InsertReferral,
  earnings, Earning, InsertEarning
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Game types methods
  getGameTypes(): Promise<GameType[]>;
  getGameType(id: number): Promise<GameType | undefined>;
  createGameType(gameType: InsertGameType): Promise<GameType>;
  
  // Tournament structure methods
  getTournamentStructures(): Promise<TournamentStructure[]>;
  getTournamentStructure(id: number): Promise<TournamentStructure | undefined>;
  createTournamentStructure(structure: InsertTournamentStructure): Promise<TournamentStructure>;
  
  // Games methods
  getGames(): Promise<Game[]>;
  getGamesByStatus(status: string): Promise<Game[]>;
  getGamesByUser(userId: number): Promise<Game[]>;
  getGamesCreatedByUser(userId: number): Promise<Game[]>;
  getGame(id: number): Promise<Game | undefined>;
  createGame(game: InsertGame): Promise<Game>;
  updateGameStatus(id: number, status: string): Promise<Game | undefined>;
  
  // Game participants methods
  getGameParticipants(gameId: number): Promise<GameParticipant[]>;
  getGameParticipant(gameId: number, userId: number): Promise<GameParticipant | undefined>;
  createGameParticipant(participant: InsertGameParticipant): Promise<GameParticipant>;
  updateParticipantPaymentStatus(id: number, hasPaid: boolean): Promise<GameParticipant | undefined>;
  
  // Referrals methods
  getReferralsByUser(userId: number): Promise<Referral[]>;
  createReferral(referral: InsertReferral): Promise<Referral>;
  updateReferralEarnings(id: number, earnings: number): Promise<Referral | undefined>;
  
  // Earnings methods
  getUserEarnings(userId: number): Promise<Earning[]>;
  createEarning(earning: InsertEarning): Promise<Earning>;
  getTotalEarnings(userId: number): Promise<number>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private gameTypes: Map<number, GameType>;
  private tournamentStructures: Map<number, TournamentStructure>;
  private games: Map<number, Game>;
  private gameParticipants: Map<number, GameParticipant>;
  private referrals: Map<number, Referral>;
  private earnings: Map<number, Earning>;
  
  private currentUserId: number;
  private currentGameTypeId: number;
  private currentStructureId: number;
  private currentGameId: number;
  private currentParticipantId: number;
  private currentReferralId: number;
  private currentEarningId: number;

  constructor() {
    this.users = new Map();
    this.gameTypes = new Map();
    this.tournamentStructures = new Map();
    this.games = new Map();
    this.gameParticipants = new Map();
    this.referrals = new Map();
    this.earnings = new Map();
    
    this.currentUserId = 1;
    this.currentGameTypeId = 1;
    this.currentStructureId = 1;
    this.currentGameId = 1;
    this.currentParticipantId = 1;
    this.currentReferralId = 1;
    this.currentEarningId = 1;
    
    // Initialize with some default data
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Create game types
    const gameTypeBasketball = this.createGameType({ name: "Basketball", iconClass: "basketball" });
    const gameTypeSoccer = this.createGameType({ name: "Soccer", iconClass: "soccer" });
    const gameTypeTennis = this.createGameType({ name: "Tennis", iconClass: "tennis" });
    
    // Create tournament structures
    const singleMatch = this.createTournamentStructure({ name: "Single Match", description: "One-off game" });
    const knockout = this.createTournamentStructure({ name: "Knockout", description: "Elimination tournament" });
    const roundRobin = this.createTournamentStructure({ name: "Round Robin", description: "Everyone plays each other" });
    const league = this.createTournamentStructure({ name: "League", description: "Season-long competition" });
    
    // Create a test user
    const user = this.createUser({
      username: "testuser",
      password: "password123",
      email: "test@example.com",
      fullName: "Test User",
      avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const now = new Date();
    const user: User = { ...insertUser, id, createdAt: now };
    this.users.set(id, user);
    return user;
  }
  
  // Game types methods
  async getGameTypes(): Promise<GameType[]> {
    return Array.from(this.gameTypes.values());
  }
  
  async getGameType(id: number): Promise<GameType | undefined> {
    return this.gameTypes.get(id);
  }
  
  async createGameType(insertGameType: InsertGameType): Promise<GameType> {
    const id = this.currentGameTypeId++;
    const gameType: GameType = { ...insertGameType, id };
    this.gameTypes.set(id, gameType);
    return gameType;
  }
  
  // Tournament structure methods
  async getTournamentStructures(): Promise<TournamentStructure[]> {
    return Array.from(this.tournamentStructures.values());
  }
  
  async getTournamentStructure(id: number): Promise<TournamentStructure | undefined> {
    return this.tournamentStructures.get(id);
  }
  
  async createTournamentStructure(insertStructure: InsertTournamentStructure): Promise<TournamentStructure> {
    const id = this.currentStructureId++;
    const structure: TournamentStructure = { ...insertStructure, id };
    this.tournamentStructures.set(id, structure);
    return structure;
  }
  
  // Games methods
  async getGames(): Promise<Game[]> {
    return Array.from(this.games.values());
  }
  
  async getGamesByStatus(status: string): Promise<Game[]> {
    return Array.from(this.games.values()).filter(game => game.status === status);
  }
  
  async getGamesByUser(userId: number): Promise<Game[]> {
    const participantGames = Array.from(this.gameParticipants.values())
      .filter(participant => participant.userId === userId)
      .map(participant => participant.gameId);
    
    return Array.from(this.games.values())
      .filter(game => participantGames.includes(game.id));
  }
  
  async getGamesCreatedByUser(userId: number): Promise<Game[]> {
    return Array.from(this.games.values())
      .filter(game => game.gameMasterId === userId);
  }
  
  async getGame(id: number): Promise<Game | undefined> {
    return this.games.get(id);
  }
  
  async createGame(insertGame: InsertGame): Promise<Game> {
    const id = this.currentGameId++;
    const now = new Date();
    const prizePool = insertGame.entryFee * insertGame.maxPlayers;
    
    const game: Game = {
      ...insertGame,
      id,
      currentPlayers: 0,
      prizePool,
      createdAt: now
    };
    
    this.games.set(id, game);
    return game;
  }
  
  async updateGameStatus(id: number, status: string): Promise<Game | undefined> {
    const game = this.games.get(id);
    if (!game) return undefined;
    
    const updatedGame = { ...game, status };
    this.games.set(id, updatedGame);
    return updatedGame;
  }
  
  // Game participants methods
  async getGameParticipants(gameId: number): Promise<GameParticipant[]> {
    return Array.from(this.gameParticipants.values())
      .filter(participant => participant.gameId === gameId);
  }
  
  async getGameParticipant(gameId: number, userId: number): Promise<GameParticipant | undefined> {
    return Array.from(this.gameParticipants.values())
      .find(participant => participant.gameId === gameId && participant.userId === userId);
  }
  
  async createGameParticipant(insertParticipant: InsertGameParticipant): Promise<GameParticipant> {
    const id = this.currentParticipantId++;
    const now = new Date();
    
    const participant: GameParticipant = {
      ...insertParticipant,
      id,
      joinedAt: now,
      hasPaid: false
    };
    
    this.gameParticipants.set(id, participant);
    
    // Update current players count in the game
    const game = this.games.get(participant.gameId);
    if (game) {
      const updatedGame = { ...game, currentPlayers: game.currentPlayers + 1 };
      this.games.set(game.id, updatedGame);
    }
    
    return participant;
  }
  
  async updateParticipantPaymentStatus(id: number, hasPaid: boolean): Promise<GameParticipant | undefined> {
    const participant = this.gameParticipants.get(id);
    if (!participant) return undefined;
    
    const updatedParticipant = { ...participant, hasPaid };
    this.gameParticipants.set(id, updatedParticipant);
    return updatedParticipant;
  }
  
  // Referrals methods
  async getReferralsByUser(userId: number): Promise<Referral[]> {
    return Array.from(this.referrals.values())
      .filter(referral => referral.referrerId === userId);
  }
  
  async createReferral(insertReferral: InsertReferral): Promise<Referral> {
    const id = this.currentReferralId++;
    const now = new Date();
    
    const referral: Referral = {
      ...insertReferral,
      id,
      earnings: 0,
      createdAt: now
    };
    
    this.referrals.set(id, referral);
    return referral;
  }
  
  async updateReferralEarnings(id: number, earnings: number): Promise<Referral | undefined> {
    const referral = this.referrals.get(id);
    if (!referral) return undefined;
    
    const updatedReferral = { ...referral, earnings };
    this.referrals.set(id, updatedReferral);
    return updatedReferral;
  }
  
  // Earnings methods
  async getUserEarnings(userId: number): Promise<Earning[]> {
    return Array.from(this.earnings.values())
      .filter(earning => earning.userId === userId);
  }
  
  async createEarning(insertEarning: InsertEarning): Promise<Earning> {
    const id = this.currentEarningId++;
    const now = new Date();
    
    const earning: Earning = {
      ...insertEarning,
      id,
      createdAt: now
    };
    
    this.earnings.set(id, earning);
    return earning;
  }
  
  async getTotalEarnings(userId: number): Promise<number> {
    const userEarnings = await this.getUserEarnings(userId);
    return userEarnings.reduce((sum, earning) => sum + earning.amount, 0);
  }
}

export const storage = new MemStorage();
