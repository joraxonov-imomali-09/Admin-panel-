/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type CurrencyType = 'USD' | 'UZS';

export type PropertyStatus = 'Active' | 'Sold' | 'Hidden';

export interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: CurrencyType;
  city: string;
  district: string;
  fullAddress: string;
  googleMapsLink: string;
  propertyType: string; // e.g., Apartment, House, Villa, Townhouse
  rooms: number;
  bathrooms: number;
  area: number; // in square meters
  floor: number;
  totalFloors: number;
  parking: boolean;
  furniture: boolean;
  constructionYear: number;
  phoneNumber: string;
  telegramUsername: string;
  status: PropertyStatus;
  isFeatured: boolean;
  images: string[];
  views: number;
  createdDate: string; // ISO String
}

export type RentalStatus = 'Active' | 'Rented' | 'Hidden';

export interface RentalProperty {
  id: string;
  title: string;
  description: string;
  price: number; // per month
  currency: CurrencyType;
  city: string;
  district: string;
  fullAddress: string;
  googleMapsLink: string;
  propertyType: string;
  rooms: number;
  bathrooms: number;
  area: number;
  floor: number;
  totalFloors: number;
  parking: boolean;
  furniture: boolean;
  constructionYear: number;
  phoneNumber: string;
  telegramUsername: string;
  status: RentalStatus;
  isFeatured: boolean;
  images: string[];
  views: number;
  createdDate: string;
}

export type AdminRole = 'Owner' | 'Administrator' | 'Editor';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: AdminRole;
  avatarUrl: string;
  bio: string;
  status: 'Active' | 'Pending';
  lastActive: string;
}

export type LanguageType = 'en' | 'uz' | 'ru';
export type ThemeType = 'light' | 'dark' | 'system';

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  unread: boolean;
  type: 'info' | 'success' | 'alert';
}

export interface RecentActivityItem {
  id: string;
  adminName: string;
  action: string; // e.g., "Created Property 'Luxury Villa'"
  time: string;
  type: 'create' | 'edit' | 'delete' | 'settings';
}
