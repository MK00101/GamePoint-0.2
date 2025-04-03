import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  fullName: true,
  avatarUrl: true,
});

// Game types
export const gameTypes = pgTable("game_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  iconClass: text("icon_class"),
});

export const insertGameTypeSchema = createInsertSchema(gameTypes).pick({
  name: true,
  iconClass: true,
});

// Tournament structure types
export const tournamentStructures = pgTable("tournament_structures", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
});

export const insertTournamentStructureSchema = createInsertSchema(tournamentStructures).pick({
  name: true,
  description: true,
});

// Games table
export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  gameMasterId: integer("game_master_id").notNull().references(() => users.id),
  gameTypeId: integer("game_type_id").notNull().references(() => gameTypes.id),
  structureId: integer("structure_id").notNull().references(() => tournamentStructures.id),
  location: text("location").notNull(),
  datetime: timestamp("datetime").notNull(),
  maxPlayers: integer("max_players").notNull(),
  currentPlayers: integer("current_players").default(0).notNull(),
  entryFee: doublePrecision("entry_fee").notNull(),
  prizePool: doublePrecision("prize_pool").default(0).notNull(),
  isPrivate: boolean("is_private").default(false).notNull(),
  status: text("status").notNull().default("scheduled"), // scheduled, active, completed, cancelled, postponed
  payoutStructure: text("payout_structure").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertGameSchema = createInsertSchema(games).omit({
  id: true,
  currentPlayers: true,
  prizePool: true,
  createdAt: true,
});

// Game participants
export const gameParticipants = pgTable("game_participants", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").notNull().references(() => games.id),
  userId: integer("user_id").notNull().references(() => users.id),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
  hasPaid: boolean("has_paid").default(false).notNull(),
  referredBy: integer("referred_by").references(() => users.id),
});

export const insertGameParticipantSchema = createInsertSchema(gameParticipants).pick({
  gameId: true,
  userId: true,
  referredBy: true,
});

// Referrals
export const referrals = pgTable("referrals", {
  id: serial("id").primaryKey(),
  referrerId: integer("referrer_id").notNull().references(() => users.id),
  referredUserId: integer("referred_user_id").notNull().references(() => users.id),
  gameId: integer("game_id").references(() => games.id),
  earnings: doublePrecision("earnings").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertReferralSchema = createInsertSchema(referrals).pick({
  referrerId: true,
  referredUserId: true,
  gameId: true,
});

// Earnings
export const earnings = pgTable("earnings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  gameId: integer("game_id").references(() => games.id),
  amount: doublePrecision("amount").notNull(),
  type: text("type").notNull(), // winner, game_master, referrer
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertEarningSchema = createInsertSchema(earnings).pick({
  userId: true,
  gameId: true,
  amount: true,
  type: true,
});

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type GameType = typeof gameTypes.$inferSelect;
export type InsertGameType = z.infer<typeof insertGameTypeSchema>;

export type TournamentStructure = typeof tournamentStructures.$inferSelect;
export type InsertTournamentStructure = z.infer<typeof insertTournamentStructureSchema>;

export type Game = typeof games.$inferSelect;
export type InsertGame = z.infer<typeof insertGameSchema>;

export type GameParticipant = typeof gameParticipants.$inferSelect;
export type InsertGameParticipant = z.infer<typeof insertGameParticipantSchema>;

export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = z.infer<typeof insertReferralSchema>;

export type Earning = typeof earnings.$inferSelect;
export type InsertEarning = z.infer<typeof insertEarningSchema>;
