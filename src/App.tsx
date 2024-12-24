import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  createRoutesFromElements,
  createBrowserRouter,
  Outlet,
  RouterProvider
} from "react-router-dom";
import { Toaster } from 'react-hot-toast';
import { Header } from "./components/Header.js";
import { Hero } from "./components/Hero.js";
import { BrandBanner } from "./components/BrandBanner.js";
import ProductGrid from "./components/ProductGrid.js";
import { ProductDetail } from "./components/ProductDetail.js";
import { AllProducts } from "./components/AllProducts.js";
import { NewProducts } from "./components/NewProducts.js";
import { SaleProducts } from "./components/SaleProducts.js";
import { Checkout } from "./components/Checkout.js";
import { Profile } from "./components/Profile.js";
import { UserOrders } from "./components/UserOrders.js";
import { UserMessages } from "./components/UserMessages.js";
import { WishlistPage } from "./components/WishlistPage.js";
import { Login } from "./components/auth/Login.js";
import { Register } from "./components/auth/Register.js";
import { AdminLogin } from "./components/auth/AdminLogin.js";
import { AdminLayout } from "./components/admin/AdminLayout.js";
import Dashboard from "./components/admin/Dashboard.js";
import { ProductManagement } from "./components/admin/ProductManagement.js";
import CategoryManagement from "./components/admin/CategoryManagement.js";
import ProductTypeManagement from "./components/admin/ProductTypeManagement.js";
import BrandManagement from "./components/admin/BrandManagement.js";
import { UserManagement } from "./components/admin/UserManagement.js";
import OrderManagement from "./components/admin/OrderManagement.js";
import MessageManagement from "./components/admin/MessageManagement.js";
import { Settings } from "./components/admin/Settings.js";
import { PublicLayout } from "./components/PublicLayout.js";
import { Layout } from "./components/Layout.js";
import { AuthProvider, useAuth } from "./context/AuthContext.js";
import { SearchProvider } from "./context/SearchContext.js";
import { CartProvider } from "./context/CartContext.js";
import { WishlistProvider } from "./context/WishlistContext.js";
import 'bootstrap/dist/css/bootstrap.min.css';

// Protected Route wrapper for admin routes
function AdminRoute({ children }: { children: JSX.Element }) {
  const { isAuthenticated, isAdmin } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}

// Protected Route wrapper for user routes
function UserRoute({ children }: { children: JSX.Element }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      {/* Public and User Routes */}
      <Route element={<PublicLayout />}>
        {/* Public Routes */}
        <Route path="/" element={
          <>
            <Hero />
            <BrandBanner />
            <ProductGrid />
          </>
        } />
        <Route path="/products" element={<AllProducts />} />
        <Route path="/products/new" element={<NewProducts />} />
        <Route path="/products/sale" element={<SaleProducts />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/checkout" element={<UserRoute><Checkout /></UserRoute>} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* User Routes */}
        <Route path="/profile" element={<UserRoute><Profile /></UserRoute>} />
        <Route path="/orders" element={<UserRoute><UserOrders /></UserRoute>} />
        <Route path="/messages" element={<UserRoute><UserMessages /></UserRoute>} />
        <Route path="/wishlist" element={<UserRoute><WishlistPage /></UserRoute>} />
      </Route>

      {/* Admin Routes - No Header */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminRoute><AdminLayout><Outlet /></AdminLayout></AdminRoute>}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="products" element={<ProductManagement />} />
        <Route path="categories" element={<CategoryManagement />} />
        <Route path="types" element={<ProductTypeManagement />} />
        <Route path="brands" element={<BrandManagement />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="orders" element={<OrderManagement />} />
        <Route path="messages" element={<MessageManagement />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </>
  ),
  {
    future: {
      v7_startTransition: true,
      v7_fetcherPersist: true,
      v7_normalizeFormMethod: true,
      v7_relativeSplatPath: true,
      v7_partialHydration: true,
      v7_skipActionErrorRevalidation: true
    }
  }
);

function App() {
  return (
    <AuthProvider>
      <SearchProvider>
        <CartProvider>
          <WishlistProvider>
            <RouterProvider router={router} />
            <Toaster position="top-right" />
          </WishlistProvider>
        </CartProvider>
      </SearchProvider>
    </AuthProvider>
  );
}

export default App;
