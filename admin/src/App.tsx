
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Pages
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Products } from './pages/Products';
import { ProductForm } from './pages/ProductForm';
import { OrderList } from './pages/OrderList';
import OrderDetail from './pages/OrderDetail';
import { SiteConfigPage } from './pages/SiteConfig';
import { OfferZones } from './pages/OfferZones';
import { Coupons } from './pages/Coupons';
import { Analytics } from './pages/Analytics';
import { UserList } from './pages/UserList';
import { UserDetail } from './pages/UserDetail';
import { ContentPages } from './pages/ContentPages';
import { ContentPageEditor } from './pages/ContentPageEditor';
import { ShippingZones } from './pages/ShippingZones';

// Layouts & Components
import { AdminLayout } from './layouts/AdminLayout';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* 1. Public Routes: Login */}
          <Route path="/admin/login" element={<Login />} />

          {/* 2. Protected Routes: Requires Admin Login */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AdminLayout />}>

              {/* Dashboard Home & Analytics */}
              <Route path="/admin/dashboard" element={<Dashboard />} />
              <Route path="/admin/analytics" element={<Analytics />} />

              {/* User Management System (Sprint 7.1) */}
              <Route path="/admin/users" element={<UserList />} />
              <Route path="/admin/users/:id" element={<UserDetail />} />

              {/* Product Management */}
              <Route path="/admin/products" element={<Products />} />
              <Route path="/admin/products/new" element={<ProductForm />} />
              <Route path="/admin/products/:id/edit" element={<ProductForm />} />

              {/* Order Management System (Sprint 3.1 & 3.2) */}
              <Route path="/admin/orders" element={<OrderList />} />
              <Route path="/admin/orders/:id" element={<OrderDetail />} />

              {/* System Configuration */}
              <Route path="/admin/config" element={<SiteConfigPage />} />
              <Route path="/admin/offer-zones" element={<OfferZones />} />
              <Route path="/admin/coupons" element={<Coupons />} />
              <Route path="/admin/pages" element={<ContentPages />} />
              <Route path="/admin/pages/:slug/edit" element={<ContentPageEditor />} />
              <Route path="/admin/shipping" element={<ShippingZones />} />

              {/* Internal Redirects */}
              <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;