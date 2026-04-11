import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

let firebaseApp = null;

export function getFirebaseAdminApp() {
    if (firebaseApp) return firebaseApp;

    const serviceAccountPath = path.resolve(
        process.cwd(),
        'backend/src/config/eshmagan-firebase-adminsdk.json'
    );

    const serviceAccount = JSON.parse(
        fs.readFileSync(serviceAccountPath, 'utf-8')
    );

    firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });

    return firebaseApp;
}

export function getFirebaseMessaging() {
    return admin.messaging(getFirebaseAdminApp());
}