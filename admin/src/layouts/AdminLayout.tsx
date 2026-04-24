import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  LogOut,
  Settings,
  Megaphone,
  Ticket,
  Activity,
  FileText,
  Truck,
  Menu,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { NotificationBell } from '../components/NotificationBell';
import { OfflineBanner } from '../components/OfflineBanner';

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Products', path: '/admin/products', icon: Package },
    { name: 'Orders', path: '/admin/orders', icon: ShoppingCart },
    { name: 'Users', path: '/admin/users', icon: Users },
    { name: 'Offer Zones', path: '/admin/offer-zones', icon: Megaphone },
    { name: 'Coupons', path: '/admin/coupons', icon: Ticket },
    { name: 'Analytics', path: '/admin/analytics', icon: Activity },
    { name: 'Pages', path: '/admin/pages', icon: FileText },
    { name: 'Shipping', path: '/admin/shipping', icon: Truck },
    { name: 'Site Config', path: '/admin/config', icon: Settings },
  ];

  return (
    <>
      <OfflineBanner />

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
              className="fixed inset-y-0 left-0 w-64 bg-[#0a0a0a] text-slate-300 flex flex-col z-50 lg:hidden shadow-2xl"
            >
              <div className="p-6 border-b border-white/10 flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">Eloria BD</h2>
                  <p className="text-sm text-slate-400 mt-1">Admin Panel</p>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.name}
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive
                          ? 'bg-[#534AB7] text-white'
                          : 'hover:bg-white/10 hover:text-white'
                        }`
                      }
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.name}</span>
                    </NavLink>
                  );
                })}
              </nav>

              <div className="p-4 border-t border-white/10">
                <div className="flex items-center space-x-3 mb-4 px-2">
                  <div className="h-10 w-10 rounded-full bg-[#534AB7] flex items-center justify-center text-white font-bold shrink-0">
                    {user?.name?.charAt(0).toUpperCase() || 'A'}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm font-medium text-white truncate">{user?.name || 'Admin User'}</p>
                    <p className="text-xs text-slate-400 truncate">{user?.email || 'admin@eloriabd.com'}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-3 px-4 py-2.5 text-slate-300 hover:bg-white/10 hover:text-red-400 rounded-lg transition-colors duration-200"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-slate-50 flex mt-[env(safe-area-inset-top)] lg:mt-0">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex w-64 bg-[#0a0a0a] border-r border-slate-800 text-slate-300 flex-col shrink-0">
          <div className="p-6 border-b border-slate-800">
            <h2 className="text-2xl font-bold text-white tracking-tight">Eloria BD</h2>
          <p className="text-sm text-slate-400 mt-1">Admin Panel</p>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive
                    ? 'bg-[#534AB7] text-white'
                    : 'hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center space-x-3 mb-4 px-2">
            <div className="h-10 w-10 rounded-full bg-[#534AB7] flex items-center justify-center text-white font-bold shrink-0">
              {user?.name?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-white truncate">{user?.name || 'Admin User'}</p>
              <p className="text-xs text-slate-400 truncate">{user?.email || 'admin@eloriabd.com'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-2.5 text-slate-300 hover:bg-slate-800 hover:text-red-400 rounded-lg transition-colors duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden text-slate-900">
        {/* Mobile Header */}
        <header className="lg:hidden h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 shadow-sm shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsMobileMenuOpen(true)} className="text-slate-600 hover:text-slate-900 transition-colors">
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight font-serif">ELORIA</h1>
          </div>
          <NotificationBell />
        </header>

        {/* Desktop Header */}
        <header className="hidden lg:flex h-16 bg-white border-b border-slate-200 flex items-center px-8 shadow-sm shrink-0">
          <h1 className="text-xl font-semibold text-slate-800 font-serif">Admin Portal</h1>
          <div className="ml-auto flex items-center space-x-6 text-slate-500">
            <NotificationBell />
            <button className="hover:text-slate-800 transition-colors">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8 bg-slate-50">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
    </>
  );
};
