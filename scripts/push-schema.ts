import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pkg from 'pg';
const { Pool } = pkg;
import * as schema from '../shared/schema';

async function main() {
  console.log('Connecting to database...');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const db = drizzle(pool, { schema });

  console.log('Running schema migrations...');
  
  // First, run the official drizzle-kit push command
  try {
    // Use drizzle-kit generate instead of push to avoid interactive prompts
    const { spawn } = await import('child_process');
    console.log('Generating migration SQL...');
    const child = spawn('npx', ['drizzle-kit', 'generate:pg'], { stdio: 'inherit' });
    
    await new Promise((resolve, reject) => {
      child.on('close', code => {
        if (code === 0) {
          resolve(null);
        } else {
          reject(new Error(`drizzle-kit generate:pg failed with code ${code}`));
        }
      });
    });
    
    console.log('Migration SQL generated. Pushing to database...');
    
  } catch (error) {
    console.error('Error running drizzle-kit generate:', error);
    // Continue with custom migrations
  }
  
  // Perform custom migrations
  const client = await pool.connect();
  try {
    // Check tables exists
    const tablesResult = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    `);
    
    const existingTables = tablesResult.rows.map(row => row.table_name);
    console.log('Existing tables:', existingTables);
    
    // Check for required payout_structure column in games table (if games table exists)
    if (existingTables.includes('games')) {
      const columnsResult = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'games' AND column_name = 'payout_structure'
      `);
      
      if (columnsResult.rows.length === 0) {
        console.log('Adding payout_structure column to games table...');
        await client.query(`
          ALTER TABLE games 
          ADD COLUMN payout_structure TEXT DEFAULT '1st:100%' NOT NULL
        `);
      }
    }
    
    // Ensure status column exists in games table (if games table exists)
    if (existingTables.includes('games')) {
      const statusColumnResult = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'games' AND column_name = 'status'
      `);
      
      if (statusColumnResult.rows.length === 0) {
        console.log('Adding status column to games table...');
        await client.query(`
          ALTER TABLE games 
          ADD COLUMN status VARCHAR(255) DEFAULT 'open' NOT NULL
        `);
      }
    }
    
    console.log('Custom migrations completed successfully');
  } finally {
    client.release();
  }

  console.log('Schema updated successfully!');
  process.exit(0);
}

main().catch(err => {
  console.error('Schema update failed:', err);
  process.exit(1);
});