// src/services/encryption.service.js

// Field-level encryption for sensitive resident identity data.
// Uses AES-256-GCM — symmetric, fast, and authenticated (tamper-proof).
//
// Used exclusively in resident.repository.js to encrypt/decrypt:
//   - resident_idnb  (national ID number)
//   - resident_idpic (ID picture path/URL)
import crypto from 'crypto';
import { ENCRYPTION_KEY } from '../config/env.js';

const ALGORITHM  = 'aes-256-gcm';
const IV_LENGTH  = 12;   // 96-bit IV — recommended for GCM
const TAG_LENGTH = 16;   // 128-bit auth tag — GCM default

export class EncryptionService {
    constructor() {
        const keyHex = ENCRYPTION_KEY;
        if (!keyHex) throw new Error("Missing required env variable: ENCRYPTION_KEY");

        // Key must be 32 bytes (64 hex chars) for AES-256
        const keyBuffer = Buffer.from(keyHex, 'hex');
        if (keyBuffer.length !== 32) {
            throw new Error("ENCRYPTION_KEY must be a 64-character hex string (32 bytes)");
        }

        this.key = keyBuffer;
    }

    // Encrypts a plaintext string.
    // Returns a single base64 string: iv + authTag + ciphertext
    // Format: <12-byte IV><16-byte authTag><ciphertext> — all base64 encoded together
    encrypt(plaintext) {
        try {
            if (plaintext === null || plaintext === undefined) return null;

            // Step 1: Generate a random IV for every encryption call
            const iv = crypto.randomBytes(IV_LENGTH);

            // Step 2: Create cipher
            const cipher = crypto.createCipheriv(ALGORITHM, this.key, iv, {
                authTagLength: TAG_LENGTH
            });

            // Step 3: Encrypt
            const encrypted = Buffer.concat([
                cipher.update(String(plaintext), 'utf8'),
                cipher.final()
            ]);

            // Step 4: Get auth tag (must be called AFTER final())
            const authTag = cipher.getAuthTag();

            // Step 5: Concatenate iv + authTag + ciphertext and base64 encode
            const combined = Buffer.concat([iv, authTag, encrypted]);
            return combined.toString('base64');
        } catch (err) {
            throw new Error(`Encryption failed: ${err.message}`);
        }
    }

    // Decrypts a base64 string produced by encrypt().
    // Returns the original plaintext string.
    decrypt(ciphertext) {
        try {
            if (ciphertext === null || ciphertext === undefined) return null;

            // Step 1: Decode base64 back to buffer
            const combined = Buffer.from(ciphertext, 'base64');

            // Step 2: Slice out iv, authTag, encrypted data
            const iv         = combined.subarray(0, IV_LENGTH);
            const authTag    = combined.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
            const encrypted  = combined.subarray(IV_LENGTH + TAG_LENGTH);

            // Step 3: Create decipher
            const decipher = crypto.createDecipheriv(ALGORITHM, this.key, iv, {
                authTagLength: TAG_LENGTH
            });

            // Step 4: Set auth tag for tamper verification
            decipher.setAuthTag(authTag);

            // Step 5: Decrypt
            const decrypted = Buffer.concat([
                decipher.update(encrypted),
                decipher.final()
            ]);

            return decrypted.toString('utf8');
        } catch (err) {
            throw new Error(`Decryption failed: ${err.message}`);
        }
    }
}