import React, { useState } from 'react';
import { Key, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { getPasswordHash, verifyPassword, hashPassword, updatePasswordHash } from '../lib/auth';
import { i18n } from '../i18n';
import { LanguageType } from '../types';

interface ChangePasswordProps {
  lang: LanguageType;
  triggerToast: (text: string, type: 'success' | 'info' | 'alert') => void;
}

export default function ChangePassword({ lang, triggerToast }: ChangePasswordProps) {
  const t = i18n[lang];
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError(t.passwordsDoNotMatch || 'New passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setError(t.passwordTooShort || 'Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const hash = await getPasswordHash();

      const isCurrentValid = await verifyPassword(currentPassword, hash);
      if (!isCurrentValid) {
        setError(t.invalidCurrentPassword || 'Current password is incorrect.');
        setLoading(false);
        return;
      }

      const newHash = await hashPassword(newPassword);
      const { error: updateError } = await updatePasswordHash(newHash);

      if (updateError) {
        throw new Error(updateError);
      }

      triggerToast(t.passwordUpdated || 'Global admin password successfully updated.', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error('Password change error:', err);
      setError('An error occurred while updating the password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-5 sm:p-6 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-xl space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Key className="w-5 h-5 text-[#D4AF37]" />
        <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
          {t.changeGlobalPassword || 'Change Global Admin Password'}
        </h3>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
        {t.changePasswordWarning || 'This password is required by ALL admins to access the panel. Changing it will affect everyone.'}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        {error && (
          <div className="bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-xl p-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-xs text-red-600 dark:text-red-400 font-medium">
              {error}
            </p>
          </div>
        )}

        <div>
          <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
            {t.currentPassword || 'Current Password'}
          </label>
          <input
            type="password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full px-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37] dark:text-white"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
            {t.newPassword || 'New Password'}
          </label>
          <input
            type="password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37] dark:text-white"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
            {t.confirmNewPassword || 'Confirm New Password'}
          </label>
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37] dark:text-white"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-[#0A0A0A] bg-[#D4AF37] hover:bg-[#AA823E] rounded-xl cursor-pointer disabled:opacity-50 transition-colors w-full sm:w-auto"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <CheckCircle className="w-4 h-4" />
          )}
          <span>{t.updatePassword || 'Update Password'}</span>
        </button>
      </form>
    </div>
  );
}
