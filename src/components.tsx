import React from 'react';
import { motion } from 'motion/react';
import { LucideIcon } from 'lucide-react';

export function Button({
  children,
  onClick,
  variant = 'primary',
  className = '',
  fullWidth = false,
  disabled = false,
  type = 'button',
}: {
  children: React.ReactNode;
  onClick?: (e?: any) => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  className?: string;
  fullWidth?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}) {
  const baseStyle = 'relative overflow-hidden font-semibold rounded-2xl transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2';
  
  const variants = {
    primary: 'bg-green-500 text-white hover:bg-green-600 shadow-lg shadow-green-500/30',
    secondary: 'bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900',
    outline: 'border-2 border-gray-200 text-gray-700 hover:border-green-500 hover:text-green-500 dark:border-gray-700 dark:text-gray-300',
    ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800',
    danger: 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/30',
  };

  const sizes = 'py-3.5 px-6 text-base';

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyle} ${variants[variant]} ${sizes} ${fullWidth ? 'w-full' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {children}
    </motion.button>
  );
}

export function Card({ children, className = '', onClick, key }: { children: React.ReactNode; className?: string; onClick?: () => void; key?: React.Key }) {
  return (
    <div 
      key={key}
      onClick={onClick}
      className={`bg-white dark:bg-gray-900 rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-gray-100 dark:border-gray-800 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

export function Input({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  icon: Icon,
  iconNode,
}: {
  label?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  icon?: LucideIcon;
  iconNode?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && <label className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">{label}</label>}
      <div className="relative">
        {Icon && !iconNode && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            <Icon size={20} />
          </div>
        )}
        {iconNode && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 flex items-center justify-center">
            {iconNode}
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl py-3.5 ${(Icon || iconNode) ? 'pl-11' : 'pl-4'} pr-4 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition-all`}
        />
      </div>
    </div>
  );
}

export function TopBar({ title, onBack, rightAction }: { title: string; onBack?: () => void; rightAction?: React.ReactNode }) {
  return (
    <div className="sticky top-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 px-4 pt-3 pb-3 sm:pt-2 sm:pb-2 min-h-[4rem] flex items-center justify-between">
      <div className="flex items-center gap-3">
        {onBack && (
          <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200 transition-colors">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
        )}
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h1>
      </div>
      {rightAction && <div>{rightAction}</div>}
    </div>
  );
}
