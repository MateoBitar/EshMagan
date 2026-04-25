import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

/**
 * This file initializes and provides access to the Firebase Admin SDK.
 * It loads the service account credentials and exposes functions
 * to retrieve the Firebase app instance and messaging service.
 */

let firebaseApp = null;

/**
 * Initialize and retrieve Firebase Admin App instance
 * 
 * PRE-CONDITIONS:
 * - Service account JSON file must exist at specified path
 * 
 * POST-CONDITIONS:
 * - Returns initialized Firebase app instance
 * - Ensures singleton (initialized only once)
 */
export function getFirebaseAdminApp() {
    if (firebaseApp) return firebaseApp;

    // Resolve path to Firebase service account credentials
    const serviceAccountPath = path.resolve(
        process.cwd(),
        'backend/src/config/eshmagan-firebase-adminsdk.json'
    );

    // Read and parse credentials file
    const serviceAccount = JSON.parse(
        fs.readFileSync(serviceAccountPath, 'utf-8')
    );

    // Initialize Firebase Admin SDK
    firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });

    return firebaseApp;
}

/**
 * Retrieve Firebase Messaging service
 * 
 * PRE-CONDITIONS:
 * - Firebase Admin App must be initialized
 * 
 * POST-CONDITIONS:
 * - Returns messaging instance for sending notifications
 */
export function getFirebaseMessaging() {
    return admin.messaging(getFirebaseAdminApp());
}