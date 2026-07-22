/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { viewsTrendData, monthlyViewsTrendData } from '../mockData';
import { Eye, TrendingUp, Calendar, Trophy, ChevronRight } from 'lucide-react';
import { LanguageType } from '../types';
import { i18n } from '../i18n';

interface AnalyticsChartsProps {
  lang: LanguageType;
  totalViews: number;
  activeCount: number;
  soldCount: number;
  rentalCount: number;
}

export default function AnalyticsCharts({
  lang,
  totalViews,
  activeCount,
  soldCount,
  rentalCount,
}: AnalyticsChartsProps) {
  const t = i18n[lang];
  const [timeRange, setTimeRange] = useState<'weekly' | 'monthly'>('weekly');

  const chartData = timeRange === 'weekly' ? viewsTrendData : monthlyViewsTrendData;

  const statusData = [
    { name: t.active, value: activeCount, color: '#D4AF37' },
    { name: t.sold, value: soldCount, color: '#10B981' },
    { name: t.totalRentals, value: rentalCount, color: '#3B82F6' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      {/* Views Trend Chart */}
      <div className="lg:col-span-2 p-8 rounded-[32px] border border-slate-100 dark:border-white/5 bg-white dark:bg-[#0F0F0F] shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-[#D4AF37]" />
              <h3 className="text-lg font-black text-slate-900 dark:text-white font-sans uppercase tracking-tight">
                {t.viewsTrend}
              </h3>
            </div>
            <p className="text-xs text-slate-400 dark:text-gray-500 mt-1 italic font-medium lowercase">Real-time listing performance indicators</p>
          </div>

          <div className="flex bg-slate-50 dark:bg-white/5 p-1 rounded-xl border border-slate-100 dark:border-white/10 self-start">
            <button
              onClick={() => setTimeRange('weekly')}
              className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                timeRange === 'weekly'
                  ? 'bg-white dark:bg-white/10 text-[#D4AF37] shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100'
              }`}
            >
              {t.weeklyViews}
            </button>
            <button
              onClick={() => setTimeRange('monthly')}
              className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                timeRange === 'monthly'
                  ? 'bg-white dark:bg-white/10 text-[#D4AF37] shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100'
              }`}
            >
              {t.monthlyViews}
            </button>
          </div>
        </div>

        {/* Recharts Area */}
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData as any} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#D4AF37" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorRentals" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" className="dark:stroke-slate-800/60" />
              <XAxis
                dataKey="name"
                stroke="#94A3B8"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                dy={10}
                className="font-mono"
              />
              <YAxis
                stroke="#94A3B8"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                dx={-10}
                className="font-mono"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0F172A',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#fff',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '11px',
                  boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
                }}
              />
              {timeRange === 'weekly' ? (
                <>
                  <Area
                    type="monotone"
                    dataKey="salesViews"
                    name="For Sale Views"
                    stroke="#D4AF37"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorSales)"
                  />
                  <Area
                    type="monotone"
                    dataKey="rentalViews"
                    name="Rental Views"
                    stroke="#3B82F6"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorRentals)"
                  />
                </>
              ) : (
                <Area
                  type="monotone"
                  dataKey="views"
                  name="Monthly Total Views"
                  stroke="#D4AF37"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorSales)"
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Portfolio Distribution By Status */}
      <div className="p-8 rounded-[32px] border border-slate-100 dark:border-white/5 bg-white dark:bg-[#0F0F0F] shadow-2xl flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-[#D4AF37]" />
            <h3 className="text-lg font-black text-slate-900 dark:text-white font-sans uppercase tracking-tight">
              {t.propertiesByStatus}
            </h3>
          </div>
          <p className="text-xs text-slate-400 dark:text-gray-500 mb-6 italic font-medium lowercase">Distribution breakdown across database schemas</p>

          {/* Mini Bar Chart */}
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData} margin={{ top: 10, right: 10, left: -30, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" className="dark:stroke-slate-800/40" />
                <XAxis dataKey="name" fontSize={9} stroke="#94A3B8" tickLine={false} axisLine={false} />
                <YAxis fontSize={9} stroke="#94A3B8" tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '10px',
                  }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={28}>
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Text Breakdown list */}
        <div className="space-y-2 mt-4 pt-4 border-t border-slate-100 dark:border-white/10">
          {statusData.map((status) => (
            <div key={status.name} className="flex items-center justify-between text-xs font-sans">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: status.color }} />
                <span className="text-slate-600 dark:text-gray-400 font-bold uppercase tracking-wider text-[10px]">{status.name}</span>
              </div>
              <span className="font-black font-mono text-slate-900 dark:text-white">{status.value} units</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
