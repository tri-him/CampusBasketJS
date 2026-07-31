import { Suspense, lazy, useEffect } from "react";
import { BrowserRouter as Router, Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import ScrollToTop from "./components/ScrollToTop";
import BusinessModeProvider from "./context/BusinessModeProvider";
import useAuth from "./context/useAuth";
import WishlistProvider from "./context/WishlistProvider";
import { syncMarketplaceProducts } from "./lib/marketplaceStore";

const Landing = lazy(() => import("./pages/Landing"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Retail = lazy(() => import("./pages/Retail"));
const SearchResults = lazy(() => import("./pages/SearchResults"));
const Wholesale = lazy(() => import("./pages/Wholesale"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const DashboardLayout = lazy(() => import("./layout/DashboardLayout"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Product = lazy(() => import("./pages/Product"));
const Order = lazy(() => import("./pages/Order"));
const Customer = lazy(() => import("./pages/Customer"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Payment = lazy(() => import("./pages/Payment"));
const OrderSuccess = lazy(() => import("./pages/OrderSucces"));
const Orders = lazy(() => import("./pages/Orders"));
const UserLogin = lazy(() => import("./pages/UserLogin"));
const UserRegister = lazy(() => import("./pages/UserRegister"));
const Support = lazy(() => import("./pages/Support"));
const SupportChat = lazy(() => import("./pages/SupportChat"));
const SupportDesk = lazy(() => import("./pages/SupportDesk"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const Account = lazy(() => import("./pages/Account"));
const Settings = lazy(() => import("./pages/Settings"));
const AdminUsers = lazy(() => import("./pages/AdminUsers"));

function RouteFallback() {
  return (
    <div className="min-h-screen bg-[#f7f7f2]">
      <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4">
        <div className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-500 shadow-sm">
          Loading CampusBasket...
        </div>
      </div>
    </div>
  );
}

function ProtectedDashboard() {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <DashboardLayout />;
}

function App() {
  useEffect(() => {
    const refreshProducts = () => {
      void syncMarketplaceProducts().catch(() => {});
    };
    const idleCallback =
      "requestIdleCallback" in window
        ? window.requestIdleCallback(refreshProducts, { timeout: 3000 })
        : window.setTimeout(refreshProducts, 1500);

    return () => {
      if ("cancelIdleCallback" in window && typeof idleCallback === "number") {
        window.cancelIdleCallback(idleCallback);
        return;
      }

      window.clearTimeout(idleCallback);
    };
  }, []);

  return (
    <Router>
      <BusinessModeProvider>
        <WishlistProvider>
          <ScrollToTop />
          <Navbar />
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/payment" element={<Payment />} />
              <Route path="/order-success" element={<OrderSuccess />} />
              <Route path="/account" element={<Account />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/wishlist" element={<Wishlist />} />
              <Route path="/support" element={<Support />} />
              <Route path="/support/chat" element={<SupportChat />} />
              <Route path="/account/login" element={<UserLogin />} />
              <Route path="/account/register" element={<UserRegister />} />

              <Route path="/dashboard" element={<ProtectedDashboard />}>
                <Route index element={<Dashboard />} />
                <Route path="products" element={<Product />} />
                <Route path="orders" element={<Order />} />
                <Route path="customers" element={<Customer />} />
                <Route path="settings" element={<Settings />} />
                <Route path="support" element={<SupportDesk />} />
                <Route path="users" element={<AdminUsers />} />
              </Route>

              <Route path="/retail" element={<Retail />} />
              <Route path="/search" element={<SearchResults />} />
              <Route path="/wholesale" element={<Wholesale />} />
              <Route path="/products/:productId" element={<ProductDetail />} />
            </Routes>
          </Suspense>
        </WishlistProvider>
      </BusinessModeProvider>
    </Router>
  );
}

export default App;
