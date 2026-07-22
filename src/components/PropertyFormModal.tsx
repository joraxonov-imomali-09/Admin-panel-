/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
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
  AlertCircle,
} from 'lucide-react';
import { Property, RentalProperty, LanguageType, CurrencyType, PropertyStatus, RentalStatus } from '../types';
import { i18n } from '../i18n';
import { supabase } from '../lib/supabase';

interface PropertyFormModalProps {
  lang: LanguageType;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  editingProperty: any | null;
  mode: 'sale' | 'rent';
  triggerToast: (text: string, type: 'success' | 'info' | 'alert') => void;
}

// ─── Image Compression ──────────────────────────────────────────────────────
// Uses the browser's native Canvas API — zero extra dependencies.
async function compressImage(file: File, maxDimension = 1920, quality = 0.82): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;
      if (width > maxDimension || height > maxDimension) {
        if (width >= height) {
          height = Math.round((height / width) * maxDimension);
          width = maxDimension;
        } else {
          width = Math.round((width / height) * maxDimension);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Canvas toBlob failed'));
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Image load failed'));
    };

    img.src = objectUrl;
  });
}

// ─── Circular Progress Ring ──────────────────────────────────────────────────
interface CircularProgressProps {
  progress: number; // 0–100
  size?: number;
}

function CircularProgress({ progress, size = 72 }: CircularProgressProps) {
  const strokeWidth = 5;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          style={{ transform: 'rotate(-90deg)' }}
        >
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(212,175,55,0.15)"
            strokeWidth={strokeWidth}
          />
          {/* Progress arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#D4AF37"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.25s cubic-bezier(0.4,0,0.2,1)' }}
          />
        </svg>
        {/* Percentage label in centre */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ top: 0 }}
        >
          <span className="font-mono font-black text-[#D4AF37]" style={{ fontSize: size * 0.22 }}>
            {Math.round(progress)}%
          </span>
        </div>
      </div>
      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
        Uploading…
      </p>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function PropertyFormModal({
  lang,
  isOpen,
  onClose,
  onSave,
  editingProperty,
  mode,
  triggerToast,
}: PropertyFormModalProps) {
  const t = i18n[lang];

  // Form Fields
  const [price, setPrice] = useState<number | ''>('');
  const [fullAddress, setFullAddress] = useState('');
  const [rooms, setRooms] = useState<number | ''>('');
  const [floor, setFloor] = useState<number | ''>('');
  const [totalFloors, setTotalFloors] = useState<number | ''>('');
  const [features, setFeatures] = useState<string[]>([]);
  const [featureInput, setFeatureInput] = useState('');

  // Images State
  const [images, setImages] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Prefill Form when editing
  useEffect(() => {
    if (editingProperty) {
      setPrice(editingProperty.price || '');
      setFullAddress(editingProperty.fullAddress || '');
      setRooms(editingProperty.rooms || '');
      setFloor(editingProperty.floor || '');
      setTotalFloors(editingProperty.totalFloors || '');
      setFeatures(editingProperty.features || []);
      setImages(editingProperty.images || []);
    } else {
      // Reset to defaults
      setPrice('');
      setFullAddress('');
      setRooms('');
      setFloor('');
      setTotalFloors('');
      setFeatures([]);
      setImages([]);
    }
    setUploadError(null);
    setUploadProgress(0);
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
    if (!isUploading) fileInputRef.current?.click();
  };

  // ─── Upload with compression + progress ─────────────────────────────────
  const uploadFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);
    setIsDragging(false);

    const collectedUrls: string[] = [];
    const errors: string[] = [];

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];

      // Update progress per file start (base progress before this file)
      const baseProgress = (i / fileArray.length) * 100;
      setUploadProgress(baseProgress);

      try {
        // 1. Compress image
        let blob: Blob;
        try {
          blob = await compressImage(file);
        } catch {
          // If compression fails (e.g. unsupported format), use original
          blob = file;
        }

        const fileExt = file.name.split('.').pop() || 'jpg';
        const fileName = `prop-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

        // 2. Upload via XHR so we can track progress
        const url = await new Promise<string>((resolve, reject) => {
          // Get the Supabase storage URL and auth headers
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
          const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
          const bucketName = mode === 'sale' ? 'uylar' : 'Kvartiralar';
          const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucketName}/${fileName}`;

          const xhr = new XMLHttpRequest();
          xhr.open('POST', uploadUrl);
          xhr.setRequestHeader('Authorization', `Bearer ${supabaseKey}`);
          xhr.setRequestHeader('apikey', supabaseKey);
          xhr.setRequestHeader('x-upsert', 'false');

          // Progress per-file: maps 0–100% of this file to its slice of total
          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const fileProgress = (event.loaded / event.total) * 100;
              const totalProgress = baseProgress + (fileProgress / fileArray.length);
              setUploadProgress(Math.min(totalProgress, 99));
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              // Construct the public URL the same way supabase client does
              const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucketName}/${fileName}`;
              resolve(publicUrl);
            } else {
              let errMsg = `Upload failed (${xhr.status})`;
              try {
                const parsed = JSON.parse(xhr.responseText);
                if (parsed.error) errMsg = parsed.error;
              } catch {}
              reject(new Error(errMsg));
            }
          };

          xhr.onerror = () => reject(new Error('Network error during upload'));
          xhr.ontimeout = () => reject(new Error('Upload timed out'));
          xhr.timeout = 60000; // 60 second timeout

          const formData = new FormData();
          formData.append('', blob, fileName);
          xhr.send(formData);
        });

        collectedUrls.push(url);
      } catch (err: any) {
        console.error(`Failed to upload ${file.name}:`, err);
        errors.push(`${file.name}: ${err.message || 'Upload failed'}`);
      }
    }

    // Finish
    setUploadProgress(100);

    // Small delay so user sees 100% before the ring disappears
    await new Promise((r) => setTimeout(r, 400));

    if (collectedUrls.length > 0) {
      setImages((prev) => [...prev, ...collectedUrls]);
    }

    if (errors.length > 0) {
      setUploadError(errors.join(' | '));
    }

    setIsUploading(false);
    setUploadProgress(0);
  }, []);

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
      // Reset input so same file can be re-selected
      e.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== index));
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
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!price || !fullAddress || !rooms) {
      triggerToast(t.fillRequiredFields || 'Please fill in all required fields.', 'alert');
      return;
    }

    if (mode === 'rent' && (!floor || !totalFloors)) {
      triggerToast('Please provide Floor and Total Floors for apartments.', 'alert');
      return;
    }

    if (images.length === 0) {
      triggerToast('Please upload at least one image.', 'alert');
      return;
    }

    const finalData = {
      id: editingProperty?.id || `prop-${mode}-${Date.now()}`,
      title: fullAddress, // fallback for title
      description: '',
      price: Number(price),
      currency: 'USD' as any,
      city: 'Tashkent', // fallback
      district: 'Tashkent', // fallback
      fullAddress,
      googleMapsLink: '',
      propertyType: mode === 'rent' ? 'Apartment' : 'House',
      rooms: Number(rooms),
      bathrooms: 1,
      area: 0,
      floor: Number(floor) || 0,
      totalFloors: Number(totalFloors) || 0,
      parking: false,
      furniture: false,
      constructionYear: new Date().getFullYear(),
      phoneNumber: '',
      telegramUsername: '',
      status: 'Active' as any,
      isFeatured: false,
      images: images,
      features: features,
      views: editingProperty?.views || 0,
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
              {/* ── Image Upload Block ────────────────────────────────────── */}
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

                {/* Drag-and-drop / click zone */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={triggerImageUpload}
                  className={`border-2 border-dashed rounded-[24px] p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all min-h-[140px] ${
                    isUploading
                      ? 'border-[#D4AF37]/40 bg-yellow-500/3 cursor-not-allowed'
                      : isDragging
                      ? 'border-[#D4AF37] bg-yellow-500/5'
                      : 'border-slate-200 dark:border-white/10 hover:border-[#D4AF37] dark:hover:border-[#D4AF37]'
                  }`}
                >
                  {isUploading ? (
                    <CircularProgress progress={uploadProgress} size={72} />
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

                {/* Upload error feedback */}
                <AnimatePresence>
                  {uploadError && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="flex items-start gap-2 px-4 py-3 rounded-xl bg-red-500/8 border border-red-500/20 text-red-500"
                    >
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <p className="text-[10px] font-bold uppercase tracking-wider leading-relaxed">
                        {uploadError}
                      </p>
                      <button
                        type="button"
                        onClick={() => setUploadError(null)}
                        className="ml-auto p-0.5 text-red-400 hover:text-red-600 shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Thumbnail Previews */}
                {images.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mt-4">
                    {images.map((url, index) => (
                      <motion.div
                        key={`${url}-${index}`}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 overflow-hidden group h-24"
                      >
                        <img
                          src={url}
                          alt={`Preview ${index}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // If image fails to load, show a placeholder
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />

                        {/* First image badge */}
                        {index === 0 && (
                          <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-[#D4AF37] text-white text-[7px] font-mono font-bold uppercase tracking-widest shadow">
                            Cover
                          </div>
                        )}

                        {/* Hover overlay with controls */}
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
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Property Info Block ───────────────────────────────────── */}
              <div className="space-y-6">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-gray-500">
                  Property Details
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Price */}
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-gray-500 mb-1.5">
                      {t.price} *
                    </label>
                    <input
                      type="number"
                      required
                      value={price}
                      onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-4 py-2.5 text-xs font-black uppercase tracking-wider bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl focus:outline-none dark:text-white"
                    />
                  </div>

                  {/* Address */}
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-gray-500 mb-1.5">
                      {t.fullAddress} *
                    </label>
                    <input
                      type="text"
                      required
                      value={fullAddress}
                      onChange={(e) => setFullAddress(e.target.value)}
                      className="w-full px-4 py-2.5 text-xs font-black uppercase tracking-wider bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl focus:outline-none dark:text-white"
                    />
                  </div>

                  {/* Rooms */}
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-gray-500 mb-1.5">
                      {t.rooms} *
                    </label>
                    <input
                      type="number"
                      required
                      value={rooms}
                      onChange={(e) => setRooms(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-4 py-2.5 text-xs font-black uppercase tracking-wider bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl focus:outline-none dark:text-white"
                    />
                  </div>

                  {/* Floor & Total Floors */}
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-gray-500 mb-1.5">
                      {t.floor}
                    </label>
                    <input
                      type="number"
                      value={floor}
                      onChange={(e) => setFloor(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-4 py-2.5 text-xs font-black uppercase tracking-wider bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl focus:outline-none dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-gray-500 mb-1.5">
                      {t.totalFloors}
                    </label>
                    <input
                      type="number"
                      value={totalFloors}
                      onChange={(e) => setTotalFloors(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-4 py-2.5 text-xs font-black uppercase tracking-wider bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl focus:outline-none dark:text-white"
                    />
                  </div>

                  {/* Features Tag Input */}
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-gray-500 mb-1.5">
                      Property Features
                    </label>
                    <div className="w-full p-2 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl focus-within:ring-1 focus-within:ring-[#D4AF37] transition-all flex flex-wrap gap-2 items-center">
                      {features.map((tag, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#D4AF37]/10 text-[#D4AF37] rounded-lg text-xs font-bold uppercase tracking-wider">
                          <span>{tag}</span>
                          <button
                            type="button"
                            onClick={() => setFeatures(prev => prev.filter((_, i) => i !== idx))}
                            className="p-0.5 hover:bg-[#D4AF37]/20 rounded-md transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      <input
                        type="text"
                        value={featureInput}
                        onChange={(e) => setFeatureInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === ',' || e.key === 'Enter') {
                            e.preventDefault();
                            const val = featureInput.trim().replace(/,$/, '');
                            if (val && !features.includes(val)) {
                              setFeatures(prev => [...prev, val]);
                            }
                            setFeatureInput('');
                          }
                        }}
                        placeholder={features.length === 0 ? "e.g. Garage, Balcony," : ""}
                        className="flex-1 min-w-[120px] px-2 py-1 bg-transparent text-xs font-black uppercase tracking-wider focus:outline-none dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 dark:text-gray-500 mt-1.5">Press comma (,) or Enter to add a tag</p>
                  </div>
                </div>
              </div>
            </form>

            {/* Bottom Buttons */}
            <div className="p-6 border-t border-slate-100 dark:border-white/10 bg-slate-50/10 dark:bg-transparent flex items-center justify-between gap-3">
              {/* Image count indicator */}
              <span className="text-[10px] font-mono text-slate-400 dark:text-gray-500 uppercase tracking-wider">
                {images.length} {images.length === 1 ? 'image' : 'images'} attached
              </span>

              <div className="flex items-center gap-3">
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
                  disabled={isUploading}
                  className="px-5 py-2.5 text-xs font-black uppercase tracking-wider text-slate-950 bg-[#D4AF37] hover:bg-[#AA823E] rounded-xl shadow-lg shadow-yellow-500/10 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? 'Uploading…' : editingProperty ? t.saveChanges : t.publish}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
