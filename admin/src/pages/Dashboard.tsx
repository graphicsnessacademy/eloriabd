import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/axios';
import { Banknote, Package, ShoppingCart, Users, Loader2 } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [statsData, setStatsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/api/admin/stats');
        setStatsData(data);
      } catch (err) {
        console.error('Failed to fetch stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const stats = [
    { 
      label: 'Total Revenue', 
      value: statsData ? `৳ ${statsData.revenue.toLocaleString()}` : '৳ 0', 
      icon: Banknote, 
      color: 'text-emerald-600', 
      bg: 'bg-emerald-100' 
    },
    { 
      label: 'Total Orders', 
      value: statsData ? statsData.orders.toLocaleString() : '0', 
      icon: ShoppingCart, 
      color: 'text-blue-600', 
      bg: 'bg-blue-100' 
    },
    { 
      label: 'Total Products', 
      value: statsData ? statsData.products.toLocaleString() : '0', 
      icon: Package, 
      color: 'text-purple-600', 
      bg: 'bg-purple-100' 
    },
    { 
      label: 'Active Users', 
      value: statsData ? statsData.users.toLocaleString() : '0', 
      icon: Users, 
      color: 'text-orange-600', 
      bg: 'bg-orange-100' 
    },
  ];

  if (loading) return (
    <div className="flex h-64 items-center justify-center">
      <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Welcome back, {user?.name}! 👋</h2>
          <p className="text-slate-500 mt-1">Here is what's happening with your store today.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4">
              <div className={`p-4 rounded-xl ${stat.bg}`}>
                <Icon className={`w-8 h-8 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Recent Activity</h3>
        <div className="text-slate-500 italic py-8 text-center border-2 border-dashed border-slate-100 rounded-xl">
          Activity feed will be implemented here.
        </div>
      </div>
    </div>
  );
};
