import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Shield, FileText, Lock, CheckCircle2, X, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Button } from './components';

export function LegalModal({ onClose, defaultTab = 'terms' }: { onClose: () => void; defaultTab?: 'terms' | 'privacy' | 'worker' | 'customer' }) {
  const [tab, setTab] = useState<'terms' | 'privacy' | 'worker' | 'customer'>(defaultTab);

  return (
    <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-gray-950 w-full max-w-xl h-[85vh] rounded-3xl flex flex-col shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden"
      >
        {/* Header */}
        <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/80 dark:bg-gray-900/80">
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
            <ShieldCheck size={24} />
            <h3 className="font-extrabold text-lg text-gray-900 dark:text-white">Legal & Safety Framework</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-full text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 p-2 gap-1 overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setTab('terms')}
            className={`px-3 py-2 rounded-xl shrink-0 transition-colors ${
              tab === 'terms' ? 'bg-green-500 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800'
            }`}
          >
            Terms & Developer Liability
          </button>
          <button
            onClick={() => setTab('privacy')}
            className={`px-3 py-2 rounded-xl shrink-0 transition-colors ${
              tab === 'privacy' ? 'bg-green-500 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800'
            }`}
          >
            Privacy Policy
          </button>
          <button
            onClick={() => setTab('worker')}
            className={`px-3 py-2 rounded-xl shrink-0 transition-colors ${
              tab === 'worker' ? 'bg-green-500 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800'
            }`}
          >
            Worker Agreement
          </button>
          <button
            onClick={() => setTab('customer')}
            className={`px-3 py-2 rounded-xl shrink-0 transition-colors ${
              tab === 'customer' ? 'bg-green-500 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800'
            }`}
          >
            Customer Policy
          </button>
        </div>

        {/* Legal Text Scroll Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
          {tab === 'terms' && (
            <div className="space-y-4">
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-300">
                <p className="font-bold flex items-center gap-1.5 mb-1 text-sm">
                  <AlertTriangle size={16} /> Important Developer & Platform Protection Notice
                </p>
                <p className="text-[11px]">
                  Obrago and its software developers act solely as a technology service provider and neutral peer-to-peer matchmaking marketplace. We do NOT employ workers, guarantee job outcomes, or take responsibility for physical interactions or payments.
                </p>
              </div>

              <h4 className="font-bold text-sm text-gray-900 dark:text-white">1. Platform Nature & Developer Disclaimer</h4>
              <p>
                Obrago is a software application developed to connect independent service seekers (Customers) with independent service providers (Workers). The software developers, operators, hosting infrastructure providers, and platform owners ("Platform Management") have no control over the quality, safety, legality, or execution of any work or service arranged through the app.
              </p>

              <h4 className="font-bold text-sm text-gray-900 dark:text-white">2. Limitation of Liability</h4>
              <p>
                Under no circumstances shall the developer or platform management be liable for any direct, indirect, incidental, punitive, or consequential damages resulting from:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Personal injury, property damage, or theft occurring during a job.</li>
                <li>Financial losses, payment non-fulfillment, or price negotiation disputes between users.</li>
                <li>Inaccurate CNIC verification documents or identity misrepresentation by any user.</li>
                <li>Network downtime, app errors, or loss of data stored on the platform.</li>
              </ul>

              <h4 className="font-bold text-sm text-gray-900 dark:text-white">3. Direct User Negotiations & Payments</h4>
              <p>
                All price bidding, counter-proposals, cash exchanges, and job completions are agreed upon strictly between the Customer and Worker. Obrago is not an escrow service, bank, or insurer.
              </p>

              <h4 className="font-bold text-sm text-gray-900 dark:text-white">4. Account Termination & Moderation</h4>
              <p>
                Platform administrators reserve the unrestricted right to suspend, block, or delete any account immediately without prior notice or refund if a user violates safety policies, commits fraud, or engages in abusive behavior.
              </p>
              
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                <p className="text-[11px] font-bold">Online Access:</p>
                <a 
                  href="/terms" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  onClick={(e) => {
                    e.preventDefault();
                    window.open(`${window.location.origin}/terms`, '_blank');
                  }}
                  className="text-blue-500 hover:underline font-semibold"
                >
                  View Terms of Service online ({typeof window !== 'undefined' ? window.location.hostname : 'obrago'}/terms)
                </a>
              </div>
            </div>
          )}

          {tab === 'privacy' && (
            <div className="space-y-4">
              <h4 className="font-bold text-sm text-gray-900 dark:text-white">1. Data Collection & Privacy Protection</h4>
              <p>
                We respect your privacy and are committed to protecting your personal information. When you register on Obrago, we collect information required to facilitate local service connections:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Personal Identity:</strong> Name, phone number, email address.</li>
                <li><strong>Verification Data:</strong> National Identity Card (CNIC) numbers and document photos for worker safety compliance.</li>
                <li><strong>Location Data:</strong> Real-time GPS location coordinates to show nearby jobs and track worker arrival.</li>
              </ul>

              <h4 className="font-bold text-sm text-gray-900 dark:text-white">2. Data Security & Storage</h4>
              <p>
                Your verification documents and account data are encrypted in accordance with industry standards. Data is used exclusively for platform moderation, safety enforcement, and emergency SOS dispatching. We NEVER sell or share your private data with unauthorized third parties.
              </p>

              <h4 className="font-bold text-sm text-gray-900 dark:text-white">3. Right to Account Deletion</h4>
              <p>
                Users maintain total ownership of their personal data. You may request or trigger permanent account deletion at any time via your Profile settings, which instantly removes all profile records, active jobs, bids, and documents from our live databases.
              </p>
              
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                <p className="text-[11px] font-bold">Online Access:</p>
                <a 
                  href="/privacy" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  onClick={(e) => {
                    e.preventDefault();
                    window.open(`${window.location.origin}/privacy`, '_blank');
                  }}
                  className="text-blue-500 hover:underline font-semibold"
                >
                  View Privacy Policy online ({typeof window !== 'undefined' ? window.location.hostname : 'obrago'}/privacy)
                </a>
              </div>
            </div>
          )}

          {tab === 'worker' && (
            <div className="space-y-4">
              <h4 className="font-bold text-sm text-gray-900 dark:text-white">Independent Contractor Agreement for Workers</h4>
              <p>
                By registering as a Worker on Obrago, you acknowledge and agree that:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>You operate as an <strong>Independent Freelance Worker</strong> and not an employee, agent, or representative of Obrago or its developers.</li>
                <li>You are solely responsible for bringing appropriate safety gear, tools, and expertise necessary to perform requested tasks safely.</li>
                <li>You must provide truthful CNIC identity information. Submitting fraudulent or fake ID credentials will result in permanent blacklisting and legal reporting to law enforcement authorities.</li>
                <li>You agree to comply with agreed price bids, arrive punctually at customer locations, and maintain professional, polite behavior at all times.</li>
                <li>You understand that 5-star ratings, reviews, and completed job statistics are visible publicly to customers.</li>
              </ul>
            </div>
          )}

          {tab === 'customer' && (
            <div className="space-y-4">
              <h4 className="font-bold text-sm text-gray-900 dark:text-white">Customer Code of Conduct & Safety Guidelines</h4>
              <p>
                By posting jobs or hiring workers on Obrago, Customers agree to:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Provide accurate job location details, clear task descriptions, and fair pricing offers.</li>
                <li>Treat workers with dignity, respect, and fairness regardless of trade or background.</li>
                <li>Ensure a safe working environment at your premises free of hazards, threats, or illegal requests.</li>
                <li>Pay the agreed-upon bid price promptly upon satisfactory job completion.</li>
                <li>Use the built-in Safety SOS features responsibly for genuine safety emergencies only.</li>
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/80 flex justify-between items-center">
          <p className="text-[11px] text-gray-500">
            By using Obrago, you unconditionally accept these terms.
          </p>
          <Button onClick={onClose} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-5 text-xs">
            I Understand & Agree
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
