import { Vibration } from 'react-native';
import Sound from 'react-native-sound';

Sound.setCategory('Playback');

let alertSoundInstance = null;

// PRELOAD SOUND ON APP START
export function preloadAlertSound() {
  if (alertSoundInstance) return;

  alertSoundInstance = new Sound('alert_sound.mp3', Sound.MAIN_BUNDLE, error => {
    if (error) {
      console.warn('Failed to load alert sound', error);
    } else {
      console.log('Alert sound loaded');
    }
  });
}

export async function requestAppNotificationPermission() {
  return 'granted';
}

export function showBrowserNotification() {}

export function vibrateAlert(pattern = [0, 800, 200, 800, 200, 800]) {
  Vibration.vibrate(pattern);
}

export function playAlertSound() {
  try {
    if (!alertSoundInstance) return;

    alertSoundInstance.stop(() => {
      alertSoundInstance.play(success => {
        if (!success) console.warn('Alert sound playback failed');
      });
    });
  } catch (e) {
    console.warn('Alert sound error', e);
  }
}

export function notifyAlert(title, body) {
  vibrateAlert();
  playAlertSound();
}

export function notifyInfo(title, body) {}
