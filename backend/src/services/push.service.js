import { getFirebaseMessaging } from '../config/firebaseAdmin.js';
import { UserService } from './user.service.js';
import { UserRepository } from '../domain/repositories/user.repository.js';

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
