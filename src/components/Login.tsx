import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Lock, Mail, ArrowRight, ShieldCheck, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { getPasswordHash, verifyPassword, upsertAdminUser, logAdminAccess, saveSession } from '../lib/auth';

interface LoginProps {
  onLoginSuccess: () => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();

      // 1. Fetch the global password hash from the database
      const hash = await getPasswordHash();

      // 2. Verify the entered password using bcrypt
      const isValid = await verifyPassword(password, hash);
      
      if (!isValid) {
        setError('Invalid password. Access denied.');
        setLoading(false);
        return;
      }

      // 3. Password is correct -> register the admin email & log access
      await upsertAdminUser(normalizedEmail);
      await logAdminAccess(normalizedEmail);

      // 4. Set the session in localStorage
      saveSession(normalizedEmail);

      onLoginSuccess();
    } catch (err: any) {
      console.error('Login error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0A0A0A] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#D4AF37]/5 dark:bg-[#D4AF37]/10 rounded-full blur-[100px] pointer-events-none" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[420px] relative z-10"
      >
        <div className="bg-white/80 dark:bg-[#0F0F0F]/80 backdrop-blur-xl p-8 rounded-[32px] border border-slate-200/50 dark:border-white/10 shadow-2xl">
          <div className="mb-8 text-center">
            <div className="mx-auto w-16 h-16 bg-[#D4AF37] rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-500/20 mb-6">
              <ShieldCheck className="w-8 h-8 text-[#0A0A0A]" />
            </div>
            <h1 className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white uppercase">
              Denov <span className="text-[#D4AF37]">Admin</span>
            </h1>
            <p className="text-xs font-medium text-slate-500 dark:text-gray-400 mt-2 uppercase tracking-widest">
              Global Admin Authentication
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-xl p-4 flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-xs text-red-600 dark:text-red-400 font-medium leading-relaxed">
                  {error}
                </p>
              </motion.div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-gray-500 ml-1">
                Your Admin Email
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="w-4 h-4 text-slate-400 group-focus-within:text-[#D4AF37] transition-colors" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  autoComplete="email"
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-2xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37] transition-all"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-gray-500 ml-1">
                Global Admin Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="w-4 h-4 text-slate-400 group-focus-within:text-[#D4AF37] transition-colors" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full pl-11 pr-12 py-3.5 bg-slate-50 dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-2xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-[#D4AF37] transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full relative group overflow-hidden rounded-2xl bg-[#D4AF37] disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
              <div className="relative flex items-center justify-center gap-2 py-4 px-6 text-sm font-black text-[#0A0A0A] uppercase tracking-wider">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-[#0A0A0A]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Authenticating...
                  </span>
                ) : (
                  <>
                    Sign In to Node
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </div>
            </button>
          </form>
          
          <div className="mt-8 text-center">
            <p className="text-[10px] font-mono text-slate-400 dark:text-gray-600 uppercase tracking-widest">
              Restricted Area • Shared Global Password Required
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
