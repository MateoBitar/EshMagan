import { getFirebaseMessaging } from '../config/firebaseAdmin.js';
import { UserService } from './user.service.js';
import { UserRepository } from '../domain/repositories/user.repository.js';

/**
 * This file defines push notification helper functions.
 * It sends Firebase Cloud Messaging notifications to device tokens
 * and clears invalid tokens from the database when detected.
 */

/**
 * Clear invalid FCM tokens.
 *
 * PRE-CONDITIONS:
 * - tokens must be an array of invalid FCM token strings.
 *
 * POST-CONDITIONS:
 * - Invalid tokens are removed from users.
 * - Logs warning if cleanup fails.
 */
async function clearInvalidTokens(tokens) {
  try {
    const userService = new UserService(new UserRepository());

    for (const token of tokens) {
      await userService.removeFcmToken(token);
    }
  } catch (e) {
    console.warn('Failed to clear invalid tokens', e);
  }
}

/**
 * Send push notifications to FCM tokens.
 *
 * PRE-CONDITIONS:
 * - tokens must be an array of FCM token strings.
 * - title and body may be provided.
 * - Firebase Admin messaging must be configured.
 *
 * POST-CONDITIONS:
 * - Sends push notifications to valid tokens.
 * - Removes invalid tokens from database.
 * - Returns Firebase send response.
 * - Throws error if sending fails.
 */
export async function sendPushToTokens(tokens = [], { title, body, data = {}, android = {} }) {
  const cleanTokens = [...new Set(tokens.filter(Boolean))];

  if (cleanTokens.length === 0) {
    return { successCount: 0, failureCount: 0, responses: [] };
  }

  const messaging = getFirebaseMessaging();

  const payload = {
    tokens: cleanTokens,
    notification: {
      title: String(title || 'EshMagan Alert'),
      body: String(body || 'You have a new alert.'),
    },
    data: {
      title: String(title || 'EshMagan Alert'),
      body: String(body || 'You have a new alert.'),
      ...Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, String(v ?? '')])
      ),
    },
    android: {
      priority: android.priority || 'high',
      notification: {
        channelId: data?.type === 'GeneralNotification' ? 'notifications' : 'alerts',
        sound: data?.type === 'GeneralNotification' ? undefined : 'alert_sound',
      },
    },
  };

  try {
    const response = await messaging.sendEachForMulticast(payload);
    const invalidTokens = [];

    response.responses.forEach((result, index) => {
      const token = cleanTokens[index];

      if (result.success) {
        console.log(`Token success: ${token}`);
      } else {
        const errorCode = result.error?.code;

        if (
          errorCode === 'messaging/registration-token-not-registered' ||
          errorCode === 'messaging/invalid-registration-token'
        ) {
          invalidTokens.push(token);
        }
      }
    });

    if (invalidTokens.length > 0) {
      await clearInvalidTokens(invalidTokens);
    }

    return response;

  } catch (err) {
    console.error('🔥 FCM SEND CRASH:', err);
    throw err;
  }
}
