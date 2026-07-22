/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Property, RentalProperty, AdminUser, NotificationItem, RecentActivityItem } from './types';

export const initialSalesProperties: Property[] = [];

export const initialRentalProperties: RentalProperty[] = [];

export const initialAdmins: AdminUser[] = [
  {
    id: 'admin-1',
    name: 'Aslbek Mamatov',
    email: 'aslbekmamatov70@gmail.com',
    phone: '+998 90 123 45 67',
    role: 'Owner',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&h=400&q=80',
    bio: 'Lead Real Estate Architect & Managing Director of Tashkent Premium Estates. Passionate about building world-class SaaS solutions for modern property management.',
    status: 'Active',
    lastActive: 'Just Now'
  },
  {
    id: 'admin-2',
    name: 'Malika Karimova',
    email: 'malika.k@premiumestates.uz',
    phone: '+998 94 987 65 43',
    role: 'Administrator',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&h=400&q=80',
    bio: 'Senior operations administrator managing property portfolios, listings quality compliance, and regional brokers relations across Tashkent.',
    status: 'Active',
    lastActive: '5 mins ago'
  },
  {
    id: 'admin-3',
    name: 'Rustam Akhmedov',
    email: 'rustam.a@premiumestates.uz',
    phone: '+998 97 555 44 33',
    role: 'Editor',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&h=400&q=80',
    bio: 'Creative content director and copywriter, responsible for professional high-impact descriptions, media management, and featured publications.',
    status: 'Active',
    lastActive: '1 hour ago'
  },
  {
    id: 'admin-4',
    name: 'Elena Smirnova',
    email: 'elena.s@premiumestates.uz',
    phone: '+998 91 222 33 44',
    role: 'Editor',
    avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&h=400&q=80',
    bio: 'Marketing designer specialist managing virtual property tours, graphic components, and client-facing digital listings.',
    status: 'Pending',
    lastActive: 'Never'
  }
];

export const initialNotifications: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'High View Milestone Reached',
    description: 'Penthouse in Mirabad district has reached over 1,200 views this week.',
    time: '2 hours ago',
    unread: true,
    type: 'success'
  },
  {
    id: 'notif-2',
    title: 'New Admin Invitation Accepted',
    description: 'Malika Karimova successfully verified her corporate admin profile.',
    time: '5 hours ago',
    unread: true,
    type: 'info'
  },
  {
    id: 'notif-3',
    title: 'Property Status Updated',
    description: 'Apartment Boulevard in Tashkent City changed status to Rented.',
    time: '1 day ago',
    unread: false,
    type: 'alert'
  },
  {
    id: 'notif-4',
    title: 'Backup Generated Successfully',
    description: 'Automated nightly SaaS database mirror backup has finished.',
    time: '2 days ago',
    unread: false,
    type: 'success'
  }
];

export const initialActivities: RecentActivityItem[] = [
  {
    id: 'act-1',
    adminName: 'Aslbek Mamatov',
    action: 'Published new sale property "Luxury High-Rise Penthouse"',
    time: '10 mins ago',
    type: 'create'
  },
  {
    id: 'act-2',
    adminName: 'Malika Karimova',
    action: 'Updated price for "Modern Minimalist Villa" to $680,000',
    time: '45 mins ago',
    type: 'edit'
  },
  {
    id: 'act-3',
    adminName: 'Rustam Akhmedov',
    action: 'Duplicated rental listing "High-End Modern Studio"',
    time: '2 hours ago',
    type: 'create'
  },
  {
    id: 'act-4',
    adminName: 'Aslbek Mamatov',
    action: 'Changed global application language structure to multi-locale (UZ/EN/RU)',
    time: '4 hours ago',
    type: 'settings'
  },
  {
    id: 'act-5',
    adminName: 'Malika Karimova',
    action: 'Deleted draft property listing id "prop-draft-109"',
    time: '1 day ago',
    type: 'delete'
  }
];

// Rich interactive data for charts (Total, Weekly, Monthly views)
export const viewsTrendData = [
  { name: 'Mon', salesViews: 120, rentalViews: 85, totalViews: 205 },
  { name: 'Tue', salesViews: 240, rentalViews: 190, totalViews: 430 },
  { name: 'Wed', salesViews: 380, rentalViews: 280, totalViews: 660 },
  { name: 'Thu', salesViews: 290, rentalViews: 310, totalViews: 600 },
  { name: 'Fri', salesViews: 520, rentalViews: 410, totalViews: 930 },
  { name: 'Sat', salesViews: 610, rentalViews: 540, totalViews: 1150 },
  { name: 'Sun', salesViews: 580, rentalViews: 480, totalViews: 1060 },
];

export const monthlyViewsTrendData = [
  { name: 'Jan', views: 8400 },
  { name: 'Feb', views: 11200 },
  { name: 'Mar', views: 9800 },
  { name: 'Apr', views: 14500 },
  { name: 'May', views: 18200 },
  { name: 'Jun', views: 22100 },
  { name: 'Jul', views: 25600 },
];
