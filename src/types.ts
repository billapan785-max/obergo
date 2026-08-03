export type Role = 'customer' | 'worker' | 'admin';
export type JobStatus = 'searching' | 'bidding' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
export type VerificationStatus = 'verified' | 'pending' | 'rejected';

export interface User {
  id: string;
  name: string;
  role: Role;
  rating: number;
  avatar: string;
  completedJobs: number;
  points: number;
  penaltyFee?: number;
  verificationStatus?: VerificationStatus;
  cnic?: string;
  phone?: string;
  email?: string;
  password?: string;
  country?: string;
  city?: string;
  address?: string;
  isBlocked?: boolean;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  isLongProject?: boolean;
  duration?: string;
  upfrontFee?: number;
}

export interface AppBanner {
  id: string;
  title: string;
  imageUrl: string;
  linkCategory?: string;
  isActive: boolean;
  createdAt: number;
}

export interface PromoCoupon {
  id: string;
  code: string;
  discountType: 'flat' | 'percentage';
  discountValue: number;
  maxUses: number;
  usedCount: number;
  expiryDate: string;
  isActive: boolean;
}

export interface CoinPackage {
  id: string;
  coins: number;
  pricePkr: number;
  popularTag?: boolean;
}

export interface AdminSettings {
  commissionRate: number; // e.g. 5 for 5%
  bankName: string;
  accountTitle: string;
  accountNumber: string;
  easypaisaNumber: string;
  jazzcashNumber: string;
  coinPricePkr: number; // e.g. 10 PKR per coin
  minTopupCoins: number; // e.g. 20 coins
  banners?: AppBanner[];
  coupons?: PromoCoupon[];
  coinPackages?: CoinPackage[];
}

export interface Job {
  id: string;
  customerId: string;
  category: string;
  description: string;
  location: string;
  city?: string;
  locationCoords?: [number, number];
  workerLocationCoords?: [number, number];
  budget: number;
  status: JobStatus;
  createdAt: number;
  workerId?: string;
  acceptedBidId?: string;
  workerArrived?: boolean;
  cancelReason?: string;
  isLongProject?: boolean;
  duration?: string;
  upfrontFee?: number;
}

export interface Bid {
  id: string;
  jobId: string;
  workerId: string;
  workerName: string;
  workerRating: number;
  workerAvatar: string;
  workerJobs: number;
  price: number;
  eta: string;
  message: string;
  createdAt: number;
  counterPrice?: number;
  counterMessage?: string;
}

export interface DepositRequest {
  id: string;
  userId: string;
  userName: string;
  userRole: Role;
  amount: number;
  method: 'bank' | 'easypaisa' | 'jazzcash';
  trxId: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: number;
}

export interface JobRating {
  id: string;
  jobId: string;
  fromUserId: string;
  toUserId: string;
  stars: number;
  tags: string[];
  comment: string;
  createdAt: number;
}

export interface ChatMessage {
  id: string;
  jobId?: string;
  senderId: string;
  receiverId: string;
  text: string;
  createdAt: number;
  read: boolean;
}

export interface CallState {
  id: string; // The caller's ID usually or a combined ID
  callerId: string;
  receiverId: string;
  callerName: string;
  callerAvatar: string;
  status: 'calling' | 'accepted' | 'rejected' | 'ended';
  isAudioOnly: boolean;
  timestamp: number;
}


export const INITIAL_CATEGORIES: Category[] = [
  { id: 'electrician', name: 'Electrician', icon: 'Zap' },
  { id: 'plumber', name: 'Plumber', icon: 'Droplets' },
  { id: 'carpenter', name: 'Carpenter', icon: 'Hammer' },
  { id: 'cleaner', name: 'Cleaner', icon: 'Sparkles' },
  { id: 'painter', name: 'Painter', icon: 'PaintRoller' },
  { id: 'mechanic', name: 'Mechanic', icon: 'Wrench' },
  { id: 'ac', name: 'AC Technician', icon: 'Fan' },
  { id: 'mason', name: 'Mason', icon: 'BrickWall' },
  { 
    id: 'house_construction_1m', 
    name: 'House Building (1 Month)', 
    icon: 'Building', 
    isLongProject: true, 
    duration: '1 Month', 
    upfrontFee: 500 
  },
  { 
    id: 'commercial_construction_2m', 
    name: 'Commercial Project (2 Months)', 
    icon: 'Building2', 
    isLongProject: true, 
    duration: '2 Months', 
    upfrontFee: 1000 
  },
];

export const CATEGORIES = INITIAL_CATEGORIES;

export const PAKISTAN_CITIES = [
  'Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Peshawar', 
  'Multan', 'Faisalabad', 'Quetta', 'Sialkot', 'Gujranwala', 
  'Hyderabad', 'Sukkur', 'Bahawalpur', 'Abbottabad', 'Mardan',
  'Sahiwal', 'Sargodha', 'Okara', 'Sheikhupura', 'Jhelum', 'Kasur',
  'Other'
];

export const CITIES_BY_COUNTRY: Record<string, string[]> = {
  'Pakistan': PAKISTAN_CITIES
};

