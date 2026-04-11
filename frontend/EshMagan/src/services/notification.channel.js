import notifee, { AndroidImportance } from '@notifee/react-native';
import { Platform } from 'react-native';

export async function createNotificationChannel() {
  if (Platform.OS !== 'android') return;

  await notifee.createChannel({
    id: 'alerts',
    name: 'Alerts',
    importance: AndroidImportance.HIGH,
    sound: 'alert_sound',
    vibration: true,
  });

  console.log('Notification channel created');
}
