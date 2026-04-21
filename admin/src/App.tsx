
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Pages
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Products } from './pages/Products';
import { ProductForm } from './pages/ProductForm';
import { OrderList } from './pages/OrderList';
import OrderDetail from './pages/OrderDetail';
import { Users } from './pages/Users';
import { SiteConfigPage } from './pages/SiteConfig';
import { OfferZones } from './pages/OfferZones';
import { Coupons } from './pages/Coupons';

// Layouts & Components
import { AdminLayout } from './layouts/AdminLayout';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* 1. Public Route: Authentication */}
          <Route path="/admin/login" element={<Login />} />

          {/* 2. Protected Routes: Requires Admin Login */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AdminLayout />}>
              
              {/* Dashboard Home */}
              <Route path="/admin/dashboard" element={<Dashboard />} />
              
              {/* Product Management */}
              <Route path="/admin/products" element={<Products />} />
              <Route path="/admin/products/new" element={<ProductForm />} />
              <Route path="/admin/products/:id/edit" element={<ProductForm />} />
              
              {/* Order Management System (Sprint 3.1 & 3.2) */}
              <Route path="/admin/orders" element={<OrderList />} />
              <Route path="/admin/orders/:id" element={<OrderDetail />} />
              
              {/* User Management */}
              <Route path="/admin/users" element={<Users />} />
              
              {/* System Configuration */}
              <Route path="/admin/config" element={<SiteConfigPage />} />
              <Route path="/admin/offer-zones" element={<OfferZones />} />
              <Route path="/admin/coupons" element={<Coupons />} />
              
              {/* Internal Redirects */}
              <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
              {/* Catch-all for undefined /admin routes */}
              <Route path="/admin/*" element={<Navigate to="/admin/dashboard" replace />} />
              
            </Route>
          </Route>
          
          {/* 3. Global Catch-all: Redirect unknown paths to login */}
          <Route path="*" element={<Navigate to="/admin/login" replace />} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;