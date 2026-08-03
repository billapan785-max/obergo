import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Job } from './types';
import { Bell, MapPin, DollarSign, X, Zap } from 'lucide-react';
import { playJobAlertChime } from './notificationService';

interface JobAlertToastProps {
  job: Job | null;
  currency: string;
  onClose: () => void;
  onOpenJob?: (job: Job) => void;
}

export function JobAlertToast({ job, currency, onClose, onOpenJob }: JobAlertToastProps) {
  useEffect(() => {
    if (job) {
      playJobAlertChime();
      const timer = setTimeout(() => {
        onClose();
      }, 10000); // auto dismiss after 10 sec
      return () => clearTimeout(timer);
    }
  }, [job]);

  if (!job) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -100, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -100, scale: 0.9 }}
        className="fixed top-4 left-3 right-3 sm:left-auto sm:right-4 sm:w-96 z-[9999] bg-gradient-to-r from-gray-900 via-slate-900 to-gray-900 text-white p-4 rounded-3xl shadow-2xl border-2 border-green-500/80 backdrop-blur-xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center shrink-0">
              <span className="animate-ping absolute inline-flex h-10 w-10 rounded-full bg-green-400 opacity-75"></span>
              <div className="w-10 h-10 rounded-2xl bg-green-500 text-white flex items-center justify-center font-bold shadow-lg shadow-green-500/50 relative z-10">
                <Bell className="animate-bounce" size={20} />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="bg-green-500/20 text-green-400 text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-green-500/30 flex items-center gap-1">
                  <Zap size={10} /> Nayi Job Alert
                </span>
                <span className="text-[10px] text-gray-400">Just now</span>
              </div>
              <h4 className="font-bold text-sm text-white mt-1 line-clamp-1">{job.description || job.category}</h4>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mt-3 bg-gray-800/80 rounded-2xl p-2.5 flex items-center justify-between text-xs border border-gray-700/50">
          <div className="flex items-center gap-1 text-gray-300 font-medium">
            <MapPin size={13} className="text-red-400 shrink-0" />
            <span className="truncate max-w-[140px]">{job.location}</span>
          </div>

          <div className="flex items-center gap-1 text-green-400 font-extrabold text-sm">
            <DollarSign size={14} className="shrink-0" />
            <span>{currency} {job.budget}</span>
          </div>
        </div>

        <button
          onClick={() => {
            if (onOpenJob) onOpenJob(job);
            onClose();
          }}
          className="mt-3 w-full py-2.5 bg-green-500 hover:bg-green-600 text-white font-extrabold rounded-xl text-xs shadow-lg shadow-green-500/30 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          ⚡ OPEN APP & BID NOW
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
