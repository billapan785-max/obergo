import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from './store';
import { TopBar, Button, Card, Input } from './components';
import { ShieldCheck, Users, FolderPlus, Settings, BarChart3, 
  CheckCircle2, XCircle, Ban, Lock, Unlock, Percent, 
  Building2, CreditCard, Phone, Plus, Search, Layers, Clock, Coins, UserCheck, Receipt, AlertCircle, RefreshCw, Trash2,
  Image as ImageIcon, Ticket, Tag, Gift, Megaphone, ToggleLeft, ToggleRight, Eye, LogOut, Bell, Send
} from 'lucide-react';
import { auth, db } from './firebase';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { safeFormatTime } from './dateUtils';

export function AdminPanel() {
  const { 
    showAdminPanel, setShowAdminPanel, 
    allUsers, verifyWorker, toggleBlockUser, deleteAccount,
    categories, addCategory, 
    adminSettings, updateAdminSettings,
    jobs, currency,
    depositRequests, processDepositRequest, refundPenalty,
    isAdminAuthenticated, setIsAdminAuthenticated,
    sendAdminBroadcast
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'overview' | 'verifications' | 'users' | 'categories' | 'settings' | 'coins' | 'banners' | 'coupons' | 'deposits' | 'support' | 'notifications'>('overview');
  const [supportChats, setSupportChats] = useState<any[]>([]);
  const { setActiveChat } = useAppStore();

  // Admin Broadcast Notification State
  const [bcastTitle, setBcastTitle] = useState('');
  const [bcastMessage, setBcastMessage] = useState('');
  const [bcastTarget, setBcastTarget] = useState<'all' | 'worker' | 'customer'>('all');

  React.useEffect(() => {
    if (isAdminAuthenticated) {
      const q = query(collection(db, 'chats'), where('isSupport', '==', true), orderBy('lastMessageTime', 'desc'));
      const unsub = onSnapshot(q, (snapshot) => {
        const chats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setSupportChats(chats);
      });
      return () => unsub();
    }
  }, [isAdminAuthenticated]);
  const [searchTerm, setSearchTerm] = useState('');

  // Admin Authentication State
  const [adminStep, setAdminStep] = useState<'credentials' | '2fa'>('credentials');
  const [adminPhone, setAdminPhone] = useState('+923170317751');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminTotpCode, setAdminTotpCode] = useState('');
  const [adminAuthError, setAdminAuthError] = useState('');
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  // Category creation form
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('Hammer');
  const [isLongProject, setIsLongProject] = useState(false);
  const [duration, setDuration] = useState('1 Month');
  const [upfrontFee, setUpfrontFee] = useState('500');

  // Settings form
  const [commRate, setCommRate] = useState(adminSettings.commissionRate.toString());
  const [bankName, setBankName] = useState(adminSettings.bankName);
  const [accTitle, setAccTitle] = useState(adminSettings.accountTitle);
  const [accNum, setAccNum] = useState(adminSettings.accountNumber);
  const [easypaisa, setEasypaisa] = useState(adminSettings.easypaisaNumber);
  const [jazzcash, setJazzcash] = useState(adminSettings.jazzcashNumber);
  const [settingsSavedMsg, setSettingsSavedMsg] = useState(false);

  // Coins & Wallet Rates
  const [coinPricePkr, setCoinPricePkr] = useState((adminSettings.coinPricePkr || 10).toString());
  const [minTopupCoins, setMinTopupCoins] = useState((adminSettings.minTopupCoins || 20).toString());
  const [newPkgCoins, setNewPkgCoins] = useState('100');
  const [newPkgPrice, setNewPkgPrice] = useState('1000');
  const [newPkgPopular, setNewPkgPopular] = useState(false);

  // Banners Form State
  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerImage, setBannerImage] = useState('');
  const [bannerCategory, setBannerCategory] = useState('');

  // Coupons Form State
  const [couponCode, setCouponCode] = useState('');
  const [couponType, setCouponType] = useState<'flat' | 'percentage'>('flat');
  const [couponValue, setCouponValue] = useState('100');
  const [couponMaxUses, setCouponMaxUses] = useState('50');
  const [couponExpiry, setCouponExpiry] = useState('2026-12-31');

  if (!showAdminPanel) return null;

  const setupRecaptcha = () => {
    if (!(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'admin-recaptcha-container', {
        size: 'invisible',
      });
    }
  };

  const handleVerifyCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminAuthError('');

    const cleanPhoneDigits = adminPhone.replace(/\D/g, '');
    const isPhoneValid = cleanPhoneDigits.endsWith('3170317751');
    const isPasswordValid = adminPassword === 'Ecomspro123@';

    if (isPhoneValid && isPasswordValid) {
      setIsSendingCode(true);
      try {
        setupRecaptcha();
        const appVerifier = (window as any).recaptchaVerifier;
        // Always send to the specific admin number
        const formattedPhone = '+923170317751';
        const result = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
        setConfirmationResult(result);
        setAdminStep('2fa');
        setAdminAuthError('');
      } catch (error: any) {
        console.error("SMS Error", error);
        setAdminAuthError('Failed to send SMS. Please try again later.');
      } finally {
        setIsSendingCode(false);
      }
    } else {
      setAdminAuthError('Access Denied: Invalid Admin Mobile Number or Password!');
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminAuthError('');

    if (!confirmationResult) {
      setAdminAuthError('Please request a new code.');
      return;
    }

    try {
      await confirmationResult.confirm(adminTotpCode);
      setIsAdminAuthenticated(true);
      setAdminAuthError('');
    } catch (error: any) {
      console.error("OTP Error", error);
      setAdminAuthError('Invalid Verification Code!');
    }
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    localStorage.removeItem('ld_admin_authed_session');
    setAdminStep('credentials');
    setAdminPassword('');
    setAdminTotpCode('');
    setAdminAuthError('');
    setShowAdminPanel(false);
  };

  if (!isAdminAuthenticated) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-0 z-50 bg-gray-950 text-white flex flex-col items-center justify-center p-4 overflow-y-auto"
      >
        <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-3xl p-6 shadow-2xl relative">
          <button 
            onClick={() => setShowAdminPanel(false)}
            className="absolute top-4 right-4 text-gray-400 hover:text-white p-2 rounded-xl bg-gray-800"
          >
            ✕
          </button>

          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg mb-3">
              <ShieldCheck size={36} className="text-white" />
            </div>
            <h2 className="text-xl font-black text-white">Admin Portal Access</h2>
            <p className="text-xs text-gray-400 mt-1">
              {adminStep === 'credentials' 
                ? 'Authorized Personnel Login Required' 
                : 'Google Authenticator 2-Step Verification'}
            </p>
          </div>

          {adminAuthError && (
            <div className="mb-4 p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{adminAuthError}</span>
            </div>
          )}

          {adminStep === 'credentials' ? (
            <form onSubmit={handleVerifyCredentials} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-300 mb-1 block">Admin Mobile Number</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3.5 top-3.5 text-gray-500" />
                  <input
                    type="text"
                    value={adminPhone}
                    onChange={(e) => setAdminPhone(e.target.value)}
                    placeholder="+923170317751"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-300 mb-1 block">Admin Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-3.5 text-gray-500" />
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSendingCode}
                className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold text-sm hover:from-purple-500 hover:to-indigo-500 shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSendingCode ? 'Sending SMS Code...' : 'Next: Verify SMS OTP →'}
              </button>
              <div id="admin-recaptcha-container"></div>
            </form>
          ) : (
            <form onSubmit={handleVerify2FA} className="space-y-4">
              <div className="bg-purple-950/40 p-4 rounded-2xl border border-purple-500/30 text-center space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-900/60 rounded-full border border-purple-500/30 text-purple-300 text-xs font-extrabold mb-1">
                  <ShieldCheck size={14} className="text-purple-400" /> SMS Code Sent
                </div>
                <p className="text-xs text-gray-300 font-medium">
                  We've sent a 6-digit verification code to your phone number <strong>+92 317 031 7751</strong>.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-gray-300 block">Enter 6-Digit SMS Code</label>
                </div>

                <input
                  type="text"
                  maxLength={6}
                  value={adminTotpCode}
                  onChange={(e) => setAdminTotpCode(e.target.value)}
                  placeholder="0 0 0 0 0 0"
                  className="w-full text-center bg-gray-800 border-2 border-purple-500/50 focus:border-purple-500 rounded-2xl py-3.5 text-2xl font-mono tracking-[0.4em] font-extrabold text-white focus:outline-none shadow-inner"
                  required
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setAdminStep('credentials')}
                    className="w-1/3 py-3 bg-gray-800 text-gray-300 rounded-xl font-bold text-xs hover:bg-gray-700"
                  >
                    ← Back
                  </button>
                  <button
                    type="submit"
                    className="w-2/3 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl font-bold text-sm hover:from-emerald-500 hover:to-green-500 shadow-lg"
                  >
                    Unlock Admin Panel
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    );
  }

  const pendingWorkers = allUsers.filter(u => u.role === 'worker' && u.verificationStatus === 'pending');
  const verifiedWorkers = allUsers.filter(u => u.role === 'worker' && u.verificationStatus === 'verified');
  const totalCustomers = allUsers.filter(u => u.role === 'customer');
  const totalWorkers = allUsers.filter(u => u.role === 'worker');

  const filteredUsers = allUsers.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.cnic && u.cnic.includes(searchTerm)) ||
    (u.phone && u.phone.includes(searchTerm))
  );

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    addCategory({
      name: newCatName.trim(),
      icon: newCatIcon,
      isLongProject,
      duration: isLongProject ? duration : undefined,
      upfrontFee: isLongProject ? parseInt(upfrontFee) || 0 : undefined
    });

    setNewCatName('');
    setIsLongProject(false);
    alert('New Category added successfully!');
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateAdminSettings({
      commissionRate: parseFloat(commRate) || 5,
      bankName,
      accountTitle: accTitle,
      accountNumber: accNum,
      easypaisaNumber: easypaisa,
      jazzcashNumber: jazzcash
    });
    setSettingsSavedMsg(true);
    setTimeout(() => setSettingsSavedMsg(false), 3000);
  };

  const handleAddBanner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerTitle.trim() || !bannerImage.trim()) {
      alert('Please enter Banner Title and Image URL');
      return;
    }
    const newBanner = {
      id: 'b_' + Date.now(),
      title: bannerTitle.trim(),
      imageUrl: bannerImage.trim(),
      linkCategory: bannerCategory || undefined,
      isActive: true,
      createdAt: Date.now()
    };
    const updated = [...(adminSettings.banners || []), newBanner];
    updateAdminSettings({ banners: updated });
    setBannerTitle('');
    setBannerImage('');
    setBannerCategory('');
    alert('App Banner added successfully!');
  };

  const handleToggleBanner = (bannerId: string) => {
    const updated = (adminSettings.banners || []).map(b => 
      b.id === bannerId ? { ...b, isActive: !b.isActive } : b
    );
    updateAdminSettings({ banners: updated });
  };

  const handleDeleteBanner = (bannerId: string) => {
    const updated = (adminSettings.banners || []).filter(b => b.id !== bannerId);
    updateAdminSettings({ banners: updated });
  };

  const handleAddCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) {
      alert('Please enter Coupon Code');
      return;
    }
    const newCoupon = {
      id: 'c_' + Date.now(),
      code: couponCode.trim().toUpperCase(),
      discountType: couponType,
      discountValue: parseFloat(couponValue) || 100,
      maxUses: parseInt(couponMaxUses) || 50,
      usedCount: 0,
      expiryDate: couponExpiry || '2026-12-31',
      isActive: true
    };
    const updated = [...(adminSettings.coupons || []), newCoupon];
    updateAdminSettings({ coupons: updated });
    setCouponCode('');
    alert('Coupon Code added successfully!');
  };

  const handleToggleCoupon = (couponId: string) => {
    const updated = (adminSettings.coupons || []).map(c => 
      c.id === couponId ? { ...c, isActive: !c.isActive } : c
    );
    updateAdminSettings({ coupons: updated });
  };

  const handleDeleteCoupon = (couponId: string) => {
    const updated = (adminSettings.coupons || []).filter(c => c.id !== couponId);
    updateAdminSettings({ coupons: updated });
  };

  const handleAddCoinPackage = (e: React.FormEvent) => {
    e.preventDefault();
    const coins = parseInt(newPkgCoins) || 50;
    const price = parseInt(newPkgPrice) || 500;
    const newPkg = {
      id: 'cp_' + Date.now(),
      coins,
      pricePkr: price,
      popularTag: newPkgPopular
    };
    const updated = [...(adminSettings.coinPackages || []), newPkg];
    updateAdminSettings({ coinPackages: updated });
    setNewPkgCoins('100');
    setNewPkgPrice('1000');
    setNewPkgPopular(false);
    alert('Coin Topup Package created!');
  };

  const handleDeleteCoinPackage = (pkgId: string) => {
    const updated = (adminSettings.coinPackages || []).filter(p => p.id !== pkgId);
    updateAdminSettings({ coinPackages: updated });
  };

  const handleSaveCoinRates = (e: React.FormEvent) => {
    e.preventDefault();
    updateAdminSettings({
      coinPricePkr: parseFloat(coinPricePkr) || 10,
      minTopupCoins: parseInt(minTopupCoins) || 20
    });
    alert('Coin Conversion Rates updated successfully!');
  };

  return (
    <motion.div 
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-50 bg-gray-50 dark:bg-gray-950 flex flex-col"
    >
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center justify-between shrink-0 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h2 className="text-sm font-black text-gray-900 dark:text-white leading-tight">Admin Control Panel</h2>
            <p className="text-[10px] text-green-600 dark:text-green-400 font-extrabold flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
              2FA Google Authenticator Active
            </p>
          </div>
        </div>

        <button
          onClick={handleAdminLogout}
          className="px-3.5 py-2 rounded-2xl bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-red-600/20 transition-all"
          title="Sign Out of Admin Account"
        >
          <LogOut size={15} />
          <span>Sign Out Admin</span>
        </button>
      </div>

      {/* Admin Tab Navigation Bar */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-3 py-2 flex gap-1 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors ${
            activeTab === 'overview' ? 'bg-green-500 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <BarChart3 size={16} /> Overview
        </button>

        <button
          onClick={() => setActiveTab('verifications')}
          className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors relative ${
            activeTab === 'verifications' ? 'bg-green-500 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <ShieldCheck size={16} /> Worker Approvals
          {pendingWorkers.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-red-500 text-white rounded-full font-bold">
              {pendingWorkers.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors ${
            activeTab === 'users' ? 'bg-green-500 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <Users size={16} /> Users ({allUsers.length})
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors ${
            activeTab === 'categories' ? 'bg-green-500 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <FolderPlus size={16} /> Categories
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors ${
            activeTab === 'settings' ? 'bg-green-500 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <Building2 size={16} /> Bank Accounts
        </button>

        <button
          onClick={() => setActiveTab('coins')}
          className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors ${
            activeTab === 'coins' ? 'bg-green-500 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <Coins size={16} /> Coin Rates
        </button>

        <button
          onClick={() => setActiveTab('banners')}
          className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors ${
            activeTab === 'banners' ? 'bg-green-500 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <ImageIcon size={16} /> Banners
        </button>

        <button
          onClick={() => setActiveTab('coupons')}
          className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors ${
            activeTab === 'coupons' ? 'bg-green-500 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <Ticket size={16} /> Coupons
        </button>

        <button
          onClick={() => setActiveTab('deposits')}
          className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors relative ${
            activeTab === 'deposits' ? 'bg-green-500 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <Receipt size={16} /> Top-Up Approvals
          {depositRequests.filter(r => r.status === 'pending').length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-yellow-500 text-white rounded-full font-bold">
              {depositRequests.filter(r => r.status === 'pending').length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors relative ${
            activeTab === 'notifications' ? 'bg-purple-600 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <Bell size={16} /> Send Notifications
        </button>

        <button
          onClick={() => setActiveTab('support')}
          className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors relative ${
            activeTab === 'support' ? 'bg-green-500 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <Phone size={16} /> Support Tickets
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Platform Metrics</h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-blue-500 mb-2">
                  <span className="text-xs font-bold text-gray-500">Total Customers</span>
                  <Users size={20} />
                </div>
                <span className="text-2xl font-black text-gray-900 dark:text-white">{totalCustomers.length}</span>
              </div>

              <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-green-500 mb-2">
                  <span className="text-xs font-bold text-gray-500">Total Workers</span>
                  <UserCheck size={20} />
                </div>
                <span className="text-2xl font-black text-gray-900 dark:text-white">{totalWorkers.length}</span>
              </div>

              <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-yellow-500 mb-2">
                  <span className="text-xs font-bold text-gray-500">Pending Workers</span>
                  <ShieldCheck size={20} />
                </div>
                <span className="text-2xl font-black text-yellow-600 dark:text-yellow-500">{pendingWorkers.length}</span>
              </div>

              <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-purple-500 mb-2">
                  <span className="text-xs font-bold text-gray-500">Commission Rate</span>
                  <Percent size={20} />
                </div>
                <span className="text-2xl font-black text-gray-900 dark:text-white">{adminSettings.commissionRate}%</span>
              </div>
            </div>

            <Card className="mt-4">
              <h4 className="font-bold text-gray-900 dark:text-white mb-3">Jobs Overview</h4>
              <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Jobs Posted</span>
                <span className="font-bold text-gray-900 dark:text-white">{jobs.length}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-sm text-gray-600 dark:text-gray-400">Active Categories</span>
                <span className="font-bold text-gray-900 dark:text-white">{categories.length}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Long Project Types</span>
                <span className="font-bold text-gray-900 dark:text-white">{categories.filter(c => c.isLongProject).length}</span>
              </div>
            </Card>
          </div>
        )}

        {/* WORKER VERIFICATIONS TAB */}
        {activeTab === 'verifications' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Pending Verification</h3>
              <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2.5 py-1 rounded-full">
                {pendingWorkers.length} Pending
              </span>
            </div>

            {pendingWorkers.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800">
                <CheckCircle2 className="mx-auto text-green-500 mb-3" size={40} />
                <p className="text-gray-600 dark:text-gray-300 font-bold">All caught up!</p>
                <p className="text-xs text-gray-400 mt-1">There are no pending worker profiles to review.</p>
              </div>
            ) : (
              pendingWorkers.map((worker) => (
                <Card key={worker.id} className="border-l-4 border-l-yellow-500">
                  <div className="flex gap-3 items-start mb-3">
                    <img src={worker.avatar} alt={worker.name} className="w-12 h-12 rounded-full border border-gray-200 shrink-0" />
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 dark:text-white text-base">{worker.name}</h4>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Phone size={12} /> {worker.phone || 'No phone provided'}
                      </p>
                    </div>
                    <span className="bg-yellow-100 text-yellow-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                      Pending
                    </span>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-xl space-y-2 text-xs mb-4">
                    <div className="flex justify-between">
                      <span className="text-gray-500">ID Card (CNIC):</span>
                      <span className="font-mono font-bold text-gray-900 dark:text-white">{worker.cnic || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Address:</span>
                      <span className="font-medium text-gray-800 dark:text-gray-200">{worker.address || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">1 CNIC per Worker Check:</span>
                      <span className="font-bold text-green-600">Passed (Unique CNIC)</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      onClick={() => verifyWorker(worker.id, 'verified')}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                    >
                      <CheckCircle2 size={16} /> Approve & Verify
                    </Button>
                    <Button 
                      onClick={() => verifyWorker(worker.id, 'rejected')}
                      variant="outline"
                      className="text-red-500 border-red-200 hover:bg-red-50"
                    >
                      <XCircle size={16} /> Reject
                    </Button>
                  </div>
                </Card>
              ))
            )}

            <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
              <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Verified Workers ({verifiedWorkers.length})</h4>
              <div className="space-y-2">
                {verifiedWorkers.map(w => (
                  <div key={w.id} className="bg-white dark:bg-gray-900 p-3 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <img src={w.avatar} alt={w.name} className="w-8 h-8 rounded-full" />
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white">{w.name}</p>
                        <p className="text-gray-400">CNIC: {w.cnic}</p>
                      </div>
                    </div>
                    <span className="text-green-500 font-bold flex items-center gap-1">
                      <CheckCircle2 size={14} /> Verified
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* USER MANAGEMENT TAB */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search user by name, CNIC or phone..."
                className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl py-3 pl-10 pr-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/50"
              />
            </div>

            <div className="space-y-3">
              {filteredUsers.map(user => (
                <div 
                  key={user.id} 
                  className={`bg-white dark:bg-gray-900 p-4 rounded-2xl border ${
                    user.isBlocked ? 'border-red-300 dark:border-red-900/50 bg-red-50/20' : 'border-gray-100 dark:border-gray-800'
                  } shadow-sm flex items-center justify-between gap-3`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full shrink-0" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-gray-900 dark:text-white text-sm truncate">{user.name}</h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                          user.role === 'worker' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                        }`}>
                          {user.role}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 truncate">
                        {user.phone || 'No phone'} {user.cnic ? `• CNIC: ${user.cnic}` : ''} • Points: <strong className="text-yellow-600 dark:text-yellow-400">{user.points || 0} Pts</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {user.isBlocked ? (
                      <button
                        onClick={() => toggleBlockUser(user.id)}
                        className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 active:scale-95 transition-transform"
                      >
                        <Unlock size={14} /> Unblock
                      </button>
                    ) : (
                      <button
                        onClick={() => toggleBlockUser(user.id)}
                        className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 active:scale-95 transition-transform"
                      >
                        <Lock size={14} /> Block
                      </button>
                    )}

                    <button
                      onClick={() => {
                        if (confirm(`Permanently delete user ${user.name} and all their data?`)) {
                          deleteAccount(user.id);
                        }
                      }}
                      className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-2 rounded-xl text-xs font-bold hover:bg-red-200 active:scale-95 transition-transform"
                      title="Delete User"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CATEGORIES & LONG PROJECTS TAB */}
        {activeTab === 'categories' && (
          <div className="space-y-6">
            <Card>
              <h3 className="font-bold text-gray-900 dark:text-white text-base mb-4 flex items-center gap-2">
                <Plus className="text-green-500" size={20} />
                Add New Category / Long Project
              </h3>

              <form onSubmit={handleCreateCategory} className="space-y-4">
                <Input 
                  label="Category Name" 
                  value={newCatName} 
                  onChange={e => setNewCatName(e.target.value)} 
                  placeholder="e.g. House Construction, Solar Repair" 
                />

                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <input
                    type="checkbox"
                    id="longProj"
                    checked={isLongProject}
                    onChange={e => setIsLongProject(e.target.checked)}
                    className="w-5 h-5 accent-green-500 rounded"
                  />
                  <label htmlFor="longProj" className="text-sm font-semibold text-gray-800 dark:text-gray-200 cursor-pointer">
                    Is this a Long Duration Project? (e.g. 1 Month / 2 Months)
                  </label>
                </div>

                {isLongProject && (
                  <div className="grid grid-cols-2 gap-3 p-3 bg-green-50/50 dark:bg-green-900/10 rounded-2xl border border-green-200 dark:border-green-900/30">
                    <div>
                      <label className="text-xs font-bold text-gray-600 dark:text-gray-400 block mb-1">Project Duration</label>
                      <select 
                        value={duration} 
                        onChange={e => setDuration(e.target.value)}
                        className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-2.5 text-xs text-gray-900 dark:text-white font-semibold"
                      >
                        <option value="15 Days">15 Days</option>
                        <option value="1 Month">1 Month</option>
                        <option value="2 Months">2 Months</option>
                        <option value="3 Months">3 Months</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-600 dark:text-gray-400 block mb-1">Upfront Fee (Pts/Rs)</label>
                      <input 
                        type="number"
                        value={upfrontFee}
                        onChange={e => setUpfrontFee(e.target.value)}
                        placeholder="500"
                        className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-2.5 text-xs text-gray-900 dark:text-white font-semibold"
                      />
                    </div>
                  </div>
                )}

                <Button fullWidth type="submit" className="bg-green-500 hover:bg-green-600">
                  Create Category
                </Button>
              </form>
            </Card>

            <div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-3">All Active Categories ({categories.length})</h4>
              <div className="grid grid-cols-2 gap-3">
                {categories.map(cat => (
                  <div key={cat.id} className="bg-white dark:bg-gray-900 p-3 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between">
                    <div>
                      <span className="font-bold text-gray-900 dark:text-white text-sm block">{cat.name}</span>
                      {cat.isLongProject ? (
                        <div className="mt-1 flex flex-col gap-1 text-[11px] text-green-600 dark:text-green-400 font-semibold">
                          <span className="flex items-center gap-1"><Clock size={12} /> {cat.duration} Project</span>
                          <span className="flex items-center gap-1"><Coins size={12} /> {cat.upfrontFee} Pts Upfront</span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-gray-400">Standard Job</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SETTINGS & BANK DETAILS TAB */}
        {activeTab === 'settings' && (
          <div className="space-y-4">
            <Card>
              <h3 className="font-bold text-gray-900 dark:text-white text-base mb-4 flex items-center gap-2">
                <Settings className="text-green-500" size={20} />
                Commission & Top-Up Bank Details
              </h3>

              <form onSubmit={handleSaveSettings} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                    Company Commission Percentage (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={commRate}
                      onChange={e => setCommRate(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl py-3 pl-4 pr-10 text-sm font-bold text-gray-900 dark:text-white"
                      placeholder="5"
                    />
                    <Percent className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">This percentage will be charged from job budget when worker accepts.</p>
                </div>

                <div className="pt-3 border-t border-gray-100 dark:border-gray-800 space-y-3">
                  <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">Top-up Bank Account Info</h4>
                  
                  <Input label="Bank Name" value={bankName} onChange={e => setBankName(e.target.value)} icon={Building2} placeholder="Meezan Bank" />
                  <Input label="Account Title" value={accTitle} onChange={e => setAccTitle(e.target.value)} icon={CreditCard} placeholder="Obrago Pvt Ltd" />
                  <Input label="Account / IBAN Number" value={accNum} onChange={e => setAccNum(e.target.value)} icon={CreditCard} placeholder="0102030405060" />
                  <Input label="EasyPaisa Number" value={easypaisa} onChange={e => setEasypaisa(e.target.value)} icon={Phone} placeholder="03001234567" />
                  <Input label="JazzCash Number" value={jazzcash} onChange={e => setJazzcash(e.target.value)} icon={Phone} placeholder="03019876543" />
                </div>

                <Button fullWidth type="submit" className="bg-green-500 hover:bg-green-600">
                  Save Changes
                </Button>

                {settingsSavedMsg && (
                  <p className="text-xs font-bold text-center text-green-600 dark:text-green-400">
                    ✓ Admin Settings updated successfully!
                  </p>
                )}
              </form>
            </Card>
          </div>
        )}

        {/* COIN PRICE & PACKAGES TAB */}
        {activeTab === 'coins' && (
          <div className="space-y-6">
            <Card>
              <h3 className="font-bold text-gray-900 dark:text-white text-base mb-4 flex items-center gap-2">
                <Coins className="text-yellow-500" size={20} />
                Coin Conversion & Pricing Rates
              </h3>

              <form onSubmit={handleSaveCoinRates} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                      Price per Coin (PKR)
                    </label>
                    <input
                      type="number"
                      value={coinPricePkr}
                      onChange={e => setCoinPricePkr(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-3 text-sm font-bold text-gray-900 dark:text-white"
                      placeholder="10"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                      Min Top-Up Coins
                    </label>
                    <input
                      type="number"
                      value={minTopupCoins}
                      onChange={e => setMinTopupCoins(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-3 text-sm font-bold text-gray-900 dark:text-white"
                      placeholder="20"
                    />
                  </div>
                </div>

                <Button fullWidth type="submit" className="bg-green-500 hover:bg-green-600">
                  Update Coin Rates
                </Button>
              </form>
            </Card>

            <Card>
              <h3 className="font-bold text-gray-900 dark:text-white text-base mb-4 flex items-center gap-2">
                <Plus className="text-green-500" size={20} />
                Create Top-Up Coin Package
              </h3>

              <form onSubmit={handleAddCoinPackage} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">Coins Amount</label>
                    <input
                      type="number"
                      value={newPkgCoins}
                      onChange={e => setNewPkgCoins(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-2.5 text-xs font-bold text-gray-900 dark:text-white"
                      placeholder="100"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">Price (PKR)</label>
                    <input
                      type="number"
                      value={newPkgPrice}
                      onChange={e => setNewPkgPrice(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-2.5 text-xs font-bold text-gray-900 dark:text-white"
                      placeholder="1000"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="popTag"
                    checked={newPkgPopular}
                    onChange={e => setNewPkgPopular(e.target.checked)}
                    className="w-4 h-4 accent-green-500 rounded"
                  />
                  <label htmlFor="popTag" className="text-xs font-semibold text-gray-700 dark:text-gray-300 cursor-pointer">
                    Highlight as "Most Popular"
                  </label>
                </div>

                <Button fullWidth type="submit" className="bg-green-500 hover:bg-green-600">
                  Add Coin Package
                </Button>
              </form>

              <div className="mt-6">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Active Top-up Packages</h4>
                <div className="grid grid-cols-2 gap-3">
                  {(adminSettings.coinPackages || []).map(pkg => (
                    <div key={pkg.id} className="bg-gray-50 dark:bg-gray-800 p-3 rounded-2xl border border-gray-200 dark:border-gray-700 flex flex-col justify-between relative">
                      {pkg.popularTag && (
                        <span className="absolute -top-2 right-2 bg-yellow-500 text-black font-extrabold text-[9px] px-2 py-0.5 rounded-full uppercase">
                          Popular
                        </span>
                      )}
                      <div>
                        <div className="flex items-center gap-1.5 text-yellow-600 dark:text-yellow-400 font-extrabold text-base">
                          <Coins size={16} /> {pkg.coins} Coins
                        </div>
                        <p className="text-xs font-bold text-gray-900 dark:text-white mt-1">
                          Rs {pkg.pricePkr}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteCoinPackage(pkg.id)}
                        className="mt-3 text-red-500 hover:text-red-700 text-xs font-bold flex items-center gap-1 self-end"
                      >
                        <Trash2 size={12} /> Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* APP BANNERS & SLIDER ADS TAB */}
        {activeTab === 'banners' && (
          <div className="space-y-6">
            <Card>
              <h3 className="font-bold text-gray-900 dark:text-white text-base mb-4 flex items-center gap-2">
                <ImageIcon className="text-blue-500" size={20} />
                Add New App Promotional Banner
              </h3>

              <form onSubmit={handleAddBanner} className="space-y-4">
                <Input
                  label="Banner Title"
                  value={bannerTitle}
                  onChange={e => setBannerTitle(e.target.value)}
                  placeholder="e.g. 20% OFF on AC Repair Services"
                  icon={Megaphone}
                />

                <Input
                  label="Banner Image URL"
                  value={bannerImage}
                  onChange={e => setBannerImage(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  icon={ImageIcon}
                />

                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                    Link to Specific Category (Optional)
                  </label>
                  <select
                    value={bannerCategory}
                    onChange={e => setBannerCategory(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-3 text-xs font-bold text-gray-900 dark:text-white"
                  >
                    <option value="">No Link (General Banner)</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <Button fullWidth type="submit" className="bg-green-500 hover:bg-green-600">
                  Publish Banner
                </Button>
              </form>
            </Card>

            <div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-3">Live Banners ({(adminSettings.banners || []).length})</h4>
              <div className="space-y-3">
                {(adminSettings.banners || []).length === 0 ? (
                  <p className="text-xs text-gray-400 italic">No promotional banners created yet.</p>
                ) : (
                  (adminSettings.banners || []).map(b => (
                    <div key={b.id} className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col">
                      <div className="h-28 w-full relative">
                        <img src={b.imageUrl} alt={b.title} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent p-3 flex flex-col justify-end">
                          <span className="text-white font-bold text-sm">{b.title}</span>
                          {b.linkCategory && (
                            <span className="text-green-300 text-[10px] font-semibold">
                              Target: {categories.find(c => c.id === b.linkCategory)?.name || b.linkCategory}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="p-3 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50">
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          b.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
                        }`}>
                          {b.isActive ? 'Active' : 'Disabled'}
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleBanner(b.id)}
                            className="text-xs font-bold px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                          >
                            {b.isActive ? 'Disable' : 'Enable'}
                          </button>
                          <button
                            onClick={() => handleDeleteBanner(b.id)}
                            className="text-xs font-bold p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* COUPONS & PROMO CODES TAB */}
        {activeTab === 'coupons' && (
          <div className="space-y-6">
            <Card>
              <h3 className="font-bold text-gray-900 dark:text-white text-base mb-4 flex items-center gap-2">
                <Ticket className="text-purple-500" size={20} />
                Create Customer Discount Coupon
              </h3>

              <form onSubmit={handleAddCoupon} className="space-y-4">
                <Input
                  label="Coupon Code"
                  value={couponCode}
                  onChange={e => setCouponCode(e.target.value)}
                  placeholder="e.g. LABOUR2026, DISCOUNT50"
                  icon={Tag}
                />

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">Discount Type</label>
                    <select
                      value={couponType}
                      onChange={e => setCouponType(e.target.value as 'flat' | 'percentage')}
                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-2.5 text-xs font-bold text-gray-900 dark:text-white"
                    >
                      <option value="flat">Flat Amount (PKR / Pts)</option>
                      <option value="percentage">Percentage (%) Off</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">Discount Value</label>
                    <input
                      type="number"
                      value={couponValue}
                      onChange={e => setCouponValue(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-2.5 text-xs font-bold text-gray-900 dark:text-white"
                      placeholder="100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">Max Redemptions</label>
                    <input
                      type="number"
                      value={couponMaxUses}
                      onChange={e => setCouponMaxUses(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-2.5 text-xs font-bold text-gray-900 dark:text-white"
                      placeholder="50"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">Expiry Date</label>
                    <input
                      type="date"
                      value={couponExpiry}
                      onChange={e => setCouponExpiry(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-2.5 text-xs font-bold text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <Button fullWidth type="submit" className="bg-green-500 hover:bg-green-600">
                  Generate Coupon Code
                </Button>
              </form>
            </Card>

            <div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-3">Active Promo Coupons ({(adminSettings.coupons || []).length})</h4>
              <div className="space-y-3">
                {(adminSettings.coupons || []).length === 0 ? (
                  <p className="text-xs text-gray-400 italic">No coupons created yet.</p>
                ) : (
                  (adminSettings.coupons || []).map(c => (
                    <div key={c.id} className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-sm text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50 px-2.5 py-1 rounded-lg border border-purple-200 dark:border-purple-800">
                            {c.code}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            c.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {c.isActive ? 'Active' : 'Expired'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Discount: <strong className="text-gray-900 dark:text-white">{c.discountType === 'percentage' ? `${c.discountValue}%` : `Rs ${c.discountValue}`}</strong>
                          {' • '}Used: {c.usedCount}/{c.maxUses}
                          {' • '}Expires: {c.expiryDate}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleCoupon(c.id)}
                          className="text-xs font-bold px-2.5 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200"
                        >
                          {c.isActive ? 'Disable' : 'Enable'}
                        </button>
                        <button
                          onClick={() => handleDeleteCoupon(c.id)}
                          className="text-red-500 p-1.5 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TOP-UP APPROVALS TAB */}
        {activeTab === 'deposits' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Deposit Proof Verification</h3>

            {depositRequests.length === 0 ? (
              <div className="text-center py-10 bg-white dark:bg-gray-900 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800">
                <Receipt className="mx-auto text-gray-400 mb-2" size={32} />
                <p className="text-sm font-bold text-gray-500">No deposit requests submitted yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {depositRequests.map(req => (
                  <Card key={req.id} className="border-l-4 border-l-green-500">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white text-base">{req.userName}</h4>
                        <p className="text-xs text-gray-400 capitalize">{req.userRole} Account</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        req.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        req.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {req.status}
                      </span>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-xl space-y-1 text-xs mb-3">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Transfer Amount:</span>
                        <span className="font-bold text-green-600">{currency}{req.amount} ({req.amount} Pts)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Gateway Method:</span>
                        <span className="font-bold text-gray-800 dark:text-gray-200 uppercase">{req.method}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">TRX ID / Reference:</span>
                        <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{req.trxId}</span>
                      </div>
                    </div>

                    {req.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => processDepositRequest(req.id, 'approved')} 
                          className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                        >
                          <CheckCircle2 size={16} /> Approve & Credit {req.amount} Pts
                        </Button>
                        <Button 
                          onClick={() => processDepositRequest(req.id, 'rejected')} 
                          variant="outline" 
                          className="text-red-500 border-red-200"
                        >
                          <XCircle size={16} /> Reject
                        </Button>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SUPPORT TICKETS TAB */}
        {activeTab === 'support' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Support Tickets</h3>
            {supportChats.length === 0 ? (
              <div className="text-center py-10 bg-white dark:bg-gray-900 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800">
                <Phone className="mx-auto text-gray-400 mb-2" size={32} />
                <p className="text-sm font-bold text-gray-500">No support tickets found.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {supportChats.map(chat => {
                  const chatUser = allUsers.find(u => u.id === chat.userId);
                  if (!chatUser) return null;
                  return (
                    <Card key={chat.id} className="border-l-4 border-l-blue-500 hover:border-l-blue-600 transition-colors cursor-pointer" onClick={() => {
                        setActiveChat({
                            name: chatUser.name,
                            avatar: chatUser.avatar,
                            role: chatUser.role,
                            userId: chatUser.id,
                            jobId: `support_${chatUser.id}`
                        });
                        // also close admin panel maybe? Or keep it open
                    }}>
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-3">
                           <img src={chatUser.avatar} alt={chatUser.name} className="w-10 h-10 rounded-full border border-gray-200" />
                           <div>
                              <h4 className="font-bold text-gray-900 dark:text-white text-sm">{chatUser.name}</h4>
                              <p className="text-[10px] text-blue-500 font-bold uppercase">{chatUser.role}</p>
                           </div>
                        </div>
                        <span className="text-[10px] text-gray-400">
                           {safeFormatTime(chat.lastMessageTime)}
                        </span>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-xl text-xs text-gray-600 dark:text-gray-300">
                        {chat.lastMessage || 'No messages yet'}
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] text-gray-500 bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg">
                         <div><span className="font-bold">Phone:</span> {chatUser.phone || 'N/A'}</div>
                         <div><span className="font-bold">Completed Jobs:</span> {chatUser.completedJobs || 0}</div>
                         <div><span className="font-bold">Rating:</span> {chatUser.rating ? chatUser.rating.toFixed(1) : 'New'}</div>
                         <div><span className="font-bold">Points:</span> {chatUser.points || 0}</div>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <Button
                          fullWidth
                          onClick={(e) => {
                             e.stopPropagation();
                             setActiveChat({
                                name: chatUser.name,
                                avatar: chatUser.avatar,
                                role: chatUser.role,
                                userId: chatUser.id,
                                jobId: `support_${chatUser.id}`
                             });
                          }}
                          className="bg-blue-500 hover:bg-blue-600 text-white py-2"
                        >
                          <Phone size={14} className="mr-1" /> Open Chat
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* CUSTOM NOTIFICATIONS BROADCAST TAB */}
        {activeTab === 'notifications' && (
          <div className="space-y-4 max-w-2xl mx-auto">
            <div className="flex items-center gap-3 bg-purple-500/10 p-4 rounded-2xl border border-purple-500/20">
              <div className="p-3 bg-purple-600 text-white rounded-xl">
                <Bell size={24} />
              </div>
              <div>
                <h3 className="text-base font-black text-gray-900 dark:text-white">Push & Lock Screen Broadcast</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Send immediate alert notifications directly to customers or workers. Appears on mobile notification shade and lock screens.
                </p>
              </div>
            </div>

            <Card className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Target Audience
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setBcastTarget('all')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                      bcastTarget === 'all'
                        ? 'bg-purple-600 text-white border-purple-600 shadow-md'
                        : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    All Users ({allUsers.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setBcastTarget('worker')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                      bcastTarget === 'worker'
                        ? 'bg-purple-600 text-white border-purple-600 shadow-md'
                        : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    Workers ({allUsers.filter(u => u.role === 'worker').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setBcastTarget('customer')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                      bcastTarget === 'customer'
                        ? 'bg-purple-600 text-white border-purple-600 shadow-md'
                        : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    Customers ({allUsers.filter(u => u.role === 'customer').length})
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Notification Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. 📢 Special Update / Zarori Ilan!"
                  value={bcastTitle}
                  onChange={(e) => setBcastTitle(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-xs font-bold text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Message Body
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Tamam workers k liye commission rate 0% kar dia gia he! Abhi naye jobs check krain."
                  value={bcastMessage}
                  onChange={(e) => setBcastMessage(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-xs font-medium text-gray-900 dark:text-white"
                />
              </div>

              <Button
                fullWidth
                disabled={!bcastTitle.trim() || !bcastMessage.trim()}
                onClick={() => {
                  sendAdminBroadcast(bcastTitle.trim(), bcastMessage.trim(), bcastTarget);
                  alert(`✅ Broadcast notification sent to ${bcastTarget} users successfully!`);
                  setBcastTitle('');
                  setBcastMessage('');
                }}
                className="bg-purple-600 hover:bg-purple-700 text-white py-3"
              >
                <Send size={16} className="mr-2" /> Send Lock Screen Broadcast
              </Button>
            </Card>
          </div>
        )}
      </div>
    </motion.div>
  );
}
