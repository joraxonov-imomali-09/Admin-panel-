import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Plus,
  ShieldCheck,
  Mail,
  Phone,
  Clock,
  Trash2,
  Edit2,
  X,
  CheckCircle,
  UserPlus,
  Lock,
  User,
  Shield,
  FileText,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { AdminUser, AdminRole, LanguageType } from '../types';
import { i18n } from '../i18n';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';

interface AdminSectionProps {
  lang: LanguageType;
  admins: AdminUser[];
  setAdmins: React.Dispatch<React.SetStateAction<AdminUser[]>>;
  triggerToast: (text: string, type: 'success' | 'info' | 'alert') => void;
}

export default function AdminSection({
  lang,
  admins,
  setAdmins,
  triggerToast,
}: AdminSectionProps) {
  const t = i18n[lang];

  const [searchQuery, setSearchQuery] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePassword, setInvitePassword] = useState('');
  const [invitePhone, setInvitePhone] = useState('+998 ');
  const [inviteRole, setInviteRole] = useState<AdminRole>('Editor');
  const [inviteBio, setInviteBio] = useState('');

  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);

  // Remove confirmation state
  const [adminToRemove, setAdminToRemove] = useState<AdminUser | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const filteredAdmins = useMemo(() => {
    if (!searchQuery.trim()) return admins;
    const q = searchQuery.toLowerCase();
    return admins.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        a.role.toLowerCase().includes(q)
    );
  }, [admins, searchQuery]);

  const adminStats = useMemo(() => {
    const total = admins.length;
    const owners = admins.filter((a) => a.role === 'Owner').length;
    const active = admins.filter((a) => a.status === 'Active').length;
    return { total, owners, active };
  }, [admins]);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName || !inviteEmail) {
      triggerToast(t.fillRequiredFields, 'alert');
      return;
    }

    const passwordToUse = invitePassword || `Pass_${Math.random().toString(36).slice(-8)}!`;
    setIsSubmitting(true);

    try {
      if (editingAdmin) {
        const { error } = await supabase
          .from('admins')
          .update({
            name: inviteName,
            email: inviteEmail,
            phone: invitePhone,
            role: inviteRole,
            bio: inviteBio
          })
          .eq('id', editingAdmin.id);

        if (error) throw error;

        setAdmins((prev) => prev.map((a) => (a.id === editingAdmin.id ? {
          ...a,
          name: inviteName,
          email: inviteEmail,
          phone: invitePhone,
          role: inviteRole,
          bio: inviteBio
        } : a)));
        triggerToast(t.adminUpdated, 'success');
      } else {
        const userId = `admin-${Date.now()}`;

        const newAdmin: AdminUser = {
          id: userId,
          name: inviteName,
          email: inviteEmail,
          phone: invitePhone,
          role: inviteRole,
          avatarUrl: '',
          bio: inviteBio || 'Corporate real estate team member.',
          status: 'Active',
          lastActive: 'Just now',
        };

        const { error: dbError } = await supabase
          .from('admins')
          .insert([{
            id: newAdmin.id,
            name: newAdmin.name,
            email: newAdmin.email,
            phone: newAdmin.phone,
            role: newAdmin.role,
            bio: newAdmin.bio,
            status: newAdmin.status,
            avatar_url: '',
            last_active: newAdmin.lastActive
          }]);

        if (dbError) {
          console.warn('Database record creation warning:', dbError);
        }

        setAdmins((prev) => [...prev, newAdmin]);
        triggerToast(`${inviteName} added to admins!`, 'success');
      }

      setInviteName('');
      setInviteEmail('');
      setInvitePassword('');
      setInvitePhone('+998 ');
      setInviteRole('Editor');
      setInviteBio('');
      setEditingAdmin(null);
      setShowInviteModal(false);
    } catch (err: any) {
      console.error('Invite error:', err);
      triggerToast(err.message || t.operationFailed, 'alert');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveAdmin = async (id: string) => {
    const target = admins.find((a) => a.id === id);
    if (!target) return;

    if (target.role === 'Owner') {
      triggerToast(t.cannotRemoveOwner, 'alert');
      return;
    }

    // Show confirmation dialog
    setAdminToRemove(target);
  };

  const confirmRemoveAdmin = async () => {
    if (!adminToRemove) return;

    setIsRemoving(true);
    try {
      const { error } = await supabase.from('admins').delete().eq('id', adminToRemove.id);
      if (error) console.warn('Remove DB warning:', error);

      setAdmins((prev) => prev.filter((a) => a.id !== adminToRemove.id));
      triggerToast(t.adminRemoved, 'success');
      setAdminToRemove(null);
    } catch (err: any) {
      triggerToast(err.message || t.operationFailed, 'alert');
    } finally {
      setIsRemoving(false);
    }
  };

  const cancelRemoveAdmin = () => {
    setAdminToRemove(null);
  };

  const handleRemoveAdminOld = async (id: string) => {
    const target = admins.find((a) => a.id === id);
    if (target?.role === 'Owner') {
      triggerToast(t.cannotRemoveOwner, 'alert');
      return;
    }

    try {
      const { error } = await supabase.from('admins').delete().eq('id', id);
      if (error) console.warn('Remove DB warning:', error);

      setAdmins((prev) => prev.filter((a) => a.id !== id));
      triggerToast(t.adminRemoved, 'success');
    } catch (err: any) {
      triggerToast(err.message || t.operationFailed, 'alert');
    }
  };

  const handleEditClick = (admin: AdminUser) => {
    setEditingAdmin(admin);
    setInviteName(admin.name);
    setInviteEmail(admin.email);
    setInvitePassword('');
    setInvitePhone(admin.phone);
    setInviteRole(admin.role);
    setInviteBio(admin.bio);
    setShowInviteModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Admin stats widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 sm:p-5 rounded-2xl border border-slate-100 dark:border-white/5 bg-white dark:bg-[#0F0F0F] flex items-center gap-4 shadow-xl">
          <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 text-[#D4AF37] flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-gray-500 block">{t.totalAdmins}</span>
            <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight mt-0.5 block">{adminStats.total} {t.members}</span>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl border border-slate-100 dark:border-white/5 bg-white dark:bg-[#0F0F0F] flex items-center gap-4 shadow-xl">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-gray-500 block">{t.activeSessions}</span>
            <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight mt-0.5 block">{adminStats.active} {t.verified}</span>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl border border-slate-100 dark:border-white/5 bg-white dark:bg-[#0F0F0F] flex items-center gap-4 shadow-xl">
          <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 text-[#D4AF37] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-gray-500 block">{t.systemOwners}</span>
            <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight mt-0.5 block">{adminStats.owners} {t.owners}</span>
          </div>
        </div>
      </div>

      {/* Admin Management Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-white/10">
        <div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white font-sans uppercase tracking-tight">{t.adminManagement}</h3>
          <p className="text-xs text-slate-400 dark:text-gray-500 mt-1 italic font-medium lowercase">{t.adminManagementSubtitle}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder={t.searchAdmin}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-auto pl-9 pr-3 py-2 text-xs font-black uppercase tracking-wider bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37] dark:text-white"
            />
          </div>

          {/* Invite button */}
          <button
            onClick={() => {
              setEditingAdmin(null);
              setInviteName('');
              setInviteEmail('');
              setInvitePassword('');
              setInvitePhone('+998 ');
              setInviteRole('Editor');
              setInviteBio('');
              setShowInviteModal(true);
            }}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-slate-950 bg-[#D4AF37] hover:bg-[#AA823E] rounded-xl shadow-lg shadow-yellow-500/10 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-slate-950" />
            <span>{t.inviteAdminBtn}</span>
          </button>
        </div>
      </div>

      {/* Admin Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <AnimatePresence mode="popLayout">
          {filteredAdmins.map((admin) => {
            const isOwner = admin.role === 'Owner';
            const isPending = admin.status === 'Pending';

            return (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={admin.id}
                className="p-5 sm:p-6 rounded-[24px] border border-slate-100 dark:border-white/5 bg-white dark:bg-[#0F0F0F] shadow-2xl flex flex-col justify-between hover:border-[#D4AF37]/20 transition-all"
              >
                <div>
                  {/* Top line with role/status */}
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider ${
                        isOwner
                          ? 'bg-yellow-50 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-200/50 dark:border-yellow-500/10'
                          : admin.role === 'Administrator'
                          ? 'bg-[#D4AF37]/10 dark:bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/20'
                          : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-500/10'
                      }`}
                    >
                      {admin.role === 'Owner' ? t.owner :
                       admin.role === 'Administrator' ? t.administrator :
                       t.editor}
                    </span>

                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-wider ${
                        isPending ? 'text-orange-400' : 'text-slate-400 dark:text-gray-500'
                      }`}
                    >
                      <Clock className="w-3 h-3" />
                      <span>{isPending ? t.pending : admin.lastActive}</span>
                    </span>
                  </div>

                  {/* Profile Info */}
                  <div className="flex gap-4 mb-4">
                    {admin.avatarUrl ? (
                      <img
                        src={admin.avatarUrl}
                        alt={admin.name}
                        className="w-12 h-12 rounded-xl object-cover border-2 border-slate-100 dark:border-white/10 shadow-sm shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/20 border-2 border-[#D4AF37]/30 text-[#D4AF37] flex items-center justify-center font-black text-base shrink-0">
                        {(admin.name || 'A').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">{admin.name}</h4>
                      <p className="text-[10px] text-slate-400 dark:text-gray-500 mt-1.5 leading-relaxed line-clamp-2">{admin.bio}</p>
                    </div>
                  </div>

                  {/* Contact Fields */}
                  <div className="space-y-1.5 py-3.5 border-t border-b border-slate-50 dark:border-white/5">
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-gray-400 font-bold uppercase tracking-wider">
                      <Mail className="w-3 h-3 text-slate-400 dark:text-gray-500 shrink-0" />
                      <span className="truncate">{admin.email}</span>
                    </div>
                    {admin.phone && (
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-gray-400 font-bold uppercase tracking-wider">
                        <Phone className="w-3 h-3 text-slate-400 dark:text-gray-500 shrink-0" />
                        <span>{admin.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Action footer */}
                <div className="flex items-center justify-end gap-2 mt-4 pt-2">
                  <button
                    onClick={() => handleEditClick(admin)}
                    className="p-2 rounded-lg text-slate-400 hover:text-[#D4AF37] hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  {!isOwner && (
                    <button
                      onClick={() => handleRemoveAdmin(admin.id)}
                      className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Invite / Edit Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!isSubmitting) {
                  setShowInviteModal(false);
                  setEditingAdmin(null);
                }
              }}
              className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              className="fixed inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 top-1/2 -translate-y-1/2 w-auto sm:w-full sm:max-w-lg p-5 sm:p-7 z-50 bg-white dark:bg-[#0F0F0F] border border-slate-200/80 dark:border-white/10 rounded-[24px] sm:rounded-[32px] shadow-2xl flex flex-col font-sans max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-4 sm:pb-5 border-b border-slate-100 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-9 sm:w-10 h-9 sm:h-10 rounded-2xl bg-[#D4AF37]/15 text-[#D4AF37] flex items-center justify-center shadow-inner shrink-0">
                    <UserPlus className="w-4 sm:w-5 h-4 sm:h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">
                      {editingAdmin ? t.editAccessPrivileges : t.inviteNewAdmin}
                    </h4>
                    <p className="text-[10px] text-slate-400 dark:text-gray-500 font-medium">
                      {editingAdmin ? t.modifyAdminParams : t.sendSecureInvite}
                    </p>
                  </div>
                </div>
                <button
                  disabled={isSubmitting}
                  onClick={() => {
                    setShowInviteModal(false);
                    setEditingAdmin(null);
                  }}
                  className="p-2 text-slate-400 hover:text-slate-700 dark:text-gray-400 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSendInvite} className="space-y-4 pt-4 sm:pt-5">
                {/* Name */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 dark:text-gray-400 mb-1.5">
                    {t.adminName} *
                  </label>
                  <div className="relative group">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#D4AF37] transition-colors" />
                    <input
                      type="text"
                      required
                      value={inviteName}
                      onChange={(e) => setInviteName(e.target.value)}
                      placeholder="e.g. Elena Smirnova"
                      className="w-full pl-10 pr-4 py-2.5 text-xs font-semibold bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37] dark:text-white transition-all placeholder:text-slate-400 dark:placeholder:text-gray-600"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 dark:text-gray-400 mb-1.5">
                    {t.email} *
                  </label>
                  <div className="relative group">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#D4AF37] transition-colors" />
                    <input
                      type="email"
                      required
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="e.g. elena@premiumestates.uz"
                      className="w-full pl-10 pr-4 py-2.5 text-xs font-semibold bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37] dark:text-white transition-all placeholder:text-slate-400 dark:placeholder:text-gray-600"
                    />
                  </div>
                </div>

                {/* Password (only when creating) */}
                {!editingAdmin && (
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 dark:text-gray-400 mb-1.5">
                      {t.initialSecurityKey}
                    </label>
                    <div className="relative group">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#D4AF37] transition-colors" />
                      <input
                        type="password"
                        value={invitePassword}
                        onChange={(e) => setInvitePassword(e.target.value)}
                        placeholder={t.autoGenerated}
                        className="w-full pl-10 pr-4 py-2.5 text-xs font-semibold bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37] dark:text-white transition-all placeholder:text-slate-400 dark:placeholder:text-gray-600"
                      />
                    </div>
                  </div>
                )}

                {/* Phone & Role Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 dark:text-gray-400 mb-1.5">
                      {t.phoneNumber}
                    </label>
                    <div className="relative group">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#D4AF37] transition-colors" />
                      <input
                        type="text"
                        value={invitePhone}
                        onChange={(e) => setInvitePhone(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 text-xs font-semibold bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37] dark:text-white transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 dark:text-gray-400 mb-1.5">
                      {t.role}
                    </label>
                    <div className="relative group">
                      <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#D4AF37] transition-colors" />
                      <select
                        value={inviteRole}
                        onChange={(e) => setInviteRole(e.target.value as AdminRole)}
                        className="w-full pl-10 pr-4 py-2.5 text-xs font-semibold bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl dark:text-gray-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37] transition-all"
                      >
                        <option value="Owner">{t.owner}</option>
                        <option value="Administrator">{t.administrator}</option>
                        <option value="Editor">{t.editor}</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 dark:text-gray-400 mb-1.5">
                    {t.shortBio}
                  </label>
                  <div className="relative group">
                    <FileText className="absolute left-3.5 top-3 w-4 h-4 text-slate-400 group-focus-within:text-[#D4AF37] transition-colors" />
                    <textarea
                      value={inviteBio}
                      onChange={(e) => setInviteBio(e.target.value)}
                      rows={2}
                      placeholder={t.bioPlaceholder}
                      className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37] dark:text-white transition-all placeholder:text-slate-400 dark:placeholder:text-gray-600"
                    />
                  </div>
                </div>

                {/* Submit footer */}
                <div className="flex items-center justify-end gap-3 pt-4 sm:pt-5 mt-2 border-t border-slate-100 dark:border-white/10">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => {
                      setShowInviteModal(false);
                      setEditingAdmin(null);
                    }}
                    className="px-4 sm:px-5 py-2.5 text-xs font-black uppercase tracking-wider text-slate-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                  >
                    {t.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-4 sm:px-6 py-2.5 text-xs font-black uppercase tracking-wider text-slate-950 bg-[#D4AF37] hover:bg-[#AA823E] rounded-xl shadow-lg shadow-yellow-500/20 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>{t.sending}</span>
                      </>
                    ) : (
                      <span>{editingAdmin ? t.saveChanges : t.inviteBtn}</span>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Remove Confirmation Dialog */}
      <AnimatePresence>
        {adminToRemove && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isRemoving && cancelRemoveAdmin()}
              className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              className="fixed inset-x-3 xs:inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 top-1/2 -translate-y-1/2 w-auto sm:w-full sm:max-w-md p-4 xs:p-5 sm:p-7 z-51 bg-white dark:bg-[#0F0F0F] border border-slate-200/80 dark:border-white/10 rounded-[20px] sm:rounded-[32px] shadow-2xl flex flex-col font-sans max-h-[90vh] overflow-y-auto"
            >
              {/* Alert Icon and Title */}
              <div className="flex gap-3 sm:gap-4 mb-4 sm:mb-5">
                <div className="w-11 sm:w-12 h-11 sm:h-12 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-500 flex items-center justify-center shrink-0 flex-shrink-0">
                  <AlertCircle className="w-5 sm:w-6 h-5 sm:h-6" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">
                    {t.removeAdminTitle || 'Remove Administrator'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5 sm:mt-1 font-medium">
                    {t.removeAdminWarning || 'This action cannot be undone.'}
                  </p>
                </div>
              </div>

              {/* Confirmation Message */}
              <div className="bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
                <p className="text-xs sm:text-sm text-slate-800 dark:text-gray-200 font-medium">
                  {t.removeAdminConfirm1 || 'Are you sure you want to remove'} <span className="font-black text-red-600 dark:text-red-400">{adminToRemove.name}</span>?
                </p>
                <p className="text-xs text-slate-600 dark:text-gray-400 mt-2 sm:mt-3 leading-relaxed">
                  {t.removeAdminConfirm2 || 'They will immediately lose access to the admin panel and all their sessions will be terminated.'}
                </p>
              </div>

              {/* Admin Info */}
              <div className="bg-slate-50 dark:bg-white/5 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 space-y-1.5 sm:space-y-2 border border-slate-100 dark:border-white/10">
                <div className="flex items-center justify-between text-[11px] sm:text-xs">
                  <span className="text-slate-500 dark:text-gray-400 uppercase font-bold tracking-wider truncate">{t.name}</span>
                  <span className="text-slate-900 dark:text-white font-black text-right truncate ml-2">{adminToRemove.name}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] sm:text-xs">
                  <span className="text-slate-500 dark:text-gray-400 uppercase font-bold tracking-wider truncate">{t.email}</span>
                  <span className="text-slate-900 dark:text-white font-mono text-[10px] sm:text-xs text-right truncate ml-2">{adminToRemove.email}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] sm:text-xs">
                  <span className="text-slate-500 dark:text-gray-400 uppercase font-bold tracking-wider truncate">{t.role}</span>
                  <span className="text-slate-900 dark:text-white font-black text-right truncate ml-2">{adminToRemove.role}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-slate-100 dark:border-white/10">
                <button
                  onClick={cancelRemoveAdmin}
                  disabled={isRemoving}
                  className="px-3 sm:px-4 py-2.5 sm:py-3 text-xs font-black uppercase tracking-wider text-slate-600 hover:text-slate-800 dark:text-gray-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed w-auto"
                >
                  {t.cancel || 'Cancel'}
                </button>
                <button
                  onClick={confirmRemoveAdmin}
                  disabled={isRemoving}
                  className="flex items-center gap-1.5 px-3 sm:px-4 py-2.5 sm:py-3 text-xs font-black uppercase tracking-wider text-white bg-red-500 hover:bg-red-600 rounded-xl shadow-lg shadow-red-500/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRemoving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span className="hidden sm:inline">{t.removing || 'Removing...'}</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{t.remove || 'Remove'}</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
