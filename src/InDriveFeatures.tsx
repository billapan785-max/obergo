import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useAppStore } from './store';
import { Button, Card, Input } from './components';
import { 
  ShieldAlert, Phone, Share2, Star, CheckCircle2, 
  DollarSign, X, AlertTriangle, Building2, CreditCard, Send, ThumbsUp
} from 'lucide-react';

// 1. INDRIVE COUNTER OFFER MODAL
export function CounterOfferModal({ 
  bidId, 
  originalPrice, 
  onClose 
}: { 
  bidId: string; 
  originalPrice: number; 
  onClose: () => void;
}) {
  const { submitCounterOffer, currency } = useAppStore();
  const [counterPrice, setCounterPrice] = useState(originalPrice.toString());
  const [note, setNote] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(counterPrice);
    if (isNaN(price) || price <= 0) {
      alert('Please enter a valid price');
      return;
    }
    submitCounterOffer(bidId, price, note || `Counter offer: ${currency}${price}`);
    alert(`Counter offer of ${currency}${price} sent to the worker!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        className="bg-white dark:bg-gray-900 w-full max-w-md rounded-3xl p-6 shadow-2xl border border-gray-100 dark:border-gray-800"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
            <DollarSign className="text-green-500" size={20} />
            InDrive Price Negotiation
          </h3>
          <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
            <X size={20} />
          </button>
        </div>

        <p className="text-xs text-gray-500 mb-4">
          Worker's current bid is <strong className="text-gray-900 dark:text-white">{currency}{originalPrice}</strong>. Propose your target budget below:
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
              Your Counter Price ({currency})
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">{currency}</span>
              <input
                type="number"
                value={counterPrice}
                onChange={e => setCounterPrice(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl py-3 pl-10 pr-4 font-bold text-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
              Note for Worker (Optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="e.g. Work is urgent, can start right now?"
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl py-3 px-4 text-xs text-gray-900 dark:text-white"
            />
          </div>

          <Button fullWidth type="submit" className="bg-green-500 hover:bg-green-600 text-white font-bold py-3">
            Send Counter Proposal
          </Button>
        </form>
      </motion.div>
    </div>
  );
}

// 2. INDRIVE SAFETY & SOS EMERGENCY MODAL
export function SafetySOSModal({ onClose }: { onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  const handleShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-red-200 dark:border-red-900/50"
      >
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2 text-red-500">
            <ShieldAlert size={24} className="animate-pulse" />
            <h3 className="font-extrabold text-lg">InDrive Safety & SOS</h3>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
            <X size={20} />
          </button>
        </div>

        <p className="text-xs text-gray-600 dark:text-gray-300 mb-5">
          Your safety is our top priority. Choose an immediate emergency response option below:
        </p>

        <div className="space-y-3 mb-4">
          <a
            href="tel:15"
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-red-500/20 text-sm"
          >
            <Phone size={18} /> Call Police / Rescue (15)
          </a>

          <button
            onClick={handleShareLink}
            className="w-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold py-3 px-4 rounded-2xl flex items-center justify-center gap-2 border border-blue-200 dark:border-blue-800 text-sm"
          >
            <Share2 size={18} /> {copied ? '✓ Live GPS Link Copied!' : 'Share Live Job & GPS to WhatsApp'}
          </button>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-2xl text-[11px] text-gray-500 dark:text-gray-400 space-y-1">
          <p className="font-bold text-gray-700 dark:text-gray-200 flex items-center gap-1">
            <AlertTriangle size={12} className="text-yellow-500" /> Obrago Emergency Hotline:
          </p>
          <p>Support dispatchers are monitoring live coordinates 24/7.</p>
        </div>
      </motion.div>
    </div>
  );
}

// 3. INDRIVE RATING & REVIEWS MODAL
export function RatingReviewModal({ 
  jobId, 
  toUserId, 
  toUserName, 
  onClose 
}: { 
  jobId: string; 
  toUserId: string; 
  toUserName: string; 
  onClose: () => void;
}) {
  const { submitRating } = useAppStore();
  const [stars, setStars] = useState(5);
  const [selectedTags, setSelectedTags] = useState<string[]>(['Punctual ⏰', 'Clean Work 🧹']);
  const [comment, setComment] = useState('');

  const tags = ['Punctual ⏰', 'Polite 🤝', 'Clean Work 🧹', 'Highly Skilled 🛠️', 'Fair Price 💰', 'Fast Service ⚡'];

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = () => {
    submitRating(jobId, toUserId, stars, selectedTags, comment);
    alert(`Thank you! Rating submitted for ${toUserName}.`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-gray-100 dark:border-gray-800"
      >
        <div className="text-center mb-5">
          <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 text-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
            <ThumbsUp size={28} />
          </div>
          <h3 className="font-bold text-lg text-gray-900 dark:text-white">Rate Your Experience</h3>
          <p className="text-xs text-gray-500 mt-1">How was your service with <strong>{toUserName}</strong>?</p>
        </div>

        {/* STAR SELECTOR */}
        <div className="flex justify-center gap-2 mb-6">
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              onClick={() => setStars(star)}
              className="p-1 transition-transform active:scale-125"
            >
              <Star 
                size={32} 
                className={star <= stars ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-gray-700'} 
              />
            </button>
          ))}
        </div>

        {/* FEEDBACK TAGS */}
        <div className="mb-4">
          <label className="text-xs font-bold text-gray-600 dark:text-gray-400 block mb-2">Select Compliments</label>
          <div className="flex flex-wrap gap-1.5">
            {tags.map(tag => {
              const active = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`text-xs px-3 py-1.5 rounded-xl font-medium transition-colors ${
                    active 
                      ? 'bg-green-500 text-white font-bold' 
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        {/* COMMENT */}
        <div className="mb-5">
          <input
            type="text"
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Write a brief comment (optional)..."
            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl py-3 px-4 text-xs text-gray-900 dark:text-white"
          />
        </div>

        <Button fullWidth onClick={handleSubmit} className="bg-green-500 hover:bg-green-600 text-white font-bold">
          Submit Review
        </Button>
      </motion.div>
    </div>
  );
}

// 4. DEPOSIT PROOF SUBMISSION FORM
export function DepositProofModal({ onClose, initialAmount }: { onClose: () => void; initialAmount?: number }) {
  const { submitDepositProof, currency, adminSettings } = useAppStore();
  const [method, setMethod] = useState<'bank' | 'easypaisa' | 'jazzcash'>('easypaisa');
  const [amount, setAmount] = useState(initialAmount ? initialAmount.toString() : '500');
  const [trxId, setTrxId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trxId.trim()) {
      alert('Please enter your Transaction ID (TRX ID / Reference No)');
      return;
    }
    const amt = parseInt(amount);
    if (isNaN(amt) || amt <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    submitDepositProof(amt, method, trxId.trim());
    alert('Deposit proof submitted successfully! Admin will verify and credit your wallet shortly.');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white dark:bg-gray-900 w-full max-w-md rounded-3xl p-6 shadow-2xl border border-gray-100 dark:border-gray-800"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
            <CreditCard className="text-green-500" size={20} />
            Submit Payment Receipt / TRX ID
          </h3>
          <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">Select Payment Gateway</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setMethod('easypaisa')}
                className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1 ${
                  method === 'easypaisa' ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'border-gray-200 dark:border-gray-800 text-gray-600'
                }`}
              >
                EasyPaisa
              </button>
              <button
                type="button"
                onClick={() => setMethod('jazzcash')}
                className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1 ${
                  method === 'jazzcash' ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400' : 'border-gray-200 dark:border-gray-800 text-gray-600'
                }`}
              >
                JazzCash
              </button>
              <button
                type="button"
                onClick={() => setMethod('bank')}
                className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1 ${
                  method === 'bank' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' : 'border-gray-200 dark:border-gray-800 text-gray-600'
                }`}
              >
                Bank
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
              Transfer Amount ({currency})
            </label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl py-3 px-4 font-bold text-sm text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
              Transaction ID / TRX ID / Reference No
            </label>
            <input
              type="text"
              value={trxId}
              onChange={e => setTrxId(e.target.value)}
              placeholder="e.g. 10293847561"
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl py-3 px-4 font-mono font-bold text-sm text-gray-900 dark:text-white"
            />
          </div>

          <Button fullWidth type="submit" className="bg-green-500 hover:bg-green-600 text-white font-bold py-3">
            Submit for Admin Verification
          </Button>
        </form>
      </motion.div>
    </div>
  );
}

// 7. CANCEL JOB MODAL
export function CancelJobModal({
  onClose,
  onConfirm
}: {
  onClose: () => void;
  onConfirm: (reason?: string) => void;
}) {
  const [reason, setReason] = useState('');

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        className="bg-white dark:bg-gray-900 w-full max-w-md rounded-3xl p-6 shadow-2xl border border-gray-100 dark:border-gray-800"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
            <AlertTriangle className="text-red-500" size={20} />
            Cancel Request
          </h3>
          <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
            <X size={20} />
          </button>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          Are you sure you want to cancel this request?
        </p>

        <div className="mb-6">
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">Reason for cancellation (Optional)</label>
          <input
            type="text"
            placeholder="e.g. Changed my mind, driver taking too long..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        <div className="flex gap-3">
          <Button fullWidth variant="outline" onClick={onClose}>
            Go Back
          </Button>
          <Button fullWidth variant="danger" onClick={() => {
            onConfirm(reason);
            onClose();
          }}>
            Confirm Cancel
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

