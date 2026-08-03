import React, { useState } from 'react';
import { ShieldCheck, ArrowLeft, Lock, FileText, AlertTriangle, Mail, Phone, ExternalLink, Trash2, CheckCircle2 } from 'lucide-react';

export function StandaloneLegalPage({ type = 'privacy' }: { type?: 'privacy' | 'terms' | 'delete-account' }) {
  const [activeTab, setActiveTab] = useState<'privacy' | 'terms' | 'delete-account'>(type);
  const [phoneForDeletion, setPhoneForDeletion] = useState('');
  const [reason, setReason] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const hostUrl = typeof window !== 'undefined' ? window.location.origin : 'https://obrago.app';

  const handleDeletionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneForDeletion.trim()) return;
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 text-gray-800 dark:text-gray-200 font-sans p-4 sm:p-8 flex justify-center">
      <div className="max-w-3xl w-full bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-800 p-6 sm:p-10 flex flex-col">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-6 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-500/10 text-green-600 dark:text-green-400 rounded-2xl">
              <ShieldCheck size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Obrago</h1>
              <p className="text-xs text-gray-500 font-medium">Official Legal & Account Policy Center</p>
            </div>
          </div>

          <a 
            href="/"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold transition-colors"
          >
            <ArrowLeft size={16} /> Open Obrago App
          </a>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap sm:flex-nowrap gap-2 bg-gray-100 dark:bg-gray-800/60 p-1.5 rounded-2xl mb-8">
          <button
            onClick={() => setActiveTab('privacy')}
            className={`flex-1 min-w-[120px] py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'privacy' 
                ? 'bg-white dark:bg-gray-900 text-green-600 dark:text-green-400 shadow-sm' 
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Lock size={16} /> Privacy Policy
          </button>
          <button
            onClick={() => setActiveTab('terms')}
            className={`flex-1 min-w-[120px] py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'terms' 
                ? 'bg-white dark:bg-gray-900 text-green-600 dark:text-green-400 shadow-sm' 
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <FileText size={16} /> Terms of Service
          </button>
          <button
            onClick={() => setActiveTab('delete-account')}
            className={`flex-1 min-w-[140px] py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'delete-account' 
                ? 'bg-white dark:bg-gray-900 text-red-600 dark:text-red-400 shadow-sm' 
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Trash2 size={16} /> Delete Account
          </button>
        </div>

        {/* Content */}
        {activeTab === 'privacy' && (
          <div className="space-y-6 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-green-600 dark:text-green-400">Google Play Policy Compliant</span>
              <h2 className="text-xl font-extrabold text-gray-900 dark:text-white mt-1 mb-2">Privacy Policy for Obrago</h2>
              <p className="text-xs text-gray-400">Effective Date: August 1, 2026 | Last Updated: August 1, 2026</p>
            </div>

            <p>
              At <strong>Obrago</strong>, accessible from <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-xs">{hostUrl}</code>, one of our main priorities is the privacy and safety of our users (both Customers and Service Workers). This Privacy Policy document outlines the types of information collected and recorded by Obrago and how we use it in full compliance with Google Play Developer Policies.
            </p>

            <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/40 rounded-2xl space-y-2 text-green-800 dark:text-green-300 text-xs">
              <p className="font-bold flex items-center gap-1.5 text-sm">
                <Lock size={16} /> Summary of Key Permissions & Data
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Location Access:</strong> Used exclusively to calculate distance between customer job sites and nearby workers and for real-time live navigation during active service requests.</li>
                <li><strong>CNIC Identity Verification:</strong> Worker identity cards and photos are collected solely for user trust, safety verification, and platform integrity.</li>
                <li><strong>Camera & Gallery:</strong> Used only when taking or uploading CNIC verification photos or job/profile pictures.</li>
              </ul>
            </div>

            <h3 className="text-base font-bold text-gray-900 dark:text-white">1. Information We Collect</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Personal Identity Information:</strong> Full Name, Phone Number, Selected City, and Account Role (Customer or Worker).</li>
              <li><strong>Verification Credentials (Workers):</strong> Computerized National Identity Card (CNIC) number, front/back photos, and skill category certifications.</li>
              <li><strong>Location Data (GPS):</strong> Precise geolocation coordinates collected with explicit user consent to calculate distances between customer requests and worker locations.</li>
              <li><strong>Device & Communication Logs:</strong> In-app messaging content and transaction status timestamps.</li>
            </ul>

            <h3 className="text-base font-bold text-gray-900 dark:text-white">2. How We Use Your Information</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>To match service requests with nearby available skilled workers.</li>
              <li>To verify worker identities and prevent fraud, impersonation, or safety violations.</li>
              <li>To provide emergency SOS dispatch assistance during active jobs.</li>
              <li>To send job status updates, bid notifications, and arrival alerts.</li>
            </ul>

            <h3 className="text-base font-bold text-gray-900 dark:text-white">3. Data Sharing & Third Parties</h3>
            <p>
              We do <strong>NOT</strong> sell, trade, or rent personal identification information to marketers or unauthorized third parties. Data is stored securely in encrypted Google Firebase cloud infrastructure in strict accordance with industry standards.
            </p>

            <h3 className="text-base font-bold text-gray-900 dark:text-white">4. User Rights & Account Deletion</h3>
            <p>
              You retain complete ownership of your personal data. You have the right to request permanent deletion of your account and all associated personal data, job histories, and verification documents at any time:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>In-App Deletion:</strong> Go to Profile Settings → Account → Delete Account.</li>
              <li><strong>Manual Support Request:</strong> Email us directly at <a href="mailto:support@obrago.app" className="text-green-600 dark:text-green-400 underline font-semibold">support@obrago.app</a> or use our web request tool on this page. Account purge completes within 24 hours.</li>
            </ul>

            <h3 className="text-base font-bold text-gray-900 dark:text-white">5. Contact Us</h3>
            <p>
              If you have any questions or suggestions regarding our Privacy Policy, do not hesitate to contact us at:
            </p>
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-800 space-y-2 text-xs">
              <p className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
                <Mail size={16} className="text-green-500" /> Email: support@obrago.app
              </p>
              <p className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
                <ExternalLink size={16} className="text-green-500" /> Website: {hostUrl}
              </p>
            </div>
          </div>
        )}

        {activeTab === 'terms' && (
          <div className="space-y-6 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-green-600 dark:text-green-400">Terms of Service & Platform Agreement</span>
              <h2 className="text-xl font-extrabold text-gray-900 dark:text-white mt-1 mb-2">Terms & Developer Disclaimer</h2>
              <p className="text-xs text-gray-400">Effective Date: August 1, 2026 | Last Updated: August 1, 2026</p>
            </div>

            <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-2xl space-y-2 text-red-800 dark:text-red-300 text-xs">
              <p className="font-bold flex items-center gap-1.5 text-sm">
                <AlertTriangle size={16} /> Developer & Neutral Marketplace Protection Notice
              </p>
              <p>
                Obrago and its software developers act strictly as a technology software provider and neutral peer-to-peer matchmaking platform. We do NOT employ workers, inspect job sites directly, guarantee work outcomes, or take responsibility for physical interactions or payments.
              </p>
            </div>

            <h3 className="text-base font-bold text-gray-900 dark:text-white">1. Platform Nature</h3>
            <p>
              Obrago provides software tools for customers to post micro-jobs and independent freelance workers to offer service bids. Software developers and hosting infrastructure operators ("Platform Management") have no control over the execution, safety, quality, or legality of services rendered.
            </p>

            <h3 className="text-base font-bold text-gray-900 dark:text-white">2. Limitation of Liability</h3>
            <p>
              To the fullest extent permitted by law, Obrago developers and operators shall not be liable for any direct, indirect, incidental, or consequential damages, including personal injury, property loss, payment disputes, or inaccuracies in identity documents provided by users.
            </p>

            <h3 className="text-base font-bold text-gray-900 dark:text-white">3. Direct User Negotiations</h3>
            <p>
              All price bidding, counter-proposals, cash/digital payments, and job agreements are negotiated strictly between the Customer and Worker. Obrago is not an escrow agent or insurer.
            </p>

            <h3 className="text-base font-bold text-gray-900 dark:text-white">4. Account Termination</h3>
            <p>
              Platform administrators reserve the right to suspend or block any account that engages in abusive behavior, fraud, fake CNIC submission, or safety violations.
            </p>
          </div>
        )}

        {activeTab === 'delete-account' && (
          <div className="space-y-6 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400">Google Play Policy Compliant</span>
              <h2 className="text-xl font-extrabold text-gray-900 dark:text-white mt-1 mb-2">Request Account & Data Deletion</h2>
              <p className="text-xs text-gray-400">Effective Date: August 1, 2026 | Obrago Platform Data Safety Policy</p>
            </div>

            <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-2xl space-y-2 text-amber-800 dark:text-amber-300 text-xs">
              <p className="font-bold flex items-center gap-1.5 text-sm">
                <Trash2 size={16} /> Data Deletion Commitment
              </p>
              <p>
                In compliance with Google Play User Data policies, Obrago allows any registered user (Customer or Worker) to delete their account and associated data either directly inside the Android app or by submitting a web request below.
              </p>
            </div>

            <h3 className="text-base font-bold text-gray-900 dark:text-white">Method 1: Delete Account Inside the Mobile App</h3>
            <ol className="list-decimal pl-5 space-y-2 text-xs sm:text-sm">
              <li>Open the <strong>Obrago App</strong> on your mobile phone.</li>
              <li>Log in to your account if prompted.</li>
              <li>Tap on <strong>Profile / Settings</strong> in the navigation bar.</li>
              <li>Scroll to the bottom of your profile options and tap <strong>Delete Account</strong>.</li>
              <li>Confirm your deletion. Your account, profile, and active jobs will be permanently deleted immediately.</li>
            </ol>

            <h3 className="text-base font-bold text-gray-900 dark:text-white">Method 2: Web-Based Account & Data Deletion Request</h3>
            <p className="text-xs">
              If you no longer have access to the app or have uninstalled it, submit your registered phone number below or email us at <a href="mailto:support@obrago.app" className="text-green-600 dark:text-green-400 underline font-semibold">support@obrago.app</a>.
            </p>

            {submitted ? (
              <div className="p-6 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-2xl flex flex-col items-center text-center gap-3">
                <CheckCircle2 size={40} className="text-green-500" />
                <h4 className="text-base font-bold text-gray-900 dark:text-white">Deletion Request Submitted</h4>
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  Your deletion request for phone number <strong>{phoneForDeletion}</strong> has been received. All associated account data, CNIC records, and job histories will be purged from our servers within 24 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleDeletionSubmit} className="p-5 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-800 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Registered Mobile Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +92 300 1234567"
                    value={phoneForDeletion}
                    onChange={(e) => setPhoneForDeletion(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Reason for Deletion (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Tell us why you want to delete your account..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow-md"
                >
                  <Trash2 size={16} /> Submit Account Deletion Request
                </button>
              </form>
            )}

            <h3 className="text-base font-bold text-gray-900 dark:text-white">What Data is Deleted vs. Retained?</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-red-50/50 dark:bg-red-950/10 border border-red-100 dark:border-red-900/30 rounded-2xl space-y-1.5">
                <p className="font-bold text-red-700 dark:text-red-400">Permanently Deleted Data:</p>
                <ul className="list-disc pl-4 space-y-1 text-gray-600 dark:text-gray-300">
                  <li>Full Name & Profile Avatar</li>
                  <li>Phone Number & Login Credentials</li>
                  <li>CNIC Images & Verification Status</li>
                  <li>In-app Chat Messages & Voice Calls Logs</li>
                  <li>GPS Location History</li>
                </ul>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-800 rounded-2xl space-y-1.5">
                <p className="font-bold text-gray-700 dark:text-gray-300">Temporarily Retained (Financial/Legal):</p>
                <ul className="list-disc pl-4 space-y-1 text-gray-500 dark:text-gray-400">
                  <li>Completed job receipts (retained for accounting/tax compliance up to 90 days).</li>
                  <li>Safety violation reports (if flagged for fraud/abuse prevention).</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-800 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} Obrago Platform. All rights reserved.
        </div>
      </div>
    </div>
  );
}

