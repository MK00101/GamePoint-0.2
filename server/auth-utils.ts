import { scrypt, randomBytes, timingSafeEqual, ScryptOptions } from 'crypto';
import { promisify } from 'util';

// Properly type scryptAsync to handle options
type ScryptFunction = (
  password: string | Buffer | NodeJS.TypedArray | DataView,
  salt: string | Buffer | NodeJS.TypedArray | DataView,
  keylen: number,
  options?: ScryptOptions
) => Promise<Buffer>;

const scryptAsync = promisify(scrypt) as ScryptFunction;

// Constants for password hashing
const KEYLEN = 64;  // Length of the derived key
const COST_FACTOR = 16384;  // N parameter for scrypt (CPU/memory cost)
const BLOCK_SIZE = 8;  // r parameter for scrypt (block size)
const PARALLELIZATION = 1;  // p parameter for scrypt (parallelization)
const SALT_LENGTH = 32;  // Length of salt in bytes

/**
 * Hash a password with a randomly generated salt and configurable parameters
 * Uses scrypt with higher cost factor for better security
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH).toString('hex');
  
  // We're using a more conservative approach for memory requirements
  // to ensure this works well in container environments
  const scryptParams: ScryptOptions = {
    N: COST_FACTOR,
    r: BLOCK_SIZE,
    p: PARALLELIZATION,
    maxmem: 64 * 1024 * 1024 // 64MB max memory
  };
  
  const buf = await scryptAsync(password, salt, KEYLEN, scryptParams);
  const iterations = COST_FACTOR.toString(16); // Store iterations as hex
  
  // Format: hash.salt.iterations
  return `${buf.toString('hex')}.${salt}.${iterations}`;
}

/**
 * Verify a password against a stored hash
 * Handles both new format (hash.salt.iterations) and legacy format (hash.salt)
 */
export async function verifyPassword(storedPassword: string, suppliedPassword: string): Promise<boolean> {
  try {
    const parts = storedPassword.split('.');
    if (parts.length < 2) {
      console.error('Invalid password format');
      return false;
    }
    
    const hashedPassword = parts[0];
    const salt = parts[1];
    const hashedPasswordBuf = Buffer.from(hashedPassword, 'hex');
    
    let suppliedPasswordBuf: Buffer;
    
    // Check if we're using the new format with iterations specified
    if (parts.length >= 3) {
      const iterations = parseInt(parts[2], 16);
      const scryptParams: ScryptOptions = {
        N: iterations,
        r: BLOCK_SIZE,
        p: PARALLELIZATION,
        maxmem: 64 * 1024 * 1024 // 64MB max memory
      };
      suppliedPasswordBuf = await scryptAsync(suppliedPassword, salt, KEYLEN, scryptParams);
    } else {
      // Legacy format without iterations - use default values
      suppliedPasswordBuf = await scryptAsync(suppliedPassword, salt, KEYLEN);
    }
    
    return timingSafeEqual(hashedPasswordBuf, suppliedPasswordBuf);
  } catch (error) {
    console.error('Error verifying password:', error);
    return false;
  }
}

// Generate a secure session secret
export function generateSessionSecret(): string {
  return randomBytes(32).toString('hex');
}

// Function to sanitize user object by removing sensitive information
export function sanitizeUser(user: any): any {
  const { password, ...sanitizedUser } = user;
  return sanitizedUser;
}