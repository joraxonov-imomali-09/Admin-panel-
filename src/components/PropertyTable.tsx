/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Edit3,
  Copy,
  Eye,
  EyeOff,
  ExternalLink,
  Plus,
  XCircle,
} from 'lucide-react';
import { Property, RentalProperty, LanguageType, CurrencyType } from '../types';
import { i18n } from '../i18n';
import { motion, AnimatePresence } from 'motion/react';

interface PropertyTableProps {
  lang: LanguageType;
  properties: (Property | RentalProperty)[];
  onEdit: (prop: any) => void;
  onDelete: (id: string) => void;
  onHide: (id: string) => void;
  onDuplicate: (prop: any) => void;
  onPreview: (prop: any) => void;
  onAddNewClick: () => void;
  isLoading?: boolean;
}

export default function PropertyTable({
  lang,
  properties,
  onEdit,
  onDelete,
  onHide,
  onDuplicate,
  onPreview,
  onAddNewClick,
  isLoading = false,
}: PropertyTableProps) {
  const t = i18n[lang];

  // States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Sold' | 'Rented' | 'Hidden'>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'price-desc' | 'views'>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Derive available Property Types for filter
  const propertyTypes = useMemo(() => {
    const types = new Set(properties.map((p) => p.propertyType));
    return ['All', ...Array.from(types)];
  }, [properties]);

  // Filter and Sort Logic
  const processedProperties = useMemo(() => {
    let result = [...properties];

    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(term) ||
          p.city.toLowerCase().includes(term) ||
          p.district.toLowerCase().includes(term) ||
          p.fullAddress.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== 'All') {
      result = result.filter((p) => p.status === statusFilter);
    }

    if (typeFilter !== 'All') {
      result = result.filter((p) => p.propertyType === typeFilter);
    }

    result.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime();
      }
      if (sortBy === 'price-asc') {
        const valA = a.currency === 'UZS' ? a.price / 12600 : a.price;
        const valB = b.currency === 'UZS' ? b.price / 12600 : b.price;
        return valA - valB;
      }
      if (sortBy === 'price-desc') {
        const valA = a.currency === 'UZS' ? a.price / 12600 : a.price;
        const valB = b.currency === 'UZS' ? b.price / 12600 : b.price;
        return valB - valA;
      }
      if (sortBy === 'views') {
        return b.views - a.views;
      }
      return 0;
    });

    return result;
  }, [properties, searchTerm, statusFilter, typeFilter, sortBy]);

  // Pagination
  const totalPages = Math.ceil(processedProperties.length / itemsPerPage) || 1;
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return processedProperties.slice(start, start + itemsPerPage);
  }, [processedProperties, currentPage]);

  const formatPrice = (price: number, currency: CurrencyType) => {
    if (currency === 'USD') {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(price);
    } else {
      return new Intl.NumberFormat('uz-UZ', { style: 'decimal', maximumFractionDigits: 0 }).format(price) + ' UZS';
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(lang === 'uz' ? 'uz-UZ' : lang === 'ru' ? 'ru-RU' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-white dark:bg-[#0F0F0F] border border-slate-100 dark:border-white/5 rounded-[32px] shadow-2xl overflow-hidden">
      {/* Table Action Controls */}
      <div className="p-4 sm:p-6 md:p-8 border-b border-slate-100 dark:border-white/10 bg-slate-50/10 dark:bg-transparent flex flex-col gap-4">
        {/* Search */}
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={t.search}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 text-xs font-black uppercase tracking-wider bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37] dark:text-white transition-all font-sans"
          />
        </div>

        {/* Filter Row — wraps on mobile */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Status */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-[10px] text-slate-400 dark:text-gray-500 font-black uppercase tracking-wider font-sans whitespace-nowrap">
              {t.statusLabel}
            </span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="px-2 sm:px-3 py-2 text-[10px] font-black uppercase tracking-wider bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[#D4AF37] cursor-pointer"
            >
              <option value="All">{t.all}</option>
              <option value="Active">{t.active}</option>
              <option value="Sold">{t.sold}</option>
              <option value="Rented">{t.rented}</option>
              <option value="Hidden">{t.hidden}</option>
            </select>
          </div>

          {/* Type */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-[10px] text-slate-400 dark:text-gray-500 font-black uppercase tracking-wider font-sans whitespace-nowrap">
              {t.typeLabel}
            </span>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2 sm:px-3 py-2 text-[10px] font-black uppercase tracking-wider bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[#D4AF37] cursor-pointer"
            >
              {propertyTypes.map((type) => (
                <option key={type} value={type}>
                  {type === 'All' ? t.all : type}
                </option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-[10px] text-slate-400 dark:text-gray-500 font-black uppercase tracking-wider font-sans whitespace-nowrap">
              {t.sortLabel}
            </span>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as any);
                setCurrentPage(1);
              }}
              className="px-2 sm:px-3 py-2 text-[10px] font-black uppercase tracking-wider bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[#D4AF37] cursor-pointer"
            >
              <option value="newest">{t.sortNewest}</option>
              <option value="price-asc">{t.sortPriceAsc}</option>
              <option value="price-desc">{t.sortPriceDesc}</option>
              <option value="views">{t.sortViews}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Scrollable Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 dark:border-white/10 bg-slate-50/30 dark:bg-[#1A1A1A]/40">
              <th className="px-4 sm:px-6 py-4 text-[10px] font-black font-sans uppercase tracking-[0.2em] text-slate-400 dark:text-gray-500">{t.thumbnail}</th>
              <th className="px-4 sm:px-6 py-4 text-[10px] font-black font-sans uppercase tracking-[0.2em] text-slate-400 dark:text-gray-500">{t.name}</th>
              <th className="px-4 sm:px-6 py-4 text-[10px] font-black font-sans uppercase tracking-[0.2em] text-slate-400 dark:text-gray-500">{t.price}</th>
              <th className="px-4 sm:px-6 py-4 text-[10px] font-black font-sans uppercase tracking-[0.2em] text-slate-400 dark:text-gray-500">{t.status}</th>
              <th className="px-4 sm:px-6 py-4 text-[10px] font-black font-sans uppercase tracking-[0.2em] text-slate-400 dark:text-gray-500">{t.views}</th>
              <th className="hidden lg:table-cell px-4 sm:px-6 py-4 text-[10px] font-black font-sans uppercase tracking-[0.2em] text-slate-400 dark:text-gray-500">{t.createdDate}</th>
              <th className="px-4 sm:px-6 py-4 text-[10px] font-black font-sans uppercase tracking-[0.2em] text-slate-400 dark:text-gray-500 text-right">{t.actions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            <AnimatePresence mode="popLayout">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <tr key={`skel-${idx}`} className="animate-pulse">
                    <td className="px-4 sm:px-6 py-4"><div className="w-16 h-12 bg-slate-200 dark:bg-slate-800 rounded-lg" /></td>
                    <td className="px-4 sm:px-6 py-4">
                      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-36 sm:w-48 mb-2" />
                      <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-20 sm:w-24" />
                    </td>
                    <td className="px-4 sm:px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-16 sm:w-20" /></td>
                    <td className="px-4 sm:px-6 py-4"><div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-full w-14 sm:w-16" /></td>
                    <td className="px-4 sm:px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-10 sm:w-12" /></td>
                    <td className="hidden lg:table-cell px-4 sm:px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-16 sm:w-20" /></td>
                    <td className="px-4 sm:px-6 py-4 text-right"><div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg w-20 sm:w-24 ml-auto" /></td>
                  </tr>
                ))
              ) : paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center justify-center max-w-md mx-auto"
                    >
                      <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-4">
                        <XCircle className="w-8 h-8" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 font-sans">{t.noData}</h4>
                      <p className="text-xs text-slate-400 mt-2 leading-relaxed text-center px-4">
                        {t.noPropertiesDescription}
                      </p>
                      <button
                        onClick={onAddNewClick}
                        className="mt-5 flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#D4AF37] hover:bg-[#AA823E] rounded-xl shadow-lg shadow-yellow-500/10 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{t.addProperty}</span>
                      </button>
                    </motion.div>
                  </td>
                </tr>
              ) : (
                paginatedItems.map((prop) => {
                  const isHidden = prop.status === 'Hidden';
                  const isSold = prop.status === 'Sold';
                  const isRented = prop.status === 'Rented';

                  // Translate status
                  const statusLabel =
                    prop.status === 'Active' ? t.active :
                    prop.status === 'Sold' ? t.sold :
                    prop.status === 'Rented' ? t.rented :
                    prop.status === 'Hidden' ? t.hidden :
                    prop.status;

                  return (
                    <motion.tr
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      key={prop.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group font-sans"
                    >
                      {/* Thumbnail */}
                      <td className="px-4 sm:px-6 py-3.5">
                        <div className="relative w-14 sm:w-16 h-10 sm:h-12 rounded-lg overflow-hidden border border-slate-100 dark:border-slate-800 bg-slate-100">
                          <img
                            src={prop.images[0] || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=150&q=80'}
                            alt={prop.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            referrerPolicy="no-referrer"
                          />
                          {prop.isFeatured && (
                            <div className="absolute top-0.5 left-0.5 bg-[#D4AF37] text-white text-[7px] font-mono font-bold px-1 py-0.5 rounded-sm uppercase tracking-widest shadow">
                              {t.starBadge}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Title & Location */}
                      <td className="px-4 sm:px-6 py-4 max-w-[160px] sm:max-w-xs">
                        <div className="font-black text-xs text-slate-900 dark:text-white truncate uppercase tracking-tight group-hover:text-[#D4AF37] transition-colors">
                          {prop.title}
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-gray-500 truncate mt-1">
                          {prop.propertyType} • {prop.city}, {prop.district}
                        </div>
                      </td>

                      {/* Price */}
                      <td className="px-4 sm:px-6 py-4">
                        <span className="text-xs font-black font-mono text-slate-900 dark:text-white whitespace-nowrap">
                          {formatPrice(prop.price, prop.currency)}
                        </span>
                      </td>

                      {/* Status Badge — translated */}
                      <td className="px-4 sm:px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2 sm:px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider whitespace-nowrap ${
                            prop.status === 'Active'
                              ? 'bg-yellow-50 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-200/50 dark:border-yellow-500/10'
                              : isSold || isRented
                              ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-500/10'
                              : 'bg-slate-50 dark:bg-slate-500/10 text-slate-500 dark:text-slate-400 border border-slate-200/50 dark:border-white/5'
                          }`}
                        >
                          {statusLabel}
                        </span>
                      </td>

                      {/* Views */}
                      <td className="px-4 sm:px-6 py-3.5">
                        <span className="text-xs font-mono text-slate-600 dark:text-slate-400 font-medium">
                          {prop.views.toLocaleString()}
                        </span>
                      </td>

                      {/* Created Date — hidden on tablet */}
                      <td className="hidden lg:table-cell px-4 sm:px-6 py-3.5">
                        <span className="text-[11px] font-mono text-slate-400">
                          {formatDate(prop.createdDate)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 sm:px-6 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-0.5 sm:gap-1">
                          <button
                            onClick={() => onPreview(prop)}
                            title={t.preview}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onDuplicate(prop)}
                            title={t.duplicate}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-[#D4AF37] hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onHide(prop.id)}
                            title={isHidden ? t.unhideListing : t.hide}
                            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                              isHidden
                                ? 'text-[#D4AF37] bg-yellow-50 dark:bg-yellow-500/5'
                                : 'text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                          >
                            {isHidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          </button>

                          <button
                            onClick={() => onEdit(prop)}
                            title={t.edit}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-[#D4AF37] hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onDelete(prop.id)}
                            title={t.delete}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {!isLoading && processedProperties.length > 0 && (
        <div className="px-4 sm:px-8 py-4 sm:py-5 border-t border-slate-100 dark:border-white/10 bg-slate-50/10 dark:bg-[#0A0A0A]/40 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-gray-500 font-sans text-center sm:text-left">
            {t.showing}{' '}
            <span className="text-slate-900 dark:text-white">{(currentPage - 1) * itemsPerPage + 1}</span>
            {' '}{t.to}{' '}
            <span className="text-slate-900 dark:text-white">
              {Math.min(currentPage * itemsPerPage, processedProperties.length)}
            </span>
            {' '}{t.of}{' '}
            <span className="text-slate-900 dark:text-white">{processedProperties.length}</span>
            {' '}{t.properties}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setCurrentPage((c) => Math.max(c - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-100 dark:border-white/10 text-slate-400 hover:text-slate-800 dark:hover:text-white disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-white/5 transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* On mobile: show only current/total; on desktop: show all page buttons */}
            <span className="sm:hidden text-xs font-black text-slate-700 dark:text-slate-300 px-2">
              {currentPage} / {totalPages}
            </span>
            <div className="hidden sm:flex items-center gap-1">
              {Array.from({ length: totalPages }).map((_, idx) => (
                <button
                  key={`page-${idx}`}
                  onClick={() => setCurrentPage(idx + 1)}
                  className={`w-7 h-7 text-xs font-black rounded-lg transition-all cursor-pointer ${
                    currentPage === idx + 1
                      ? 'bg-[#D4AF37] text-slate-950 shadow-md shadow-yellow-500/10'
                      : 'text-slate-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-white'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentPage((c) => Math.min(c + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-100 dark:border-white/10 text-slate-400 hover:text-slate-800 dark:hover:text-white disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-white/5 transition-all cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
