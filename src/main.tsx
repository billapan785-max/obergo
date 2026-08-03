import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import App from './App.tsx';
import './index.css';

// Initialize Capacitor native plugins if running on a device
if (Capacitor.isNativePlatform()) {
  try {
    if (Capacitor.isPluginAvailable('SplashScreen')) {
      SplashScreen.hide().catch(console.warn);
    }
  } catch (e) {
    console.warn("SplashScreen hide failed:", e);
  }
  
  try {
    if (Capacitor.isPluginAvailable('StatusBar')) {
      StatusBar.hide().catch(console.warn);
      StatusBar.setOverlaysWebView({ overlay: true }).catch(console.warn);
    }
  } catch (e) {
    console.warn("StatusBar setup failed:", e);
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
