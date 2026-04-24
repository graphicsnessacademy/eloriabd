import React, { useState, useEffect } from 'react';
import { api } from '../api/axios';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
  BarChart, Bar
} from 'recharts';
import { Activity, Users, ShoppingBag, Search } from 'lucide-react';
import { ExportButton } from '../components/ExportButton';

const COLORS = ['#534AB7', '#A39ADD', '#2C2C2A', '#E5E7EB'];

export const Analytics: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const { data: responseData } = await api.get('/api/admin/analytics/dashboard');
        setData(responseData);
      } catch (error) {
        console.error('Failed to fetch analytics', error);
        // Fallback to mock data on error so UI still renders something
        setData({
          dau: [{ date: 'Mon', users: 0 }],
          visitorTypes: [{ name: 'New', value: 0 }, { name: 'Returning', value: 0 }],
          funnel: [
            { stage: 'Product View', count: 0 },
            { stage: 'Add to Bag', count: 0 },
            { stage: 'Checkout', count: 0 },
            { stage: 'Order Placed', count: 0 },
          ],
          searchTerms: [{ term: 'N/A', count: 0 }],
          popularProducts: [{ name: 'Waiting for traffic...', views: 0 }],
          livePulse: 0,
          totalVisitors: 0,
          ordersToday: 0
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#534AB7]"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-serif text-gray-900">Traffic & Analytics</h1>
          <p className="text-gray-500 mt-1">Real-time visitor behavior and conversion tracking</p>
        </div>
        <div className="flex items-center gap-4">
          <ExportButton 
            endpoint="/api/admin/analytics/report"
            filename={`eloria_executive_report_${new Date().toISOString().split('T')[0]}.pdf`}
            label="Generate Executive Report"
            isPdf={true}
            className="bg-[#534AB7] text-white hover:bg-[#3d3599]"
          />
          <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100 flex items-center gap-2">
            <Activity size={18} className="text-[#534AB7]" />
            <span className="font-semibold text-gray-700">Live Pulse</span>
            <span className="flex h-2 w-2 relative ml-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#534AB7] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#534AB7]"></span>
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Visitors', value: data.totalVisitors || '0', icon: Users, trend: 'Past 30 Days' },
          { label: 'Orders Today', value: data.ordersToday || '0', icon: ShoppingBag, trend: 'Today' },
          { label: 'Live Pulse', value: data.livePulse || '0', icon: Activity, trend: 'Past 30 Mins' },
          { label: 'Conversion', value: data.funnel?.[3]?.count > 0 ? `${((data.funnel[3].count / Math.max(1, data.funnel[0].count)) * 100).toFixed(1)}%` : '0%', icon: Activity, trend: 'Est. Funnel' },
        ].map((kpi, i) => (
          <div key={i} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500 font-medium">{kpi.label}</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">{kpi.value}</h3>
              </div>
              <div className="p-2 bg-purple-50 rounded-lg">
                <kpi.icon size={20} className="text-[#534AB7]" />
              </div>
            </div>
            <div className="text-xs mt-3 font-medium text-gray-500">
              {kpi.trend}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* DAU Chart */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm lg:col-span-2">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Daily Active Users</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.dau}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} dx={-10} />
                <RechartsTooltip
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                />
                <Line
                  type="monotone"
                  dataKey="users"
                  stroke="#534AB7"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#534AB7', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* New vs Returning */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Visitor Demographics</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.visitorTypes}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data.visitorTypes.map((_entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Conversion Funnel */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Conversion Funnel</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.funnel} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E5E7EB" />
                <XAxis type="number" hide />
                <YAxis dataKey="stage" type="category" axisLine={false} tickLine={false} tick={{ fill: '#374151', fontSize: 12, fontWeight: 500 }} />
                <RechartsTooltip cursor={{ fill: 'transparent' }} />
                <Bar dataKey="count" fill="#534AB7" radius={[0, 4, 4, 0]} barSize={24}>
                  {data.funnel.map((_entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tables */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Search size={18} className="text-[#534AB7]" />
              <h2 className="text-lg font-bold text-gray-900">Top Search Terms</h2>
            </div>
            <div className="space-y-3">
              {data.searchTerms.map((item: any, i: number) => (
                <div key={i} className="flex justify-between items-center text-sm">
                  <span className="text-gray-700 font-medium">{item.term}</span>
                  <span className="text-gray-500 bg-gray-50 px-2 py-1 rounded">{item.count} searches</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Popular Masterpieces</h2>
            <div className="space-y-3">
              {data.popularProducts.map((item: any, i: number) => (
                <div key={i} className="flex justify-between items-center text-sm">
                  <span className="text-gray-700 font-medium truncate pr-4">{item.name}</span>
                  <span className="text-[#534AB7] font-semibold bg-purple-50 px-2 py-1 rounded whitespace-nowrap">{item.views} views</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
