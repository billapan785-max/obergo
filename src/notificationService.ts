import { Job } from './types';
import { LocalNotifications } from '@capacitor/local-notifications';
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { db } from './firebase';
import { doc, updateDoc } from 'firebase/firestore';

// Play loud job alert chime audio synthesized via Web Audio API
export function playJobAlertChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;
    
    // Multi-tone siren chime (D5 -> F#5 -> A5 -> D6)
    const tones = [587.33, 739.99, 880.00, 1174.66];
    tones.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);

      gain.gain.setValueAtTime(0, now + idx * 0.12);
      gain.gain.linearRampToValueAtTime(0.4, now + idx * 0.12 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 0.26);
    });
  } catch (err) {
    console.warn("Audio chime error:", err);
  }
}

// Request all essential permissions (Notification & Geolocation) on app launch
export async function requestAllAppPermissions(): Promise<{ notification: boolean; location: boolean }> {
  let notificationGranted = false;
  let locationGranted = false;

  // 1. Notification Permission
  try {
    if (Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('LocalNotifications')) {
      const perm = await LocalNotifications.requestPermissions();
      notificationGranted = perm.display === 'granted';
    } else if (typeof window !== 'undefined' && 'Notification' in window && typeof Notification === 'function') {
      if (Notification.permission === 'granted') {
        notificationGranted = true;
      } else if (Notification.permission !== 'denied' && typeof Notification.requestPermission === 'function') {
        const res = await Notification.requestPermission();
        notificationGranted = res === 'granted';
      }
    }
  } catch (e) {
    console.warn("Notification permission error:", e);
  }

  // 2. Geolocation Permission
  try {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      locationGranted = await new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          () => resolve(true),
          () => resolve(false),
          { timeout: 5000 }
        );
      });
    }
  } catch (e) {
    console.warn("Location permission error:", e);
  }

  return { notification: notificationGranted, location: locationGranted };
}

// Request device/browser push notification permission
export async function requestJobNotificationPermission(): Promise<boolean> {
  if (Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('LocalNotifications')) {
    try {
      const perm = await LocalNotifications.requestPermissions();
      return perm.display === 'granted';
    } catch (e) {
      console.warn("LocalNotifications request error:", e);
    }
  }
  try {
    if (typeof window === 'undefined' || !('Notification' in window) || typeof Notification !== 'function') {
      return false;
    }
    if (Notification.permission === 'granted') {
      return true;
    }
    if (Notification.permission !== 'denied' && typeof Notification.requestPermission === 'function') {
      const res = await Notification.requestPermission();
      return res === 'granted';
    }
  } catch (e) {
    console.warn("Permission check error:", e);
  }
  return false;
}

// Setup Firebase FCM for Push Notifications
export async function setupFirebasePushNotifications(userId: string) {
  if (Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('PushNotifications')) {
    try {
      console.log("PushNotifications native plugin detected, but skipped to prevent crash on generic APK builds without google-services.json.");
      // Note: Enabling PushNotifications.register() without google-services.json in the android/app dir causes a fatal JVM crash.
      // let permStatus = await PushNotifications.checkPermissions();
      // if (permStatus.receive === 'prompt') {
      //   permStatus = await PushNotifications.requestPermissions();
      // }
      // if (permStatus.receive !== 'granted') return;
      // await PushNotifications.register();
      // ...
    } catch (e) {
      console.warn("FCM setup failed safely:", e);
    }
  }
}

// Trigger OS push/lock screen notification + Vibration + Sound for Custom Broadcasts or Alerts
export async function triggerSystemCustomNotification(title: string, body: string) {
  // 1. Play alert sound
  playJobAlertChime();

  // 2. Vibrate phone
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([300, 100, 300, 100, 400]);
    } catch (e) {}
  }

  // 3. Native Android Lockscreen Notification via Capacitor
  if (Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('LocalNotifications')) {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title,
            body,
            id: Math.floor(Math.random() * 1000000),
            schedule: { at: new Date(Date.now() + 100) },
            extra: { type: 'broadcast' }
          }
        ]
      });
      return;
    } catch (err) {
      console.warn("Native LocalNotifications error:", err);
    }
  }

  // 4. Web Notification fallback with protection against 'Illegal constructor' on Android WebView
  try {
    if (typeof window !== 'undefined' && 'Notification' in window && typeof Notification === 'function') {
      if (Notification.permission === 'granted') {
        const options = {
          body,
          icon: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=128&h=128&fit=crop',
          tag: `broadcast_${Date.now()}`,
          vibrate: [300, 100, 300, 100, 400]
        };

        if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.ready.then((reg) => {
            reg.showNotification(title, options).catch(() => {});
          }).catch(() => {});
        } else {
          // Wrap new Notification in try-catch because Android WebView throws 'Illegal constructor'
          try {
            const notif = new Notification(title, options);
            notif.onclick = () => {
              window.focus();
              notif.close();
            };
          } catch (constrErr) {
            console.warn("Direct Notification constructor not supported on this device:", constrErr);
          }
        }
      }
    }
  } catch (err) {
    console.warn("Web Notification error:", err);
  }
}

// Trigger OS push notification + Vibration + Sound for new jobs
export async function triggerSystemJobAlert(job: Job, currencySymbol: string = 'Rs') {
  const title = `🚨 NAYI JOB ALERT: ${job.description || job.category}`;
  const body = `💰 Budget: ${currencySymbol} ${job.budget}\n📍 Location: ${job.location}\n⚡ Open Obrago app to view and bid!`;

  await triggerSystemCustomNotification(title, body);
}

