import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useAppStore } from './store';
import { Star, ShieldCheck, X, ThumbsUp, Calendar, AlertTriangle } from 'lucide-react';
import { safeFormatDate } from './dateUtils';
import { ReportModal } from './ReportModal';

export function PublicProfileModal({ userId, onClose }: { userId: string, onClose: () => void }) {
  const { allUsers, ratings, currency, currentUser } = useAppStore();
  const [showReport, setShowReport] = useState(false);
  const user = allUsers.find(u => u.id === userId);
  const userRatings = ratings.filter(r => r.toUserId === userId).sort((a, b) => b.createdAt - a.createdAt);

  if (!user) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4">
      <motion.div 
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="bg-white dark:bg-gray-900 w-full sm:max-w-md h-[85vh] sm:h-[80vh] sm:rounded-3xl rounded-t-3xl shadow-2xl border border-gray-100 dark:border-gray-800 flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-md">
          <h3 className="font-bold text-lg text-gray-900 dark:text-white capitalize">{user.role} Profile</h3>
          <div className="flex items-center gap-2">
            {currentUser?.id !== userId && (
              <button onClick={() => setShowReport(true)} className="p-2 rounded-full bg-red-50 dark:bg-red-900/20 text-red-500">
                <AlertTriangle size={18} />
              </button>
            )}
            <button onClick={onClose} className="p-2 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
              <X size={20} />
            </button>
          </div>
        </div>
        
        {showReport && (
          <ReportModal targetId={userId} targetType="user" onClose={() => setShowReport(false)} />
        )}

        <div className="flex-1 overflow-y-auto p-5">
          {/* Top Info */}
          <div className="flex flex-col items-center mb-6">
            <img src={user.avatar} alt={user.name} className="w-24 h-24 rounded-full border-4 border-green-500 mb-3" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-1">
              {user.name} <ShieldCheck size={20} className="text-green-500" />
            </h2>
            <p className="text-sm text-gray-500 mt-1 capitalize">{user.role} on Obrago</p>
            
            <div className="flex gap-4 mt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-1">
                  <Star size={20} className="fill-yellow-400 text-yellow-400" />
                  {user.rating?.toFixed(1) || 'New'}
                </p>
                <p className="text-xs text-gray-500">Rating</p>
              </div>
              <div className="w-px bg-gray-200 dark:bg-gray-700"></div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{user.completedJobs || 0}</p>
                <p className="text-xs text-gray-500">Completed Jobs</p>
              </div>
            </div>
          </div>

          <h4 className="font-bold text-gray-900 dark:text-white mb-4">Reviews ({userRatings.length})</h4>
          
          <div className="space-y-4">
            {userRatings.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                No reviews yet.
              </div>
            ) : (
              userRatings.map(rating => {
                const reviewer = allUsers.find(u => u.id === rating.fromUserId);
                return (
                  <div key={rating.id} className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <img src={reviewer?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${rating.fromUserId}`} alt="Avatar" className="w-8 h-8 rounded-full" />
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">{reviewer?.name || 'User'}</p>
                          <p className="text-[10px] text-gray-500">{safeFormatDate(rating.createdAt)}</p>
                        </div>
                      </div>
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={14} className={i < rating.stars ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-gray-700'} />
                        ))}
                      </div>
                    </div>
                    {rating.tags && rating.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {rating.tags.map(tag => (
                          <span key={tag} className="text-[10px] bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    {rating.comment && (
                      <p className="text-xs text-gray-600 dark:text-gray-300 mt-2">{rating.comment}</p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
