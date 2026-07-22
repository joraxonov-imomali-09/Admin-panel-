/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from 'motion/react';
import { LayoutDashboard, Home, Key, User, Settings, LogOut, X } from 'lucide-react';
import { LanguageType, AdminUser } from '../types';
import { i18n } from '../i18n';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  lang: LanguageType;
  currentUser?: AdminUser | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ activeTab, setActiveTab, lang, currentUser, isOpen, onClose }: SidebarProps) {
  const t = i18n[lang];

  const menuItems = [
    { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard },
    { id: 'sale', label: t.propertiesForSale, icon: Home },
    { id: 'rent', label: t.rentalProperties, icon: Key },
    { id: 'profile', label: t.profile, icon: User },
    { id: 'settings', label: t.settings, icon: Settings },
  ];

  const handleLogout = () => {
    window.dispatchEvent(new Event('admin-logout'));
  };

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    onClose(); // close mobile drawer on navigation
  };

  const name = currentUser?.name || localStorage.getItem('admin_email')?.split('@')[0] || 'Admin';
  const email = currentUser?.email || localStorage.getItem('admin_email') || 'admin@example.com';
  const avatarUrl = currentUser?.avatarUrl;

  const sidebarContent = (
    <aside className="w-68 h-full flex flex-col justify-between border-r border-slate-200/50 bg-white dark:border-white/10 dark:bg-[#0F0F0F]">
      {/* Brand Header */}
      <div>
        <div className="flex items-center justify-between px-6 h-20 border-b border-slate-100 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#D4AF37] rounded-lg flex items-center justify-center shrink-0">
              <span className="text-[#0A0A0A] font-black italic font-sans text-base">D</span>
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tighter text-slate-900 dark:text-white uppercase font-sans leading-none">
                Denov <span className="text-[#D4AF37]">Uylari</span>
              </h1>
              <p className="text-[9px] font-black tracking-[0.2em] text-slate-400 dark:text-gray-500 uppercase mt-0.5">SaaS Admin</p>
            </div>
          </div>
          {/* Mobile close button */}
          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`relative w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs uppercase font-black tracking-wider transition-all duration-300 group cursor-pointer ${
                  isActive
                    ? 'text-[#D4AF37] dark:text-[#D4AF37] font-black'
                    : 'text-slate-600 dark:text-gray-400 hover:text-[#D4AF37] dark:hover:text-[#D4AF37] hover:bg-slate-50 dark:hover:bg-white/5'
                }`}
              >
                {/* Active Highlight Slider */}
                {isActive && (
                  <motion.div
                    layoutId="activeNavBackground"
                    className="absolute inset-0 bg-yellow-50/50 dark:bg-white/5 rounded-xl border border-yellow-200/40 dark:border-white/10"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}

                <Icon
                  className={`w-4 h-4 relative z-10 transition-transform duration-300 group-hover:scale-110 ${
                    isActive ? 'text-[#D4AF37]' : 'text-slate-400 dark:text-gray-500 group-hover:text-[#D4AF37]'
                  }`}
                />
                <span className="relative z-10">{item.label}</span>

                {/* Right Accent indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeNavDot"
                    className="absolute right-3 w-1.5 h-1.5 rounded-full bg-[#D4AF37]"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-slate-100 dark:border-white/10 bg-slate-50/30 dark:bg-[#1A1A1A]/40">
        <div className="flex items-center gap-3 px-3 py-2 rounded-2xl bg-slate-100/50 dark:bg-[#1A1A1A] border border-slate-200/30 dark:border-white/5 mb-3">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={name}
              className="w-10 h-10 rounded-xl object-cover border-2 border-[#D4AF37]/30 shadow-inner shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/20 border-2 border-[#D4AF37]/30 text-[#D4AF37] flex items-center justify-center font-black text-sm shrink-0">
              {name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-black tracking-tight text-slate-800 dark:text-white truncate">{name}</h4>
            <p className="text-[9px] font-mono text-slate-400 dark:text-gray-500 truncate">{email}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[10px] uppercase font-black tracking-widest text-slate-500 hover:text-red-500 hover:bg-red-50/50 dark:text-gray-400 dark:hover:bg-red-500/10 dark:hover:text-red-400 transition-all duration-200 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5 text-slate-400 dark:text-gray-500" />
          <span>{t.logout}</span>
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop: fixed sidebar */}
      <div className="hidden md:block fixed top-0 left-0 bottom-0 z-20 w-68 transition-all duration-300">
        {sidebarContent}
      </div>

      {/* Mobile: animated drawer overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onClose}
              className="md:hidden fixed inset-0 z-30 bg-slate-900/60 backdrop-blur-sm"
            />
            {/* Drawer panel */}
            <motion.div
              initial={{ x: -272 }}
              animate={{ x: 0 }}
              exit={{ x: -272 }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              className="md:hidden fixed top-0 left-0 bottom-0 z-40 w-68"
            >
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
