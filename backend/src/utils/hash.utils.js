import bcrypt from 'bcrypt';

// Cost factor (work factor)
// 12 is a strong default for production
const SALT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS, 10) || 12;

/**
 * Hash a plain text password using bcrypt
 * @param {string} password
 * @returns {Promise<string>}
 */
export async function hashPassword(password) {
  if (!password || typeof password !== 'string') {
    throw new Error('Invalid password input');
  }

  try {
    return await bcrypt.hash(password, SALT_ROUNDS);
  } catch (err) {
    throw new Error(`Hashing failed: ${err.message}`);
  }
}

/**
 * Compare a plain text password with a hashed password
 * @param {string} plainPassword
 * @param {string} hashedPassword
 * @returns {Promise<boolean>}
 */
export async function comparePassword(plainPassword, hashedPassword) {
  if (!plainPassword || !hashedPassword) {
    throw new Error('Both passwords are required for comparison');
  }

  try {
    return await bcrypt.compare(plainPassword, hashedPassword);
  } catch (err) {
    throw new Error(`Password comparison failed: ${err.message}`);
  }
}

/**
 * Check if a hash needs rehashing (e.g., if SALT_ROUNDS changed)
 * Useful for upgrading security over time
 * @param {string} hashedPassword
 * @returns {boolean}
 */
export function needsRehash(hashedPassword) {
  try {
    const rounds = bcrypt.getRounds(hashedPassword);
    return rounds < SALT_ROUNDS;
  } catch {
    return true;
  }
}