/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { i18n } from '../i18n';
import { LanguageType } from '../types';

interface AuthCallbackProps {
  lang: LanguageType;
  onActivationSuccess: () => void;
}

export default function AuthCallback({ lang, onActivationSuccess }: AuthCallbackProps) {
  const t = i18n[lang];
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Parse token from URL hash or search params (Supabase sends both styles)
        const hashParams = new URLSearchParams(window.location.hash.replace('#', ''));
        const searchParams = new URLSearchParams(window.location.search);

        const tokenHash = searchParams.get('token_hash') || hashParams.get('token_hash');
        const type = searchParams.get('type') || hashParams.get('type');
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (accessToken && refreshToken) {
          // Magic link style: set session directly from hash
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) throw error;
          handleSuccess();
        } else if (tokenHash && type) {
          // OTP / email confirmation style
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as any,
          });
          if (error) throw error;
          handleSuccess();
        } else {
          // Try to get session from URL automatically (Supabase v2 handles this)
          const { data, error } = await supabase.auth.getSession();
          if (error) throw error;
          if (data.session) {
            handleSuccess();
          } else {
            throw new Error('No valid token found in URL.');
          }
        }
      } catch (err: any) {
        console.error('Auth callback error:', err);
        setErrorMsg(err.message || t.invalidLink);
        setStatus('error');
      }
    };

    handleCallback();
  }, []);

  const handleSuccess = () => {
    setStatus('success');
    localStorage.setItem('admin_authenticated', 'true');
    // Get email from Supabase session
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user?.email) {
        localStorage.setItem('admin_email', data.session.user.email);
      }
    });
    setTimeout(() => {
      onActivationSuccess();
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 bg-[#D4AF37] rounded-xl flex items-center justify-center">
            <span className="text-[#0A0A0A] font-black italic text-lg">D</span>
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter text-white uppercase font-sans leading-none">
              Denov <span className="text-[#D4AF37]">Uylari</span>
            </h1>
            <p className="text-[9px] font-black tracking-[0.2em] text-gray-500 uppercase mt-0.5">
              SaaS Admin
            </p>
          </div>
        </div>

        <div className="bg-[#0F0F0F] border border-white/10 rounded-[28px] p-8 shadow-2xl text-center">
          {status === 'loading' && (
            <>
              <div className="w-16 h-16 mx-auto mb-5 rounded-full border-4 border-[#D4AF37]/20 border-t-[#D4AF37] animate-spin" />
              <h2 className="text-base font-black text-white uppercase tracking-tight mb-2">
                {t.activatingAccount}
              </h2>
              <p className="text-xs text-gray-500">
                {t.loading}
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-base font-black text-white uppercase tracking-tight mb-2">
                {t.accountActivated}
              </h2>
              <p className="text-xs text-[#D4AF37] font-mono">
                {t.redirectingToDashboard}
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-base font-black text-white uppercase tracking-tight mb-2">
                {t.activationFailed}
              </h2>
              <p className="text-xs text-gray-500 mb-5 leading-relaxed">
                {errorMsg || t.invalidLink}
              </p>
              <button
                onClick={() => window.location.replace('/')}
                className="px-6 py-2.5 text-xs font-black uppercase tracking-widest text-slate-950 bg-[#D4AF37] hover:bg-[#AA823E] rounded-xl transition-all cursor-pointer"
              >
                {t.goToLogin}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
