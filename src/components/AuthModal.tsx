import React, { useState } from 'react';
import { UserAccount, UserRole } from '../types';
import { 
  X, 
  Lock, 
  KeyRound, 
  UserCheck, 
  ShieldAlert, 
  ShieldCheck, 
  Bike, 
  Store, 
  Shield, 
  User, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  ArrowRight,
  Phone,
  Mail,
  HelpCircle
} from 'lucide-react';
import { SUPPORT_CONTACTS } from '../data/mockData';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount;
  accounts: UserAccount[];
  onSelectUser: (user: UserAccount) => void;
  targetApp?: 'admin' | 'store' | 'rider' | 'customer';
  onRegisterCustomer?: (name: string, phone: string, email: string, pin: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  accounts,
  onSelectUser,
  targetApp,
  onRegisterCustomer,
}) => {
  const [mode, setMode] = useState<'switch_or_pin' | 'register'>('switch_or_pin');
  const [identifier, setIdentifier] = useState(''); // phone or email
  const [pin, setPin] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  // New customer registration state
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('07');
  const [regEmail, setRegEmail] = useState('');
  const [regPin, setRegPin] = useState('');

  if (!isOpen) return null;

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    const cleanIdent = identifier.trim().toLowerCase();
    const found = accounts.find(
      (acc) =>
        (acc.phone.replace(/\s+/g, '') === cleanIdent.replace(/\s+/g, '') ||
         acc.email.toLowerCase() === cleanIdent) &&
        acc.pin === pin.trim()
    );

    if (!found) {
      setAuthError('Invalid phone/email or incorrect 4-digit PIN. Please check credentials or use one-click sign in below.');
      return;
    }

    if (found.status === 'suspended') {
      setAuthError('This account has been suspended by the platform administrator. Please contact 0743926800.');
      return;
    }

    onSelectUser(found);
    onClose();
  };

  const handleDirectSelect = (acc: UserAccount) => {
    if (acc.status === 'suspended') {
      setAuthError(`Account "${acc.name}" is suspended by the Admin.`);
      return;
    }
    onSelectUser(acc);
    onClose();
  };

  const handleCustomerRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!regName.trim() || !regPhone.trim() || regPin.length < 4) {
      setAuthError('Please provide full name, phone number, and a 4-digit PIN.');
      return;
    }

    if (onRegisterCustomer) {
      onRegisterCustomer(regName.trim(), regPhone.trim(), regEmail.trim(), regPin.trim());
      onClose();
    }
  };

  const roleColor = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/40';
      case 'store':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      case 'rider':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
      case 'customer':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/40';
    }
  };

  const roleIcon = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-3.5 h-3.5" />;
      case 'store':
        return <Store className="w-3.5 h-3.5" />;
      case 'rider':
        return <Bike className="w-3.5 h-3.5" />;
      case 'customer':
        return <User className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl p-6 sm:p-7 text-white my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Versam Security & Auth
              </span>
              {targetApp && (
                <span className="text-xs text-neutral-400">
                  Switching to: <strong className="text-white capitalize">{targetApp} App</strong>
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold mt-1 text-white">Account Authentication & Switcher</h2>
            <p className="text-xs text-neutral-400">
              Each team member & customer logs in with their unique credentials and PIN.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active User Banner */}
        <div className="mt-4 p-3 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.name}
              className="w-10 h-10 rounded-xl object-cover border border-neutral-700"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">{currentUser.name}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${roleColor(currentUser.role)}`}>
                  {roleIcon(currentUser.role)}
                  <span className="capitalize">{currentUser.role}</span>
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                {currentUser.phone} • {currentUser.email}
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">
              Logged In
            </span>
          </div>
        </div>

        {authError && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{authError}</span>
          </div>
        )}

        {/* Mode Selector Tabs */}
        <div className="flex gap-2 mt-4 border-b border-neutral-800 pb-2">
          <button
            onClick={() => setMode('switch_or_pin')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              mode === 'switch_or_pin'
                ? 'bg-emerald-500 text-neutral-950 shadow-md'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            Sign In / Quick Switch
          </button>
          <button
            onClick={() => setMode('register')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              mode === 'register'
                ? 'bg-emerald-500 text-neutral-950 shadow-md'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            Create Customer Account
          </button>
        </div>

        {mode === 'switch_or_pin' ? (
          <div className="mt-4 space-y-5">
            {/* 1-Click Fast Persona Switch for Reviewer / Evaluation */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>1-Click Switch Account (With Stored PINs)</span>
                </span>
                <span className="text-[11px] text-neutral-500">Pick any role below</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
                {accounts.map((acc) => {
                  const isCurrent = acc.id === currentUser.id;
                  return (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => handleDirectSelect(acc)}
                      className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                        isCurrent
                          ? 'bg-neutral-950 border-emerald-500/60 ring-1 ring-emerald-500/30'
                          : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-950'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={acc.avatarUrl}
                          alt={acc.name}
                          className="w-8 h-8 rounded-lg object-cover shrink-0 border border-neutral-800"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-white truncate">{acc.name}</span>
                            <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${roleColor(acc.role)}`}>
                              {acc.role}
                            </span>
                          </div>
                          <div className="text-[10px] text-neutral-400 truncate">
                            PIN: <strong className="font-mono text-emerald-400">{acc.pin}</strong> • {acc.phone}
                          </div>
                        </div>
                      </div>

                      {isCurrent ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 ml-2" />
                      ) : (
                        <ArrowRight className="w-3.5 h-3.5 text-neutral-600 hover:text-neutral-300 shrink-0 ml-2" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Manual PIN / Password Sign In Form */}
            <form onSubmit={handleManualLogin} className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-3">
              <div className="text-xs font-bold text-neutral-200 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-emerald-400" />
                <span>Or Sign In with Phone / Email & 4-Digit PIN</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-400 mb-1">
                    Phone Number or Email
                  </label>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. 0743926800 or email"
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-400 mb-1">
                    4-Digit Secret PIN / Password
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="Enter PIN (e.g. 7439)"
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500 tracking-wider"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-neutral-500">
                  Default Admin PIN is <code className="font-mono text-emerald-400">7439</code>
                </span>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-neutral-950 transition cursor-pointer flex items-center gap-1.5"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Verify PIN & Sign In</span>
                </button>
              </div>
            </form>

            {/* Note regarding Rider and Store accounts */}
            <div className="p-3 rounded-xl bg-neutral-950/80 border border-neutral-800 text-[11px] text-neutral-400 flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-neutral-200">Strict Operational Security Policy:</strong>
                <p className="mt-0.5">
                  As required, <strong>Rider accounts can ONLY be opened at the Admin App</strong>. Once an administrator onboards a courier, their phone and PIN immediately become active here for the Rider App.
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Registration for Customer Account */
          <form onSubmit={handleCustomerRegister} className="mt-4 space-y-4">
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
              Customer accounts can be registered self-service. If you are a courier rider, onboarding is handled exclusively by the Admin desk.
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Full Customer Name
              </label>
              <input
                type="text"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="e.g. Christine Wangari"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  M-Pesa Phone Number
                </label>
                <input
                  type="tel"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="0743926800"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Create 4-Digit Security PIN / Password
              </label>
              <input
                type="password"
                maxLength={4}
                value={regPin}
                onChange={(e) => setRegPin(e.target.value)}
                placeholder="4-digit PIN (e.g. 1105)"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500 tracking-wider"
                required
              />
              <span className="text-[10px] text-neutral-500 mt-1 block">
                This PIN will be used for fast checkout and signing in on any device.
              </span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setMode('switch_or_pin')}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white cursor-pointer"
              >
                Back to Sign In
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-neutral-950 rounded-xl transition cursor-pointer flex items-center gap-1.5"
              >
                <UserCheck className="w-4 h-4" />
                <span>Create Customer Account</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
