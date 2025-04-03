import { drizzle } from 'drizzle-orm/node-postgres';
import { NodePgDatabase } from 'drizzle-orm/node-postgres/driver';
import pkg from 'pg';
const { Pool } = pkg;
import * as schema from '@shared/schema';

// Initialize connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Initialize drizzle with the pool and schema
export const db: NodePgDatabase<typeof schema> = drizzle(pool, { schema });

// Function to initialize the database tables
export async function initDb() {
  console.log('Initializing database...');
  
  try {
    // Create tables if they don't exist
    await createTables();
    
    // Seed initial data if needed
    await seedInitialData();
    
    console.log('Database initialization complete.');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

// Create database tables
async function createTables() {
  try {
    // Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        full_name VARCHAR(255),
        avatar_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Game types
    await pool.query(`
      CREATE TABLE IF NOT EXISTS game_types (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        icon_class VARCHAR(255)
      )
    `);

    // Tournament structures
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tournament_structures (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT
      )
    `);

    // Games
    await pool.query(`
      CREATE TABLE IF NOT EXISTS games (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        game_type_id INTEGER REFERENCES game_types(id),
        structure_id INTEGER REFERENCES tournament_structures(id),
        game_master_id INTEGER REFERENCES users(id),
        location VARCHAR(255) NOT NULL,
        datetime TIMESTAMP NOT NULL,
        entry_fee DECIMAL(10, 2) NOT NULL,
        max_players INTEGER NOT NULL,
        current_players INTEGER DEFAULT 0,
        prize_pool DECIMAL(10, 2) NOT NULL,
        status VARCHAR(50) DEFAULT 'scheduled',
        is_private BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Game participants
    await pool.query(`
      CREATE TABLE IF NOT EXISTS game_participants (
        id SERIAL PRIMARY KEY,
        game_id INTEGER REFERENCES games(id),
        user_id INTEGER REFERENCES users(id),
        has_paid BOOLEAN DEFAULT false,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(game_id, user_id)
      )
    `);

    // Referrals
    await pool.query(`
      CREATE TABLE IF NOT EXISTS referrals (
        id SERIAL PRIMARY KEY,
        referrer_id INTEGER REFERENCES users(id),
        referred_user_id INTEGER REFERENCES users(id),
        game_id INTEGER REFERENCES games(id),
        earnings DECIMAL(10, 2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Earnings
    await pool.query(`
      CREATE TABLE IF NOT EXISTS earnings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        game_id INTEGER REFERENCES games(id),
        amount DECIMAL(10, 2) NOT NULL,
        type VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Tables created successfully');
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  }
}

// Seed initial data for the application
async function seedInitialData() {
  try {
    // Check if we already have game types
    const gameTypesResult = await pool.query('SELECT COUNT(*) FROM game_types');
    if (parseInt(gameTypesResult.rows[0].count) === 0) {
      // Insert game types
      await pool.query(`
        INSERT INTO game_types (name, icon_class) VALUES
        ('Basketball', 'basketball'),
        ('Soccer', 'soccer'),
        ('Tennis', 'tennis')
      `);
    }

    // Check if we already have tournament structures
    const structuresResult = await pool.query('SELECT COUNT(*) FROM tournament_structures');
    if (parseInt(structuresResult.rows[0].count) === 0) {
      // Insert tournament structures
      await pool.query(`
        INSERT INTO tournament_structures (name, description) VALUES
        ('Single Match', 'One-off game'),
        ('Knockout', 'Elimination tournament'),
        ('Round Robin', 'Everyone plays each other'),
        ('League', 'Season-long competition')
      `);
    }

    // Check if we already have a test user
    const usersResult = await pool.query('SELECT COUNT(*) FROM users');
    if (parseInt(usersResult.rows[0].count) === 0) {
      // Insert a test user
      await pool.query(`
        INSERT INTO users (username, password, email, full_name, avatar_url) VALUES
        ('testuser', 'password123', 'test@example.com', 'Test User', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80')
      `);
    }

    console.log('Initial data seeded successfully');
  } catch (error) {
    console.error('Error seeding initial data:', error);
    throw error;
  }
}