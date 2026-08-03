import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from './store';
import { Job, Bid } from './types';
import { TopBar, Button, Card } from './components';
import { DepositProofModal, RatingReviewModal } from './InDriveFeatures';
import { LegalModal } from './LegalModal';
import { ReceiptModal } from './ReceiptModal';
import { 
  History, Settings, ShieldAlert, FileText, Lock, 
  PhoneCall, LogOut, ChevronRight, User as UserIcon, Coins, CreditCard, Building2, Phone, Receipt, Trash2, AlertTriangle, Scale, CheckCircle2, Clock, Star
} from 'lucide-react';

export function ProfileFlow() {
  const { showProfile, setShowProfile, currentUser, setIsLoggedIn, addPoints, currency, adminSettings, deleteAccount, jobs, bids, setActiveChat } = useAppStore();
  const [activeTab, setActiveTab] = useState<'menu' | 'history' | 'settings' | 'help' | 'safety' | 'topup'>('menu');
  const [customAmount, setCustomAmount] = useState('');
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositModalAmount, setDepositModalAmount] = useState<number>(500);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<{ job: Job; bid: Bid } | null>(null);
  const [reviewJob, setReviewJob] = useState<{ job: Job; bid: Bid } | null>(null);

  if (!showProfile) return null;

  const handleClose = () => {
    setShowProfile(false);
    setActiveTab('menu');
    setCustomAmount('');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    handleClose();
  };

  const handleDeleteAccount = () => {
    deleteAccount(currentUser.id);
    alert('Your account and profile data have been permanently deleted from the database.');
    setShowDeleteConfirm(false);
  };

  const handleTopUpRequest = (amount: number) => {
    setDepositModalAmount(amount);
    setShowDepositModal(true);
  };

  const handleCustomTopUpRequest = () => {
    const amount = parseInt(customAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    handleTopUpRequest(amount);
    setCustomAmount('');
  };


  return (
    <motion.div 
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="absolute inset-0 z-[60] bg-gray-50 dark:bg-gray-950 flex flex-col"
    >
      <TopBar 
        title={
          activeTab === 'menu' ? 'Profile' : 
          activeTab === 'history' ? 'Order History' : 
          activeTab === 'settings' ? 'Settings' : 
          activeTab === 'help' ? 'Help Center' : 
          activeTab === 'topup' ? 'Top Up Points' : 'Safety Features'
        } 
        onBack={activeTab === 'menu' ? handleClose : () => setActiveTab('menu')} 
      />

      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'menu' && (
            <motion.div key="menu" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-5 flex flex-col gap-6">
              
              <div className="flex items-center gap-4 bg-white dark:bg-gray-900 p-4 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
                <img src={currentUser.avatar} alt="Profile" className="w-16 h-16 rounded-full border-2 border-green-500" />
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">{currentUser.name}</h2>
                  <p className="text-sm text-gray-500 capitalize">{currentUser.role} Account</p>
                </div>
                <div className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-500 px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm border border-yellow-200 dark:border-yellow-900/50">
                  <Coins size={16} className="fill-yellow-500" />
                  <span className="font-bold">{currentUser.points || 0}</span>
                </div>
              </div>

              <div className="space-y-3">
                <MenuButton icon={Coins} label="Wallet & Top Up" onClick={() => setActiveTab('topup')} iconClassName="text-yellow-500" />
                <MenuButton icon={History} label="Order History" onClick={() => setActiveTab('history')} />
                <MenuButton icon={Settings} label="Settings" onClick={() => setActiveTab('settings')} />
                <MenuButton icon={Scale} label="Terms & Privacy Policy" onClick={() => setShowLegalModal(true)} iconClassName="text-blue-500" />
                <MenuButton icon={PhoneCall} label="Help Center" onClick={() => setActiveTab('help')} />
                <MenuButton icon={ShieldAlert} label="Safety Features" onClick={() => setActiveTab('safety')} className="text-red-500" iconClassName="text-red-500" />
              </div>

              <div className="mt-auto pt-6 space-y-2">
                <Button fullWidth variant="ghost" onClick={handleLogout} className="text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
                  <LogOut size={20} />
                  Logout
                </Button>
                <Button fullWidth variant="ghost" onClick={() => setShowDeleteConfirm(true)} className="text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20">
                  <Trash2 size={20} />
                  Delete My Profile & Data
                </Button>
              </div>
            </motion.div>
          )}

          {activeTab === 'topup' && (
             <motion.div key="topup" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="p-5 flex flex-col gap-6">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-100 dark:bg-yellow-900/30 rounded-full mb-4 shadow-sm border-2 border-yellow-200 dark:border-yellow-900/50">
                    <Coins size={40} className="text-yellow-500 fill-yellow-500" />
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{currentUser.points || 0}</h3>
                  <p className="text-gray-500 font-medium">Available Points</p>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/30 rounded-2xl p-4">
                  <p className="text-sm text-blue-700 dark:text-blue-400 font-medium">
                    {currentUser.role === 'worker' ? (
                      <>
                        You need points to accept jobs. <br/>
                        <strong>Cost:</strong> 5% of the job budget. <br/>
                        (e.g., A {currency}1000 job requires 50 points).
                      </>
                    ) : (
                      <>
                        You can use points to pay for jobs or clear penalty fees. <br/>
                        Add points to your wallet to easily manage your account.
                      </>
                    )}
                  </p>
                </div>

                <div className="space-y-4">
                  <h4 className="font-bold text-gray-900 dark:text-white">Select Top Up Amount</h4>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {[50, 100, 200, 500].map(amount => (
                      <button 
                        key={amount}
                        onClick={() => handleTopUpRequest(amount)}
                        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 flex flex-col items-center gap-2 hover:border-yellow-500 dark:hover:border-yellow-500 transition-colors shadow-sm active:scale-95"
                      >
                        <Coins className="text-yellow-500" />
                        <span className="font-bold text-lg text-gray-900 dark:text-white">{amount} Pts</span>
                        <span className="text-sm text-gray-500 font-medium">{currency}{amount}</span>
                      </button>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                    <h4 className="font-bold text-gray-900 dark:text-white mb-3">Or Enter Custom Amount</h4>
                    <div className="flex gap-2 mb-6">
                      <div className="relative flex-1">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                          <Coins size={20} />
                        </div>
                        <input
                          type="number"
                          value={customAmount}
                          onChange={(e) => setCustomAmount(e.target.value)}
                          placeholder="e.g. 500"
                          className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl py-3.5 pl-11 pr-4 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 transition-all"
                        />
                      </div>
                      <Button onClick={handleCustomTopUpRequest} disabled={!customAmount} className="bg-yellow-500 hover:bg-yellow-600 text-white border-none shrink-0 px-6">
                        Deposit
                      </Button>
                    </div>

                    {/* Official Company Bank Account info managed by Admin */}
                    <Card className="bg-slate-900 text-white border-none">
                      <h4 className="font-bold text-yellow-400 text-sm mb-3 flex items-center gap-2">
                        <Building2 size={18} /> Official Company Deposit Accounts
                      </h4>
                      <p className="text-xs text-gray-300 mb-3">
                        Transfer payment to any official account below for instant wallet top up:
                      </p>
                      
                      <div className="space-y-2 text-xs">
                        <div className="bg-slate-800 p-2.5 rounded-xl border border-slate-700">
                          <span className="text-gray-400 block text-[10px]">Bank Transfer</span>
                          <span className="font-bold text-white block">{adminSettings.bankName}</span>
                          <span className="text-yellow-400 font-mono font-bold block">{adminSettings.accountNumber}</span>
                          <span className="text-gray-300 text-[10px]">Title: {adminSettings.accountTitle}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-slate-800 p-2.5 rounded-xl border border-slate-700">
                            <span className="text-gray-400 block text-[10px]">EasyPaisa</span>
                            <span className="font-mono font-bold text-green-400">{adminSettings.easypaisaNumber}</span>
                          </div>
                          <div className="bg-slate-800 p-2.5 rounded-xl border border-slate-700">
                            <span className="text-gray-400 block text-[10px]">JazzCash</span>
                            <span className="font-mono font-bold text-red-400">{adminSettings.jazzcashNumber}</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setShowDepositModal(true)}
                          className="w-full mt-3 bg-green-500 hover:bg-green-600 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs active:scale-95 transition-transform"
                        >
                          <Receipt size={16} /> Submit Payment Receipt / TRX ID
                        </button>
                      </div>
                    </Card>
                  </div>
                </div>

                {showDepositModal && (
                  <DepositProofModal initialAmount={depositModalAmount} onClose={() => setShowDepositModal(false)} />
                )}
             </motion.div>
          )}

          {activeTab === 'history' && (
             <motion.div key="history" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="p-5 flex flex-col gap-4">
                {(() => {
                  const userJobs = jobs.filter(j => j.customerId === currentUser.id || j.workerId === currentUser.id);
                  if (userJobs.length === 0) {
                    return (
                      <div className="text-center py-10 bg-white dark:bg-gray-900 rounded-3xl border border-dashed border-gray-300 dark:border-gray-700">
                        <History className="text-gray-400 mx-auto mb-3" size={32} />
                        <p className="text-gray-500 font-medium">No order history yet.</p>
                      </div>
                    );
                  }
                  return userJobs.map(job => {
                    const acceptedBid = bids.find(b => b.id === job.acceptedBidId);
                    return (
                      <Card key={job.id} className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2.5 py-0.5 rounded-full">
                              {job.category}
                            </span>
                            <h4 className="font-bold text-gray-900 dark:text-white mt-1.5">{job.description}</h4>
                            <p className="text-xs text-gray-500 mt-0.5">{job.location}</p>
                          </div>
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                            job.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400' :
                            job.status === 'in_progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400' :
                            'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                          }`}>
                            {job.status.toUpperCase()}
                          </span>
                        </div>

                        {acceptedBid && (
                          <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
                            <div>
                              <p className="text-xs text-gray-400">Worker: <strong className="text-gray-800 dark:text-gray-200">{acceptedBid.workerName}</strong></p>
                              <p className="text-sm font-bold text-green-500">{currency}{acceptedBid.price.toFixed(0)}</p>
                            </div>
                            <div className="flex gap-2">
                              {job.status === 'completed' && (
                                <Button 
                                  variant="outline" 
                                  className="text-xs py-1.5 px-3 flex items-center gap-1.5 border-amber-200 text-amber-600 dark:border-amber-800/30 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 font-bold"
                                  onClick={() => setReviewJob({ job, bid: acceptedBid })}
                                >
                                  <Star size={14} /> Review
                                </Button>
                              )}
                              <Button 
                                variant="outline" 
                                className="text-xs py-1.5 px-3 flex items-center gap-1.5 border-green-200 text-green-600 dark:border-green-800 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 font-bold"
                                onClick={() => setSelectedReceipt({ job, bid: acceptedBid })}
                              >
                                <FileText size={14} /> Receipt
                              </Button>
                            </div>
                          </div>
                        )}
                      </Card>
                    );
                  });
                })()}
             </motion.div>
          )}

          {activeTab === 'settings' && (
             <motion.div key="settings" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="p-5 flex flex-col gap-4">
                <Card>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Push Notifications</span>
                      <div className="w-12 h-6 bg-green-500 rounded-full relative">
                        <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Location Services</span>
                      <div className="w-12 h-6 bg-green-500 rounded-full relative">
                        <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Dark Mode</span>
                      <button onClick={() => document.documentElement.classList.toggle('dark')} className="text-green-500 font-semibold text-sm">Toggle</button>
                    </div>
                  </div>
                </Card>

                <Card className="border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-900/10">
                  <h4 className="font-bold text-red-600 dark:text-red-400 mb-1 flex items-center gap-1.5 text-sm">
                    <AlertTriangle size={16} /> Danger Zone
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                    Permanently delete your profile, jobs, bids, and wallet points from our database.
                  </p>
                  <Button fullWidth variant="danger" onClick={() => setShowDeleteConfirm(true)}>
                    <Trash2 size={16} /> Delete My Account
                  </Button>
                </Card>
             </motion.div>
          )}

          {activeTab === 'safety' && (
             <motion.div key="safety" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="p-5 flex flex-col gap-4">
                <Card className="bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30">
                  <h3 className="font-bold text-red-600 dark:text-red-500 flex items-center gap-2 mb-2">
                    <ShieldAlert size={20} />
                    Emergency Protocol
                  </h3>
                  <p className="text-sm text-red-600/80 dark:text-red-400 mb-4">If you feel unsafe or are in immediate danger, use the button below to contact local authorities.</p>
                  <Button fullWidth variant="danger">
                    Call Police (15)
                  </Button>
                </Card>
                
                <Card>
                  <div className="space-y-4">
                    <button className="flex items-center justify-between w-full py-2 text-left">
                      <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                        <PhoneCall size={20} className="text-blue-500" />
                        <span className="font-medium">Call Support Center</span>
                      </div>
                      <ChevronRight size={16} className="text-gray-400" />
                    </button>
                    <div className="h-px bg-gray-100 dark:bg-gray-800"></div>
                    <button className="flex items-center justify-between w-full py-2 text-left">
                      <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                        <FileText size={20} className="text-gray-500" />
                        <span className="font-medium">Terms & Services</span>
                      </div>
                      <ChevronRight size={16} className="text-gray-400" />
                    </button>
                    <div className="h-px bg-gray-100 dark:bg-gray-800"></div>
                    <button className="flex items-center justify-between w-full py-2 text-left">
                      <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                        <Lock size={20} className="text-gray-500" />
                        <span className="font-medium">Privacy Policy</span>
                      </div>
                      <ChevronRight size={16} className="text-gray-400" />
                    </button>
                  </div>
                </Card>
             </motion.div>
          )}

          {activeTab === 'help' && (
             <motion.div key="help" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="p-5 flex flex-col gap-4">
                <Card>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-2">How can we help you?</h3>
                  <p className="text-xs text-gray-500 mb-4">Our support team is available 24/7 to assist customers and service workers.</p>
                  
                  <div className="space-y-3">
                    <Button fullWidth className="bg-green-500 hover:bg-green-600 text-white font-bold flex items-center justify-center gap-2 py-3.5" onClick={() => {
                      if (setActiveChat) {
                        setActiveChat({
                          name: 'Obrago Official Support',
                          avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=support',
                          role: 'admin',
                          userId: 'admin_support',
                          jobId: `support_${currentUser?.id || 'guest'}`
                        });
                      }
                    }}>
                      <PhoneCall size={18} />
                      Contact Support via Chat
                    </Button>
                  </div>
                </Card>

                <Card>
                  <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-3">Frequently Asked Questions</h4>
                  <div className="space-y-3 text-xs text-gray-600 dark:text-gray-300 divide-y divide-gray-100 dark:divide-gray-800">
                    <div className="pt-2">
                      <p className="font-semibold text-gray-900 dark:text-white mb-1">How do I top up my wallet points?</p>
                      <p className="text-gray-500">Go to Wallet & Top Up in your profile, select an amount, and submit deposit proof. Admin will verify and credit your wallet.</p>
                    </div>
                    <div className="pt-2">
                      <p className="font-semibold text-gray-900 dark:text-white mb-1">Is my profile data private?</p>
                      <p className="text-gray-500">Yes! Your complete profile, contact details, and transaction logs are securely visible only to verified Admins when you contact support.</p>
                    </div>
                    <div className="pt-2">
                      <p className="font-semibold text-gray-900 dark:text-white mb-1">How do bids work?</p>
                      <p className="text-gray-500">Workers use points to place competitive bids on posted jobs. Customers choose the best worker and accept the offer.</p>
                    </div>
                  </div>
                </Card>
             </motion.div>
          )}
        </AnimatePresence>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[110] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-900 rounded-3xl p-6 max-w-sm w-full border border-red-200 dark:border-red-900/50 shadow-2xl text-center space-y-4"
          >
            <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mx-auto">
              <Trash2 size={28} />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-gray-900 dark:text-white">Delete Account & Data?</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Are you sure you want to delete your profile? All your information, posted jobs, active bids, and wallet points will be permanently removed from our database.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <Button fullWidth variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
              <Button fullWidth className="bg-red-600 hover:bg-red-700 text-white font-bold" onClick={handleDeleteAccount}>
                Yes, Delete
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {showLegalModal && (
        <LegalModal onClose={() => setShowLegalModal(false)} />
      )}

      {selectedReceipt && (
        <ReceiptModal 
          job={selectedReceipt.job} 
          bid={selectedReceipt.bid} 
          onClose={() => setSelectedReceipt(null)} 
        />
      )}

      {reviewJob && (
        <RatingReviewModal 
          jobId={reviewJob.job.id} 
          toUserId={currentUser.id === reviewJob.job.customerId ? reviewJob.job.workerId! : reviewJob.job.customerId} 
          toUserName={currentUser.id === reviewJob.job.customerId ? reviewJob.bid.workerName : "Customer"} 
          onClose={() => setReviewJob(null)} 
        />
      )}
    </motion.div>
  );
}

function MenuButton({ icon: Icon, label, onClick, className = '', iconClassName = 'text-green-500' }: any) {
  return (
    <button onClick={onClick} className={`flex items-center justify-between w-full bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm active:scale-[0.98] transition-transform ${className}`}>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center ${iconClassName}`}>
          <Icon size={20} />
        </div>
        <span className="font-semibold text-gray-900 dark:text-white">{label}</span>
      </div>
      <ChevronRight size={20} className="text-gray-400" />
    </button>
  );
}
