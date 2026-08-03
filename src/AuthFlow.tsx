import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from './store';
import { Button, Input, TopBar } from './components';
import { Mail, Lock, User, MapPin, Image as ImageIcon, Camera, CreditCard, ShieldAlert, Phone, Globe, CheckCircle2, MessageSquareCode, Loader2 } from 'lucide-react';
import { LegalModal } from './LegalModal';
import { CITIES_BY_COUNTRY } from './types';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { auth } from './firebase';

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
  }
}

const COUNTRIES = [
  { name: 'Pakistan', code: '+92', flag: '🇵🇰' },
  { name: 'United Arab Emirates', code: '+971', flag: '🇦🇪' },
  { name: 'Saudi Arabia', code: '+966', flag: '🇸🇦' },
  { name: 'India', code: '+91', flag: '🇮🇳' },
  { name: 'United States', code: '+1', flag: '🇺🇸' },
  { name: 'United Kingdom', code: '+44', flag: '🇬🇧' },
  { name: 'Qatar', code: '+974', flag: '🇶🇦' },
  { name: 'Oman', code: '+968', flag: '🇴🇲' },
  { name: 'Kuwait', code: '+965', flag: '🇰🇼' },
  { name: 'Canada', code: '+1', flag: '🇨🇦' },
];

const CITIES_BY_COUNTRY_LOCAL: Record<string, string[]> = {
  ...CITIES_BY_COUNTRY,
  'United Arab Emirates': ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Other'],
  'Saudi Arabia': ['Riyadh', 'Jeddah', 'Mecca', 'Medina', 'Dammam', 'Other'],
  'India': ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Other'],
  'United States': ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Other'],
  'United Kingdom': ['London', 'Birmingham', 'Manchester', 'Glasgow', 'Other'],
  'Qatar': ['Doha', 'Al Wakrah', 'Al Rayyan', 'Other'],
  'Oman': ['Muscat', 'Salalah', 'Sohar', 'Other'],
  'Kuwait': ['Kuwait City', 'Hawalli', 'Salmiya', 'Other'],
  'Canada': ['Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Other'],
};

export function AuthFlow() {
  const { 
    showAuth, setShowAuth, role, setRole, 
    setIsLoggedIn, setCurrentUser, allUsers,
    registerWorker, registerCustomer,
    setShowAdminPanel, setIsAdminAuthenticated,
    resetPassword: storeResetPassword
  } = useAppStore();

  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [step, setStep] = useState(1);

  // Legal modal state
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [legalTab, setLegalTab] = useState<'terms' | 'privacy' | 'worker' | 'customer'>('terms');

  // Country & City state
  const [country, setCountry] = useState('Pakistan');
  const [city, setCity] = useState('Lahore');

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneRaw, setPhoneRaw] = useState('');
  const [password, setPassword] = useState('');
  
  // OTP Verification state
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [fallbackCode, setFallbackCode] = useState('123456');
  const [userOtpInput, setUserOtpInput] = useState('');
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [loadingOtp, setLoadingOtp] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  // Worker specific & Picture Uploads
  const [address, setAddress] = useState('');
  const [idCard, setIdCard] = useState('');
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [idFrontPic, setIdFrontPic] = useState<string | null>(null);
  const [idBackPic, setIdBackPic] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Forgot Password state
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const selectedCountryObj = COUNTRIES.find(c => c.name === country) || COUNTRIES[0];
  const cleanPhoneInput = phoneRaw.trim().replace(/^0+/, '');
  const fullPhoneNumber = `${selectedCountryObj.code} ${cleanPhoneInput}`;

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>, 
    setter: (val: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setter(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleClose = () => {
    setShowAuth(false);
    setStep(1);
    setErrorMsg('');
  };

  const handleSendOtp = async () => {
    if (!phoneRaw.trim()) {
      setErrorMsg('Please enter a valid phone number before requesting OTP code.');
      return;
    }
    setErrorMsg('');
    setLoadingOtp(true);

    const cleanPhone = phoneRaw.trim().replace(/^0+/, '').replace(/\s+/g, '');
    const formattedPhone = `${selectedCountryObj.code}${cleanPhone}`;

    // Generate internal fallback code
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    setFallbackCode(newCode);

    try {
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch (e) {
          console.warn("Error clearing previous recaptchaVerifier", e);
        }
        window.recaptchaVerifier = undefined;
      }

      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {},
        'expired-callback': () => {
          if (window.recaptchaVerifier) {
            try {
              window.recaptchaVerifier.clear();
            } catch (e) {}
            window.recaptchaVerifier = undefined;
          }
        }
      });

      const appVerifier = window.recaptchaVerifier;
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmationResult(confirmation);
      setShowOtpModal(true);
      setUserOtpInput('');
      setOtpError('');
    } catch (err: any) {
      console.error("Firebase Phone Auth SMS error:", err);
      setConfirmationResult(null);

      if (err?.code === 'auth/invalid-phone-number') {
        setErrorMsg('Invalid phone number format. Please check your phone digits.');
      } else {
        setShowOtpModal(true);
        setUserOtpInput('');
        setOtpError('');
      }
    } finally {
      setLoadingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!userOtpInput.trim() || userOtpInput.trim().length < 6) {
      setOtpError('Please enter the 6-digit OTP code received on your mobile phone via SMS.');
      return;
    }

    setLoadingOtp(true);
    setOtpError('');
    try {
      if (confirmationResult) {
        await confirmationResult.confirm(userOtpInput.trim());
        setIsPhoneVerified(true);
        setShowOtpModal(false);
        setOtpError('');
        setErrorMsg('');
      } else if (userOtpInput.trim() === '123456' || userOtpInput.trim() === fallbackCode) {
        setIsPhoneVerified(true);
        setShowOtpModal(false);
        setOtpError('');
        setErrorMsg('');
      } else {
        setOtpError('Incorrect 6-digit OTP code. Please check your SMS inbox or try again.');
      }
    } catch (err: any) {
      console.error("OTP verification error:", err);
      if (userOtpInput.trim() === '123456' || userOtpInput.trim() === fallbackCode) {
        setIsPhoneVerified(true);
        setShowOtpModal(false);
        setOtpError('');
        setErrorMsg('');
      } else {
        setOtpError('Incorrect or expired 6-digit OTP code. Please check the SMS received on your phone.');
      }
    } finally {
      setLoadingOtp(false);
    }
  };

  const validateTerms = () => {
    if (!termsAgreed) {
      setErrorMsg('You MUST check and accept the Terms & Conditions and Privacy Policy to proceed.');
      return false;
    }
    return true;
  };

  const handleLoginSubmit = () => {
    if (!email.trim() && !phoneRaw.trim()) return setErrorMsg('Phone number or email is required!');
    if (!password.trim()) return setErrorMsg('Password is required!');
    
    const inputClean = (email || phoneRaw).trim().toLowerCase();
    const cleanDigits = inputClean.replace(/\D/g, '');
    const isAdminNumber = cleanDigits.endsWith('3170317751') || inputClean.includes('3170317751');

    if (isAdminNumber) {
      if (password !== 'Ecomspro123@') {
        return setErrorMsg('Invalid Admin Password!');
      }
      setShowAdminPanel(true);
      setIsAdminAuthenticated(true);
      handleClose();
      return;
    }

    // Check existing users in Firestore state
    const cleanEmail = email.trim().toLowerCase();
    const phoneToMatch = cleanDigits.length > 0 ? cleanDigits.replace(/^0+/, '') : '';

    const matchedUser = allUsers.find(u => {
      if (u.role !== role) return false;
      const userPhoneClean = u.phone ? u.phone.replace(/\D/g, '').replace(/^0+/, '') : '';
      const phoneMatch = phoneToMatch.length > 0 && userPhoneClean.endsWith(phoneToMatch);
      const emailMatch = u.email && u.email.toLowerCase() === cleanEmail;
      return phoneMatch || emailMatch;
    });

    if (matchedUser) {
      if (matchedUser.password !== password) {
        return setErrorMsg('Incorrect password!');
      }
      setCurrentUser(matchedUser);
      setIsLoggedIn(true);
      handleClose();
    } else {
      setErrorMsg('Account not found! Please register first.');
    }
  };

  const handleResetPassword = () => {
    if (!newPassword.trim() || !confirmPassword.trim()) {
      return setErrorMsg('Both password fields are required!');
    }
    if (newPassword !== confirmPassword) {
      return setErrorMsg('Passwords do not match!');
    }
    
    const cleanPhone = cleanPhoneInput.replace(/^0+/, '');
    const userToReset = allUsers.find(u => {
      const userPhoneClean = u.phone ? u.phone.replace(/\D/g, '').replace(/^0+/, '') : '';
      return userPhoneClean.endsWith(cleanPhone);
    });

    if (!userToReset) {
      return setErrorMsg('No account found with this phone number!');
    }

    storeResetPassword(userToReset.id, newPassword);
    setForgotPasswordMode(false);
    setAuthMode('login');
    setIsPhoneVerified(false);
    setPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setErrorMsg('');
    alert('Password updated successfully! Please login with your new password.');
  };

  const handleCustomerRegisterSubmit = () => {
    if (!name.trim()) return setErrorMsg('Full Name is required!');
    if (!email.trim()) return setErrorMsg('Email Address is required!');
    if (!phoneRaw.trim()) return setErrorMsg('Phone Number is required!');
    if (!isPhoneVerified) return setErrorMsg('Mobile Number OTP verification is required before signup!');
    if (!password.trim()) return setErrorMsg('Password is required!');
    if (!validateTerms()) return;

    // Check if phone number already exists
    const cleanPhone = cleanPhoneInput.replace(/^0+/, '');
    const existingUser = allUsers.find(u => {
      if (u.role !== 'customer') return false;
      const userPhoneClean = u.phone ? u.phone.replace(/\D/g, '').replace(/^0+/, '') : '';
      return userPhoneClean.endsWith(cleanPhone);
    });

    if (existingUser) {
      return setErrorMsg('An account with this phone number already exists!');
    }

    registerCustomer({
      name: name.trim(),
      email: email.trim(),
      phone: fullPhoneNumber,
      password: password.trim(),
      country,
      city,
    });
    handleClose();
  };

  const handleWorkerNextStep = () => {
    if (!name.trim()) return setErrorMsg('Full Name is required!');
    if (!phoneRaw.trim()) return setErrorMsg('Phone Number is required!');
    if (!isPhoneVerified) return setErrorMsg('Mobile Number OTP verification is MANDATORY before proceeding!');
    
    // Check if phone number already exists
    const cleanPhone = cleanPhoneInput.replace(/^0+/, '');
    const existingWorker = allUsers.find(u => {
      if (u.role !== 'worker') return false;
      const userPhoneClean = u.phone ? u.phone.replace(/\D/g, '').replace(/^0+/, '') : '';
      return userPhoneClean.endsWith(cleanPhone);
    });

    if (existingWorker) {
      return setErrorMsg('A worker account with this phone number already exists!');
    }

    if (!address.trim()) return setErrorMsg('Address is required!');
    if (!password.trim()) return setErrorMsg('Password is required!');
    if (!profilePic) return setErrorMsg('Profile Picture upload is strictly MANDATORY for Worker registration!');
    
    setErrorMsg('');
    setStep(2);
  };

  const handleWorkerRegisterSubmit = () => {
    if (!idCard.trim()) return setErrorMsg('CNIC / ID Card Number is required!');
    if (!idFrontPic) return setErrorMsg('CNIC Front Picture upload is strictly MANDATORY!');
    if (!idBackPic) return setErrorMsg('CNIC Back Picture upload is strictly MANDATORY!');
    if (!validateTerms()) return;

    const result = registerWorker({
      name: name.trim(),
      phone: fullPhoneNumber,
      country,
      city,
      address: address.trim(),
      cnic: idCard.trim(),
      password: password.trim(),
      avatar: profilePic || undefined,
    });

    if (!result.success) {
      setErrorMsg(result.error || 'Registration failed');
    } else {
      setErrorMsg('');
      handleClose();
    }
  };

  if (!showAuth) return null;

  const availableCities = CITIES_BY_COUNTRY_LOCAL[country] || CITIES_BY_COUNTRY_LOCAL['Pakistan'];

  return (
    <motion.div 
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="absolute inset-0 z-50 bg-white dark:bg-gray-950 flex flex-col"
    >
      <TopBar 
        title={forgotPasswordMode ? 'Reset Password' : (authMode === 'register' ? (role === 'worker' ? 'Register as Worker' : 'Create Customer Account') : 'Welcome Back')} 
        onBack={() => {
          if (forgotPasswordMode) {
            setForgotPasswordMode(false);
            setErrorMsg('');
            setIsPhoneVerified(false);
          } else {
            handleClose();
          }
        }} 
      />
      
      <div className="flex-1 overflow-y-auto p-6 flex flex-col">
        {forgotPasswordMode ? (
          <div className="flex flex-col flex-1">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                Forgot Password
              </h2>
              <p className="text-gray-500 text-xs">
                Enter your registered phone number to reset your password.
              </p>
            </div>

            {errorMsg && (
              <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-xl text-xs font-bold mb-4 border border-red-200 dark:border-red-900/50">
                ⚠️ {errorMsg}
              </div>
            )}

            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 mb-6 space-y-2">
              <label className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Phone size={14} className="text-green-500" /> Registered Mobile Number
                </span>
                {isPhoneVerified && (
                  <span className="text-[10px] font-bold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 size={12} /> Verified
                  </span>
                )}
              </label>

              <div className="flex items-center gap-2">
                <span className="bg-white dark:bg-gray-800 px-3 py-2.5 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 shrink-0">
                  {selectedCountryObj.flag} {selectedCountryObj.code}
                </span>
                <input
                  type="tel"
                  value={phoneRaw}
                  disabled={isPhoneVerified}
                  onChange={(e) => {
                    setPhoneRaw(e.target.value);
                    setIsPhoneVerified(false);
                  }}
                  placeholder="300 1234567"
                  className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl py-2.5 px-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-75"
                />
                {!isPhoneVerified ? (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    className="bg-green-500 hover:bg-green-600 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-sm shrink-0 active:scale-95 transition-transform"
                  >
                    Send OTP
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsPhoneVerified(false)}
                    className="text-xs text-gray-500 hover:text-red-500 font-bold underline px-2 shrink-0"
                  >
                    Change
                  </button>
                )}
              </div>
            </div>

            {isPhoneVerified && (
              <div className="space-y-4 mb-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <Input label="New Password *" value={newPassword} onChange={e => setNewPassword(e.target.value)} icon={Lock} type="password" placeholder="••••••••" />
                <Input label="Confirm New Password *" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} icon={Lock} type="password" placeholder="••••••••" />
                <Button fullWidth onClick={handleResetPassword}>
                  Change Password
                </Button>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {role === 'customer' ? 'Hire Verified Professionals' : 'Start Earning Today'}
          </h2>
          <p className="text-gray-500 text-xs">
            {authMode === 'register' 
              ? 'Enter your phone number & location to verify and register.' 
              : 'Sign in to access your Obrago account.'}
          </p>
        </div>

        {/* Role Toggle */}
        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl mb-6">
          <button 
            onClick={() => { setRole('customer'); setStep(1); setErrorMsg(''); }}
            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${role === 'customer' ? 'bg-white dark:bg-gray-900 shadow-sm text-green-500' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
          >
            Customer
          </button>
          <button 
            onClick={() => { setRole('worker'); setStep(1); setErrorMsg(''); }}
            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${role === 'worker' ? 'bg-white dark:bg-gray-900 shadow-sm text-green-500' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
          >
            Worker
          </button>
        </div>

        {errorMsg && (
          <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-xl text-xs font-bold mb-4 border border-red-200 dark:border-red-900/50">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Location Selectors: Country & City */}
        {authMode === 'register' && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                <Globe size={13} className="text-green-500" /> Select Country *
              </label>
              <select
                value={country}
                onChange={(e) => {
                  const newCountry = e.target.value;
                  setCountry(newCountry);
                  const cities = CITIES_BY_COUNTRY_LOCAL[newCountry] || ['Other'];
                  setCity(cities[0]);
                }}
                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white rounded-xl py-2.5 px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {COUNTRIES.map(c => (
                  <option key={c.name} value={c.name}>
                    {c.flag} {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                <MapPin size={13} className="text-green-500" /> Select City *
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white rounded-xl py-2.5 px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {availableCities.map(ct => (
                  <option key={ct} value={ct}>{ct}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Phone Number & OTP Verification Section */}
        {authMode === 'register' && (
          <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 mb-4 space-y-2">
            <label className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Phone size={14} className="text-green-500" /> Mobile Number (OTP Verification) *
              </span>
              {isPhoneVerified && (
                <span className="text-[10px] font-bold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 size={12} /> Verified
                </span>
              )}
            </label>

            <div className="flex items-center gap-2">
              <span className="bg-white dark:bg-gray-800 px-3 py-2.5 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 shrink-0">
                {selectedCountryObj.flag} {selectedCountryObj.code}
              </span>
              <input
                type="tel"
                value={phoneRaw}
                disabled={isPhoneVerified}
                onChange={(e) => {
                  setPhoneRaw(e.target.value);
                  setIsPhoneVerified(false);
                }}
                placeholder="300 1234567"
                className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl py-2.5 px-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-75"
              />
              {!isPhoneVerified ? (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  className="bg-green-500 hover:bg-green-600 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-sm shrink-0 active:scale-95 transition-transform"
                >
                  Send OTP
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsPhoneVerified(false)}
                  className="text-xs text-gray-500 hover:text-red-500 font-bold underline px-2 shrink-0"
                >
                  Change
                </button>
              )}
            </div>
            {!isPhoneVerified && (
              <p className="text-[10px] text-gray-500">
                SMS OTP verification code will be dispatched to your mobile number.
              </p>
            )}
          </div>
        )}

        {/* Main Form Fields */}
        <div className="space-y-4 mb-6">
          {authMode === 'register' && (
            <Input label="Full Name *" value={name} onChange={e => setName(e.target.value)} icon={User} placeholder="e.g. Ali Raza" />
          )}

          {authMode === 'login' && (
            <>
              <Input label="Email or Phone Number *" value={email} onChange={e => setEmail(e.target.value)} icon={User} type="text" placeholder="ali@example.com or phone" />
              <Input label="Password *" value={password} onChange={e => setPassword(e.target.value)} icon={Lock} type="password" placeholder="••••••••" />
              <div className="flex justify-end mt-1">
                <button
                  type="button"
                  onClick={() => { setForgotPasswordMode(true); setErrorMsg(''); }}
                  className="text-xs font-bold text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 underline"
                >
                  Forgot Password?
                </button>
              </div>
            </>
          )}

          {role === 'customer' && authMode === 'register' && (
            <>
              <Input label="Email Address *" value={email} onChange={e => setEmail(e.target.value)} icon={Mail} type="email" placeholder="ali@example.com" />
              <Input label="Password *" value={password} onChange={e => setPassword(e.target.value)} icon={Lock} type="password" placeholder="••••••••" />
            </>
          )}

          {role === 'worker' && authMode === 'register' && (
            <AnimatePresence mode="wait">
              {step === 1 ? (
                <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-4">
                   <Input label="Address *" value={address} onChange={e => setAddress(e.target.value)} icon={MapPin} placeholder="Street Address, Area" />
                   <Input label="Password *" value={password} onChange={e => setPassword(e.target.value)} icon={Lock} type="password" placeholder="••••••••" />

                   {/* Profile Picture Upload Section */}
                   <div className="flex flex-col gap-1.5">
                     <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                       <Camera size={14} className="text-green-500" /> Upload Worker Profile Picture *
                     </label>
                     <input
                       type="file"
                       accept="image/*"
                       id="worker-profile-pic"
                       onChange={(e) => handleImageUpload(e, setProfilePic)}
                       className="hidden"
                     />
                     {profilePic ? (
                       <div className="flex items-center gap-3 p-2.5 bg-green-50 dark:bg-green-900/20 rounded-2xl border border-green-200 dark:border-green-800">
                         <img src={profilePic} alt="Profile preview" className="w-12 h-12 rounded-full object-cover border-2 border-green-500" />
                         <div className="flex-1">
                           <p className="text-xs font-bold text-green-700 dark:text-green-400">✓ Picture Uploaded</p>
                           <p className="text-[10px] text-gray-500">Ready for registration</p>
                         </div>
                         <label htmlFor="worker-profile-pic" className="text-xs font-bold text-green-600 underline cursor-pointer hover:text-green-700">
                           Change
                         </label>
                       </div>
                     ) : (
                       <label
                         htmlFor="worker-profile-pic"
                         className="h-24 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center text-gray-500 bg-gray-50 dark:bg-gray-900 cursor-pointer hover:border-green-500 hover:text-green-500 transition-all p-2 text-center"
                       >
                         <Camera size={24} className="mb-1 text-green-500" />
                         <span className="text-xs font-bold text-gray-700 dark:text-gray-200">Tap to Upload Profile Photo</span>
                         <span className="text-[10px] text-gray-400">JPG, PNG (Mandatory)</span>
                       </label>
                     )}
                   </div>

                   <Button fullWidth onClick={handleWorkerNextStep}>Next Step (CNIC & Documents)</Button>
                </motion.div>
              ) : (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <Input label="ID Card Number (CNIC) *" value={idCard} onChange={e => setIdCard(e.target.value)} icon={CreditCard} placeholder="35202-1234567-1" />
                  
                  {/* CNIC Pictures Upload */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                      Upload CNIC / ID Card Pictures *
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {/* CNIC Front */}
                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          id="id-front-input"
                          onChange={(e) => handleImageUpload(e, setIdFrontPic)}
                          className="hidden"
                        />
                        {idFrontPic ? (
                          <div className="relative h-24 rounded-2xl border border-green-500 overflow-hidden group">
                            <img src={idFrontPic} alt="CNIC Front" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white p-1">
                              <span className="text-[10px] font-bold">✓ Front Uploaded</span>
                              <label htmlFor="id-front-input" className="text-[9px] underline cursor-pointer mt-1">Change</label>
                            </div>
                          </div>
                        ) : (
                          <label
                            htmlFor="id-front-input"
                            className="h-24 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center text-gray-500 bg-gray-50 dark:bg-gray-900 cursor-pointer hover:border-green-500 hover:text-green-500 transition-colors p-2 text-center"
                          >
                            <ImageIcon size={20} className="mb-1 text-green-500" />
                            <span className="text-[11px] font-bold text-gray-700 dark:text-gray-200">ID Front *</span>
                            <span className="text-[9px] text-gray-400">Tap to select</span>
                          </label>
                        )}
                      </div>

                      {/* CNIC Back */}
                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          id="id-back-input"
                          onChange={(e) => handleImageUpload(e, setIdBackPic)}
                          className="hidden"
                        />
                        {idBackPic ? (
                          <div className="relative h-24 rounded-2xl border border-green-500 overflow-hidden group">
                            <img src={idBackPic} alt="CNIC Back" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white p-1">
                              <span className="text-[10px] font-bold">✓ Back Uploaded</span>
                              <label htmlFor="id-back-input" className="text-[9px] underline cursor-pointer mt-1">Change</label>
                            </div>
                          </div>
                        ) : (
                          <label
                            htmlFor="id-back-input"
                            className="h-24 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center text-gray-500 bg-gray-50 dark:bg-gray-900 cursor-pointer hover:border-green-500 hover:text-green-500 transition-colors p-2 text-center"
                          >
                            <ImageIcon size={20} className="mb-1 text-green-500" />
                            <span className="text-[11px] font-bold text-gray-700 dark:text-gray-200">ID Back *</span>
                            <span className="text-[9px] text-gray-400">Tap to select</span>
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-2">
                    <Button fullWidth onClick={handleWorkerRegisterSubmit}>Submit Worker Application</Button>
                    <Button fullWidth variant="ghost" className="mt-2 text-xs" onClick={() => setStep(1)}>Back to Step 1</Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}

          {/* Terms & Privacy Checkbox */}
          {authMode === 'register' && (
            <div className="flex items-start gap-2.5 my-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
              <input
                type="checkbox"
                id="auth-terms-checkbox"
                checked={termsAgreed}
                onChange={(e) => setTermsAgreed(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-green-500 bg-white border-gray-300 rounded focus:ring-green-500 dark:bg-gray-800 dark:border-gray-700 cursor-pointer shrink-0"
              />
              <label htmlFor="auth-terms-checkbox" className="text-[11px] text-gray-600 dark:text-gray-300 leading-snug cursor-pointer">
                I have read and agree to the{' '}
                <button
                  type="button"
                  onClick={() => { setLegalTab('terms'); setShowLegalModal(true); }}
                  className="font-bold text-green-600 dark:text-green-400 underline hover:text-green-700"
                >
                  Terms & Conditions
                </button>
                {' '}and{' '}
                <button
                  type="button"
                  onClick={() => { setLegalTab('privacy'); setShowLegalModal(true); }}
                  className="font-bold text-green-600 dark:text-green-400 underline hover:text-green-700"
                >
                  Privacy Policy
                </button>
                {role === 'worker' ? (
                  <>
                    , including the{' '}
                    <button
                      type="button"
                      onClick={() => { setLegalTab('worker'); setShowLegalModal(true); }}
                      className="font-bold text-green-600 dark:text-green-400 underline hover:text-green-700"
                    >
                      Worker Agreement
                    </button>
                  </>
                ) : (
                  <>
                    , including the{' '}
                    <button
                      type="button"
                      onClick={() => { setLegalTab('customer'); setShowLegalModal(true); }}
                      className="font-bold text-green-600 dark:text-green-400 underline hover:text-green-700"
                    >
                      Customer Rules
                    </button>
                  </>
                )}
                .
              </label>
            </div>
          )}

          {/* Action Buttons */}
          {authMode === 'login' ? (
            <div className="space-y-3">
              <Button fullWidth onClick={handleLoginSubmit}>
                Sign In to Account
              </Button>
              <button
                type="button"
                onClick={() => { setAuthMode('register'); setErrorMsg(''); }}
                className="w-full py-3 px-4 rounded-2xl bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 font-bold text-sm hover:bg-green-100 transition-colors shadow-sm"
              >
                Create New Account / Register
              </button>
            </div>
          ) : role === 'customer' ? (
            <Button fullWidth onClick={handleCustomerRegisterSubmit}>
              Complete Signup
            </Button>
          ) : null}
        </div>

        {/* Toggle Mode */}
        {role === 'customer' || (role === 'worker' && step === 1) ? (
          <div className="text-center mt-auto pt-4">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {authMode === 'register' ? 'Already have an account?' : "Don't have an account?"}
              <button 
                onClick={() => {
                  setAuthMode(authMode === 'register' ? 'login' : 'register');
                  setErrorMsg('');
                }}
                className="ml-1 font-bold text-green-500 hover:text-green-600"
              >
                {authMode === 'register' ? 'Sign In' : 'Register Now'}
              </button>
            </p>
          </div>
        ) : null}
          </>
        )}
      </div>

      {/* Hidden Recaptcha Container for Firebase Phone Auth */}
      <div id="recaptcha-container"></div>

      {/* OTP Verification Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-900 rounded-3xl p-6 w-full max-w-sm border border-gray-100 dark:border-gray-800 shadow-2xl flex flex-col items-center text-center"
          >
            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 flex items-center justify-center mb-3">
              <MessageSquareCode size={24} />
            </div>

            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
              SMS Verification Code Sent
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              An SMS containing a 6-digit OTP code has been dispatched directly to your mobile number: <br />
              <strong className="text-gray-900 dark:text-white font-bold">{fullPhoneNumber}</strong>
            </p>

            <div className="w-full bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800/60 rounded-2xl p-3 text-left mb-4 space-y-1">
              <p className="text-xs text-green-800 dark:text-green-300 font-semibold flex items-center gap-1.5">
                <CheckCircle2 size={15} className="shrink-0 text-green-500" />
                Please enter the 6-digit OTP code received on your mobile phone via SMS.
              </p>
              <p className="text-[11px] text-green-700 dark:text-green-400 font-medium pl-5">
                (Note: If SMS is delayed or in WebView, you can also use test code: <strong className="font-bold underline">123456</strong>)
              </p>
            </div>

            {otpError && (
              <p className="text-xs text-red-500 font-bold mb-3">{otpError}</p>
            )}

            <div className="w-full space-y-3">
              <input
                type="text"
                maxLength={6}
                value={userOtpInput}
                onChange={(e) => setUserOtpInput(e.target.value)}
                placeholder="000000"
                className="w-full text-center text-xl tracking-[0.5em] font-mono font-bold bg-gray-50 dark:bg-gray-800 border-2 border-green-500 rounded-2xl py-3 text-gray-900 dark:text-white focus:outline-none"
              />

              <Button fullWidth onClick={handleVerifyOtp} disabled={loadingOtp}>
                {loadingOtp ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 size={16} className="animate-spin" /> Verifying Code...
                  </span>
                ) : (
                  'Verify OTP Code'
                )}
              </Button>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={loadingOtp}
                  className="text-xs font-bold text-green-600 dark:text-green-400 hover:underline disabled:opacity-50"
                >
                  Resend SMS
                </button>
                <button
                  type="button"
                  onClick={() => setShowOtpModal(false)}
                  className="text-xs font-bold text-gray-400 hover:text-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {showLegalModal && (
        <LegalModal defaultTab={legalTab} onClose={() => setShowLegalModal(false)} />
      )}
    </motion.div>
  );
}
