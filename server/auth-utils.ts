import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

// Hash a password with a randomly generated salt
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString('hex')}.${salt}`;
}

// Verify a password against a stored hash
export async function verifyPassword(storedPassword: string, suppliedPassword: string): Promise<boolean> {
  try {
    const [hashedPassword, salt] = storedPassword.split('.');
    const hashedPasswordBuf = Buffer.from(hashedPassword, 'hex');
    const suppliedPasswordBuf = (await scryptAsync(suppliedPassword, salt, 64)) as Buffer;
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