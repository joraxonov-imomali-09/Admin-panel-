import React, { useState } from 'react';
import { Bell, Sun, Moon, Laptop, Languages, Check, Sparkles, AlertCircle, Menu } from 'lucide-react';
import { LanguageType, ThemeType, NotificationItem, AdminUser } from '../types';
import { i18n } from '../i18n';
import { motion, AnimatePresence } from 'motion/react';

interface NavbarProps {
  lang: LanguageType;
  setLang: (lang: LanguageType) => void;
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  notifications: NotificationItem[];
  setNotifications: React.Dispatch<React.SetStateAction<NotificationItem[]>>;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  triggerToast: (text: string, type: 'success' | 'info' | 'alert') => void;
  currentUser?: AdminUser | null;
  onMenuToggle: () => void;
}

export default function Navbar({
  lang,
  setLang,
  theme,
  setTheme,
  notifications,
  setNotifications,
  activeTab,
  setActiveTab,
  triggerToast,
  currentUser,
  onMenuToggle,
}: NavbarProps) {
  const t = i18n[lang];
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    triggerToast(t.markAllRead, 'info');
  };

  const handleClearNotif = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const currentLangLabel = {
    en: 'English',
    uz: 'Oʻzbekcha',
    ru: 'Русский',
  }[lang];

  const name = currentUser?.name || localStorage.getItem('admin_email')?.split('@')[0] || 'Admin';
  const role = currentUser?.role || 'Administrator';
  const avatarUrl = currentUser?.avatarUrl;

  const pageSubtitle = {
    dashboard: t.analyticsOverview,
    sale: t.salesPortfolio,
    rent: t.rentalPortfolio,
    profile: t.activeSession,
    settings: t.systemPreferences,
  }[activeTab] || '';

  return (
    <header className="sticky top-0 right-0 left-0 z-10 flex items-center justify-between h-16 sm:h-20 px-4 sm:px-6 md:px-8 border-b border-slate-100 dark:border-white/10 bg-white/85 dark:bg-[#0A0A0A]/80 backdrop-blur-md">
      {/* Left: Hamburger (mobile) + Page Title */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Hamburger button — mobile only */}
        <button
          onClick={onMenuToggle}
          className="md:hidden flex items-center justify-center w-9 h-9 text-slate-600 dark:text-slate-300 hover:text-[#D4AF37] dark:hover:text-yellow-400 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 rounded-xl transition-all cursor-pointer shrink-0"
          aria-label="Open menu"
        >
          <Menu className="w-4 h-4" />
        </button>

        <div className="min-w-0">
          <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white font-sans tracking-tighter uppercase leading-none truncate">
            {activeTab === 'dashboard' && t.dashboard}
            {activeTab === 'sale' && t.propertiesForSale}
            {activeTab === 'rent' && t.rentalProperties}
            {activeTab === 'profile' && t.profile}
            {activeTab === 'settings' && t.settings}
          </h2>
          <p className="hidden sm:block text-[10px] font-black tracking-[0.2em] text-[#D4AF37] uppercase mt-1 truncate">
            {pageSubtitle}
          </p>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {/* Language Switcher */}
        <div className="relative">
          <button
            onClick={() => {
              setShowLangMenu(!showLangMenu);
              setShowThemeMenu(false);
              setShowNotifMenu(false);
            }}
            className="flex items-center gap-2 px-2 sm:px-3 py-2 text-sm font-medium text-slate-600 hover:text-[#D4AF37] dark:text-slate-300 dark:hover:text-yellow-400 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
          >
            <Languages className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="hidden sm:inline">{currentLangLabel}</span>
          </button>

          <AnimatePresence>
            {showLangMenu && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setShowLangMenu(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-44 z-30 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-2xl p-1.5"
                >
                  <div className="text-[10px] font-bold text-slate-400 tracking-wider uppercase px-3 py-1.5 font-mono">
                    {t.selectLanguage}
                  </div>
                  {(['en', 'uz', 'ru'] as LanguageType[]).map((l) => (
                    <button
                      key={l}
                      onClick={() => {
                        setLang(l);
                        setShowLangMenu(false);
                        const label = l === 'en' ? 'English' : l === 'uz' ? 'Oʻzbek' : 'Русский';
                        triggerToast(`${t.languageSwitched}: ${label}`, 'success');
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-[#D4AF37] transition-all text-left font-medium cursor-pointer"
                    >
                      <span>{l === 'en' ? 'English' : l === 'uz' ? 'Oʻzbekcha' : 'Русский'}</span>
                      {lang === l && <Check className="w-3.5 h-3.5 text-[#D4AF37]" />}
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Theme Switcher */}
        <div className="relative">
          <button
            onClick={() => {
              setShowThemeMenu(!showThemeMenu);
              setShowLangMenu(false);
              setShowNotifMenu(false);
            }}
            className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 text-slate-600 hover:text-[#D4AF37] dark:text-slate-300 dark:hover:text-yellow-400 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
          >
            {theme === 'light' && <Sun className="w-4 h-4 text-[#D4AF37]" />}
            {theme === 'dark' && <Moon className="w-4 h-4 text-[#D4AF37]" />}
            {theme === 'system' && <Laptop className="w-4 h-4" />}
          </button>

          <AnimatePresence>
            {showThemeMenu && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setShowThemeMenu(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-40 z-30 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-2xl p-1.5"
                >
                  <div className="text-[10px] font-bold text-slate-400 tracking-wider uppercase px-3 py-1.5 font-mono">
                    {t.appearance}
                  </div>
                  {[
                    { id: 'light', label: t.light, icon: Sun, color: 'text-[#065f46]' },
                    { id: 'dark', label: t.dark, icon: Moon, color: 'text-[#D4AF37]' },
                    { id: 'system', label: t.system, icon: Laptop, color: 'text-slate-500' },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setTheme(item.id as ThemeType);
                          setShowThemeMenu(false);
                          triggerToast(`${t.themeSetTo}: ${item.label}`, 'info');
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-[#D4AF37] transition-all text-left font-medium cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <Icon className={`w-3.5 h-3.5 ${item.color}`} />
                          <span>{item.label}</span>
                        </div>
                        {theme === item.id && <Check className="w-3.5 h-3.5 text-[#D4AF37]" />}
                      </button>
                    );
                  })}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifMenu(!showNotifMenu);
              setShowLangMenu(false);
              setShowThemeMenu(false);
            }}
            className="relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 text-slate-600 hover:text-[#D4AF37] dark:text-slate-300 dark:hover:text-yellow-400 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 border-2 border-white dark:border-[#0d121f] rounded-full animate-pulse" />
            )}
          </button>

          <AnimatePresence>
            {showNotifMenu && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setShowNotifMenu(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-72 sm:w-80 z-30 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
                >
                  {/* Notifications Header */}
                  <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-[#D4AF37]" />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                        {t.recentNotifications}
                      </span>
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[10px] font-semibold text-[#D4AF37] hover:underline cursor-pointer"
                      >
                        {t.markAllRead}
                      </button>
                    )}
                  </div>

                  {/* Notifications List */}
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800/50">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 text-xs">{t.noNotifications}</div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`p-3.5 flex gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors relative ${
                            n.unread ? 'bg-yellow-500/5' : ''
                          }`}
                        >
                          <div className="mt-0.5">
                            {n.type === 'success' ? (
                              <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-[#D4AF37]" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-bold text-slate-800 dark:text-slate-100 line-clamp-1">
                              {n.title}
                            </p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal mt-0.5 line-clamp-2">
                              {n.description}
                            </p>
                            <span className="text-[9px] font-mono text-slate-400 block mt-1">{n.time}</span>
                          </div>
                          <button
                            onClick={() => handleClearNotif(n.id)}
                            className="text-slate-400 hover:text-red-500 p-1 rounded transition-colors self-start text-[10px]"
                          >
                            ×
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Profile Avatar Quick Link */}
        <button
          onClick={() => setActiveTab('profile')}
          className="flex items-center gap-2 border-l border-slate-100 dark:border-slate-800/50 pl-2 sm:pl-4 cursor-pointer group"
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={name}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl object-cover border-2 border-transparent group-hover:border-[#D4AF37]/50 transition-all shadow"
            />
          ) : (
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#D4AF37]/20 border-2 border-[#D4AF37]/30 text-[#D4AF37] flex items-center justify-center font-black text-xs shrink-0">
              {name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="hidden lg:block text-left">
            <span className="block text-xs font-semibold text-slate-700 dark:text-slate-200 leading-none truncate max-w-[100px]">
              {name}
            </span>
            <span className="text-[9px] font-mono text-[#D4AF37] leading-none block mt-0.5">{role}</span>
          </div>
        </button>
      </div>
    </header>
  );
}
