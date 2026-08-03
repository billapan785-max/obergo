import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { Hammer } from 'lucide-react';

export function SplashScreen({ onFinish }: { onFinish: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onFinish, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div 
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.4 }}
      className="absolute inset-0 z-[100] bg-green-500 flex flex-col items-center justify-center text-white"
    >
      <motion.div 
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', bounce: 0.5 }}
        className="w-28 h-28 bg-white rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-green-900/20 mb-6 p-2 overflow-hidden"
      >
        <img 
          src="/obragosplashicon.png" 
          alt="Obrago Logo" 
          className="w-full h-full object-contain rounded-[2rem]"
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
      </motion.div>
      <motion.h1 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-3xl font-bold tracking-tight"
      >
        Obrago
      </motion.h1>
      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-green-100 mt-2 font-medium text-lg"
      >
        Professional Services on Demand.
      </motion.p>
    </motion.div>
  );
}
