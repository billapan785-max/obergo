import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Button } from './components';
import { AlertTriangle, X, CheckCircle2 } from 'lucide-react';
import { useAppStore } from './store';
import { db } from './firebase';
import { collection, addDoc } from 'firebase/firestore';

export function ReportModal({
  targetId,
  targetType, // 'user' or 'job'
  onClose
}: {
  targetId: string;
  targetType: 'user' | 'job';
  onClose: () => void;
}) {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const { currentUser } = useAppStore();

  const handleReport = async () => {
    if (!reason) {
      alert('Please select a reason for reporting.');
      return;
    }
    
    try {
      await addDoc(collection(db, 'reports'), {
        reporterId: currentUser?.id,
        targetId,
        targetType,
        reason,
        details,
        status: 'pending',
        timestamp: Date.now()
      });
      setSubmitted(true);
      setTimeout(onClose, 2000);
    } catch (e) {
      console.error('Error submitting report', e);
      alert('Error submitting report. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md p-6 relative shadow-2xl"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X size={20} />
        </button>

        {!submitted ? (
          <>
            <div className="flex items-center space-x-3 mb-4 text-red-500">
              <AlertTriangle size={24} />
              <h3 className="font-bold text-lg">Report {targetType === 'user' ? 'User' : 'Job'}</h3>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              We take safety seriously. Please let us know why you are reporting this {targetType}.
            </p>

            <div className="space-y-3 mb-4">
              {['Inappropriate Content', 'Spam or Scam', 'Harassment', 'Fake Profile', 'Other'].map(r => (
                <button
                  key={r}
                  onClick={() => setReason(r)}
                  className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${
                    reason === r 
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                      : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            <textarea
              placeholder="Additional details (optional)"
              value={details}
              onChange={e => setDetails(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-red-500 mb-4 text-gray-900 dark:text-white"
              rows={3}
            />

            <Button fullWidth onClick={handleReport} className="bg-red-500 hover:bg-red-600 text-white border-none">
              Submit Report
            </Button>
            <p className="text-[10px] text-gray-500 text-center mt-3">
              If someone is in immediate danger, please contact local emergency services immediately.
            </p>
          </>
        ) : (
          <div className="py-8 text-center">
            <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="font-bold text-lg mb-2">Report Received</h3>
            <p className="text-sm text-gray-500">
              Thank you for keeping Obrago safe. Our admin team will review this shortly.
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
