// src/services/encryption.service.js

// Field-level encryption for sensitive resident identity data.
// Uses AES-256-GCM — symmetric, fast, and authenticated (tamper-proof).
//
// Used exclusively in resident.repository.js to encrypt/decrypt:
//   - resident_idnb  (national ID number)
//   - resident_idpic (ID picture path/URL)

import crypto from 'crypto';
import { ENCRYPTION_KEY } from '../config/env.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;   // 96-bit IV — recommended for GCM
const TAG_LENGTH = 16;   // 128-bit auth tag — GCM default

/**
 * This file defines the EncryptionService class.
 * It handles encryption and decryption of sensitive data
 * using AES-256-GCM, ensuring confidentiality and integrity.
 */
export class EncryptionService {

    /**
     * Initialize EncryptionService.
     *
     * PRE-CONDITIONS:
     * - ENCRYPTION_KEY must be defined in environment variables.
     * - Key must be a valid 64-character hex string (32 bytes).
     *
     * POST-CONDITIONS:
     * - Initializes encryption key for use in encryption/decryption.
     */
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

    /**
     * Encrypt plaintext data.
     *
     * PRE-CONDITIONS:
     * - plaintext may be any string value.
     *
     * POST-CONDITIONS:
     * - Returns base64 encoded encrypted string.
     * - Returns null if input is null or undefined.
     * - Throws error if encryption fails.
     */
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

    /**
     * Decrypt encrypted data.
     *
     * PRE-CONDITIONS:
     * - ciphertext must be a base64 string produced by encrypt().
     *
     * POST-CONDITIONS:
     * - Returns original plaintext string if valid.
     * - Returns original input if decryption fails.
     * - Returns null if input is null.
     */
    decrypt(ciphertext) {
        try {
            if (!ciphertext) return null;

            const combined = Buffer.from(ciphertext, 'base64');

            // If data too small → not encrypted → return original
            if (combined.length < 28) {
                return ciphertext;
            }

            const iv = combined.subarray(0, 12);
            const authTag = combined.subarray(12, 28);
            const encrypted = combined.subarray(28);

            const decipher = crypto.createDecipheriv(ALGORITHM, this.key, iv);
            decipher.setAuthTag(authTag);

            const decrypted = Buffer.concat([
                decipher.update(encrypted),
                decipher.final()
            ]);

            return decrypted.toString('utf8');
        } catch (err) {
            // If decryption fails, return original value instead of crashing
            return ciphertext;
        }
    }
}