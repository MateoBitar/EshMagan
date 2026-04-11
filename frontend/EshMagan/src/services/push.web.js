export async function requestNativePushPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;

  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;

  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

export async function getNativePushToken() {
  return null; // no FCM for web
}

export function onForegroundNativeMessage(callback) {
  return () => {}; // no Firebase listener
}