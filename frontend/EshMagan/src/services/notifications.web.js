// src/services/notifications.web.js

const WEB_NOTIFICATION_PROMPT_KEY = 'eshmagan_notification_prompted';

export function preloadAlertSound() {
  // preload web audio
  try {
    const audio = new Audio('/alert_sound.mp3');
    audio.preload = 'auto';
  } catch {}
}

export async function requestAppNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';

  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';

  const alreadyPrompted = window.localStorage.getItem(WEB_NOTIFICATION_PROMPT_KEY);
  if (alreadyPrompted === 'true') return Notification.permission;

  const result = await Notification.requestPermission();
  window.localStorage.setItem(WEB_NOTIFICATION_PROMPT_KEY, 'true');
  return result;
}

export function showBrowserNotification(title, body, options = {}) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  new Notification(title, {
    body,
    icon: '/fire-icon.png',
    ...options,
  });
}

export function vibrateAlert(pattern = [0, 600, 200, 600]) {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
}

export function playAlertSound() {
  try {
    const audio = new Audio('/alert_sound.mp3');
    audio.play().catch(() => {});
  } catch {}
}

export function notifyAlert(title, body) {
  showBrowserNotification(title, body);
  vibrateAlert();
  playAlertSound();
}

export function notifyInfo(title, body) {
  showBrowserNotification(title, body);
}