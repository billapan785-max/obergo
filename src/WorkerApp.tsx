import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from './store';
import { Job, CATEGORIES, PAKISTAN_CITIES } from './types';
import { Button, Card, Input, TopBar } from './components';
import { LiveMap, getDistanceKm } from './LiveMap';
import { SafetySOSModal, RatingReviewModal, CancelJobModal } from './InDriveFeatures';
import { PublicProfileModal } from './PublicProfileModal';
import { ReportModal } from './ReportModal';
import { MapPin, DollarSign, Clock, CheckCircle2, Navigation, MessageSquare, Phone, ShieldAlert, User, Bell, AlertTriangle } from 'lucide-react';
import { requestJobNotificationPermission, playJobAlertChime } from './notificationService';
import { db } from './firebase';
import { doc, updateDoc } from 'firebase/firestore';

export function WorkerApp() {
  const { jobs, bids, currentUser, isLoggedIn, setShowAuth, setShowProfile, userLocation, requestLocation, currency } = useAppStore();
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [selectedCity, setSelectedCity] = useState<string>(() => currentUser?.city || 'Islamabad');
  const [notifGranted, setNotifGranted] = useState(() => {
    try {
      return typeof window !== 'undefined' && 'Notification' in window && typeof Notification === 'function' && typeof Notification.requestPermission === 'function' && Notification.permission === 'granted';
    } catch {
      return false;
    }
  });

  const isWebNotificationSupported = useMemo(() => {
    try {
      return typeof window !== 'undefined' && 'Notification' in window && typeof Notification === 'function' && typeof Notification.requestPermission === 'function';
    } catch {
      return false;
    }
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good Morning,';
    if (hour >= 12 && hour < 17) return 'Good Afternoon,';
    if (hour >= 17 && hour < 21) return 'Good Evening,';
    return 'Good Night,';
  };

  const handleEnablePush = async () => {
    const granted = await requestJobNotificationPermission();
    setNotifGranted(granted);
    if (granted) {
      playJobAlertChime();
    }
  };

  const citiesList = [
    'All Cities',
    ...PAKISTAN_CITIES
  ];

  // Calculate real worker earnings and completed jobs count
  const completedWorkerJobs = jobs.filter(j => j.workerId === currentUser.id && j.status === 'completed');
  const totalWorkerEarnings = completedWorkerJobs.reduce((sum, job) => {
    const acceptedBid = bids.find(b => b.id === job.acceptedBidId);
    return sum + (acceptedBid ? acceptedBid.price : 0);
  }, 0);

  // Filter jobs by bidding status and city
  const availableJobs = jobs.filter(j => {
    if (j.status !== 'bidding') return false;
    if (selectedCity === 'All Cities') return true;
    const jobCity = j.city || j.location || '';
    return jobCity.toLowerCase().includes(selectedCity.toLowerCase()) || selectedCity.toLowerCase().includes(jobCity.toLowerCase());
  });
  
  // Find if worker has an active job (accepted)
  const activeJob = jobs.find(j => j.workerId === currentUser.id && j.status !== 'completed' && j.status !== 'cancelled');

  if (activeJob) {
    return <WorkerActiveJob job={activeJob} />;
  }

  if (selectedJob) {
    return <WorkerSubmitBid job={selectedJob} onBack={() => setSelectedJob(null)} />;
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950">
      <div className="bg-gray-900 text-white px-5 pt-10 sm:pt-8 pb-6 rounded-b-[2rem] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-green-500 rounded-full blur-[80px] opacity-20 -translate-y-1/2 translate-x-1/2"></div>
        <div className="flex justify-between items-center mb-6 relative z-10">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowProfile(true)}
              className="rounded-full border-2 border-green-500 overflow-hidden active:scale-95 transition-transform bg-white/10 shrink-0"
            >
              <img src={currentUser.avatar} alt="Profile" className="w-12 h-12 object-cover" />
            </button>
            <div>
              <p className="text-green-400 text-xs font-bold uppercase tracking-wide mb-0.5">{getGreeting()}</p>
              {isLoggedIn ? (
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold">{currentUser.name}</h1>
                  {currentUser.verificationStatus === 'verified' && (
                    <CheckCircle2 size={18} className="text-green-400" />
                  )}
                </div>
              ) : (
                <button onClick={() => setShowAuth(true)} className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-full text-sm font-bold transition-colors">
                  Sign In to Earn
                </button>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="flex items-center gap-2 bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-bold border border-green-500/30">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div> Online
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 relative z-10">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/5">
            <p className="text-gray-400 text-xs mb-1">Total Earnings</p>
            <p className="text-2xl font-bold text-white">{currency} {totalWorkerEarnings.toFixed(0)}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/5">
            <p className="text-gray-400 text-xs mb-1">Completed</p>
            <p className="text-2xl font-bold text-white">{completedWorkerJobs.length} Jobs</p>
          </div>
        </div>
      </div>

      <div className="px-5 mt-6 flex-1 overflow-y-auto">
        {/* Verification Status Alert Banner */}
        {isLoggedIn && currentUser.verificationStatus === 'pending' && (
          <div className="mb-4 bg-yellow-50 dark:bg-yellow-950/40 border border-yellow-200 dark:border-yellow-800 rounded-2xl p-4 text-xs font-semibold text-yellow-800 dark:text-yellow-200 space-y-1">
            <div className="flex items-center gap-2 font-bold text-sm text-yellow-900 dark:text-yellow-100">
              ⏳ Verification Pending Admin Review
            </div>
            <p>Your worker profile and ID Card (CNIC: {currentUser.cnic || 'N/A'}) are currently under verification by Admin. You will be able to accept jobs once verified.</p>
          </div>
        )}

        {isLoggedIn && currentUser.isBlocked && (
          <div className="mb-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-2xl p-4 text-xs font-semibold text-red-800 dark:text-red-200 space-y-1">
            <div className="flex items-center gap-2 font-bold text-sm text-red-900 dark:text-red-100">
              ⛔ Account Suspended / Blocked
            </div>
            <p>Your worker account has been blocked by Admin. Please contact customer support.</p>
          </div>
        )}
        {!userLocation && (
          <div className="mb-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/30 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 dark:bg-blue-900/50 p-2 rounded-full text-blue-600 dark:text-blue-400">
                <Navigation size={20} />
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-white text-sm">Enable Location</p>
                <p className="text-xs text-gray-500">To find jobs near you</p>
              </div>
            </div>
            <button 
              onClick={requestLocation}
              className="px-4 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-full text-sm font-bold shadow-sm transition-colors"
            >
              Allow
            </button>
          </div>
        )}

        {!notifGranted && isWebNotificationSupported && (
          <div className="mb-4 bg-gradient-to-r from-emerald-500/10 via-green-500/10 to-teal-500/10 border border-green-500/30 rounded-2xl p-3.5 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-green-500 text-white p-2.5 rounded-2xl shadow-md shadow-green-500/30 shrink-0">
                <Bell size={18} className="animate-bounce" />
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-white text-xs">Job Alert Push Notifications</p>
                <p className="text-[11px] text-gray-500">Get instant sound & screen alerts when a new job arrives!</p>
              </div>
            </div>
            <button 
              onClick={handleEnablePush}
              className="px-3.5 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-xl text-xs font-black shadow-md shadow-green-500/30 shrink-0 active:scale-95 transition-transform"
            >
              ENABLE
            </button>
          </div>
        )}

        {/* City Filter Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Nearby Requests</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500">City:</span>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="px-3 py-1.5 bg-white dark:bg-gray-900 border border-green-500/40 rounded-xl text-xs font-bold text-green-600 dark:text-green-400 shadow-sm focus:outline-none"
            >
              {citiesList.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="flex flex-col gap-4 pb-20">
          {availableJobs.length === 0 ? (
            <div className="text-center py-10 bg-white dark:bg-gray-900 rounded-3xl border border-dashed border-gray-300 dark:border-gray-700">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                <Navigation className="text-gray-400" size={24} />
              </div>
              <p className="text-gray-500 font-medium">No jobs available for {selectedCity}.</p>
              <p className="text-xs text-gray-400 mt-1">Try switching to "All Cities" or wait for a new request.</p>
            </div>
          ) : (
            availableJobs.map((job) => {
              const category = CATEGORIES.find(c => c.id === job.category);
              return (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={job.id}
                  onClick={() => setSelectedJob(job)}
                  className="bg-white dark:bg-gray-900 p-5 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all cursor-pointer relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-2 h-full bg-green-500"></div>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg text-xs font-bold uppercase tracking-wider">
                        {category?.name}
                      </span>
                      {job.city && (
                        <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-md text-[11px] font-semibold">
                          📍 {job.city}
                        </span>
                      )}
                      <span className="text-xs text-gray-400">Just now</span>
                    </div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      Est. {currency}{job.budget}
                    </div>
                  </div>
                  
                  <p className="text-gray-700 dark:text-gray-300 font-medium mb-4 line-clamp-2">
                    "{job.description}"
                  </p>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <MapPin size={16} className="text-green-500" />
                      <span>{job.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Navigation size={16} className="text-blue-500" />
                      <span>
                        {userLocation && job.locationCoords 
                          ? `${getDistanceKm(userLocation[0], userLocation[1], job.locationCoords[0], job.locationCoords[1]).toFixed(1)} km`
                          : 'Nearby'}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function WorkerSubmitBid({ job, onBack }: { job: Job, onBack: () => void }) {
  const { submitBid, currentUser, isLoggedIn, setShowAuth, deductPoints, currency, userLocation, bids, acceptCounterOffer } = useAppStore();
  const [price, setPrice] = useState(job.budget.toString());
  const [eta, setEta] = useState('15');
  const [message, setMessage] = useState('I am nearby and can start immediately. Expert in this field.');
  const [showReport, setShowReport] = useState(false);

  const existingBid = bids.find(b => b.jobId === job.id && b.workerId === currentUser.id);

  const pointsCost = Math.ceil(job.budget * 0.05);
  const hasEnoughPoints = (currentUser.points || 0) >= pointsCost;

  const workerCoords = userLocation || job.workerLocationCoords;
  const customerCoords = job.locationCoords;
  const distKm = (workerCoords && customerCoords)
    ? getDistanceKm(workerCoords[0], workerCoords[1], customerCoords[0], customerCoords[1])
    : null;

  const handleSubmit = () => {
    if (!isLoggedIn) {
      setShowAuth(true);
      return;
    }
    if (!hasEnoughPoints) return;
    
    deductPoints(pointsCost);
    submitBid({
      jobId: job.id,
      workerId: currentUser.id,
      workerName: currentUser.name,
      workerRating: currentUser.rating,
      workerAvatar: currentUser.avatar,
      workerJobs: currentUser.completedJobs,
      price: parseFloat(price),
      eta: `${eta} mins`,
      message,
    });
    onBack(); // go back to dashboard, wait for acceptance
  };

  const handleAcceptCounter = () => {
    if (existingBid && existingBid.counterPrice) {
      acceptCounterOffer(existingBid.id);
      alert('Counter offer accepted! Wait for customer to confirm.');
      onBack();
    }
  };

  const category = CATEGORIES.find(c => c.id === job.category);

  return (
    <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="flex flex-col h-full bg-white dark:bg-gray-950">
      <TopBar title="Submit Offer" onBack={onBack} rightAction={
        <button onClick={() => setShowReport(true)} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
          <AlertTriangle size={20} className="text-red-500" />
        </button>
      } />
      
      {showReport && <ReportModal targetId={job.id} targetType="job" onClose={() => setShowReport(false)} />}
      
      <div className="flex-1 overflow-y-auto p-5">
        {/* Customer Location Map Card */}
        <div className="mb-6 rounded-3xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm bg-gray-50 dark:bg-gray-900">
          <div className="h-48 w-full relative">
            <LiveMap 
              isWorker 
              customerLocation={job.locationCoords} 
              workerLocation={userLocation || job.workerLocationCoords} 
            />
            <div className="absolute top-2 left-2 bg-gray-900/80 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-bold flex items-center gap-1.5 z-[1000]">
              <Navigation size={12} className="text-green-400" />
              <span>{distKm !== null ? `${distKm.toFixed(1)} km away` : 'Customer Map Location'}</span>
            </div>
          </div>
          <div className="p-4">
            <div className="flex items-center gap-2 mb-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
              <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-md uppercase font-bold">{category?.name}</span>
              <span>•</span>
              <span>Est. Budget: {currency}{job.budget}</span>
            </div>
            <p className="text-gray-900 dark:text-white font-bold text-base mb-2">"{job.description}"</p>
            <div className="flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 p-2.5 rounded-xl border border-gray-100 dark:border-gray-700">
              <MapPin size={16} className="text-red-500 shrink-0" /> 
              <span className="truncate">{job.location}</span>
            </div>
          </div>
        </div>

        <h3 className="font-bold text-gray-900 dark:text-white mb-4">Your Offer Details</h3>
        
        {existingBid ? (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50 p-4 rounded-2xl mb-6">
            <h4 className="font-bold text-blue-900 dark:text-blue-100 mb-2">You Already Sent an Offer</h4>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-blue-700 dark:text-blue-300">Your Bid:</span>
              <span className="font-bold text-blue-900 dark:text-blue-100">{currency} {existingBid.price}</span>
            </div>
            
            {existingBid.counterPrice ? (
              <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-800/50">
                <span className="inline-block bg-orange-100 text-orange-700 px-2 py-1 rounded-md text-xs font-bold mb-2">NEW COUNTER OFFER</span>
                <p className="text-sm text-gray-800 dark:text-gray-200 mb-2 italic">"{existingBid.counterMessage}"</p>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Customer Counter Price:</span>
                  <span className="font-bold text-xl text-green-600 dark:text-green-400">{currency} {existingBid.counterPrice}</span>
                </div>
                <Button onClick={handleAcceptCounter} className="w-full bg-green-500 hover:bg-green-600 text-white rounded-xl shadow-lg shadow-green-500/30">
                  Accept Counter Offer
                </Button>
              </div>
            ) : (
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">Waiting for customer to respond...</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <Input 
              label={`Your Price (${currency})`} 
              type="number"
              value={price} 
              onChange={(e) => setPrice(e.target.value)} 
              iconNode={<span className="text-gray-500 font-bold text-sm">{currency}</span>}
            />
            <Input 
              label="Arrival Time (Minutes)" 
              type="number"
              value={eta} 
              onChange={(e) => setEta(e.target.value)} 
              icon={Clock}
            />
            <div className="flex flex-col gap-1.5 w-full">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">Message to Customer</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl py-3 px-4 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all min-h-[100px] resize-none"
              />
            </div>
          </div>
        )}
        
        {!existingBid && (
          <div className="mt-8">
            <Button fullWidth onClick={handleSubmit} disabled={!price || !eta || !hasEnoughPoints}>
              {hasEnoughPoints ? `Send Offer (-${pointsCost} Pts)` : `Not Enough Points (${currentUser.points}/${pointsCost})`}
            </Button>
            <p className="text-center text-xs text-gray-400 mt-4">
              {hasEnoughPoints 
                ? `This will deduct ${pointsCost} points from your wallet (5% of budget).` 
                : `You need ${pointsCost} points to bid on this job. Please Top Up in Profile.`}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function WorkerActiveJob({ job }: { job: Job }) {
  const { bids, allUsers, currentUser, userLocation, currency, setActiveChat, setActiveCall, markWorkerArrived, cancelJob } = useAppStore();
  const acceptedBid = bids.find(b => b.id === job.acceptedBidId);
  const customerUser = allUsers.find(u => u.id === job.customerId);
  const customerPhone = customerUser?.phone || '';
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Live Tracking Sync
  React.useEffect(() => {
    if (userLocation && !job.workerArrived) {
      const interval = setInterval(() => {
        updateDoc(doc(db, 'jobs', job.id), {
          workerLocationCoords: userLocation
        }).catch(console.error);
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [userLocation, job.id, job.workerArrived]);

  const handleCancel = () => {
    setShowCancelModal(true);
  };

  const workerCoords = userLocation || job.workerLocationCoords;
  const customerCoords = job.locationCoords;
  const distKm = (workerCoords && customerCoords)
    ? getDistanceKm(workerCoords[0], workerCoords[1], customerCoords[0], customerCoords[1])
    : null;

  const handleOpenChat = () => {
    setActiveChat({ 
      name: customerUser?.name || 'Customer', 
      avatar: customerUser?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Customer', 
      role: 'Customer',
      phone: customerPhone,
      jobId: job.id,
      userId: job.customerId
    });
  };

  const handleOpenCall = () => {
    const targetPhone = customerPhone || customerUser?.phone || '03001234567';
    const clean = targetPhone.replace(/[^0-9+]/g, '');
    window.location.href = `tel:${clean || '03001234567'}`;
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full bg-gray-900 text-white">
      <TopBar title="Active Job" rightAction={
        <div className="flex gap-2 items-center px-2">
          <button 
            onClick={() => setShowSafetyModal(true)} 
            className="bg-red-500 hover:bg-red-600 text-white font-bold text-xs px-2.5 py-1 rounded-full flex items-center gap-1 active:scale-95 transition-transform shrink-0"
          >
            <ShieldAlert size={14} /> SOS
          </button>
          <button onClick={handleOpenChat} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center transition-colors hover:bg-white/20 active:scale-95">
            <MessageSquare size={16} />
          </button>
          <button onClick={handleOpenCall} className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/30 transition-transform active:scale-95">
            <Phone size={16} />
          </button>
        </div>
      } />
      
      <div className="flex-1 overflow-y-auto flex flex-col">
        <div className="flex-1 bg-gray-800 relative overflow-hidden min-h-[300px]">
           <LiveMap 
             isWorker 
             workerAvatar={currentUser.avatar} 
             customerAvatar={customerUser?.avatar} 
             customerLocation={job.locationCoords} 
             workerLocation={userLocation || job.workerLocationCoords} 
           />
           
           {/* Navigation UI Overlay */}
           {!job.workerArrived && (
             <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-full shadow-lg shadow-green-500/20 font-bold flex items-center gap-2 pointer-events-none z-[20]">
               <Navigation size={20} className="fill-white" />
               Head North on Main St
             </div>
           )}
        </div>

        {/* Bottom Sheet */}
        <div className="bg-white dark:bg-gray-950 rounded-t-[2rem] p-6 -mt-6 z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] text-gray-900 dark:text-white flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold mb-1">
                {job.workerArrived ? 'Arrived' : (distKm !== null ? (distKm <= 0.05 ? 'Arrived' : `${distKm.toFixed(1)} km`) : 'En Route')}
              </h2>
              <p className="text-gray-500 font-medium">{job.workerArrived ? 'Waiting for customer' : `Est. arrival: ${acceptedBid?.eta}`}</p>
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-bold text-green-500">{currency}{acceptedBid?.price}</h2>
              <p className="text-gray-500 font-medium">Agreed Price</p>
            </div>
          </div>

          {/* Customer Profile Banner */}
          <div className="bg-green-50 dark:bg-green-900/10 rounded-2xl p-4 flex items-center justify-between border border-green-100 dark:border-green-900/30">
            <div className="flex items-center gap-3">
              <img src={customerUser?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Customer'} alt="Customer" className="w-10 h-10 rounded-full bg-green-200" />
              <div>
                <p className="font-bold text-gray-900 dark:text-white">{customerUser?.name || 'Customer'}</p>
                <button onClick={() => setShowProfileModal(true)} className="text-xs text-green-600 font-bold flex items-center hover:underline">
                  View Profile <User size={12} className="ml-1" />
                </button>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={handleOpenChat} className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 flex items-center justify-center transition-transform active:scale-95">
                <MessageSquare size={20} />
              </button>
              <button onClick={handleOpenCall} className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center shadow-lg shadow-green-500/30 transition-transform active:scale-95">
                <Phone size={20} />
              </button>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-800 rounded-xl flex items-center justify-center text-gray-600 dark:text-gray-400 shrink-0">
              <MapPin size={24} />
            </div>
            <div>
              <p className="font-bold text-gray-900 dark:text-white">{job.location}</p>
              <p className="text-sm text-gray-500">"{job.description}"</p>
            </div>
          </div>

          {!job.workerArrived ? (
            <div className="flex flex-col gap-2">
              <Button fullWidth onClick={() => markWorkerArrived(job.id)}>
                I Have Arrived
              </Button>
              <Button fullWidth variant="outline" className="text-red-500 border-red-200 hover:bg-red-50 dark:border-red-900/30 font-bold" onClick={handleCancel}>
                Cancel Job
              </Button>
            </div>
          ) : (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/30 p-4 rounded-2xl flex flex-col items-center justify-center text-center gap-2">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400">
                <CheckCircle2 size={24} />
              </div>
              <p className="font-bold text-blue-900 dark:text-blue-300">You have arrived.</p>
              <p className="text-sm text-blue-700 dark:text-blue-400">Wait for the customer to complete the job and pay.</p>
            </div>
          )}
        </div>
      </div>
      
      {showSafetyModal && <SafetySOSModal onClose={() => setShowSafetyModal(false)} />}
      {showProfileModal && <PublicProfileModal userId={job.customerId} onClose={() => setShowProfileModal(false)} />}
      {showCancelModal && (
        <CancelJobModal 
          onClose={() => setShowCancelModal(false)}
          onConfirm={(reason) => cancelJob(job.id, reason)}
        />
      )}
    </motion.div>
  );
}
