import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from './store';
import { CATEGORIES, Job, Bid, PAKISTAN_CITIES } from './types';
import { Button, Card, Input, TopBar } from './components';
import { LiveMap } from './LiveMap';
import { CounterOfferModal, SafetySOSModal, RatingReviewModal, CancelJobModal } from './InDriveFeatures';
import { PublicProfileModal } from './PublicProfileModal';
import { ReceiptModal } from './ReceiptModal';
import { ReportModal } from './ReportModal';
import { 
  Search, MapPin, Clock, DollarSign, Star, Zap, Droplets, 
  Hammer, Sparkles, PaintRoller, Wrench, Fan, BrickWall,
  ChevronRight, Phone, MessageSquare, ShieldCheck, AlertTriangle, ShieldAlert, FileText, User, Navigation
} from 'lucide-react';

const iconMap: Record<string, React.ElementType> = {
  Zap, Droplets, Hammer, Sparkles, PaintRoller, Wrench, Fan, BrickWall
};

export function CustomerApp() {
  const { jobs, currentUser } = useAppStore();
  
  // Find if customer has an active job (bidding, accepted, or in_progress)
  const activeJob = jobs.find(j => j.customerId === currentUser.id && j.status !== 'completed' && j.status !== 'cancelled');

  if (activeJob) {
    if (activeJob.status === 'bidding') return <CustomerBidding job={activeJob} />;
    return <CustomerActiveJob job={activeJob} />;
  }

  return <CustomerHome />;
}

function CustomerHome() {
  const { currentUser, isLoggedIn, setShowProfile, setShowAuth, adminSettings } = useAppStore();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good Morning,';
    if (hour >= 12 && hour < 17) return 'Good Afternoon,';
    if (hour >= 17 && hour < 21) return 'Good Evening,';
    return 'Good Night,';
  };

  const activeBanners = (adminSettings.banners || []).filter(b => b.isActive);

  if (selectedCategory) {
    return <CustomerPostJob categoryId={selectedCategory} onBack={() => setSelectedCategory(null)} />;
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950 overflow-y-auto pb-20">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 px-5 pt-10 sm:pt-8 pb-6 rounded-b-[2rem] shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">
              {isLoggedIn ? getGreeting() : 'Welcome to Obrago'}
            </p>
            {isLoggedIn ? (
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{currentUser.name}</h1>
            ) : (
              <button 
                onClick={() => setShowAuth(true)}
                className="mt-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-1 active:scale-95 transition-transform"
              >
                Sign In / Register <ChevronRight size={16} />
              </button>
            )}
          </div>
          <button 
            onClick={() => setShowProfile(true)}
            className="rounded-full border-2 border-green-500 overflow-hidden active:scale-95 transition-transform shrink-0"
          >
            <img src={currentUser.avatar} alt="Profile" className="w-12 h-12 object-cover" />
          </button>
        </div>
        
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="What service do you need?" 
            className="w-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-2xl py-4 pl-12 pr-4 font-medium focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
          />
        </div>
      </div>

      {/* Promotional Banners Slider */}
      <div className="px-5 mt-6">
        {activeBanners.length > 0 ? (
          <div className="flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory">
            {activeBanners.map(banner => (
              <div 
                key={banner.id}
                onClick={() => banner.linkCategory && setSelectedCategory(banner.linkCategory)}
                className="snap-center shrink-0 w-full h-40 rounded-3xl overflow-hidden relative shadow-md cursor-pointer group"
              >
                <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent p-5 flex flex-col justify-end">
                  <h2 className="text-white font-bold text-lg leading-tight">{banner.title}</h2>
                  <p className="text-green-400 text-xs font-semibold mt-1 flex items-center gap-1">
                    Book Service Now <ChevronRight size={14} />
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-3xl p-6 text-white relative overflow-hidden shadow-lg shadow-green-500/20">
            <div className="relative z-10">
              <h2 className="text-xl font-bold mb-2">Need Urgent Help?</h2>
              <p className="text-green-50 text-sm mb-4 max-w-[200px]">Get a verified professional at your doorstep in minutes.</p>
              <button className="bg-white text-green-600 px-5 py-2 rounded-xl font-bold text-sm hover:bg-green-50 transition-colors">
                Book Now
              </button>
            </div>
            <ShieldCheck className="absolute -right-4 -bottom-4 text-white/20 w-32 h-32" />
          </div>
        )}
      </div>

      {/* Categories */}
      <div className="px-5 mt-8">
        <div className="flex justify-between items-end mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Categories</h2>
          <button className="text-green-500 text-sm font-semibold">See All</button>
        </div>
        
        <div className="grid grid-cols-4 gap-4">
          {CATEGORIES.map(cat => {
            const Icon = iconMap[cat.icon] || Wrench;
            return (
              <motion.button
                key={cat.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCategory(cat.id)}
                className="flex flex-col items-center gap-2"
              >
                <div className="w-16 h-16 bg-white dark:bg-gray-900 rounded-2xl flex items-center justify-center shadow-sm border border-gray-100 dark:border-gray-800 text-green-500 hover:bg-green-50 transition-colors">
                  <Icon size={28} strokeWidth={1.5} />
                </div>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center">{cat.name}</span>
              </motion.button>
            )
          })}
        </div>
      </div>
    </div>
  );
}

function CustomerPostJob({ categoryId, onBack }: { categoryId: string, onBack: () => void }) {
  const { postJob, currentUser, isLoggedIn, setShowAuth, userLocation, requestLocation, locationError, currency } = useAppStore();
  const category = CATEGORIES.find(c => c.id === categoryId);
  const Icon = (category && iconMap[category.icon]) || Wrench;
  
  const [description, setDescription] = useState('');
  const [selectedCity, setSelectedCity] = useState(currentUser.city || 'Islamabad');
  const [location, setLocation] = useState('Current Location (Fetching...)');
  const [budget, setBudget] = useState('50');

  const [showLocationModal, setShowLocationModal] = useState(false);

  useEffect(() => {
    if (!userLocation && !locationError) {
      requestLocation();
    }
  }, [userLocation, locationError, requestLocation]);

  useEffect(() => {
    if (userLocation) {
      setShowLocationModal(false);
      // Reverse geocode GPS coordinates to real readable address
      const [lat, lon] = userLocation;
      setLocation(`Fetching address (${lat.toFixed(3)}, ${lon.toFixed(3)})...`);
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`, {
        headers: {
          'User-Agent': 'ObragoApp/1.0',
          'Accept-Language': 'en-US,en;q=0.9'
        }
      })
        .then(res => res.json())
        .then(data => {
          if (data && data.display_name) {
            const parts = data.display_name.split(',');
            const shortAddress = parts.slice(0, 3).join(',').trim();
            setLocation(shortAddress);
            if (data.address && data.address.city) {
              setSelectedCity(data.address.city);
            }
          } else {
            setLocation(`GPS Location (${lat.toFixed(4)}, ${lon.toFixed(4)})`);
          }
        })
        .catch(() => {
          setLocation(`GPS Location (${lat.toFixed(4)}, ${lon.toFixed(4)})`);
        });
    } else if (locationError) {
      setLocation('Location unavailable, enter manually');
    }
  }, [userLocation, locationError]);

  const handlePost = () => {
    if (!description || !location || !budget) return;

    if (!userLocation) {
      setShowLocationModal(true);
      requestLocation();
      return;
    }

    if (!isLoggedIn) {
      setShowAuth(true);
      return;
    }

    postJob({
      customerId: currentUser.id,
      category: category ? category.id : categoryId,
      description,
      location,
      city: selectedCity,
      locationCoords: userLocation || undefined,
      budget: parseFloat(budget),
    });
    onBack();
  };

  const citiesList = [
    ...PAKISTAN_CITIES
  ];

  return (
    <motion.div 
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      className="flex flex-col h-full bg-white dark:bg-gray-950"
    >
      <TopBar title={`Need ${category ? category.name : 'Worker'}`} onBack={onBack} />
      
      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-6 pb-20">
        <div className="flex items-center gap-4 p-4 bg-green-50 dark:bg-green-500/10 rounded-2xl text-green-600 dark:text-green-400">
          <div className="p-3 bg-white dark:bg-gray-900 rounded-xl shadow-sm">
            <Icon size={24} />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white">Post a Job</h3>
            <p className="text-sm">Nearby workers will bid shortly</p>
          </div>
        </div>

        {currentUser.penaltyFee && currentUser.penaltyFee > 0 && (
          <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-2xl text-red-600 dark:text-red-400">
            <h4 className="font-bold flex items-center gap-2 mb-1"><AlertTriangle size={18} /> Outstanding Penalty</h4>
            <p className="text-sm opacity-90">
              You have a penalty fee of {currency}{currentUser.penaltyFee} from a previously cancelled job. This amount will be deducted from your points when you post this job.
            </p>
          </div>
        )}

        <div className="space-y-4">
          <Input 
            label="What needs to be done?" 
            value={description} 
            onChange={(e) => setDescription(e.target.value)} 
            placeholder="E.g. Fix leaking kitchen sink"
          />

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Select City
            </label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:border-green-500"
            >
              {citiesList.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <Input 
            label="Area / Exact Address" 
            value={location} 
            onChange={(e) => setLocation(e.target.value)} 
            icon={MapPin}
          />

          <Input 
            label={`Your Budget (Offer Price)`} 
            type="number"
            value={budget} 
            onChange={(e) => setBudget(e.target.value)} 
            iconNode={<span className="text-gray-500 font-bold text-sm">{currency}</span>}
          />
        </div>
        
        <div className="mt-auto pt-6">
          <Button fullWidth onClick={handlePost} disabled={!description || !budget}>
            {currentUser.penaltyFee && currentUser.penaltyFee > 0 ? 'Pay Penalty & Request Now' : 'Request Now'}
          </Button>
        </div>
      </div>

      {showLocationModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 w-full max-w-sm text-center shadow-2xl border border-gray-100 dark:border-gray-800">
            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin size={32} />
            </div>
            <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2">Location / GPS Required</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
              Job post kerne se pehle mobile ki Location / GPS ON honi lazmi he ta ke qareebi workers ko aap ki request send ho sake.
            </p>
            <div className="space-y-2">
              <Button fullWidth onClick={() => { requestLocation(); }}>
                <Navigation size={16} className="mr-2" /> Turn On GPS & Retry
              </Button>
              <button
                onClick={() => setShowLocationModal(false)}
                className="text-xs font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 py-2 w-full"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

function CustomerBidding({ job }: { job: Job }) {
  const { bids, cancelJob, acceptBid, currency, currentUser, userLocation } = useAppStore();
  const jobBids = bids.filter(b => b.jobId === job.id).sort((a, b) => b.createdAt - a.createdAt);
  const [selectedBidForCounter, setSelectedBidForCounter] = useState<{ id: string; price: number } | null>(null);
  const [hiredBid, setHiredBid] = useState<Bid | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const handleAccept = (bid: Bid) => {
    acceptBid(job.id, bid.id);
    setHiredBid(bid);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950">
      <TopBar title="Finding Workers" rightAction={
        <button onClick={() => setShowCancelModal(true)} className="text-red-500 text-sm font-semibold px-2">Cancel</button>
      } />
      
      <div className="p-5 flex-1 overflow-y-auto flex flex-col">
        <div className="mb-6 h-64 relative rounded-3xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-800">
          <LiveMap 
            customerAvatar={currentUser.avatar} 
            customerLocation={userLocation || job.locationCoords} 
            biddingWorkers={jobBids}
          />
          
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md px-6 py-3 rounded-full shadow-lg flex items-center gap-3 z-[20]">
            <motion.div 
              animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }} 
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="w-3 h-3 bg-green-500 rounded-full"
            />
            <span className="font-bold text-gray-900 dark:text-white whitespace-nowrap">Broadcasting Request...</span>
          </div>
        </div>

        <div className="flex justify-between items-end mb-4">
          <h3 className="font-bold text-gray-900 dark:text-white">Offers Received ({jobBids.length})</h3>
        </div>

        <div className="flex flex-col gap-4">
          <AnimatePresence>
            {jobBids.length === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-10 text-gray-400">
                Offers will appear here
              </motion.div>
            )}
            {jobBids.map((bid) => (
              <motion.div
                key={bid.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-900 p-4 rounded-3xl border border-green-100 dark:border-green-900/30 shadow-[0_8px_30px_rgb(34,197,94,0.08)]"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex gap-3">
                    <img src={bid.workerAvatar} alt={bid.workerName} className="w-12 h-12 rounded-full object-cover bg-gray-100" />
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white">{bid.workerName}</h4>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                        <span className="flex items-center text-amber-500 font-medium"><Star size={12} className="mr-0.5 fill-amber-500" /> {bid.workerRating}</span>
                        <span>•</span>
                        <span>{bid.workerJobs} jobs</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-green-500">{currency}{bid.price.toFixed(0)}</div>
                    {bid.counterPrice && (
                      <div className="text-xs font-semibold text-blue-500 mt-0.5">
                        Countered: {currency}{bid.counterPrice}
                      </div>
                    )}
                    <div className="flex items-center justify-end gap-1 text-xs text-gray-500 mt-1">
                      <Clock size={12} /> {bid.eta}
                    </div>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl italic">
                  "{bid.message}"
                </p>
                
                <div className="flex gap-2">
                  <Button fullWidth onClick={() => handleAccept(bid)}>
                    Accept Offer
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setSelectedBidForCounter({ id: bid.id, price: bid.price })}
                    className="shrink-0 font-bold border-green-200 text-green-600 hover:bg-green-50 dark:border-green-800 dark:hover:bg-green-900/20"
                  >
                    Counter 💬
                  </Button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {selectedBidForCounter && (
        <CounterOfferModal 
          bidId={selectedBidForCounter.id} 
          originalPrice={selectedBidForCounter.price} 
          onClose={() => setSelectedBidForCounter(null)} 
        />
      )}

      {hiredBid && (
        <ReceiptModal 
          job={job} 
          bid={hiredBid} 
          onClose={() => setHiredBid(null)} 
        />
      )}

      {showCancelModal && (
        <CancelJobModal 
          onClose={() => setShowCancelModal(false)}
          onConfirm={(reason) => cancelJob(job.id, reason)}
        />
      )}
    </div>
  );
}

function CustomerActiveJob({ job }: { job: Job }) {
  const { bids, allUsers, completeJob, cancelJob, cancelJobAfterArrival, currentUser, userLocation, currency, setActiveChat, setActiveCall } = useAppStore();
  const acceptedBid = bids.find(b => b.id === job.acceptedBidId);
  const workerUser = allUsers.find(u => u.id === acceptedBid?.workerId);
  const workerPhone = workerUser?.phone || '';

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showReport, setShowReport] = useState(false);
  
  if (!acceptedBid) return null;

  const handleOpenChat = () => {
    setActiveChat({ 
      name: acceptedBid.workerName, 
      avatar: acceptedBid.workerAvatar, 
      role: 'Worker',
      phone: workerPhone,
      jobId: job.id,
      userId: acceptedBid.workerId
    });
  };

  const handleOpenCall = () => {
    const targetPhone = workerPhone || '03001234567';
    const clean = targetPhone.replace(/[^0-9+]/g, '');
    window.location.href = `tel:${clean || '03001234567'}`;
  };

  const handleComplete = () => {
    completeJob(job.id);
    setShowRatingModal(true);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full bg-gray-50 dark:bg-gray-950">
      {showReport && <ReportModal targetId={acceptedBid.workerId} targetType="user" onClose={() => setShowReport(false)} />}
      <TopBar 
        title="Job Active" 
        rightAction={
          <div className="flex gap-2 items-center px-2">
            <button 
              onClick={() => setShowSafetyModal(true)} 
              className="bg-red-500 hover:bg-red-600 text-white font-bold text-xs px-2.5 py-1 rounded-full flex items-center gap-1 active:scale-95 transition-transform"
            >
              <ShieldAlert size={14} /> SOS
            </button>
            <button onClick={() => setShowReport(true)} className="p-1 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full">
              <AlertTriangle size={18} className="text-red-500" />
            </button>
          </div>
        } 
      />
      
      <div className="flex-1 overflow-y-auto pb-20">
        <div className="h-64 bg-gray-200 dark:bg-gray-800 relative overflow-hidden">
          <LiveMap 
            customerAvatar={currentUser.avatar} 
            workerAvatar={acceptedBid.workerAvatar} 
            customerLocation={userLocation || job.locationCoords} 
            workerLocation={job.workerLocationCoords}
          />
          
          <div className="absolute bottom-4 inset-x-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md rounded-2xl p-4 shadow-lg flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${job.workerArrived ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'}`}>
              {job.workerArrived ? <MapPin size={24} /> : <Clock size={24} />}
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">{job.workerArrived ? 'Status' : 'Worker Arriving In'}</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{job.workerArrived ? 'Worker has arrived' : acceptedBid.eta}</p>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <Card className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={acceptedBid.workerAvatar} alt="Worker" className="w-14 h-14 rounded-full" />
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">{acceptedBid.workerName}</h3>
                <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                  <Star size={14} className="fill-amber-500 text-amber-500" /> {acceptedBid.workerRating}
                  <span className="mx-1">•</span>
                  <button onClick={() => setShowProfileModal(true)} className="text-green-600 font-bold flex items-center hover:underline">
                    View Profile <User size={12} className="ml-1" />
                  </button>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleOpenChat} className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 flex items-center justify-center transition-transform active:scale-95">
                <MessageSquare size={20} />
              </button>
              <button onClick={handleOpenCall} className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center shadow-lg shadow-green-500/30 transition-transform active:scale-95">
                <Phone size={20} />
              </button>
            </div>
          </Card>

          <Card>
            <h4 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">Job Details</h4>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Service</span>
                <span className="font-medium text-gray-900 dark:text-white capitalize">{job.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Agreed Price</span>
                <span className="font-bold text-green-500">{currency}{acceptedBid.price.toFixed(0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Address</span>
                <span className="font-medium text-gray-900 dark:text-white">{job.location}</span>
              </div>
            </div>
            <Button 
              fullWidth 
              variant="outline" 
              className="mt-4 flex items-center justify-center gap-2 border-green-200 text-green-600 dark:border-green-800 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 font-bold"
              onClick={() => setShowReceipt(true)}
            >
              <FileText size={18} /> View & Download Receipt
            </Button>
          </Card>

          <Button fullWidth variant="primary" className="mt-4" onClick={handleComplete}>
            Mark as Completed & Pay
          </Button>

          {!showCancelConfirm ? (
            <Button 
              fullWidth 
              variant="outline" 
              className="mt-2 text-red-500 border-red-200 hover:bg-red-50 dark:border-red-900/30 dark:hover:bg-red-900/10 font-bold" 
              onClick={() => {
                if (!job.workerArrived) {
                  setShowCancelModal(true);
                } else {
                  setShowCancelConfirm(true);
                }
              }}
            >
              Cancel Job {job.workerArrived ? '(Worker Arrived)' : ''}
            </Button>
          ) : (
            <Card className="mt-2 bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30">
              <h4 className="font-bold text-red-600 dark:text-red-400 mb-2">Cancel Job & Penalty Notice</h4>
              <p className="text-sm text-red-600/80 dark:text-red-400/80 mb-4">
                Since the worker has already arrived, a penalty fee of 50% ({currency}{(acceptedBid.price * 0.5).toFixed(0)}) will be recorded for compensation. Your account balance will remain safe.
              </p>
              <div className="flex gap-2">
                <Button fullWidth variant="outline" onClick={() => setShowCancelConfirm(false)}>
                  Go Back
                </Button>
                <Button fullWidth variant="danger" onClick={() => cancelJobAfterArrival(job.id)}>
                  Confirm Cancel
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>

      {showCancelModal && (
        <CancelJobModal 
          onClose={() => setShowCancelModal(false)}
          onConfirm={(reason) => cancelJob(job.id, reason)}
        />
      )}

      {showSafetyModal && (
        <SafetySOSModal onClose={() => setShowSafetyModal(false)} />
      )}

      {showRatingModal && (
        <RatingReviewModal 
          jobId={job.id} 
          toUserId={acceptedBid.workerId} 
          toUserName={acceptedBid.workerName} 
          onClose={() => setShowRatingModal(false)} 
        />
      )}

      {showReceipt && (
        <ReceiptModal 
          job={job} 
          bid={acceptedBid} 
          onClose={() => setShowReceipt(false)} 
        />
      )}

      {showProfileModal && (
        <PublicProfileModal 
          userId={acceptedBid.workerId} 
          onClose={() => setShowProfileModal(false)} 
        />
      )}
    </motion.div>
  );
}
