import pkg from 'pg';
const { Pool } = pkg;
import {
  User, InsertUser,
  GameType, InsertGameType,
  TournamentStructure, InsertTournamentStructure,
  Game, InsertGame,
  GameParticipant, InsertGameParticipant,
  Referral, InsertReferral,
  Earning, InsertEarning
} from "@shared/schema";
import { IStorage } from "./storage";

export class PgStorage implements IStorage {
  private pool: any;

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const result = await this.pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.pool.query('SELECT * FROM users WHERE username = $1', [username]);
    return result.rows[0] || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await this.pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0] || undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await this.pool.query(
      'INSERT INTO users (username, password, email, full_name, avatar_url) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [user.username, user.password, user.email, user.fullName, user.avatarUrl]
    );
    return result.rows[0];
  }

  // Game types methods
  async getGameTypes(): Promise<GameType[]> {
    const result = await this.pool.query('SELECT * FROM game_types');
    return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      iconClass: row.icon_class
    }));
  }

  async getGameType(id: number): Promise<GameType | undefined> {
    const result = await this.pool.query('SELECT * FROM game_types WHERE id = $1', [id]);
    if (result.rows.length === 0) return undefined;
    return {
      id: result.rows[0].id,
      name: result.rows[0].name,
      iconClass: result.rows[0].icon_class
    };
  }

  async createGameType(gameType: InsertGameType): Promise<GameType> {
    const result = await this.pool.query(
      'INSERT INTO game_types (name, icon_class) VALUES ($1, $2) RETURNING *',
      [gameType.name, gameType.iconClass]
    );
    return {
      id: result.rows[0].id,
      name: result.rows[0].name,
      iconClass: result.rows[0].icon_class
    };
  }

  // Tournament structure methods
  async getTournamentStructures(): Promise<TournamentStructure[]> {
    const result = await this.pool.query('SELECT * FROM tournament_structures');
    return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description
    }));
  }

  async getTournamentStructure(id: number): Promise<TournamentStructure | undefined> {
    const result = await this.pool.query('SELECT * FROM tournament_structures WHERE id = $1', [id]);
    if (result.rows.length === 0) return undefined;
    return {
      id: result.rows[0].id,
      name: result.rows[0].name,
      description: result.rows[0].description
    };
  }

  async createTournamentStructure(structure: InsertTournamentStructure): Promise<TournamentStructure> {
    const result = await this.pool.query(
      'INSERT INTO tournament_structures (name, description) VALUES ($1, $2) RETURNING *',
      [structure.name, structure.description]
    );
    return {
      id: result.rows[0].id,
      name: result.rows[0].name,
      description: result.rows[0].description
    };
  }

  // Games methods
  async getGames(): Promise<Game[]> {
    const result = await this.pool.query('SELECT * FROM games');
    return result.rows.map(this.mapGameRow);
  }

  async getGamesByStatus(status: string): Promise<Game[]> {
    const result = await this.pool.query('SELECT * FROM games WHERE status = $1', [status]);
    return result.rows.map(this.mapGameRow);
  }

  async getGamesByUser(userId: number): Promise<Game[]> {
    const result = await this.pool.query(
      'SELECT g.* FROM games g JOIN game_participants p ON g.id = p.game_id WHERE p.user_id = $1',
      [userId]
    );
    return result.rows.map(this.mapGameRow);
  }

  async getGamesCreatedByUser(userId: number): Promise<Game[]> {
    const result = await this.pool.query('SELECT * FROM games WHERE game_master_id = $1', [userId]);
    return result.rows.map(this.mapGameRow);
  }

  async getGame(id: number): Promise<Game | undefined> {
    const result = await this.pool.query('SELECT * FROM games WHERE id = $1', [id]);
    if (result.rows.length === 0) return undefined;
    return this.mapGameRow(result.rows[0]);
  }

  async createGame(game: InsertGame): Promise<Game> {
    // Calculate prize pool amount
    const prizePool = game.entryFee * game.maxPlayers;
    
    const result = await this.pool.query(
      `INSERT INTO games 
       (name, game_type_id, structure_id, game_master_id, location, datetime, 
        entry_fee, max_players, prize_pool, status, is_private, payout_structure) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
       RETURNING *`,
      [
        game.name,
        game.gameTypeId,
        game.structureId,
        game.gameMasterId,
        game.location,
        game.datetime,
        game.entryFee,
        game.maxPlayers,
        prizePool,
        game.status || 'scheduled',
        game.isPrivate || false,
        game.payoutStructure
      ]
    );
    return this.mapGameRow(result.rows[0]);
  }

  async updateGameStatus(id: number, status: string): Promise<Game | undefined> {
    const result = await this.pool.query(
      'UPDATE games SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    if (result.rows.length === 0) return undefined;
    return this.mapGameRow(result.rows[0]);
  }

  // Game participants methods
  async getGameParticipants(gameId: number): Promise<GameParticipant[]> {
    const result = await this.pool.query('SELECT * FROM game_participants WHERE game_id = $1', [gameId]);
    return result.rows.map(this.mapParticipantRow);
  }

  async getGameParticipant(gameId: number, userId: number): Promise<GameParticipant | undefined> {
    const result = await this.pool.query(
      'SELECT * FROM game_participants WHERE game_id = $1 AND user_id = $2',
      [gameId, userId]
    );
    if (result.rows.length === 0) return undefined;
    return this.mapParticipantRow(result.rows[0]);
  }

  async createGameParticipant(participant: InsertGameParticipant): Promise<GameParticipant> {
    // First, increase the current_players count in the game
    await this.pool.query(
      'UPDATE games SET current_players = current_players + 1 WHERE id = $1',
      [participant.gameId]
    );

    // Then, create the participant record
    const result = await this.pool.query(
      'INSERT INTO game_participants (game_id, user_id, referred_by) VALUES ($1, $2, $3) RETURNING *',
      [participant.gameId, participant.userId, participant.referredBy]
    );
    return this.mapParticipantRow(result.rows[0]);
  }

  async updateParticipantPaymentStatus(id: number, hasPaid: boolean): Promise<GameParticipant | undefined> {
    const result = await this.pool.query(
      'UPDATE game_participants SET has_paid = $1 WHERE id = $2 RETURNING *',
      [hasPaid, id]
    );
    if (result.rows.length === 0) return undefined;
    return this.mapParticipantRow(result.rows[0]);
  }

  // Referrals methods
  async getReferralsByUser(userId: number): Promise<Referral[]> {
    const result = await this.pool.query('SELECT * FROM referrals WHERE referrer_id = $1', [userId]);
    return result.rows.map(this.mapReferralRow);
  }

  async createReferral(referral: InsertReferral): Promise<Referral> {
    const result = await this.pool.query(
      'INSERT INTO referrals (referrer_id, referred_user_id, game_id) VALUES ($1, $2, $3) RETURNING *',
      [referral.referrerId, referral.referredUserId, referral.gameId]
    );
    return this.mapReferralRow(result.rows[0]);
  }

  async updateReferralEarnings(id: number, earnings: number): Promise<Referral | undefined> {
    const result = await this.pool.query(
      'UPDATE referrals SET earnings = $1 WHERE id = $2 RETURNING *',
      [earnings, id]
    );
    if (result.rows.length === 0) return undefined;
    return this.mapReferralRow(result.rows[0]);
  }

  // Earnings methods
  async getUserEarnings(userId: number): Promise<Earning[]> {
    const result = await this.pool.query('SELECT * FROM earnings WHERE user_id = $1', [userId]);
    return result.rows.map(this.mapEarningRow);
  }

  async createEarning(earning: InsertEarning): Promise<Earning> {
    const result = await this.pool.query(
      'INSERT INTO earnings (user_id, game_id, amount, type) VALUES ($1, $2, $3, $4) RETURNING *',
      [earning.userId, earning.gameId, earning.amount, earning.type]
    );
    return this.mapEarningRow(result.rows[0]);
  }

  async getTotalEarnings(userId: number): Promise<number> {
    const result = await this.pool.query(
      'SELECT SUM(amount) as total FROM earnings WHERE user_id = $1',
      [userId]
    );
    return parseFloat(result.rows[0]?.total) || 0;
  }

  // Helper methods to map DB rows to our schema types
  private mapGameRow(row: any): Game {
    return {
      id: row.id,
      name: row.name,
      gameTypeId: row.game_type_id,
      structureId: row.structure_id,
      gameMasterId: row.game_master_id,
      location: row.location,
      datetime: row.datetime,
      entryFee: parseFloat(row.entry_fee),
      maxPlayers: row.max_players,
      currentPlayers: row.current_players,
      prizePool: parseFloat(row.prize_pool),
      status: row.status,
      isPrivate: row.is_private,
      payoutStructure: row.payout_structure,
      createdAt: row.created_at
    };
  }

  private mapParticipantRow(row: any): GameParticipant {
    return {
      id: row.id,
      gameId: row.game_id,
      userId: row.user_id,
      hasPaid: row.has_paid,
      joinedAt: row.joined_at,
      referredBy: row.referred_by
    };
  }

  private mapReferralRow(row: any): Referral {
    return {
      id: row.id,
      referrerId: row.referrer_id,
      referredUserId: row.referred_user_id,
      gameId: row.game_id,
      earnings: parseFloat(row.earnings),
      createdAt: row.created_at
    };
  }

  private mapEarningRow(row: any): Earning {
    return {
      id: row.id,
      userId: row.user_id,
      gameId: row.game_id,
      amount: parseFloat(row.amount),
      type: row.type,
      createdAt: row.created_at
    };
  }
}