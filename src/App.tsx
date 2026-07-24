/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Property,
  RentalProperty,
  AdminUser,
  AdminRole,
  LanguageType,
  ThemeType,
  NotificationItem,
  RecentActivityItem,
  CurrencyType,
} from './types';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import AnalyticsCharts from './components/AnalyticsCharts';
import PropertyTable from './components/PropertyTable';
import PropertyFormModal from './components/PropertyFormModal';
import AdminSection from './components/AdminSection';
import Toast, { ToastMessage } from './components/Toast';
import Login from './components/Login';
import { supabase } from './lib/supabase';
import { isSessionValid, clearSession } from './lib/auth';
import { formatPrice } from './lib/currency';
import ChangePassword from './components/ChangePassword';

import {
  initialSalesProperties,
  initialRentalProperties,
  initialAdmins,
  initialNotifications,
  initialActivities,
} from './mockData';
import { i18n } from './i18n';
import { motion, AnimatePresence } from 'motion/react';
import {
  Eye,
  Home,
  Key,
  TrendingUp,
  Plus,
  Phone,
  Send,
  Building2,
  Calendar,
  Layers,
  MapPin,
  Check,
  Languages,
  Shield,
  Bell,
  Activity,
  ChevronRight,
  Lock,
  X,
} from 'lucide-react';

export default function App() {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(isSessionValid());

  // Global States
  const [lang, setLang] = useState<LanguageType>('en');
  const [theme, setTheme] = useState<ThemeType>(() => {
    const saved = localStorage.getItem('theme-preference');
    return (saved as ThemeType) || 'dark';
  });
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Mobile sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Portfolios
  const [salesProperties, setSalesProperties] = useState<Property[]>(initialSalesProperties);
  const [rentalProperties, setRentalProperties] = useState<RentalProperty[]>(initialRentalProperties);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [activities, setActivities] = useState<RecentActivityItem[]>(initialActivities);

  // Modal control states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<any | null>(null);
  const [previewProperty, setPreviewProperty] = useState<any | null>(null);

  // Table loading simulation state
  const [isTableLoading, setIsTableLoading] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const triggerToast = (text: string, type: 'success' | 'info' | 'alert') => {
    const newToast: ToastMessage = { id: `toast-${Date.now()}`, text, type };
    setToasts((prev) => [...prev, newToast]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const t = i18n[lang];

  // Apply Theme class
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
    localStorage.setItem('theme-preference', theme);
  }, [theme]);

  // Handle logout event from Navbar or other components
  useEffect(() => {
    const handleLogout = () => {
      clearSession();
      setIsAuthenticated(false);
    };

    window.addEventListener('admin-logout', handleLogout);
    return () => window.removeEventListener('admin-logout', handleLogout);
  }, []);

  // Close sidebar on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loggedInEmail = useMemo(() => {
    return localStorage.getItem('admin_email') || 'joraxonovimomali@gmail.com';
  }, [isAuthenticated]);

  const currentUserAdmin = useMemo(() => {
    return admins.find((a) => a.email.toLowerCase() === loggedInEmail.toLowerCase()) || {
      id: 'admin-current',
      name: loggedInEmail.split('@')[0],
      email: loggedInEmail,
      phone: '',
      role: 'Owner' as const,
      avatarUrl: '',
      bio: '',
      status: 'Active' as const,
      lastActive: 'Just now',
    };
  }, [admins, loggedInEmail]);

  // Fetch Admins
  useEffect(() => {
    if (isAuthenticated) {
      const fetchAdmins = async () => {
        const { data, error } = await supabase
          .from('admins')
          .select('*')
          .order('name');

        if (!error && data) {
          const formattedAdmins = data.map((item: any) => ({
            id: item.id,
            name: item.name || '',
            email: item.email || '',
            phone: item.phone || '',
            role: item.role as AdminRole,
            avatarUrl: item.avatar_url || item.avatarUrl || '',
            bio: item.bio || '',
            status: item.status || 'Active',
            lastActive: item.last_active || 'Just now',
          }));
          setAdmins(formattedAdmins);
        }
      };
      fetchAdmins();
    }
  }, [isAuthenticated]);

  // Fetch Properties from Supabase
  useEffect(() => {
    if (isAuthenticated) {
      const fetchProperties = async () => {
        setIsTableLoading(true);
        try {
          const { data, error } = await supabase
            .from('properties')
            .select('*')
            .order('created_at', { ascending: false });

          if (error) {
            console.error('Error fetching properties:', error);
          } else if (data) {
            const sales: Property[] = [];
            const rentals: RentalProperty[] = [];

            data.forEach((item: any) => {
              const formatted: any = {
                id: String(item.id),
                title: item.title || '',
                description: item.description || '',
                price: Number(item.price) || 0,
                currency: item.currency || 'USD',
                city: item.city || '',
                district: item.district || '',
                fullAddress: item.fullAddress || item.full_address || '',
                googleMapsLink: item.googleMapsLink || item.google_maps_link || '',
                // Display-only: derive from canonical `category` field
                propertyType: item.category === 'apartment' ? 'Apartment' : 'House',
                rooms: Number(item.rooms) || 0,
                bathrooms: Number(item.bathrooms) || 0,
                floor: Number(item.floor) || 0,
                totalFloors: Number(item.totalFloors || item.total_floors) || 0,
                parking: Boolean(item.parking),
                furniture: Boolean(item.furniture),
                constructionYear: Number(item.constructionYear || item.construction_year) || 2023,
                phoneNumber: item.phoneNumber || item.phone_number || '',
                telegramUsername: item.telegramUsername || item.telegram_username || '',
                status: item.status || 'Active',
                isFeatured: Boolean(item.isFeatured || item.is_featured),
                images: Array.isArray(item.images)
                  ? item.images
                  : typeof item.images === 'string'
                  ? JSON.parse(item.images)
                  : [],
                features: Array.isArray(item.features)
                  ? item.features
                  : typeof item.features === 'string'
                  ? JSON.parse(item.features)
                  : [],
                views: Number(item.views) || 0,
                category: item.category,
                createdDate: item.createdDate || item.created_at || new Date().toISOString(),
              };

              if (item.category === 'apartment') {
                rentals.push(formatted as RentalProperty);
              } else {
                sales.push(formatted as Property);
              }
            });

            setSalesProperties(sales);
            setRentalProperties(rentals);
          }
        } catch (err) {
          console.error('Failed to load properties:', err);
        } finally {
          setIsTableLoading(false);
        }
      };

      fetchProperties();
    }
  }, [isAuthenticated]);

  // Analytics Derived Stats
  const totalSalesViews = useMemo(() => salesProperties.reduce((sum, p) => sum + p.views, 0), [salesProperties]);
  const totalRentalViews = useMemo(() => rentalProperties.reduce((sum, p) => sum + p.views, 0), [rentalProperties]);
  const overallViews = totalSalesViews + totalRentalViews;

  const totalActiveSales = useMemo(() => salesProperties.filter((p) => p.status === 'Active').length, [salesProperties]);
  const totalSold = useMemo(() => salesProperties.filter((p) => p.status === 'Sold').length, [salesProperties]);
  const totalRentalsCount = useMemo(() => rentalProperties.length, [rentalProperties]);

  const activePropertiesCombined = totalActiveSales + rentalProperties.filter((p) => p.status === 'Active').length;

  const recentPropertyPosts = useMemo(() => {
    const combined = [
      ...salesProperties.map((p) => ({ ...p, tab: 'sale' })),
      ...rentalProperties.map((p) => ({ ...p, tab: 'rent' })),
    ];
    return combined
      .sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime())
      .slice(0, 3);
  }, [salesProperties, rentalProperties]);

  // CRUD actions for Sale and Rental Portfolios
  const handleSaveProperty = async (formData: any) => {
    setIsTableLoading(true);

    try {
      const isNew = String(formData.id).startsWith('prop-');
      const { id, ...dataToSave } = formData;
      // Single canonical category field — derive for creates from the active admin tab.
      const category = activeTab === 'rent' ? 'apartment' : 'house';

      // Map camelCase to snake_case for Supabase
      const dbPayload = {
        title: dataToSave.title,
        description: dataToSave.description,
        price: dataToSave.price,
        currency: dataToSave.currency,
        city: dataToSave.city,
        district: dataToSave.district,
        full_address: dataToSave.fullAddress,
        // NOTE: Do not write any duplicate category fields (e.g. property_type).
        rooms: dataToSave.rooms,
        bathrooms: dataToSave.bathrooms,
        floor: dataToSave.floor,
        total_floors: dataToSave.totalFloors,
        parking: dataToSave.parking,
        furniture: dataToSave.furniture,
        construction_year: dataToSave.constructionYear,
        phone_number: dataToSave.phoneNumber,
        telegram_username: dataToSave.telegramUsername,
        status: dataToSave.status,
        is_featured: dataToSave.isFeatured,
        images: dataToSave.images,
        features: dataToSave.features,
        views: dataToSave.views,
        category: category,
      };

      let dbResult;

      if (isNew) {
        const { data, error } = await supabase
          .from('properties')
          .insert([dbPayload])
          .select()
          .single();

        if (error) throw error;
        dbResult = data;
      } else {
        // For updates: do NOT modify `category` implicitly. Only update other fields.
        const { category: _c, ...updatePayload } = dbPayload as any;

        const { data, error } = await supabase
          .from('properties')
          .update(updatePayload)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        dbResult = data;
      }

      // Map snake_case back to camelCase for UI state
      const savedData = {
        id: String(dbResult.id),
        title: dbResult.title || '',
        description: dbResult.description || '',
        price: Number(dbResult.price) || 0,
        currency: dbResult.currency || 'USD',
        city: dbResult.city || '',
        district: dbResult.district || '',
        fullAddress: dbResult.full_address || '',
        googleMapsLink: dbResult.google_maps_link || '',
        // Display-only propertyType derived from canonical `category`
        propertyType: dbResult.category === 'apartment' ? 'Apartment' : 'House',
        rooms: Number(dbResult.rooms) || 0,
        bathrooms: Number(dbResult.bathrooms) || 0,
        floor: Number(dbResult.floor) || 0,
        totalFloors: Number(dbResult.total_floors) || 0,
        parking: Boolean(dbResult.parking),
        furniture: Boolean(dbResult.furniture),
        constructionYear: Number(dbResult.construction_year) || 2023,
        phoneNumber: dbResult.phone_number || '',
        telegramUsername: dbResult.telegram_username || '',
        status: dbResult.status || 'Active',
        isFeatured: Boolean(dbResult.is_featured),
        images: Array.isArray(dbResult.images) ? dbResult.images : [],
        features: Array.isArray(dbResult.features) ? dbResult.features : [],
        views: Number(dbResult.views) || 0,
        category: dbResult.category,
        createdDate: dbResult.created_at || new Date().toISOString(),
      };

      if (activeTab === 'sale') {
        if (!isNew) {
          setSalesProperties((prev) => prev.map((p) => (p.id === savedData.id ? (savedData as any) : p)));
          triggerToast(t.successUpdate, 'success');
        } else {
          setSalesProperties((prev) => [(savedData as any), ...prev]);
          triggerToast(t.successCreate, 'success');
        }

        const newAct: RecentActivityItem = {
          id: `act-${Date.now()}`,
          adminName: currentUserAdmin.name,
          action: `${!isNew ? 'Updated' : 'Published'} sale property "${savedData.title}"`,
          time: 'Just now',
          type: !isNew ? 'edit' : 'create',
        };
        setActivities((prev) => [newAct, ...prev]);
      } else if (activeTab === 'rent') {
        if (!isNew) {
          setRentalProperties((prev) => prev.map((p) => (p.id === savedData.id ? (savedData as any) : p)));
          triggerToast(t.successUpdate, 'success');
        } else {
          setRentalProperties((prev) => [(savedData as any), ...prev]);
          triggerToast(t.successCreate, 'success');
        }

        const newAct: RecentActivityItem = {
          id: `act-${Date.now()}`,
          adminName: currentUserAdmin.name,
          action: `${!isNew ? 'Updated' : 'Published'} rental property "${savedData.title}"`,
          time: 'Just now',
          type: !isNew ? 'edit' : 'create',
        };
        setActivities((prev) => [newAct, ...prev]);
      }

      setIsFormOpen(false);
      setEditingProperty(null);
    } catch (error: any) {
      console.error('Error saving property:', error);
      triggerToast(`${t.failedSave}: ${error.message}`, 'alert');
    } finally {
      setIsTableLoading(false);
    }
  };

  const handleDeleteProperty = async (id: string) => {
    if (!window.confirm(t.confirmDeleteMsg)) return;

    try {
      const { error } = await supabase.from('properties').delete().eq('id', id);
      if (error) throw error;

      if (activeTab === 'sale') {
        const target = salesProperties.find((p) => p.id === id);
        setSalesProperties((prev) => prev.filter((p) => p.id !== id));
        triggerToast(t.successDelete, 'success');

        setActivities((prev) => [
          {
            id: `act-${Date.now()}`,
            adminName: currentUserAdmin.name,
            action: `Deleted sale listing "${target?.title || id}"`,
            time: 'Just now',
            type: 'delete',
          },
          ...prev,
        ]);
      } else if (activeTab === 'rent') {
        const target = rentalProperties.find((p) => p.id === id);
        setRentalProperties((prev) => prev.filter((p) => p.id !== id));
        triggerToast(t.successDelete, 'success');

        setActivities((prev) => [
          {
            id: `act-${Date.now()}`,
            adminName: currentUserAdmin.name,
            action: `Deleted rental listing "${target?.title || id}"`,
            time: 'Just now',
            type: 'delete',
          },
          ...prev,
        ]);
      }
    } catch (err: any) {
      console.error('Delete property error:', err);
      triggerToast(`${t.failedDelete}: ${err.message}`, 'alert');
    }
  };

  const handleHideProperty = async (id: string) => {
    const list = activeTab === 'sale' ? salesProperties : rentalProperties;
    const target = list.find((p) => p.id === id);
    if (!target) return;
    const nextStatus = target.status === 'Hidden' ? 'Active' : 'Hidden';

    try {
      const { error } = await supabase
        .from('properties')
        .update({ status: nextStatus })
        .eq('id', id);

      if (error) throw error;

      if (activeTab === 'sale') {
        setSalesProperties((prev) =>
          prev.map((p) => (p.id === id ? { ...p, status: nextStatus as any } : p))
        );
      } else {
        setRentalProperties((prev) =>
          prev.map((p) => (p.id === id ? { ...p, status: nextStatus as any } : p))
        );
      }
      triggerToast(`${t.statusSetTo}: ${nextStatus}`, 'info');
    } catch (err: any) {
      console.error('Hide property error:', err);
      triggerToast(`${t.failedStatus}: ${err.message}`, 'alert');
    }
  };

  const handleDuplicateProperty = async (prop: any) => {
    const { id, ...dataToDuplicate } = prop;
    const duplicatedData = {
      ...dataToDuplicate,
      title: `${prop.title} (Copy)`,
      views: 0,
      createdDate: new Date().toISOString(),
      category: activeTab === 'rent' ? 'apartment' : 'house',
    };

    try {
      const { data, error } = await supabase
        .from('properties')
        .insert([duplicatedData])
        .select()
        .single();

      if (error) throw error;

      const duplicated = data || { ...duplicatedData, id: `prop-dup-${Date.now()}` };

      if (activeTab === 'sale') {
        setSalesProperties((prev) => [duplicated, ...prev]);
      } else if (activeTab === 'rent') {
        setRentalProperties((prev) => [duplicated, ...prev]);
      }

      triggerToast(t.successDuplicate, 'success');
    } catch (err: any) {
      console.error('Duplicate property error:', err);
      triggerToast(`${t.failedDuplicate}: ${err.message}`, 'alert');
    }
  };

  // Profile Edit fields
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileBio, setProfileBio] = useState('');
  const [profileAvatarUrl, setProfileAvatarUrl] = useState('');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentUserAdmin) {
      setProfileName(currentUserAdmin.name || '');
      setProfileEmail(currentUserAdmin.email || loggedInEmail);
      setProfilePhone(currentUserAdmin.phone || '');
      setProfileBio(currentUserAdmin.bio || '');
      setProfileAvatarUrl(currentUserAdmin.avatarUrl || '');
    }
  }, [currentUserAdmin, loggedInEmail]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `avatar-${Date.now()}.${fileExt}`;
    setIsUploadingAvatar(true);

    try {
      const { error: uploadError } = await supabase.storage
        .from('uylar')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('uylar').getPublicUrl(fileName);
      const newAvatarUrl = data.publicUrl;
      setProfileAvatarUrl(newAvatarUrl);

      if (currentUserAdmin && currentUserAdmin.id && !currentUserAdmin.id.startsWith('admin-')) {
        await supabase
          .from('admins')
          .update({ avatar_url: newAvatarUrl })
          .eq('id', currentUserAdmin.id);

        setAdmins((prev) =>
          prev.map((a) => (a.id === currentUserAdmin.id ? { ...a, avatarUrl: newAvatarUrl } : a))
        );
      }
      triggerToast(t.avatarUploaded, 'success');
    } catch (err: any) {
      console.error('Avatar upload error:', err);
      triggerToast(`${t.failedAvatarUpload}: ${err.message}`, 'alert');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (currentUserAdmin && currentUserAdmin.id && !currentUserAdmin.id.startsWith('admin-')) {
        const { error } = await supabase
          .from('admins')
          .update({
            name: profileName,
            email: profileEmail,
            phone: profilePhone,
            bio: profileBio,
            avatar_url: profileAvatarUrl,
          })
          .eq('id', currentUserAdmin.id);

        if (error) throw error;

        setAdmins((prev) =>
          prev.map((a) =>
            a.id === currentUserAdmin.id
              ? {
                  ...a,
                  name: profileName,
                  email: profileEmail,
                  phone: profilePhone,
                  bio: profileBio,
                  avatarUrl: profileAvatarUrl,
                }
              : a
          )
        );
      }
      triggerToast(t.successProfile, 'success');
    } catch (err: any) {
      console.error('Profile update error:', err);
      triggerToast(`${t.failedProfile}: ${err.message}`, 'alert');
    }
  };

  if (!isAuthenticated) {
    return <Login onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 dark:bg-[#0A0A0A] dark:text-white transition-colors duration-300 font-sans flex">
      {/* Sidebar — handles its own desktop fixed / mobile drawer */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        lang={lang}
        currentUser={currentUserAdmin}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main right panel — ml-0 on mobile, ml-68 on desktop */}
      <div className="flex-1 md:ml-68 flex flex-col min-h-screen">
        {/* Navbar */}
        <Navbar
          lang={lang}
          setLang={setLang}
          theme={theme}
          setTheme={setTheme}
          notifications={notifications}
          setNotifications={setNotifications}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          triggerToast={triggerToast}
          currentUser={currentUserAdmin}
          onMenuToggle={() => setIsSidebarOpen(true)}
        />

        {/* Content Container */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto">
          {/* DASHBOARD PAGE */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 sm:space-y-8 animate-fade-in">
              {/* Analytics Top widgets */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                {/* Total Views */}
                <div className="bg-white dark:bg-[#0F0F0F] p-4 sm:p-6 rounded-[20px] sm:rounded-[24px] border border-slate-100 dark:border-white/5 shadow-2xl relative overflow-hidden flex flex-col justify-between group">
                  <div>
                    <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-gray-500 mb-2">
                      {t.totalPropertyViews}
                    </p>
                    <h3 className="text-2xl sm:text-4xl font-bold tracking-tighter text-slate-900 dark:text-white">
                      {overallViews.toLocaleString()}
                    </h3>
                  </div>
                  <div className="mt-3 flex items-center text-xs text-[#D4AF37] font-bold z-10">
                    <span className="mr-1">↑ 18.2%</span>
                    <span className="text-slate-400 dark:text-gray-600 font-medium lowercase italic text-[10px]">{t.vsLastMonth}</span>
                  </div>
                  <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-[#D4AF37]/5 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-500"></div>
                </div>

                {/* Active properties */}
                <div className="bg-white dark:bg-[#0F0F0F] p-4 sm:p-6 rounded-[20px] sm:rounded-[24px] border border-slate-100 dark:border-white/5 shadow-2xl relative overflow-hidden flex flex-col justify-between group">
                  <div>
                    <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-gray-500 mb-2">
                      {t.activeProperties}
                    </p>
                    <h3 className="text-2xl sm:text-4xl font-bold tracking-tighter text-slate-900 dark:text-white">
                      {activePropertiesCombined}
                    </h3>
                  </div>
                  <div className="mt-3 flex items-center text-xs text-[#D4AF37] font-bold z-10">
                    <span className="text-slate-400 dark:text-gray-600 font-medium lowercase italic text-[10px]">{t.liveDatabaseNode}</span>
                  </div>
                  <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-[#D4AF37]/5 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-500"></div>
                </div>

                {/* Sold units */}
                <div className="bg-white dark:bg-[#0F0F0F] p-4 sm:p-6 rounded-[20px] sm:rounded-[24px] border border-slate-100 dark:border-white/5 shadow-2xl relative overflow-hidden flex flex-col justify-between group">
                  <div>
                    <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-gray-500 mb-2">
                      {t.soldProperties}
                    </p>
                    <h3 className="text-2xl sm:text-4xl font-bold tracking-tighter text-slate-900 dark:text-white">
                      {totalSold}
                    </h3>
                  </div>
                  <div className="mt-3 flex items-center text-xs text-green-500 font-bold z-10">
                    <span className="text-slate-400 dark:text-gray-600 font-medium lowercase italic text-[10px]">{t.archivedPortfolioLogs}</span>
                  </div>
                  <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-green-500/5 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-500"></div>
                </div>

                {/* Rental Properties */}
                <div className="bg-white dark:bg-[#0F0F0F] p-4 sm:p-6 rounded-[20px] sm:rounded-[24px] border border-slate-100 dark:border-white/5 shadow-2xl relative overflow-hidden flex flex-col justify-between group">
                  <div>
                    <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-gray-500 mb-2">
                      {t.totalRentals}
                    </p>
                    <h3 className="text-2xl sm:text-4xl font-bold tracking-tighter text-slate-900 dark:text-white">
                      {totalRentalsCount}
                    </h3>
                  </div>
                  <div className="mt-3 flex items-center text-xs text-[#D4AF37] font-bold z-10">
                    <span className="text-slate-400 dark:text-gray-600 font-medium lowercase italic text-[10px]">{t.leasingCatalogMetrics}</span>
                  </div>
                  <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-[#D4AF37]/5 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-500"></div>
                </div>
              </div>

              {/* Recharts Analytics graphs */}
              <AnalyticsCharts
                lang={lang}
                totalViews={overallViews}
                activeCount={activePropertiesCombined}
                soldCount={totalSold}
                rentalCount={totalRentalsCount}
              />

              {/* Lower Section: Activities & Recent Posts */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Recent property posts */}
                <div className="lg:col-span-2 p-5 sm:p-8 rounded-[24px] sm:rounded-[32px] border border-slate-100 dark:border-white/5 bg-white dark:bg-[#0F0F0F] shadow-2xl flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-5 sm:mb-6">
                      <div>
                        <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-sans uppercase tracking-tight">
                          {t.recentlyAdded}
                        </h3>
                        <p className="text-xs text-slate-400 dark:text-gray-500 mt-1 italic font-medium lowercase">{t.realtimeFeed}</p>
                      </div>
                      <span className="px-2.5 py-1 rounded-md bg-yellow-500/10 text-[#D4AF37] text-[10px] font-black uppercase tracking-wider shrink-0">
                        {t.liveFeed}
                      </span>
                    </div>

                    <div className="space-y-3 sm:space-y-4">
                      {recentPropertyPosts.map((post) => (
                        <div
                          key={post.id}
                          className="flex items-center justify-between p-3 sm:p-3.5 rounded-2xl border border-slate-50 dark:border-white/5 hover:bg-slate-50/50 dark:hover:bg-white/5 transition-all group"
                        >
                          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                            <img
                              src={post.images[0]}
                              alt={post.title}
                              className="w-10 sm:w-12 h-9 sm:h-10 rounded-xl object-cover border border-slate-100 dark:border-white/10 shrink-0"
                              referrerPolicy="no-referrer"
                            />
                            <div className="min-w-0">
                              <span className="block text-xs font-black text-slate-900 dark:text-white truncate max-w-[140px] sm:max-w-xs group-hover:text-[#D4AF37] transition-colors uppercase tracking-tight">
                                {post.title}
                              </span>
                              <span className="text-[10px] text-slate-400 dark:text-gray-500 block mt-0.5 font-medium truncate">
                                {post.city}, {post.district} • {post.propertyType}
                              </span>
                            </div>
                          </div>

                          <div className="text-right shrink-0 ml-2">
                            <span className="block text-xs font-black font-mono text-[#D4AF37]">
                              {formatPrice(post.price, post.currency)}
                            </span>
                            <span className="text-[9px] uppercase font-black tracking-wider text-slate-400 dark:text-gray-500 block mt-0.5">
                              {post.tab === 'sale' ? t.propertiesForSale : t.rentalProperties}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab('sale')}
                    className="w-full text-center py-2.5 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-[#D4AF37] dark:text-gray-400 dark:hover:text-[#D4AF37] mt-5 sm:mt-6 pt-4 border-t border-slate-100 dark:border-white/10 cursor-pointer"
                  >
                    {t.viewAll} →
                  </button>
                </div>

                {/* Recent activity log */}
                <div className="p-5 sm:p-8 rounded-[24px] sm:rounded-[32px] border border-slate-100 dark:border-white/5 bg-white dark:bg-[#0F0F0F] shadow-2xl flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Activity className="w-4 h-4 text-[#D4AF37]" />
                      <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-sans uppercase tracking-tight">
                        {t.latestActivities}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-400 dark:text-gray-500 mb-5 sm:mb-6 italic font-medium lowercase">{t.operationsTelemetry}</p>

                    <div className="space-y-4">
                      {activities.slice(0, 4).map((act) => (
                        <div key={act.id} className="flex gap-3 text-xs leading-normal font-sans">
                          <div className="w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0 bg-[#D4AF37] shadow shadow-yellow-500/50" />
                          <div className="min-w-0">
                            <p className="text-slate-700 dark:text-gray-400">
                              <span className="font-black text-slate-900 dark:text-white uppercase tracking-tight">{act.adminName}</span>{' '}
                              {act.action}
                            </p>
                            <span className="text-[9px] font-mono text-slate-400 dark:text-gray-500 block mt-1">{act.time}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab('profile')}
                    className="w-full text-center py-2.5 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-[#D4AF37] dark:text-gray-400 dark:hover:text-[#D4AF37] mt-5 sm:mt-6 pt-4 border-t border-slate-100 dark:border-white/10 cursor-pointer"
                  >
                    {t.viewAdminLogs} →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* PROPERTIES FOR SALE PAGE */}
          {activeTab === 'sale' && (
            <div className="space-y-4 sm:space-y-6 animate-fade-in">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider truncate">{t.propertiesForSale}</h3>
                  <p className="text-xs text-slate-400 mt-1 hidden sm:block">{t.manageSalesCatalog}</p>
                </div>

                <button
                  onClick={() => {
                    setEditingProperty(null);
                    setIsFormOpen(true);
                  }}
                  className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 text-xs font-bold text-white bg-[#D4AF37] hover:bg-[#AA823E] rounded-xl shadow-lg shadow-yellow-500/10 cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">{t.addProperty}</span>
                  <span className="sm:hidden">{t.addProperty}</span>
                </button>
              </div>

              <PropertyTable
                lang={lang}
                properties={salesProperties}
                onEdit={(p) => {
                  setEditingProperty(p);
                  setIsFormOpen(true);
                }}
                onDelete={handleDeleteProperty}
                onHide={handleHideProperty}
                onDuplicate={handleDuplicateProperty}
                onPreview={setPreviewProperty}
                onAddNewClick={() => {
                  setEditingProperty(null);
                  setIsFormOpen(true);
                }}
                isLoading={isTableLoading}
              />
            </div>
          )}

          {/* RENTAL PROPERTIES PAGE */}
          {activeTab === 'rent' && (
            <div className="space-y-4 sm:space-y-6 animate-fade-in">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider truncate">{t.rentalProperties}</h3>
                  <p className="text-xs text-slate-400 mt-1 hidden sm:block">{t.manageLeasingProperties}</p>
                </div>

                <button
                  onClick={() => {
                    setEditingProperty(null);
                    setIsFormOpen(true);
                  }}
                  className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 text-xs font-bold text-white bg-[#D4AF37] hover:bg-[#AA823E] rounded-xl shadow-lg shadow-yellow-500/10 cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>{t.addRental}</span>
                </button>
              </div>

              <PropertyTable
                lang={lang}
                properties={rentalProperties}
                onEdit={(p) => {
                  setEditingProperty(p);
                  setIsFormOpen(true);
                }}
                onDelete={handleDeleteProperty}
                onHide={handleHideProperty}
                onDuplicate={handleDuplicateProperty}
                onPreview={setPreviewProperty}
                onAddNewClick={() => {
                  setEditingProperty(null);
                  setIsFormOpen(true);
                }}
                isLoading={isTableLoading}
              />
            </div>
          )}

          {/* PROFILE PAGE */}
          {activeTab === 'profile' && (
            <div className="space-y-6 sm:space-y-8 animate-fade-in font-sans max-w-4xl">
              {/* Profile card */}
              <div className="p-5 sm:p-6 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-xl">
                <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider mb-5 sm:mb-6">
                  {t.adminProfile}
                </h3>

                <input
                  type="file"
                  ref={avatarInputRef}
                  onChange={handleAvatarUpload}
                  accept="image/*"
                  className="hidden"
                />

                <form onSubmit={handleProfileUpdate} className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
                  {/* Avatar Upload */}
                  <div className="flex flex-col items-center text-center p-4 bg-slate-50/40 dark:bg-slate-800/20 rounded-xl border border-slate-100 dark:border-slate-800/40">
                    {profileAvatarUrl ? (
                      <img
                        src={profileAvatarUrl}
                        alt="Avatar"
                        className="w-20 sm:w-24 h-20 sm:h-24 rounded-2xl object-cover border-4 border-[#D4AF37]/20 shadow-md"
                      />
                    ) : (
                      <div className="w-20 sm:w-24 h-20 sm:h-24 rounded-2xl bg-[#D4AF37]/20 border-4 border-[#D4AF37]/30 text-[#D4AF37] flex items-center justify-center font-black text-2xl shadow-md">
                        {(profileName || 'A').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <button
                      type="button"
                      disabled={isUploadingAvatar}
                      onClick={() => avatarInputRef.current?.click()}
                      className="text-[11px] font-bold text-[#D4AF37] hover:underline mt-4 cursor-pointer disabled:opacity-50"
                    >
                      {isUploadingAvatar ? t.uploadingAvatar : t.changeAvatar}
                    </button>
                    <p className="text-[10px] text-slate-400 mt-2">{t.avatarHint}</p>
                  </div>

                  {/* Input fields */}
                  <div className="md:col-span-2 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">{t.adminName}</label>
                        <input
                          type="text"
                          required
                          value={profileName}
                          onChange={(e) => setProfileName(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">{t.email}</label>
                        <input
                          type="email"
                          required
                          value={profileEmail}
                          onChange={(e) => setProfileEmail(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">{t.phoneNumber}</label>
                      <input
                        type="text"
                        value={profilePhone}
                        onChange={(e) => setProfilePhone(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">{t.professionalBio}</label>
                      <textarea
                        rows={3}
                        value={profileBio}
                        onChange={(e) => setProfileBio(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                      />
                    </div>

                    <button
                      type="submit"
                      className="px-4 py-2 text-xs font-bold text-white bg-[#D4AF37] hover:bg-[#AA823E] rounded-xl cursor-pointer"
                    >
                      {t.saveChanges}
                    </button>
                  </div>
                </form>
              </div>

              {/* Admin Management */}
              <AdminSection lang={lang} admins={admins} setAdmins={setAdmins} triggerToast={triggerToast} />
            </div>
          )}

          {/* SETTINGS PAGE */}
          {activeTab === 'settings' && (
            <div className="space-y-6 sm:space-y-8 animate-fade-in font-sans max-w-2xl">
              {/* Change Password Component */}
              <ChangePassword lang={lang} triggerToast={triggerToast} />

              {/* Language, Theme settings */}
              <div className="p-5 sm:p-6 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-xl space-y-6">
                <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                  {t.saasSystemConfig}
                </h3>

                {/* Localizer */}
                <div className="flex items-center justify-between py-3 border-b border-slate-50 dark:border-slate-800/50 gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <Languages className="w-5 h-5 text-[#D4AF37] shrink-0" />
                    <div className="min-w-0">
                      <span className="block text-xs font-semibold text-slate-800 dark:text-slate-200">{t.language}</span>
                      <span className="text-[10px] text-slate-400 hidden sm:block">{t.translationDictionary}</span>
                    </div>
                  </div>

                  <select
                    value={lang}
                    onChange={(e) => {
                      setLang(e.target.value as any);
                      triggerToast(t.localizationChanged, 'info');
                    }}
                    className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl dark:text-slate-200 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#D4AF37] shrink-0"
                  >
                    <option value="en">English</option>
                    <option value="uz">Oʻzbekcha</option>
                    <option value="ru">Русский</option>
                  </select>
                </div>

                {/* Appearance */}
                <div className="flex items-center justify-between py-3 gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <Shield className="w-5 h-5 text-[#D4AF37] shrink-0" />
                    <div className="min-w-0">
                      <span className="block text-xs font-semibold text-slate-800 dark:text-slate-200">{t.theme}</span>
                      <span className="text-[10px] text-slate-400 hidden sm:block">{t.darkModePalette}</span>
                    </div>
                  </div>

                  <select
                    value={theme}
                    onChange={(e) => {
                      setTheme(e.target.value as any);
                      triggerToast(`${t.themeSetTo}: ${e.target.value}`, 'info');
                    }}
                    className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl dark:text-slate-200 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#D4AF37] shrink-0"
                  >
                    <option value="light">{t.light}</option>
                    <option value="dark">{t.dark}</option>
                    <option value="system">{t.system}</option>
                  </select>
                </div>
              </div>

              {/* Notification preferences */}
              <div className="p-5 sm:p-6 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-xl space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {t.notificationPrefs}
                </h3>

                <div className="space-y-3">
                  <label className="flex items-center justify-between py-1 cursor-pointer">
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{t.emailNotifications}</span>
                    <input
                      type="checkbox"
                      defaultChecked
                      className="w-4 h-4 rounded border-slate-300 text-[#D4AF37] focus:ring-[#D4AF37]/50"
                    />
                  </label>
                  <label className="flex items-center justify-between py-1 cursor-pointer">
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{t.pushNotifications}</span>
                    <input
                      type="checkbox"
                      defaultChecked
                      className="w-4 h-4 rounded border-slate-300 text-[#D4AF37] focus:ring-[#D4AF37]/50"
                    />
                  </label>
                </div>
              </div>

              {/* Security and 2FA */}
              <div className="p-5 sm:p-6 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-xl space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {t.securitySettings}
                </h3>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <span className="block text-xs font-semibold text-slate-800 dark:text-slate-200">{t.twoFactorAuth}</span>
                    <span className="text-[10px] text-slate-400">{t.twoFactorSubtitle}</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-9 h-5 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-focus:ring-2 peer-focus:ring-[#D4AF37]/20 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#D4AF37]" />
                  </label>
                </div>
              </div>

              {/* App info */}
              <div className="p-5 sm:p-6 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-xl space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {t.appInfo}
                </h3>

                <div className="divide-y divide-slate-50 dark:divide-slate-800/40 text-xs">
                  <div className="flex items-center justify-between py-2 font-mono text-[10px]">
                    <span className="text-slate-400 uppercase">{t.version}</span>
                    <span className="text-slate-700 dark:text-slate-300">v1.2.4-stable</span>
                  </div>
                  <div className="flex items-center justify-between py-2 font-mono text-[10px]">
                    <span className="text-slate-400 uppercase">{t.environment}</span>
                    <span className="px-2 py-0.5 rounded bg-[#D4AF37]/10 text-[#D4AF37] font-bold">
                      {t.development}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 font-mono text-[10px]">
                    <span className="text-slate-400 uppercase">{t.apiStatus}</span>
                    <span className="text-emerald-500 font-bold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                      <span>{t.apiConnected}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* PROPERTY FORM MODAL */}
      <PropertyFormModal
        lang={lang}
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingProperty(null);
        }}
        onSave={handleSaveProperty}
        editingProperty={editingProperty}
        mode={activeTab === 'rent' ? 'rent' : 'sale'}
        triggerToast={triggerToast}
      />

      {/* PROPERTY PREVIEW MODAL */}
      <AnimatePresence>
        {previewProperty && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPreviewProperty(null)}
              className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="fixed inset-2 sm:inset-6 md:inset-12 lg:inset-x-24 lg:inset-y-12 xl:inset-x-44 z-50 bg-white dark:bg-[#111827] border border-slate-100 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden font-sans"
            >
              {/* Left Photo */}
              <div className="md:w-1/2 bg-slate-100 dark:bg-slate-900 relative min-h-48 md:min-h-0">
                <img
                  src={previewProperty.images[0]}
                  alt={previewProperty.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-3 sm:top-4 left-3 sm:left-4 flex gap-2">
                  <span className="px-2.5 py-1 rounded bg-black/60 text-white text-[9px] font-bold uppercase tracking-wider">
                    {previewProperty.propertyType}
                  </span>
                  <span className="px-2.5 py-1 rounded bg-[#D4AF37] text-white text-[9px] font-bold uppercase tracking-wider">
                    {previewProperty.status}
                  </span>
                </div>
              </div>

              {/* Right details */}
              <div className="flex-1 p-5 sm:p-8 overflow-y-auto flex flex-col justify-between space-y-4 sm:space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-mono font-bold text-slate-400 block uppercase tracking-wider">
                      {t.databaseNodeRef} {previewProperty.id}
                    </span>
                    <button
                      onClick={() => setPreviewProperty(null)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-50 dark:hover:text-slate-200 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 font-sans tracking-tight">
                    {previewProperty.title}
                  </h3>

                  <div className="text-lg sm:text-xl font-bold font-mono text-[#D4AF37] mt-3">
                    {formatPrice(previewProperty.price, previewProperty.currency)}
                    {activeTab === 'rent' && <span className="text-xs text-slate-400 font-normal">{' '}{t.perMonth}</span>}
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:gap-4 border-t border-b border-slate-50 dark:border-slate-800/40 py-3 sm:py-4 my-3 sm:my-4 text-xs font-medium">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <Layers className="w-4 h-4 text-[#D4AF37] shrink-0" />
                      <span>{previewProperty.rooms} {t.roomsBath} {previewProperty.bathrooms}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <Building2 className="w-4 h-4 text-[#D4AF37] shrink-0" />
                      <span>{t.floorOf} {previewProperty.floor} / {previewProperty.totalFloors}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <Calendar className="w-4 h-4 text-[#D4AF37] shrink-0" />
                      <span>{t.builtIn} {previewProperty.constructionYear}</span>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{t.description}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
                      {previewProperty.description || t.noDescription}
                    </p>
                  </div>

                  {/* Features */}
                  {previewProperty.features && previewProperty.features.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Features</h4>
                      <div className="flex flex-wrap gap-2">
                        {previewProperty.features.map((feature, idx) => (
                          <span key={idx} className="px-2 py-1 bg-[#D4AF37]/10 text-[#D4AF37] rounded-lg text-[10px] font-bold uppercase tracking-wider">
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Address */}
                  <div className="mt-4">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{t.address}</h4>
                    <div className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400 font-sans">
                      <MapPin className="w-4 h-4 text-[#D4AF37] flex-shrink-0 mt-0.5" />
                      <div>
                        <span>{previewProperty.fullAddress || `${previewProperty.city}, ${previewProperty.district}`}</span>
                        {previewProperty.googleMapsLink && (
                          <a
                            href={previewProperty.googleMapsLink}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#D4AF37] hover:underline block mt-1 font-semibold flex items-center gap-1 text-[11px]"
                          >
                            {t.openGoogleMaps}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contacts Panel */}
                <div className="pt-4 sm:pt-6 border-t border-slate-50 dark:border-slate-800/40">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">{t.listingContacts}</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-800/30 flex items-center gap-2">
                      <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                      <div>
                        <span className="text-[9px] text-slate-400 block uppercase">{t.phoneNumberLabel}</span>
                        <span className="text-xs font-bold font-mono text-slate-800 dark:text-slate-200">
                          {previewProperty.phoneNumber || '+998 90 123 45 67'}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-800/30 flex items-center gap-2">
                      <Send className="w-4 h-4 text-slate-400 shrink-0" />
                      <div>
                        <span className="text-[9px] text-slate-400 block uppercase">{t.telegramHandle}</span>
                        <span className="text-xs font-bold font-mono text-slate-800 dark:text-slate-200">
                          {previewProperty.telegramUsername || '@tashkent_premium'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* TOAST NOTIFICATIONS */}
      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
