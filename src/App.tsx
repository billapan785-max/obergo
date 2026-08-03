import React, { useState, useEffect } from 'react';
import { AppProvider, useAppStore } from './store';
import { CustomerApp } from './CustomerApp';
import { WorkerApp } from './WorkerApp';
import { SplashScreen } from './SplashScreen';
import { AuthFlow } from './AuthFlow';
import { ProfileFlow } from './ProfileFlow';
import { AdminPanel } from './AdminPanel';
import { CommunicationModals } from './CommunicationModals';
import { CallHandler } from './CallHandler';
import { ErrorBoundary } from './ErrorBoundary';
import { JobAlertToast } from './JobAlertToast';
import { StandaloneLegalPage } from './StandaloneLegalPage';
import { motion, AnimatePresence } from 'motion/react';
import { Settings2, ShieldCheck, User, Wrench, Moon, Sun, AlertTriangle } from 'lucide-react';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { Button } from './components';
import { setupFirebasePushNotifications } from './notificationService';

function MainApp() {
  const { role, setRole, latestJobAlert, setLatestJobAlert, currency, currentUser } = useAppStore();
  const [showSplash, setShowSplash] = useState(true);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Check URL pathname/search for standalone privacy/terms pages
  const pathname = typeof window !== 'undefined' ? window.location.pathname.toLowerCase() : '';
  const search = typeof window !== 'undefined' ? window.location.search.toLowerCase() : '';

  if (pathname.includes('/privacy') || search.includes('page=privacy')) {
    return <StandaloneLegalPage type="privacy" />;
  }

  if (pathname.includes('/terms') || search.includes('page=terms')) {
    return <StandaloneLegalPage type="terms" />;
  }

  if (pathname.includes('/delete-account') || pathname.includes('/account-deletion') || search.includes('page=delete-account')) {
    return <StandaloneLegalPage type="delete-account" />;
  }

  useEffect(() => {
    if (Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('App')) {
      try {
        const backListener = CapacitorApp.addListener('backButton', ({ canGoBack }) => {
          if (!canGoBack) {
            setShowExitConfirm(true);
          } else {
            window.history.back();
          }
        });
        return () => {
          backListener.then(listener => listener?.remove()).catch(() => {});
        };
      } catch (e) {
        console.warn("BackButton listener setup failed:", e);
      }
    }
  }, []);

  useEffect(() => {
    if (currentUser && currentUser.id !== 'guest') {
      setupFirebasePushNotifications(currentUser.id).catch(console.warn);
    }
  }, [currentUser?.id]);

  const handleExitApp = () => {
    if (Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('App')) {
      try {
        CapacitorApp.exitApp();
      } catch (e) {}
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-100 dark:bg-gray-950 flex flex-col items-center justify-start font-sans selection:bg-green-500/30">
      {/* Fully responsive wrapper filling full width on mobile, max-w container on desktop */}
      <div className="w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl min-h-screen bg-white dark:bg-gray-900 shadow-2xl relative flex flex-col overflow-x-hidden pt-safe sm:pt-0">
        
        <div className="flex-1 w-full relative flex flex-col">
          <AnimatePresence>
            {showSplash ? (
              <SplashScreen key="splash" onFinish={() => setShowSplash(false)} />
            ) : (
              <motion.div
                key="app"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="flex-1 w-full relative flex flex-col"
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={role}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="flex-1 w-full flex flex-col"
                  >
                    <ErrorBoundary>
                      {role === 'customer' ? <CustomerApp /> : <WorkerApp />}
                    </ErrorBoundary>
                  </motion.div>
                </AnimatePresence>
                
                {/* Lazy Auth, Profile, Admin & Modal Overlays */}
                <ErrorBoundary>
                  <JobAlertToast 
                    job={latestJobAlert} 
                    currency={currency} 
                    onClose={() => setLatestJobAlert(null)}
                    onOpenJob={() => setRole('worker')}
                  />
                  <AnimatePresence>
                    <AuthFlow key="auth" />
                    <ProfileFlow key="profile" />
                    <AdminPanel key="admin" />
                    <CommunicationModals key="comms" />
                    <CallHandler key="call-handler" />
                  </AnimatePresence>
                </ErrorBoundary>
                  
                  {/* Exit Confirmation Modal */}
                  {showExitConfirm && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
                    >
                      <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="bg-white dark:bg-gray-900 rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-gray-100 dark:border-gray-800"
                      >
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                          <AlertTriangle className="text-red-500" size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-center text-gray-900 dark:text-white mb-2">Exit App?</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-center text-sm mb-6">
                          Are you sure you want to quit the application?
                        </p>
                        <div className="flex gap-3">
                          <Button variant="outline" fullWidth onClick={() => setShowExitConfirm(false)}>
                            Cancel
                          </Button>
                          <Button 
                            fullWidth 
                            className="bg-red-500 hover:bg-red-600 text-white border-transparent"
                            onClick={handleExitApp}
                          >
                            Quit
                          </Button>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <MainApp />
      </AppProvider>
    </ErrorBoundary>
  );
}
