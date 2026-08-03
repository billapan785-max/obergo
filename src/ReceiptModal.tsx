import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Download, Printer, X, ShieldCheck, FileText, MapPin, User, Calendar, DollarSign, Clock } from 'lucide-react';
import { useAppStore } from './store';
import { Job, Bid } from './types';
import { Button } from './components';
import { safeFormatDate, safeFormatTime } from './dateUtils';

interface ReceiptModalProps {
  job: Job;
  bid: Bid;
  onClose: () => void;
}

export function ReceiptModal({ job, bid, onClose }: ReceiptModalProps) {
  const { currency, currentUser } = useAppStore();
  const receiptRef = useRef<HTMLDivElement>(null);

  const receiptId = `OBR-${job.id.slice(-6).toUpperCase()}`;
  const formattedDate = `${safeFormatDate(job.createdAt || Date.now())} ${safeFormatTime(job.createdAt || Date.now())}`;

  const handleDownloadPNG = () => {
    // Create an offscreen canvas to generate a high quality PNG receipt image
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 1000;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 800, 1000);

    // Green Header Bar
    ctx.fillStyle = '#22C55E';
    ctx.fillRect(0, 0, 800, 120);

    // Title inside Header
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 32px sans-serif';
    ctx.fillText('OBRAGO SERVICES', 40, 60);
    ctx.font = '18px sans-serif';
    ctx.fillText('Official Hiring & Booking Receipt', 40, 95);

    // Receipt ID & Status
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(`Receipt #: ${receiptId}`, 40, 170);
    
    ctx.fillStyle = '#16A34A';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('STATUS: WORKER HIRED (CONFIRMED)', 450, 170);

    // Divider
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(40, 190);
    ctx.lineTo(760, 190);
    ctx.stroke();

    // Booking Details
    ctx.fillStyle = '#6B7280';
    ctx.font = '14px sans-serif';
    ctx.fillText('DATE & TIME', 40, 220);
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(formattedDate, 40, 245);

    ctx.fillStyle = '#6B7280';
    ctx.font = '14px sans-serif';
    ctx.fillText('SERVICE CATEGORY', 450, 220);
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(job.category.toUpperCase(), 450, 245);

    // Divider
    ctx.beginPath();
    ctx.moveTo(40, 275);
    ctx.lineTo(760, 275);
    ctx.stroke();

    // Customer Info Box
    ctx.fillStyle = '#F9FAFB';
    ctx.fillRect(40, 300, 340, 140);
    ctx.strokeStyle = '#E5E7EB';
    ctx.strokeRect(40, 300, 340, 140);

    ctx.fillStyle = '#374151';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('CUSTOMER DETAILS', 60, 330);
    ctx.font = '15px sans-serif';
    ctx.fillStyle = '#111827';
    ctx.fillText(`Name: ${currentUser.name || 'Customer'}`, 60, 360);
    ctx.fillText(`Phone: ${currentUser.phone || 'N/A'}`, 60, 390);
    ctx.fillText(`Address: ${job.location}`, 60, 420);

    // Worker Info Box
    ctx.fillStyle = '#F9FAFB';
    ctx.fillRect(420, 300, 340, 140);
    ctx.strokeRect(420, 300, 340, 140);

    ctx.fillStyle = '#374151';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('HIRED WORKER DETAILS', 440, 330);
    ctx.font = '15px sans-serif';
    ctx.fillStyle = '#111827';
    ctx.fillText(`Worker: ${bid.workerName}`, 440, 360);
    ctx.fillText(`Rating: ⭐ ${bid.workerRating}`, 440, 390);
    ctx.fillText(`ETA: ${bid.eta}`, 440, 420);

    // Job Description
    ctx.fillStyle = '#6B7280';
    ctx.font = '14px sans-serif';
    ctx.fillText('JOB DESCRIPTION', 40, 480);
    ctx.fillStyle = '#111827';
    ctx.font = '16px sans-serif';
    ctx.fillText(job.description, 40, 510);

    // Financial Table
    ctx.fillStyle = '#F3F4F6';
    ctx.fillRect(40, 550, 720, 40);
    ctx.fillStyle = '#374151';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('DESCRIPTION', 60, 575);
    ctx.fillText('AMOUNT', 640, 575);

    ctx.fillStyle = '#111827';
    ctx.font = '16px sans-serif';
    ctx.fillText(`${job.category} Service (Agreed Bid)`, 60, 620);
    ctx.fillText(`${currency} ${bid.price.toFixed(0)}`, 640, 620);

    ctx.fillText('Platform Service Fee', 60, 660);
    ctx.fillText(`${currency} 0 (Included)`, 640, 660);

    // Total Line
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(40, 690);
    ctx.lineTo(760, 690);
    ctx.stroke();

    ctx.fillStyle = '#111827';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('TOTAL AGREED AMOUNT:', 40, 730);
    ctx.fillStyle = '#16A34A';
    ctx.fillText(`${currency} ${bid.price.toFixed(0)}`, 610, 730);

    // Verification Stamp
    ctx.fillStyle = '#DCFCE7';
    ctx.fillRect(200, 780, 400, 60);
    ctx.strokeStyle = '#16A34A';
    ctx.lineWidth = 2;
    ctx.strokeRect(200, 780, 400, 60);

    ctx.fillStyle = '#15803D';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('✓ VERIFIED BY OBRAGO GUARANTEE', 240, 815);

    // Footer
    ctx.fillStyle = '#9CA3AF';
    ctx.font = '13px sans-serif';
    ctx.fillText('Thank you for booking with Obrago. For support, contact support@obrago.app', 160, 920);
    ctx.fillText('This is a computer generated digital hiring receipt.', 240, 945);

    // Trigger Download
    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `Obrago_Receipt_${receiptId}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-800 my-auto"
      >
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white font-bold">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Worker Hired Successfully!</h3>
              <p className="text-green-100 text-xs font-medium">Hiring & Booking Receipt</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Printable / Viewable Receipt Body */}
        <div ref={receiptRef} className="p-6 space-y-5 text-gray-900 dark:text-white max-h-[70vh] overflow-y-auto">
          {/* Badge & Receipt No */}
          <div className="flex justify-between items-start bg-green-50 dark:bg-green-950/40 p-4 rounded-2xl border border-green-200 dark:border-green-800">
            <div>
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-green-700 dark:text-green-400">
                Official Receipt
              </span>
              <p className="text-lg font-bold text-gray-900 dark:text-white mt-0.5">{receiptId}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{formattedDate}</p>
            </div>
            <span className="bg-green-500 text-white font-bold text-xs px-3 py-1 rounded-full shadow-sm flex items-center gap-1">
              <ShieldCheck size={14} /> Confirmed
            </span>
          </div>

          {/* Customer & Worker Summary */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-gray-50 dark:bg-gray-800/60 p-3 rounded-2xl border border-gray-100 dark:border-gray-800">
              <p className="text-gray-400 font-medium mb-1 uppercase tracking-wider text-[10px]">Customer</p>
              <p className="font-bold text-gray-900 dark:text-white">{currentUser.name || 'Customer'}</p>
              <p className="text-gray-500 mt-0.5">{currentUser.phone || 'N/A'}</p>
              <p className="text-gray-500 mt-0.5 truncate"><MapPin size={10} className="inline mr-1" />{job.location}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/60 p-3 rounded-2xl border border-gray-100 dark:border-gray-800">
              <p className="text-gray-400 font-medium mb-1 uppercase tracking-wider text-[10px]">Hired Worker</p>
              <p className="font-bold text-gray-900 dark:text-white">{bid.workerName}</p>
              <p className="text-amber-500 font-semibold mt-0.5">⭐ {bid.workerRating}</p>
              <p className="text-gray-500 mt-0.5"><Clock size={10} className="inline mr-1" />ETA: {bid.eta}</p>
            </div>
          </div>

          {/* Job Details */}
          <div className="space-y-2 text-xs border-t border-b border-gray-100 dark:border-gray-800 py-3">
            <div className="flex justify-between">
              <span className="text-gray-500">Service Category:</span>
              <span className="font-bold uppercase text-gray-900 dark:text-white">{job.category}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Task Details:</span>
              <span className="font-medium text-gray-800 dark:text-gray-200 text-right max-w-[200px] truncate">{job.description}</span>
            </div>
          </div>

          {/* Pricing Details */}
          <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-2xl space-y-2 text-xs">
            <div className="flex justify-between text-gray-600 dark:text-gray-300">
              <span>Agreed Service Fare:</span>
              <span className="font-semibold">{currency}{bid.price.toFixed(0)}</span>
            </div>
            <div className="flex justify-between text-gray-600 dark:text-gray-300">
              <span>Service Fee:</span>
              <span className="font-semibold text-green-600 dark:text-green-400">Included (Free)</span>
            </div>
            <div className="flex justify-between text-base font-bold text-gray-900 dark:text-white pt-2 border-t border-gray-200 dark:border-gray-700">
              <span>Total Payable:</span>
              <span className="text-green-500">{currency}{bid.price.toFixed(0)}</span>
            </div>
          </div>

          {/* Verification Guarantee */}
          <div className="text-center bg-green-500/10 border border-green-500/20 p-2.5 rounded-xl text-xs font-semibold text-green-600 dark:text-green-400 flex items-center justify-center gap-1.5">
            <ShieldCheck size={16} /> Obrago Verified Booking • Satisfaction Guaranteed
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-5 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex gap-3">
          <Button fullWidth onClick={handleDownloadPNG} className="bg-green-500 hover:bg-green-600 text-white flex items-center justify-center gap-2">
            <Download size={18} /> Download Receipt
          </Button>
          <Button variant="outline" onClick={handlePrint} className="shrink-0 flex items-center gap-1 px-4">
            <Printer size={18} /> Print
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
