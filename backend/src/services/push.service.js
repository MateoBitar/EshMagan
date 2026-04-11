import { getFirebaseMessaging } from '../config/firebaseAdmin.js';
import { pool } from '../config/db.js';

const INVALID_TOKEN_ERRORS = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
]);

async function clearInvalidTokens(tokens = []) {
  const uniqueTokens = [...new Set(tokens.filter(Boolean))];
  if (!uniqueTokens.length) return;

  try {
    await pool.query(
      `UPDATE users
       SET fcm_token = NULL
       WHERE fcm_token = ANY($1::text[])`,
      [uniqueTokens]
    );

    console.log(`🧹 Cleared ${uniqueTokens.length} invalid FCM token(s) from DB`);
  } catch (err) {
    console.error('Failed to clear invalid FCM tokens:', err.message);
  }
}

export async function sendPushToTokens(tokens = [], { title, body, data = {} }) {
  const cleanTokens = [...new Set(tokens.filter(Boolean))];

  if (cleanTokens.length === 0) {
    return { successCount: 0, failureCount: 0, responses: [] };
  }

  const messaging = getFirebaseMessaging();

  const response = await messaging.sendEachForMulticast({
    tokens: cleanTokens,
    notification: {
      title: title || 'EshMagan Alert',
      body: body || 'You have a new alert.',
    },
    data: Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, String(v ?? '')])
    ),
    android: {
      priority: 'high',
      notification: {
        sound: 'alert_sound',
        channelId: 'alerts',
      },
    },
  });

  const invalidTokens = [];

  response.responses.forEach((result, index) => {
    if (!result.success) {
      const errorCode = result.error?.code;
      const failedToken = cleanTokens[index];

      console.warn(`FCM send failed for token ${failedToken}: ${errorCode || 'unknown error'}`);

      if (INVALID_TOKEN_ERRORS.has(errorCode)) {
        invalidTokens.push(failedToken);
      }
    }
  });

  if (invalidTokens.length > 0) {
    await clearInvalidTokens(invalidTokens);
  }

  return response;
}
