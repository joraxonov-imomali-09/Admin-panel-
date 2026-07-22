/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  UploadCloud,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Link,
  Phone,
  Send,
  Building,
} from 'lucide-react';
import { Property, RentalProperty, LanguageType, CurrencyType, PropertyStatus, RentalStatus } from '../types';
import { i18n } from '../i18n';
import { supabase } from '../lib/supabase';

interface PropertyFormModalProps {
  lang: LanguageType;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  editingProperty: any | null; // If null, we are creating a new property
  mode: 'sale' | 'rent';
}

export default function PropertyFormModal({
  lang,
  isOpen,
  onClose,
  onSave,
  editingProperty,
  mode,
}: PropertyFormModalProps) {
  const t = i18n[lang];

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [currency, setCurrency] = useState<CurrencyType>('USD');
  const [city, setCity] = useState('Tashkent');
  const [district, setDistrict] = useState('Mirabad');
  const [fullAddress, setFullAddress] = useState('');
  const [googleMapsLink, setGoogleMapsLink] = useState('');
  const [propertyType, setPropertyType] = useState('Apartment');
  const [rooms, setRooms] = useState<number>(2);
  const [bathrooms, setBathrooms] = useState<number>(1);
  const [area, setArea] = useState<number | ''>('');
  const [floor, setFloor] = useState<number>(3);
  const [totalFloors, setTotalFloors] = useState<number>(9);
  const [parking, setParking] = useState(false);
  const [furniture, setFurniture] = useState(false);
  const [constructionYear, setConstructionYear] = useState<number>(2023);
  const [phoneNumber, setPhoneNumber] = useState('+998 ');
  const [telegramUsername, setTelegramUsername] = useState('@');
  const [status, setStatus] = useState<string>('Active');
  const [isFeatured, setIsFeatured] = useState(false);

  // Images State
  const [images, setImages] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Prefill Form when editing
  useEffect(() => {
    if (editingProperty) {
      setTitle(editingProperty.title || '');
      setDescription(editingProperty.description || '');
      setPrice(editingProperty.price || '');
      setCurrency(editingProperty.currency || 'USD');
      setCity(editingProperty.city || 'Tashkent');
      setDistrict(editingProperty.district || 'Mirabad');
      setFullAddress(editingProperty.fullAddress || '');
      setGoogleMapsLink(editingProperty.googleMapsLink || '');
      setPropertyType(editingProperty.propertyType || 'Apartment');
      setRooms(editingProperty.rooms || 2);
      setBathrooms(editingProperty.bathrooms || 1);
      setArea(editingProperty.area || '');
      setFloor(editingProperty.floor || 1);
      setTotalFloors(editingProperty.totalFloors || 5);
      setParking(editingProperty.parking || false);
      setFurniture(editingProperty.furniture || false);
      setConstructionYear(editingProperty.constructionYear || 2023);
      setPhoneNumber(editingProperty.phoneNumber || '+998 ');
      setTelegramUsername(editingProperty.telegramUsername || '@');
      setStatus(editingProperty.status || 'Active');
      setIsFeatured(editingProperty.isFeatured || false);
      setImages(editingProperty.images || []);
    } else {
      // Reset to defaults
      setTitle('');
      setDescription('');
      setPrice('');
      setCurrency('USD');
      setCity('Tashkent');
      setDistrict('Mirabad');
      setFullAddress('');
      setGoogleMapsLink('');
      setPropertyType('Apartment');
      setRooms(2);
      setBathrooms(1);
      setArea('');
      setFloor(3);
      setTotalFloors(9);
      setParking(false);
      setFurniture(false);
      setConstructionYear(2023);
      setPhoneNumber('+998 ');
      setTelegramUsername('@');
      setStatus('Active');
      setIsFeatured(false);
      setImages([]);
    }
  }, [editingProperty, isOpen, mode]);

  // Handle Drag Events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const triggerImageUpload = () => {
    fileInputRef.current?.click();
  };

  const uploadFiles = async (files: FileList | File[]) => {
    setIsUploading(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('properties')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Error uploading file:', uploadError);
          return null;
        }

        const { data } = supabase.storage.from('properties').getPublicUrl(filePath);
        return data.publicUrl;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      const validUrls = uploadedUrls.filter((url) => url !== null) as string[];
      
      setImages((prev) => [...prev, ...validUrls]);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      uploadFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadFiles(e.target.files);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, idx) => idx !== index));
  };

  const reorderImage = (index: number, direction: 'left' | 'right') => {
    if (direction === 'left' && index === 0) return;
    if (direction === 'right' && index === images.length - 1) return;

    const targetIdx = direction === 'left' ? index - 1 : index + 1;
    const reordered = [...images];
    const temp = reordered[index];
    reordered[index] = reordered[targetIdx];
    reordered[targetIdx] = temp;
    setImages(reordered);
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !price || !area) return;

    const finalData = {
      id: editingProperty?.id || `prop-${mode}-${Date.now()}`,
      title,
      description,
      price: Number(price),
      currency,
      city,
      district,
      fullAddress,
      googleMapsLink,
      propertyType,
      rooms,
      bathrooms,
      area: Number(area),
      floor,
      totalFloors,
      parking,
      furniture,
      constructionYear,
      phoneNumber,
      telegramUsername,
      status: status as any,
      isFeatured,
      images: images,
      views: editingProperty?.views || Math.floor(Math.random() * 200),
      createdDate: editingProperty?.createdDate || new Date().toISOString(),
    };

    onSave(finalData);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="fixed inset-y-10 inset-x-4 sm:inset-x-12 md:inset-x-24 lg:inset-x-40 xl:inset-x-56 z-50 bg-white dark:bg-[#0F0F0F] border border-slate-100 dark:border-white/5 rounded-[32px] shadow-2xl flex flex-col overflow-hidden font-sans"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-white/10 bg-slate-50/10 dark:bg-transparent">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-yellow-500/10 text-[#D4AF37] flex items-center justify-center">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">
                    {editingProperty ? t.update : mode === 'sale' ? t.addProperty : t.addRental}
                  </h3>
                  <p className="text-[10px] text-slate-400 dark:text-gray-500 mt-0.5 italic lowercase">Fill out listing node database record parameters</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Area */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8">
              {/* Image Upload Block */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-gray-500">
                  {t.imageUpload}
                </h4>

                <input 
                  type="file" 
                  multiple 
                  ref={fileInputRef} 
                  onChange={handleFileSelect} 
                  className="hidden" 
                  accept="image/*" 
                />

                {/* Drag and drop panel */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={triggerImageUpload}
                  className={`border-2 border-dashed rounded-[24px] p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                    isDragging
                      ? 'border-[#D4AF37] bg-yellow-500/5'
                      : 'border-slate-200 dark:border-white/10 hover:border-[#D4AF37] dark:hover:border-[#D4AF37]'
                  }`}
                >
                  {isUploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-8 h-8 rounded-full border-4 border-[#D4AF37]/20 border-t-[#D4AF37] animate-spin" />
                      <p className="text-xs text-slate-500 dark:text-slate-400">Uploading image to Supabase Storage...</p>
                    </div>
                  ) : (
                    <>
                      <UploadCloud className="w-10 h-10 text-slate-400 dark:text-slate-600 mb-3" />
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        {t.dragDropImages}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">{t.imageLimits}</p>
                    </>
                  )}
                </div>

                {/* Thumbnail Previews */}
                {images.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mt-4">
                    {images.map((url, index) => (
                      <div
                        key={`${url}-${index}`}
                        className="relative rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 overflow-hidden group h-24"
                      >
                        <img src={url} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                        
                        {/* Remove Image Overlay */}
                        <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              reorderImage(index, 'left');
                            }}
                            disabled={index === 0}
                            className="p-1 rounded bg-white/15 hover:bg-white/30 text-white disabled:opacity-30 cursor-pointer"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeImage(index);
                            }}
                            className="p-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              reorderImage(index, 'right');
                            }}
                            disabled={index === images.length - 1}
                            className="p-1 rounded bg-white/15 hover:bg-white/30 text-white disabled:opacity-30 cursor-pointer"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Property Info Block */}
              <div className="space-y-6">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-gray-500">
                  {t.personalInfo}
                </h4>

                {/* Form fields layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Title */}
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-gray-500 mb-1.5">
                      {t.title} *
                    </label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Luxurious 4-Room Penthouse overlooking Mirabad Ave"
                      className="w-full px-4 py-2.5 text-xs font-black uppercase tracking-wider bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37] dark:text-white"
                    />
                  </div>

                  {/* Description */}
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-gray-500 mb-1.5">
                      {t.description}
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      placeholder="Detailed property specifications, materials, amenities, surrounding location elements..."
                      className="w-full px-4 py-2.5 text-xs bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37] dark:text-white"
                    />
                  </div>

                  {/* Price */}
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-gray-500 mb-1.5">
                      {t.price} *
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        required
                        value={price}
                        onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="e.g. 150000"
                        className="flex-1 px-4 py-2.5 text-xs font-black uppercase tracking-wider bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37] dark:text-white"
                      />
                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value as CurrencyType)}
                        className="px-3 py-2 text-xs font-black uppercase tracking-wider bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl dark:text-gray-300 cursor-pointer focus:outline-none"
                      >
                        <option value="USD">USD ($)</option>
                        <option value="UZS">UZS (сум)</option>
                      </select>
                    </div>
                  </div>

                  {/* Property Type */}
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-gray-500 mb-1.5">
                      {t.propertyType}
                    </label>
                    <select
                      value={propertyType}
                      onChange={(e) => setPropertyType(e.target.value)}
                      className="w-full px-4 py-2.5 text-xs font-black uppercase tracking-wider bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl dark:text-gray-300 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                    >
                      <option value="Apartment">Apartment</option>
                      <option value="House">House</option>
                      <option value="Villa">Villa</option>
                      <option value="Penthouse">Penthouse</option>
                      <option value="Townhouse">Townhouse</option>
                      <option value="Office">Office</option>
                    </select>
                  </div>

                  {/* City & District */}
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-gray-500 mb-1.5">
                      {t.city}
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-4 py-2.5 text-xs font-black uppercase tracking-wider bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37] dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-gray-500 mb-1.5">
                      {t.district}
                    </label>
                    <select
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="w-full px-4 py-2.5 text-xs font-black uppercase tracking-wider bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl dark:text-gray-300 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                    >
                      <option value="Mirabad">Mirabad</option>
                      <option value="Yunusabad">Yunusabad</option>
                      <option value="Yakkasaray">Yakkasaray</option>
                      <option value="Chilanzar">Chilanzar</option>
                      <option value="Almazar">Almazar</option>
                      <option value="Shaykhantahur">Shaykhantahur</option>
                      <option value="Mirzo Ulugbek">Mirzo Ulugbek</option>
                      <option value="Yashnabad">Yashnabad</option>
                    </select>
                  </div>

                  {/* Full Address */}
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-gray-500 mb-1.5">
                      {t.fullAddress}
                    </label>
                    <input
                      type="text"
                      value={fullAddress}
                      onChange={(e) => setFullAddress(e.target.value)}
                      placeholder="Street, block, house/apartment number details"
                      className="w-full px-4 py-2.5 text-xs font-black uppercase tracking-wider bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37] dark:text-white"
                    />
                  </div>

                  {/* Maps link */}
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-gray-500 mb-1.5 flex items-center gap-1.5">
                      <Link className="w-3.5 h-3.5 text-slate-400" />
                      <span>{t.googleMapsLink}</span>
                    </label>
                    <input
                      type="text"
                      value={googleMapsLink}
                      onChange={(e) => setGoogleMapsLink(e.target.value)}
                      placeholder="https://maps.google.com/?q=..."
                      className="w-full px-4 py-2.5 text-xs font-black uppercase tracking-wider bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37] dark:text-white"
                    />
                  </div>

                  {/* Rooms & Bathrooms */}
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-gray-500 mb-1.5">
                      {t.rooms}
                    </label>
                    <input
                      type="number"
                      value={rooms}
                      onChange={(e) => setRooms(Number(e.target.value))}
                      className="w-full px-4 py-2.5 text-xs font-black uppercase tracking-wider bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37] dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-gray-500 mb-1.5">
                      {t.bathrooms}
                    </label>
                    <input
                      type="number"
                      value={bathrooms}
                      onChange={(e) => setBathrooms(Number(e.target.value))}
                      className="w-full px-4 py-2.5 text-xs font-black uppercase tracking-wider bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37] dark:text-white"
                    />
                  </div>

                  {/* Area */}
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-gray-500 mb-1.5">
                      {t.area} *
                    </label>
                    <input
                      type="number"
                      required
                      value={area}
                      onChange={(e) => setArea(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="e.g. 120"
                      className="w-full px-4 py-2.5 text-xs font-black uppercase tracking-wider bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37] dark:text-white"
                    />
                  </div>

                  {/* Year */}
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-gray-500 mb-1.5">
                      {t.constructionYear}
                    </label>
                    <input
                      type="number"
                      value={constructionYear}
                      onChange={(e) => setConstructionYear(Number(e.target.value))}
                      className="w-full px-4 py-2.5 text-xs font-black uppercase tracking-wider bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37] dark:text-white"
                    />
                  </div>

                  {/* Floors */}
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-gray-500 mb-1.5">
                      {t.floor}
                    </label>
                    <input
                      type="number"
                      value={floor}
                      onChange={(e) => setFloor(Number(e.target.value))}
                      className="w-full px-4 py-2.5 text-xs font-black uppercase tracking-wider bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37] dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-gray-500 mb-1.5">
                      {t.totalFloors}
                    </label>
                    <input
                      type="number"
                      value={totalFloors}
                      onChange={(e) => setTotalFloors(Number(e.target.value))}
                      className="w-full px-4 py-2.5 text-xs font-black uppercase tracking-wider bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37] dark:text-white"
                    />
                  </div>

                  {/* Phone & Telegram */}
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-gray-500 mb-1.5 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{t.phoneNumber}</span>
                    </label>
                    <input
                      type="text"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full px-4 py-2.5 text-xs font-black uppercase tracking-wider bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37] dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-gray-500 mb-1.5 flex items-center gap-1.5">
                      <Send className="w-3.5 h-3.5 text-slate-400" />
                      <span>{t.telegram}</span>
                    </label>
                    <input
                      type="text"
                      value={telegramUsername}
                      onChange={(e) => setTelegramUsername(e.target.value)}
                      className="w-full px-4 py-2.5 text-xs font-black uppercase tracking-wider bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37] dark:text-white"
                    />
                  </div>

                  {/* Status Selection */}
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-gray-500 mb-1.5">
                      {t.status}
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full px-4 py-2.5 text-xs font-black uppercase tracking-wider bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl dark:text-gray-300 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                    >
                      <option value="Active">{t.active}</option>
                      {mode === 'sale' ? (
                        <option value="Sold">{t.sold}</option>
                      ) : (
                        <option value="Rented">{t.rented}</option>
                      )}
                      <option value="Hidden">{t.hidden}</option>
                    </select>
                  </div>

                  {/* Toggles */}
                  <div className="flex flex-col gap-4 justify-center md:pt-4">
                    {/* Parking toggle */}
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={parking}
                        onChange={(e) => setParking(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 dark:border-white/10 text-[#D4AF37] focus:ring-[#D4AF37]/50"
                      />
                      <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-gray-300">
                        {parking ? 'Parking available' : 'No Parking'}
                      </span>
                    </label>

                    {/* Furniture toggle */}
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={furniture}
                        onChange={(e) => setFurniture(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 dark:border-white/10 text-[#D4AF37] focus:ring-[#D4AF37]/50"
                      />
                      <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-gray-300">
                        {furniture ? 'Fully Furnished' : 'Unfurnished'}
                      </span>
                    </label>
                  </div>

                  {/* Featured property toggle */}
                  <div className="md:col-span-2 border-t border-slate-100 dark:border-white/10 pt-4 mt-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-start gap-2.5">
                        <Sparkles className="w-4.5 h-4.5 text-[#D4AF37] mt-0.5" />
                        <div>
                          <span className="block text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white">
                            {t.featured}
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-gray-500 block mt-0.5 font-medium italic lowercase">
                            {t.featuredToggle}
                          </span>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isFeatured}
                          onChange={(e) => setIsFeatured(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-200 dark:bg-white/10 rounded-full peer peer-focus:ring-2 peer-focus:ring-[#D4AF37]/20 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#D4AF37]" />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </form>

            {/* Bottom Buttons */}
            <div className="p-6 border-t border-slate-100 dark:border-white/10 bg-slate-50/10 dark:bg-transparent flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-xs font-black uppercase tracking-wider text-slate-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-all cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="px-5 py-2.5 text-xs font-black uppercase tracking-wider text-slate-950 bg-[#D4AF37] hover:bg-[#AA823E] rounded-xl shadow-lg shadow-yellow-500/10 transition-all cursor-pointer"
              >
                {editingProperty ? t.saveChanges : t.publish}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
