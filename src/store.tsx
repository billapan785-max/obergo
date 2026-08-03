import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { Job, Bid, User, Role, JobStatus, Category, AdminSettings, INITIAL_CATEGORIES, DepositRequest, JobRating, ChatMessage, CallState } from './types';
import { db } from './firebase';
import { 
  collection, doc, onSnapshot, setDoc, updateDoc, deleteDoc, getDoc, deleteField
} from 'firebase/firestore';
import { triggerSystemJobAlert, triggerSystemCustomNotification, requestAllAppPermissions } from './notificationService';

export interface CommunicationTarget {
  name: string;
  avatar: string;
  role: string;
  phone?: string;
  jobId?: string;
  userId?: string;
}

export function getCurrencyForUser(user?: User): string {
  if (!user) return 'PKR';
  const country = (user.country || '').toLowerCase();
  const phone = (user.phone || '').trim();

  if (country.includes('pakistan') || country === 'pk' || phone.startsWith('+92') || phone.startsWith('92') || phone.startsWith('03')) {
    return 'PKR';
  }
  if (country.includes('united arab emirates') || country.includes('uae') || country === 'ae' || phone.startsWith('+971')) {
    return 'AED';
  }
  if (country.includes('saudi') || country === 'sa' || phone.startsWith('+966')) {
    return 'SAR';
  }
  if (country.includes('india') || country === 'in' || phone.startsWith('+91')) {
    return 'INR';
  }
  if (country.includes('united kingdom') || country.includes('uk') || country === 'gb' || phone.startsWith('+44')) {
    return '£';
  }
  if (country.includes('united states') || country.includes('usa') || country === 'us' || phone.startsWith('+1')) {
    return '$';
  }
  return 'PKR';
}

interface AppState {
  role: Role;
  setRole: (role: Role) => void;
  isLoggedIn: boolean;
  setIsLoggedIn: (val: boolean) => void;
  showAuth: boolean;
  setShowAuth: (val: boolean) => void;
  showProfile: boolean;
  setShowProfile: (val: boolean) => void;
  showAdminPanel: boolean;
  setShowAdminPanel: (val: boolean) => void;
  isAdminAuthenticated: boolean;
  setIsAdminAuthenticated: (val: boolean) => void;
  userLocation: [number, number] | null;
  requestLocation: () => void;
  locationError: string | null;
  currentUser: User;
  setCurrentUser: (user: User) => void;
  allUsers: User[];
  verifyWorker: (userId: string, status: 'verified' | 'rejected') => void;
  toggleBlockUser: (userId: string) => void;
  registerWorker: (data: { name: string; phone: string; address: string; cnic: string; password?: string; country?: string; city?: string; avatar?: string }) => { success: boolean; error?: string };
  registerCustomer: (data: { name: string; email: string; phone: string; password?: string; country: string; city: string }) => void;
  addPoints: (amount: number) => void;
  deductPoints: (amount: number) => void;
  jobs: Job[];
  bids: Bid[];
  categories: Category[];
  addCategory: (cat: Omit<Category, 'id'>) => void;
  adminSettings: AdminSettings;
  updateAdminSettings: (settings: Partial<AdminSettings>) => void;
  currency: string;
  setCurrency: (currency: string) => void;
  activeChat: CommunicationTarget | null;
  activeCall: CommunicationTarget | null;
  setActiveChat: (chat: CommunicationTarget | null) => void;
  setActiveCall: (call: CommunicationTarget | null) => void;
  latestJobAlert: Job | null;
  setLatestJobAlert: (job: Job | null) => void;
  postJob: (job: Omit<Job, 'id' | 'createdAt' | 'status'>) => void;
  cancelJob: (jobId: string, reason?: string) => void;
  markWorkerArrived: (jobId: string) => void;
  cancelJobAfterArrival: (jobId: string) => void;
  acceptBid: (jobId: string, bidId: string) => void;
  completeJob: (jobId: string) => void;
  submitBid: (bid: Omit<Bid, 'id' | 'createdAt'>) => void;
  submitCounterOffer: (bidId: string, counterPrice: number, counterMessage?: string) => void;
  acceptCounterOffer: (bidId: string) => void;
  depositRequests: DepositRequest[];
  submitDepositProof: (amount: number, method: 'bank' | 'easypaisa' | 'jazzcash', trxId: string) => void;
  processDepositRequest: (requestId: string, status: 'approved' | 'rejected') => void;
  ratings: JobRating[];
  submitRating: (jobId: string, toUserId: string, stars: number, tags: string[], comment: string) => void;
  refundPenalty: (userId: string) => void;
  deleteAccount: (userId: string) => void;
  resetPassword: (userId: string, newPass: string) => void;
  sendAdminBroadcast: (title: string, message: string, targetRole: 'all' | 'worker' | 'customer') => void;
}

const defaultAdminSettings: AdminSettings = {
  commissionRate: 5,
  bankName: 'Meezan Bank',
  accountTitle: 'Obrago Pvt Ltd',
  accountNumber: '0101-0102938475-01',
  easypaisaNumber: '0300-1234567',
  jazzcashNumber: '0301-9876543',
  coinPricePkr: 10,
  minTopupCoins: 20,
  banners: [
    {
      id: 'b1',
      title: 'Discount on House Cleaning Services',
      imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&auto=format&fit=crop',
      linkCategory: 'cleaner',
      isActive: true,
      createdAt: Date.now() - 86400000,
    },
    {
      id: 'b2',
      title: 'Verified Electricians at Your Doorstep',
      imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&auto=format&fit=crop',
      linkCategory: 'electrician',
      isActive: true,
      createdAt: Date.now() - 172800000,
    }
  ],
  coupons: [
    {
      id: 'c1',
      code: 'LABOUR100',
      discountType: 'flat',
      discountValue: 100,
      maxUses: 50,
      usedCount: 12,
      expiryDate: '2026-12-31',
      isActive: true
    },
    {
      id: 'c2',
      code: 'WELCOME20',
      discountType: 'percentage',
      discountValue: 20,
      maxUses: 100,
      usedCount: 45,
      expiryDate: '2026-10-31',
      isActive: true
    }
  ],
  coinPackages: [
    { id: 'cp1', coins: 50, pricePkr: 500, popularTag: false },
    { id: 'cp2', coins: 100, pricePkr: 950, popularTag: true },
    { id: 'cp3', coins: 250, pricePkr: 2200, popularTag: false },
    { id: 'cp4', coins: 500, pricePkr: 4000, popularTag: false },
  ]
};

const guestUser: User = {
  id: 'guest',
  name: 'Guest User',
  role: 'customer',
  rating: 0,
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Guest',
  completedJobs: 0,
  points: 0,
};

const AppContext = createContext<AppState | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>(() => {
    try {
      const savedRole = localStorage.getItem('obrago_role');
      if (savedRole === 'worker' || savedRole === 'customer') return savedRole;
    } catch (e) {}
    return 'customer';
  });

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    try {
      return localStorage.getItem('obrago_logged_in') === 'true';
    } catch (e) {
      return false;
    }
  });

  const [showAuth, setShowAuth] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showAdminPanel, setShowAdminPanelState] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  const setShowAdminPanel = (val: boolean) => {
    setShowAdminPanelState(val);
    if (val) {
      if (window.location.hash !== '#admin') {
        window.history.pushState(null, '', '#admin');
      }
    } else {
      if (window.location.hash === '#admin') {
        window.history.pushState(null, '', window.location.pathname);
      }
    }
  };

  useEffect(() => {
    const handleHash = () => {
      if (window.location.hash === '#admin' || window.location.search.includes('admin=true')) {
        setShowAdminPanelState(true);
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    window.addEventListener('popstate', handleHash);
    return () => {
      window.removeEventListener('hashchange', handleHash);
      window.removeEventListener('popstate', handleHash);
    };
  }, []);

  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User>(() => {
    try {
      const savedUser = localStorage.getItem('obrago_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (parsed && parsed.id) return parsed;
      }
    } catch (e) {}
    return guestUser;
  });

  // Persist user session to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('obrago_role', role);
      localStorage.setItem('obrago_logged_in', isLoggedIn ? 'true' : 'false');
      if (isLoggedIn && currentUser && currentUser.id !== 'guest') {
        localStorage.setItem('obrago_user', JSON.stringify(currentUser));
      } else {
        localStorage.removeItem('obrago_user');
      }
    } catch (e) {
      console.warn("Error persisting user session to localStorage:", e);
    }
  }, [isLoggedIn, currentUser, role]);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [adminSettings, setAdminSettings] = useState<AdminSettings>(defaultAdminSettings);

  const [jobs, setJobs] = useState<Job[]>([]);
  const [bids, setBids] = useState<Bid[]>([]);
  const [depositRequests, setDepositRequests] = useState<DepositRequest[]>([]);
  const [ratings, setRatings] = useState<JobRating[]>([]);
  const [currency, setCurrency] = useState('PKR');
  const [activeChat, setActiveChat] = useState<CommunicationTarget | null>(null);
  const [activeCallState, setActiveCallState] = useState<CommunicationTarget | null>(null);
  const setActiveCall = (target: CommunicationTarget | null) => {
    setActiveCallState(target);
  };
  const activeCall = activeCallState;
  const [latestJobAlert, setLatestJobAlert] = useState<Job | null>(null);
  const isInitialJobsRef = useRef(true);
  const isInitialBroadcastsRef = useRef(true);
  const currentUserRef = useRef(currentUser);
  const roleRef = useRef(role);

  // Permissions should be requested contextually
  // useEffect(() => {
  //   requestAllAppPermissions().catch(console.warn);
  // }, []);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  useEffect(() => {
    roleRef.current = role;
  }, [role]);

  // Sync currency whenever currentUser changes
  useEffect(() => {
    if (currentUser) {
      const cur = getCurrencyForUser(currentUser);
      setCurrency(cur);
    }
  }, [currentUser]);

  // Real-time Firestore Listeners
  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const list: User[] = snapshot.docs.map(doc => doc.data() as User);
      setAllUsers(list);
    }, (err) => console.error("Firestore users error:", err));

    const unsubJobs = onSnapshot(collection(db, 'jobs'), (snapshot) => {
      const list: Job[] = snapshot.docs.map(doc => doc.data() as Job);
      list.sort((a, b) => b.createdAt - a.createdAt);

      if (!isInitialJobsRef.current) {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const newJob = change.doc.data() as Job;
            if (newJob.status === 'bidding') {
              const currentUserId = currentUserRef.current?.id;
              const currentRole = roleRef.current;
              const isWorker = currentRole === 'worker' || currentUserRef.current?.role === 'worker';
              const isJobOwner = currentUserId && currentUserId !== 'guest' && newJob.customerId === currentUserId;

              // Only notify if user is a Worker and NOT the job owner
              if (isWorker && !isJobOwner) {
                triggerSystemJobAlert(newJob, currency);
                setLatestJobAlert(newJob);
              }
            }
          }
        });
      } else {
        isInitialJobsRef.current = false;
      }

      setJobs(list);
    }, (err) => console.error("Firestore jobs error:", err));

    const unsubBroadcasts = onSnapshot(collection(db, 'broadcasts'), (snapshot) => {
      if (!isInitialBroadcastsRef.current) {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const broadcast = change.doc.data();
            const currentRole = roleRef.current;
            if (broadcast.targetRole === 'all' || broadcast.targetRole === currentRole) {
              triggerSystemCustomNotification(broadcast.title, broadcast.message);
            }
          }
        });
      } else {
        isInitialBroadcastsRef.current = false;
      }
    }, (err) => console.error("Firestore broadcasts error:", err));

    const unsubBids = onSnapshot(collection(db, 'bids'), (snapshot) => {
      const list: Bid[] = snapshot.docs.map(doc => doc.data() as Bid);
      list.sort((a, b) => b.createdAt - a.createdAt);
      setBids(list);
    }, (err) => console.error("Firestore bids error:", err));

    const unsubDeposits = onSnapshot(collection(db, 'depositRequests'), (snapshot) => {
      const list: DepositRequest[] = snapshot.docs.map(doc => doc.data() as DepositRequest);
      list.sort((a, b) => b.createdAt - a.createdAt);
      setDepositRequests(list);
    }, (err) => console.error("Firestore deposit error:", err));

    const unsubRatings = onSnapshot(collection(db, 'ratings'), (snapshot) => {
      const list: JobRating[] = snapshot.docs.map(doc => doc.data() as JobRating);
      setRatings(list);
    }, (err) => console.error("Firestore ratings error:", err));

    const unsubCategories = onSnapshot(collection(db, 'categories'), (snapshot) => {
      const list: Category[] = snapshot.docs.map(doc => doc.data() as Category);
      if (list.length > 0) {
        setCategories(list);
      } else {
        // Seed initial categories to firestore if empty
        INITIAL_CATEGORIES.forEach(cat => {
          setDoc(doc(db, 'categories', cat.id), cat).catch(console.error);
        });
      }
    }, (err) => console.error("Firestore categories error:", err));

    const unsubSettings = onSnapshot(doc(db, 'settings', 'admin'), (docSnap) => {
      if (docSnap.exists()) {
        setAdminSettings(docSnap.data() as AdminSettings);
      } else {
        setDoc(doc(db, 'settings', 'admin'), defaultAdminSettings).catch(console.error);
      }
    }, (err) => console.error("Firestore settings error:", err));

    return () => {
      unsubUsers();
      unsubJobs();
      unsubBroadcasts();
      unsubBids();
      unsubDeposits();
      unsubRatings();
      unsubCategories();
      unsubSettings();
    };
  }, []);

  // Sync current user with allUsers if updated
  useEffect(() => {
    if (currentUser && currentUser.id !== 'guest') {
      const updated = allUsers.find(u => u.id === currentUser.id);
      if (updated) {
        setCurrentUser(updated);
      }
    }
  }, [allUsers]);

  // Request location automatically on mount for live GPS tracking
  useEffect(() => {
    requestLocation();
  }, []);

  // Sync live user GPS location to active Firestore job
  useEffect(() => {
    if (!userLocation || !currentUser) return;

    jobs.forEach((job) => {
      if (job.status === 'completed' || job.status === 'cancelled') return;

      const isWorkerRole = role === 'worker' || currentUser.role === 'worker';
      const isCustomerRole = role === 'customer' || currentUser.role === 'customer';

      // Update worker location if current user/view is worker for this job
      if (isWorkerRole && (job.workerId === currentUser.id || !job.workerId || currentUser.id === 'guest')) {
        if (!job.workerLocationCoords || job.workerLocationCoords[0] !== userLocation[0] || job.workerLocationCoords[1] !== userLocation[1]) {
          setJobs(prev => prev.map(j => j.id === job.id ? { ...j, workerLocationCoords: userLocation } : j));
          updateDoc(doc(db, 'jobs', job.id), { workerLocationCoords: userLocation }).catch(console.error);
        }
      } 
      // Update customer location if current user/view is customer for this job
      if (isCustomerRole && (job.customerId === currentUser.id || currentUser.id === 'guest')) {
        if (!job.locationCoords || job.locationCoords[0] !== userLocation[0] || job.locationCoords[1] !== userLocation[1]) {
          setJobs(prev => prev.map(j => j.id === job.id ? { ...j, locationCoords: userLocation } : j));
          updateDoc(doc(db, 'jobs', job.id), { locationCoords: userLocation }).catch(console.error);
        }
      }
    });
  }, [userLocation, currentUser, role, jobs]);

  // Load user's currency based on timezone/IP and set location fallback
  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      if (tz.includes('Karachi')) setCurrency('Rs ');
      else if (tz.includes('Kolkata') || tz.includes('Calcutta')) setCurrency('₹');
      else if (tz.includes('London')) setCurrency('£');
      else if (tz.includes('Europe')) setCurrency('€');
      else if (tz.includes('Dubai')) setCurrency('AED ');
      else if (tz.includes('Riyadh')) setCurrency('SAR ');
    } catch(e) {}

    fetch('https://ipapi.co/json/')
      .then(r => r.json())
      .then(data => {
        if (data.latitude && data.longitude) {
          setUserLocation(prev => prev || [data.latitude, data.longitude]);
        }
        if (data.currency === 'PKR') setCurrency('Rs ');
        else if (data.currency === 'INR') setCurrency('₹');
        else if (data.currency === 'GBP') setCurrency('£');
        else if (data.currency === 'EUR') setCurrency('€');
        else if (data.currency === 'AED') setCurrency('AED ');
        else if (data.currency === 'SAR') setCurrency('SAR ');
        else if (data.currency === 'USD') setCurrency('$');
        else if (data.currency) setCurrency(data.currency + ' ');
      })
      .catch(() => {});
  }, []);

  // Update guest user role based on selected role
  useEffect(() => {
    if (!isLoggedIn) {
      setCurrentUser({
        ...guestUser,
        role,
        name: role === 'worker' ? 'Guest Worker' : 'Guest Customer'
      });
    }
  }, [role, isLoggedIn]);

  const updateAdminSettings = (newSettings: Partial<AdminSettings>) => {
    const updated = { ...adminSettings, ...newSettings };
    setAdminSettings(updated);
    setDoc(doc(db, 'settings', 'admin'), updated, { merge: true }).catch(console.error);
  };

  const addCategory = (catData: Omit<Category, 'id'>) => {
    const newCat: Category = {
      ...catData,
      id: `cat_${Date.now()}`
    };
    setCategories(prev => [...prev, newCat]);
    setDoc(doc(db, 'categories', newCat.id), newCat).catch(console.error);
  };

  const verifyWorker = (userId: string, status: 'verified' | 'rejected') => {
    setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, verificationStatus: status } : u));
    updateDoc(doc(db, 'users', userId), { verificationStatus: status }).catch(console.error);
  };

  const toggleBlockUser = (userId: string) => {
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;
    const nextBlocked = !user.isBlocked;
    setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, isBlocked: nextBlocked } : u));
    updateDoc(doc(db, 'users', userId), { isBlocked: nextBlocked }).catch(console.error);
  };

  const registerWorker = (data: { name: string; phone: string; address: string; cnic: string; password?: string; country?: string; city?: string; avatar?: string }) => {
    const cleanCnic = data.cnic.trim();
    // Check if CNIC is already registered by any worker
    const existingCNIC = allUsers.find(u => u.role === 'worker' && u.cnic && u.cnic.trim() === cleanCnic);
    if (existingCNIC) {
      return { success: false, error: 'A worker with this ID Card / CNIC is already registered!' };
    }

    const newUser: User = {
      id: `w_${Date.now()}`,
      name: data.name || 'New Worker',
      role: 'worker',
      rating: 5.0,
      avatar: data.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.name || 'Worker'}`,
      completedJobs: 0,
      points: 0,
      phone: data.phone,
      password: data.password,
      country: data.country || 'Pakistan',
      city: data.city || 'Lahore',
      address: data.address,
      cnic: cleanCnic,
      verificationStatus: 'pending',
      isBlocked: false,
    };

    setAllUsers(prev => [newUser, ...prev]);
    setCurrentUser(newUser);
    setIsLoggedIn(true);
    setDoc(doc(db, 'users', newUser.id), newUser).catch(console.error);
    return { success: true };
  };

  const registerCustomer = (data: { name: string; email: string; phone: string; password?: string; country: string; city: string }) => {
    const newUser: User = {
      id: `c_${Date.now()}`,
      name: data.name || 'Valued Customer',
      role: 'customer',
      rating: 5.0,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.name || 'Customer'}`,
      completedJobs: 0,
      points: 0,
      phone: data.phone || data.email,
      email: data.email,
      password: data.password,
      country: data.country || 'Pakistan',
      city: data.city || 'Lahore',
      isBlocked: false,
    };
    setAllUsers(prev => [newUser, ...prev]);
    setCurrentUser(newUser);
    setIsLoggedIn(true);
    setDoc(doc(db, 'users', newUser.id), newUser).catch(console.error);
  };

  const requestLocation = async () => {
    try {
      let lat, lng;
      // Try Capacitor Native Geolocation first if available
      if (typeof window !== 'undefined' && 'Capacitor' in window && (window as any).Capacitor.isNativePlatform()) {
        const { Geolocation } = await import('@capacitor/geolocation');
        const permission = await Geolocation.checkPermissions();
        if (permission.location !== 'granted') {
          await Geolocation.requestPermissions();
        }
        const position = await Geolocation.getCurrentPosition({ enableHighAccuracy: false, timeout: 10000 });
        lat = position.coords.latitude;
        lng = position.coords.longitude;
        setUserLocation([lat, lng]);
        setLocationError(null);

        // Watch position natively
        Geolocation.watchPosition({ enableHighAccuracy: true }, (pos, err) => {
          if (pos) setUserLocation([pos.coords.latitude, pos.coords.longitude]);
        });
      } else if (navigator.geolocation) {
        // Fallback to Web Geolocation API
        navigator.geolocation.getCurrentPosition(
          (position) => {
            lat = position.coords.latitude;
            lng = position.coords.longitude;
            setUserLocation([lat, lng]);
            setLocationError(null);
            
            // Watch position on web
            navigator.geolocation.watchPosition(
              (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
              (err) => console.warn(err.message),
              { enableHighAccuracy: true }
            );
          },
          (error) => setLocationError(error.message),
          { enableHighAccuracy: true, timeout: 10000 }
        );
      } else {
        setLocationError("Geolocation is not supported by this device.");
      }

      // Auto-detect city and update user profile if not set
      if (lat && lng && currentUser && currentUser.id !== 'guest') {
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, {
          headers: {
            'User-Agent': 'ObragoApp/1.0',
            'Accept-Language': 'en-US,en;q=0.9'
          }
        })
          .then(res => res.json())
          .then(data => {
            const detectedCity = data.address?.city || data.address?.town || data.address?.village || data.address?.county || 'Unknown';
            if (detectedCity && currentUser.city !== detectedCity) {
              const updatedUser = { ...currentUser, city: detectedCity };
              setCurrentUser(updatedUser);
              updateDoc(doc(db, 'users', currentUser.id), { city: detectedCity }).catch(console.error);
            }
          })
          .catch(e => console.warn("City auto-detect failed:", e));
      }
    } catch (error: any) {
      setLocationError(error.message || "Failed to get location");
    }
  };

  const postJob = (jobData: Omit<Job, 'id' | 'createdAt' | 'status'>) => {
    setCurrentUser((prev) => {
      if (prev.penaltyFee && prev.penaltyFee > 0) {
        const updated = { ...prev, penaltyFee: 0 };
        updateDoc(doc(db, 'users', prev.id), { penaltyFee: 0 }).catch(console.error);
        return updated;
      }
      return prev;
    });

    const newJob: Job = {
      ...jobData,
      id: `job_${Date.now()}`,
      status: 'bidding',
      createdAt: Date.now(),
    };
    setJobs((prev) => [newJob, ...prev]);
    setDoc(doc(db, 'jobs', newJob.id), newJob).catch(console.error);
  };

  const cancelJob = (jobId: string, reason?: string) => {
    setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, status: 'cancelled', cancelReason: reason } : j)));
    setBids((prev) => prev.filter((b) => b.jobId !== jobId));
    updateDoc(doc(db, 'jobs', jobId), { status: 'cancelled', cancelReason: reason || deleteField() }).catch(() => {
      deleteDoc(doc(db, 'jobs', jobId)).catch(console.error);
    });
  };

  const acceptBid = (jobId: string, bidId: string) => {
    const bid = bids.find((b) => b.id === bidId);
    if (!bid) return;

    setJobs((prev) =>
      prev.map((job) =>
        job.id === jobId
          ? { ...job, status: 'accepted', workerId: bid.workerId, acceptedBidId: bidId }
          : job
      )
    );
    updateDoc(doc(db, 'jobs', jobId), { status: 'accepted', workerId: bid.workerId, acceptedBidId: bidId }).catch(console.error);
  };

  const markWorkerArrived = (jobId: string) => {
    setJobs((prev) =>
      prev.map((job) =>
        job.id === jobId ? { ...job, workerArrived: true } : job
      )
    );
    updateDoc(doc(db, 'jobs', jobId), { workerArrived: true }).catch(console.error);
  };

  const cancelJobAfterArrival = (jobId: string) => {
    setJobs((prev) => {
      const job = prev.find((j) => j.id === jobId);
      if (!job) return prev;

      const penaltyAmount = job.budget * 0.5;
      const compensationAmount = Math.ceil(job.budget * 0.05);

      if (currentUser.role === 'customer' && currentUser.id === job.customerId) {
        setCurrentUser((u) => {
          const newPts = Math.max(0, (u.points || 0) - penaltyAmount);
          const newPen = (u.penaltyFee || 0) + penaltyAmount;
          updateDoc(doc(db, 'users', u.id), { points: newPts, penaltyFee: newPen }).catch(console.error);
          return { ...u, points: newPts, penaltyFee: newPen };
        });
      } else if (currentUser.role === 'worker' && job.acceptedBidId) {
        const acceptedBid = bids.find(b => b.id === job.acceptedBidId);
        if (acceptedBid && acceptedBid.workerId === currentUser.id) {
          setCurrentUser((u) => {
            const newPts = (u.points || 0) + compensationAmount;
            updateDoc(doc(db, 'users', u.id), { points: newPts }).catch(console.error);
            return { ...u, points: newPts };
          });
        }
      }

      updateDoc(doc(db, 'jobs', jobId), { status: 'cancelled' }).catch(console.error);
      return prev.map((j) => (j.id === jobId ? { ...j, status: 'cancelled' } : j));
    });
  };

  const completeJob = (jobId: string) => {
    setJobs((prev) =>
      prev.map((job) =>
        job.id === jobId ? { ...job, status: 'completed' } : job
      )
    );
    updateDoc(doc(db, 'jobs', jobId), { status: 'completed' }).catch(console.error);
  };

  const addPoints = (amount: number) => {
    setCurrentUser((prev) => {
      const newPts = (prev.points || 0) + amount;
      if (prev.id !== 'guest') {
        updateDoc(doc(db, 'users', prev.id), { points: newPts }).catch(console.error);
      }
      return { ...prev, points: newPts };
    });
  };

  const deductPoints = (amount: number) => {
    setCurrentUser((prev) => {
      const newPts = Math.max(0, (prev.points || 0) - amount);
      if (prev.id !== 'guest') {
        updateDoc(doc(db, 'users', prev.id), { points: newPts }).catch(console.error);
      }
      return { ...prev, points: newPts };
    });
  };

  const submitBid = (bidData: Omit<Bid, 'id' | 'createdAt'>) => {
    const newBid: Bid = {
      ...bidData,
      id: `bid_${Date.now()}`,
      createdAt: Date.now(),
    };
    setBids((prev) => [newBid, ...prev]);
    setDoc(doc(db, 'bids', newBid.id), newBid).catch(console.error);
  };

  const submitCounterOffer = (bidId: string, counterPrice: number, counterMessage?: string) => {
    const msg = counterMessage || `Counter proposal: ${currency}${counterPrice}`;
    setBids((prev) =>
      prev.map((b) =>
        b.id === bidId
          ? {
              ...b,
              counterPrice,
              counterMessage: msg,
            }
          : b
      )
    );
    updateDoc(doc(db, 'bids', bidId), { counterPrice, counterMessage: msg }).catch(console.error);
  };

  const acceptCounterOffer = (bidId: string) => {
    setBids((prev) =>
      prev.map((b) =>
        b.id === bidId && b.counterPrice
          ? {
              ...b,
              price: b.counterPrice, // Update to the new agreed price
              counterPrice: undefined,
              counterMessage: undefined,
            }
          : b
      )
    );
    // Real-time update
    const bidToUpdate = bids.find(b => b.id === bidId);
    if (bidToUpdate && bidToUpdate.counterPrice) {
      updateDoc(doc(db, 'bids', bidId), { 
        price: bidToUpdate.counterPrice,
        counterPrice: deleteField(),
        counterMessage: deleteField()
      }).catch(console.error);
    }
  };

  const submitDepositProof = (amount: number, method: 'bank' | 'easypaisa' | 'jazzcash', trxId: string) => {
    const newReq: DepositRequest = {
      id: `dep_${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      amount,
      method,
      trxId,
      status: 'pending',
      createdAt: Date.now(),
    };
    setDepositRequests((prev) => [newReq, ...prev]);
    setDoc(doc(db, 'depositRequests', newReq.id), newReq).catch(console.error);
  };

  const processDepositRequest = (requestId: string, status: 'approved' | 'rejected') => {
    const req = depositRequests.find((r) => r.id === requestId);
    if (req && status === 'approved') {
      const user = allUsers.find(u => u.id === req.userId);
      if (user) {
        const newPts = (user.points || 0) + req.amount;
        updateDoc(doc(db, 'users', user.id), { points: newPts }).catch(console.error);
      }
    }
    updateDoc(doc(db, 'depositRequests', requestId), { status }).catch(console.error);
  };

  const submitRating = (jobId: string, toUserId: string, stars: number, tags: string[], comment: string) => {
    const newRating: JobRating = {
      id: `rat_${Date.now()}`,
      jobId,
      fromUserId: currentUser.id,
      toUserId,
      stars,
      tags,
      comment,
      createdAt: Date.now(),
    };
    setRatings((prev) => [newRating, ...prev]);
    setDoc(doc(db, 'ratings', newRating.id), newRating).catch(console.error);

    // Update target user's rating in Firestore
    const target = allUsers.find(u => u.id === toUserId);
    if (target) {
      const newAvg = target.rating ? Number(((target.rating + stars) / 2).toFixed(1)) : stars;
      updateDoc(doc(db, 'users', toUserId), { 
        rating: newAvg, 
        completedJobs: (target.completedJobs || 0) + 1 
      }).catch(console.error);
    }
  };

  const refundPenalty = (userId: string) => {
    setAllUsers((users) =>
      users.map((u) => (u.id === userId ? { ...u, penaltyFee: 0 } : u))
    );
    if (currentUser.id === userId) {
      setCurrentUser((u) => ({ ...u, penaltyFee: 0 }));
    }
    updateDoc(doc(db, 'users', userId), { penaltyFee: 0 }).catch(console.error);
  };

  const deleteAccount = (userId: string) => {
    deleteDoc(doc(db, 'users', userId)).catch(console.error);

    // If deleting current user account, log out immediately
    if (currentUser.id === userId) {
      setIsLoggedIn(false);
      setCurrentUser({
        ...guestUser,
        role,
        name: role === 'worker' ? 'Guest Worker' : 'Guest Customer',
      });
      setShowProfile(false);
    }
  };

  const resetPassword = (userId: string, newPass: string) => {
    updateDoc(doc(db, 'users', userId), { password: newPass }).catch(console.error);
    if (currentUser.id === userId) {
      setCurrentUser(prev => ({ ...prev, password: newPass }));
    }
  };

  const sendAdminBroadcast = (title: string, message: string, targetRole: 'all' | 'worker' | 'customer') => {
    const newBroadcast = {
      id: `bcast_${Date.now()}`,
      title,
      message,
      targetRole,
      createdAt: Date.now()
    };
    setDoc(doc(db, 'broadcasts', newBroadcast.id), newBroadcast).catch(console.error);
    triggerSystemCustomNotification(title, message);
  };

  return (
    <AppContext.Provider
      value={{
        role,
        setRole,
        isLoggedIn,
        setIsLoggedIn,
        showAuth,
        setShowAuth,
        showProfile,
        setShowProfile,
        showAdminPanel,
        setShowAdminPanel,
        isAdminAuthenticated,
        setIsAdminAuthenticated,
        userLocation,
        requestLocation,
        locationError,
        currentUser,
        setCurrentUser,
        allUsers,
        verifyWorker,
        toggleBlockUser,
        registerWorker,
        registerCustomer,
        addPoints,
        deductPoints,
        jobs,
        bids,
        categories,
        addCategory,
        adminSettings,
        updateAdminSettings,
        currency,
        setCurrency,
        activeChat,
        setActiveChat,
        activeCall,
        setActiveCall,
        latestJobAlert,
        setLatestJobAlert,
        postJob,
        cancelJob,
        acceptBid,
        markWorkerArrived,
        cancelJobAfterArrival,
        completeJob,
        submitBid,
        submitCounterOffer,
        acceptCounterOffer,
        depositRequests,
        submitDepositProof,
        processDepositRequest,
        ratings,
        submitRating,
        refundPenalty,
        deleteAccount,
        resetPassword,
        sendAdminBroadcast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppStore() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppStore must be used within an AppProvider');
  }
  return context;
}
