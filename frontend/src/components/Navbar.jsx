import { useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Boxes,
  ChevronRight,
  Headset,
  Heart,
  MessageSquare,
  Search,
  ShoppingBag,
  ShoppingCart,
  Store,
  UserCircle2,
} from "lucide-react";
import useAuth from "../context/useAuth";
import useCart from "../context/useCart";
import useCustomerAuth from "../context/useCustomerAuth";
import BrandLogo from "./BrandLogo";

const actionCardBase =
  "group inline-flex h-11 items-center gap-2 rounded-full border px-3 text-sm font-semibold text-white transition duration-200 sm:px-3.5";


  
function Navbar() {
  const { user: seller, logout: logoutSeller } = useAuth();
  const { customer, logoutCustomer } = useCustomerAuth();
  const { cart } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const [openPanelKey, setOpenPanelKey] = useState(null);

  if (location.pathname.startsWith("/dashboard")) {
    return null;
  }

  const activeSearch = new URLSearchParams(location.search).get("search") || "";
  const currentRouteKey = `${location.pathname}${location.search}`;

  const isPanelOpen = (name) => openPanelKey === `${currentRouteKey}:${name}`;

  const togglePanel = (name) => {
    const nextKey = `${currentRouteKey}:${name}`;
    setOpenPanelKey((current) => (current === nextKey ? null : nextKey));
  };

  const closePanels = () => {
    setOpenPanelKey(null);
  };

  const handleSearch = (e) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const rawSearch = formData.get("search");
    const trimmedQuery =
      typeof rawSearch === "string" ? rawSearch.trim() : "";

    const targetPath =
      location.pathname === "/wholesale"
        ? "/wholesale"
        : location.pathname === "/retail"
          ? "/retail"
          : "/search";

    closePanels();

    if (trimmedQuery) {
      navigate(`${targetPath}?search=${encodeURIComponent(trimmedQuery)}`);
      return;
    }

    navigate(targetPath);
  };

  const isLoggedIn = Boolean(customer || seller);
  const showUserSection = !isLoggedIn || Boolean(customer);
  const showSellerSection = !isLoggedIn || Boolean(seller && seller.role !== "ADMIN");
  const showAdminSection = !isLoggedIn || Boolean(seller && seller.role === "ADMIN");

  return (
    <nav className="sticky top-0 z-50 border-b border-[color:rgba(214,178,94,0.18)] bg-[linear-gradient(135deg,rgba(15,23,42,0.98)_0%,rgba(17,24,39,0.96)_60%,rgba(17,46,37,0.94)_100%)] px-2 py-2 text-white backdrop-blur sm:px-3 md:px-5">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-1.5 sm:gap-2 lg:flex-nowrap">
          <BrandLogo
            onClick={closePanels}
            compact
            className="order-1 flex-1 rounded-full border border-white/10 bg-white/[0.04] px-2 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] lg:order-none lg:flex-none lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none"
          />

          <NavLink
            to="/retail"
            onClick={closePanels}
            className={({ isActive }) =>
              `${actionCardBase} order-2 flex-1 justify-center lg:order-none lg:flex-none lg:justify-start ${
                isActive
                  ? "border-[color:rgba(16,185,129,0.58)] bg-[color:rgba(16,185,129,0.18)] shadow-[0_10px_25px_rgba(16,185,129,0.12)]"
                  : "border-white/10 bg-white/5 hover:border-[color:rgba(16,185,129,0.46)] hover:bg-[color:rgba(16,185,129,0.12)]"
              }`
            }
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[color:rgba(16,185,129,0.16)] text-[var(--color-brand-emerald)]">
              <ShoppingBag size={15} />
            </div>
            <span>Retail</span>
          </NavLink>

          <NavLink
            to="/wholesale"
            onClick={closePanels}
            className={({ isActive }) =>
              `${actionCardBase} order-2 flex-1 justify-center lg:order-none lg:flex-none lg:justify-start ${
                isActive
                  ? "border-[color:rgba(214,178,94,0.58)] bg-[color:rgba(214,178,94,0.18)] shadow-[0_10px_25px_rgba(214,178,94,0.14)]"
                  : "border-white/10 bg-white/5 hover:border-[color:rgba(214,178,94,0.46)] hover:bg-[color:rgba(214,178,94,0.12)]"
              }`
            }
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[color:rgba(214,178,94,0.16)] text-[var(--color-brand-champagne)]">
              <Boxes size={15} />
            </div>
            <span>Wholesale</span>
          </NavLink>

          <form
            onSubmit={handleSearch}
            key={`${location.pathname}-${activeSearch}`}
            className="order-last flex w-full flex-none basis-full items-center gap-2 lg:order-none lg:min-w-[15rem] lg:flex-1 lg:basis-auto"
          >
            <div className="relative min-w-0 flex-1">
              <Search
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[color:rgba(255,255,255,0.48)]"
              />
              <input
                name="search"
                type="search"
                defaultValue={activeSearch}
                placeholder="Search products or deals"
                className="w-full rounded-full border border-white/10 bg-[color:rgba(255,255,255,0.08)] py-2.5 pl-9 pr-4 text-sm text-white outline-none transition placeholder:text-[color:rgba(255,255,255,0.45)] focus:border-[var(--color-brand-champagne)] focus:ring-2 focus:ring-[color:rgba(214,178,94,0.18)] lg:py-2"
              />
            </div>

            <button
              type="submit"
              className="shrink-0 rounded-full bg-[linear-gradient(135deg,var(--color-brand-emerald)_0%,#34d399_100%)] px-4 py-2.5 text-sm font-semibold text-[var(--color-brand-slate)] shadow-[0_12px_24px_rgba(16,185,129,0.18)] transition hover:brightness-105 sm:py-2"
            >
              Search
            </button>
          </form>

          <div className="relative order-1 shrink-0 lg:order-none">
            <button
              type="button"
              onClick={() => togglePanel("login")}
              className={`${actionCardBase} border-[color:rgba(214,178,94,0.18)] bg-[color:rgba(255,255,255,0.06)] hover:border-[color:rgba(214,178,94,0.38)] hover:bg-white/10`}
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[color:rgba(255,255,255,0.08)] text-[var(--color-brand-champagne-soft)]">
                <UserCircle2 size={16} />
              </div>
              <span>{customer ? "My Account" : seller?.role === "ADMIN" ? "Admin" : seller ? "Seller" : "Login"}</span>
            </button>

            {isPanelOpen("login") && (
              <div className="fixed left-1/2 top-[4.75rem] z-50 max-h-[calc(100vh-5.25rem)] w-[min(22rem,calc(100vw-2rem))] -translate-x-1/2 overflow-y-auto rounded-3xl border border-[color:rgba(214,178,94,0.16)] bg-[linear-gradient(180deg,rgba(15,23,42,0.98)_0%,rgba(23,31,48,0.98)_100%)] p-3 shadow-2xl shadow-slate-950/60 sm:w-[24rem] sm:p-4 lg:absolute lg:left-auto lg:right-0 lg:top-[calc(100%+10px)] lg:max-h-[calc(100vh-120px)] lg:w-[min(24rem,calc(100vw-1rem))] lg:translate-x-0 lg:p-5">
                <div className="mb-5 flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[color:rgba(214,178,94,0.12)] text-[var(--color-brand-champagne-soft)]">
                    <UserCircle2 size={18} strokeWidth={2.2} />
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white">
                      {customer ? "Customer Account" : seller?.role === "ADMIN" ? "Admin Workspace" : seller ? "Seller Hub" : "Login Hub"}
                    </h3>
                    <p className="mt-1 text-sm text-[color:rgba(255,255,255,0.62)]">
                      {isLoggedIn ? "Manage your account securely." : "Customer, seller, and admin access are grouped in one place."}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {showUserSection && (
                  <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="mb-3 flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[color:rgba(255,255,255,0.07)] text-slate-100">
                        <UserCircle2 size={17} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">User</p>
                        <p className="text-xs text-[color:rgba(255,255,255,0.58)]">Customer account access</p>
                      </div>
                    </div>

                    {customer ? (
                      <div className="space-y-2">
                        <p className="text-xs text-[color:rgba(255,255,255,0.58)] mb-2">
                          Signed in as <span className="font-semibold text-white">{customer.name}</span>
                        </p>
                        <Link
                          to="/account"
                          onClick={closePanels}
                          className="flex items-center justify-between rounded-full border border-[color:rgba(255,255,255,0.12)] px-4 py-2.5 text-sm font-semibold text-slate-100 transition hover:border-[color:rgba(214,178,94,0.28)] hover:bg-[color:rgba(255,255,255,0.06)]"
                        >
                          Account Overview
                          <ChevronRight size={16} />
                        </Link>
                        <Link
                          to="/orders"
                          onClick={closePanels}
                          className="flex items-center justify-between rounded-full border border-[color:rgba(255,255,255,0.12)] px-4 py-2.5 text-sm font-semibold text-slate-100 transition hover:border-[color:rgba(214,178,94,0.28)] hover:bg-[color:rgba(255,255,255,0.06)]"
                        >
                          Track Orders
                          <ChevronRight size={16} />
                        </Link>
                        <Link
                          to="/cart"
                          onClick={closePanels}
                          className="flex items-center justify-between rounded-full border border-[color:rgba(255,255,255,0.12)] px-4 py-2.5 text-sm font-semibold text-slate-100 transition hover:border-[color:rgba(214,178,94,0.28)] hover:bg-[color:rgba(255,255,255,0.06)]"
                        >
                          View Cart
                          <ChevronRight size={16} />
                        </Link>
                        <Link
                          to="/wishlist"
                          onClick={closePanels}
                          className="flex items-center justify-between rounded-full border border-[color:rgba(255,255,255,0.12)] px-4 py-2.5 text-sm font-semibold text-slate-100 transition hover:border-[color:rgba(214,178,94,0.28)] hover:bg-[color:rgba(255,255,255,0.06)]"
                        >
                          Wishlist
                          <Heart size={16} />
                        </Link>
                        <Link
                          to="/support"
                          onClick={closePanels}
                          className="flex items-center justify-between rounded-full border border-[color:rgba(255,255,255,0.12)] px-4 py-2.5 text-sm font-semibold text-slate-100 transition hover:border-[color:rgba(214,178,94,0.28)] hover:bg-[color:rgba(255,255,255,0.06)]"
                        >
                          Customer Service
                          <Headset size={16} />
                        </Link>
                        <Link
                          to="/support/chat"
                          onClick={closePanels}
                          className="flex items-center justify-between rounded-full border border-[color:rgba(255,255,255,0.12)] px-4 py-2.5 text-sm font-semibold text-slate-100 transition hover:border-[color:rgba(214,178,94,0.28)] hover:bg-[color:rgba(255,255,255,0.06)]"
                        >
                          Live Support Chat
                          <MessageSquare size={16} />
                        </Link>
                        <div className="pt-2">
                          <button
                            onClick={() => {
                              closePanels();
                              logoutCustomer();
                            }}
                            className="w-full rounded-full border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-sm font-semibold text-rose-400 transition hover:bg-rose-500/20"
                          >
                            User Logout
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Link
                          to="/account/login"
                          onClick={closePanels}
                          className="flex items-center justify-between rounded-full bg-[var(--color-brand-ivory-soft)] px-4 py-2.5 text-sm font-semibold text-[var(--color-brand-slate)] transition hover:bg-white"
                        >
                          User Login
                          <ChevronRight size={16} />
                        </Link>
                        <Link
                          to="/account/register"
                          onClick={closePanels}
                          className="flex items-center justify-between rounded-full border border-[color:rgba(255,255,255,0.12)] px-4 py-2.5 text-sm font-semibold text-slate-100 transition hover:border-[color:rgba(214,178,94,0.28)] hover:bg-[color:rgba(255,255,255,0.06)]"
                        >
                          User Register
                          <ChevronRight size={16} />
                        </Link>
                      </div>
                    )}
                  </section>
                  )}

                  {showSellerSection && (
                  <section className="rounded-2xl border border-[color:rgba(214,178,94,0.24)] bg-[color:rgba(214,178,94,0.08)] p-4">
                    <div className="mb-3 flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[color:rgba(214,178,94,0.14)] text-[var(--color-brand-champagne-soft)]">
                        <Store size={17} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">Seller</p>
                        <p className="text-xs text-[color:rgba(255,255,255,0.58)]">Store login and management</p>
                      </div>
                    </div>

                    {seller && seller.role !== "ADMIN" ? (
                      <div className="space-y-2">
                        <p className="text-xs text-[color:rgba(255,255,255,0.7)]">
                          Active store <span className="font-semibold text-white">{seller.storeName || seller.name}</span>
                        </p>
                        <Link
                          to="/dashboard"
                          onClick={closePanels}
                          className="flex items-center justify-between rounded-full bg-[linear-gradient(135deg,var(--color-brand-emerald)_0%,#34d399_100%)] px-4 py-2.5 text-sm font-semibold text-[var(--color-brand-slate)] transition hover:brightness-105"
                        >
                          Seller Dashboard
                          <ChevronRight size={16} />
                        </Link>
                        <button
                          onClick={() => {
                            closePanels();
                            logoutSeller();
                          }}
                          className="w-full rounded-full bg-rose-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-400"
                        >
                          Seller Logout
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Link
                          to="/login?role=SELLER"
                          onClick={closePanels}
                          className="flex items-center justify-between rounded-full border border-[color:rgba(255,255,255,0.12)] px-4 py-2.5 text-sm font-semibold text-slate-100 transition hover:border-[color:rgba(214,178,94,0.3)] hover:bg-[color:rgba(255,255,255,0.06)]"
                        >
                          Seller Login
                          <ChevronRight size={16} />
                        </Link>
                        <Link
                          to="/register"
                          onClick={closePanels}
                          className="flex items-center justify-between rounded-full bg-[linear-gradient(135deg,var(--color-brand-champagne-soft)_0%,#ebd7a3_100%)] px-4 py-2.5 text-sm font-semibold text-[var(--color-brand-slate)] transition hover:brightness-105"
                        >
                          Seller Register
                          <ChevronRight size={16} />
                        </Link>
                      </div>
                    )}
                  </section>
                  )}

                  {showAdminSection && (
                  <section className="rounded-2xl border border-[color:rgba(16,185,129,0.2)] bg-[color:rgba(16,185,129,0.08)] p-4">
                    <div className="mb-3 flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[color:rgba(16,185,129,0.14)] text-[color:rgba(220,252,231,0.95)]">
                        <Headset size={17} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">Admin</p>
                        <p className="text-xs text-[color:rgba(255,255,255,0.58)]">Support workspace access</p>
                      </div>
                    </div>

                    {seller?.role === "ADMIN" ? (
                      <div className="space-y-2">
                        <p className="text-xs text-[color:rgba(255,255,255,0.7)]">
                          Signed in as <span className="font-semibold text-white">{seller.name}</span>
                        </p>
                        <Link
                          to="/dashboard/support"
                          onClick={closePanels}
                          className="flex items-center justify-between rounded-full bg-[linear-gradient(135deg,var(--color-brand-emerald)_0%,#6ee7b7_100%)] px-4 py-2.5 text-sm font-semibold text-[var(--color-brand-slate)] transition hover:brightness-105"
                        >
                          Open Admin Desk
                          <ChevronRight size={16} />
                        </Link>
                        <button
                          onClick={() => {
                            closePanels();
                            logoutSeller();
                          }}
                          className="w-full rounded-full bg-rose-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-400"
                        >
                          Admin Logout
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Link
                          to="/login?role=ADMIN"
                          onClick={closePanels}
                          className="flex items-center justify-between rounded-full bg-[linear-gradient(135deg,var(--color-brand-emerald)_0%,#6ee7b7_100%)] px-4 py-2.5 text-sm font-semibold text-[var(--color-brand-slate)] transition hover:brightness-105"
                        >
                          Admin Login
                          <ChevronRight size={16} />
                        </Link>
                      </div>
                    )}
                  </section>
                  )}
                </div>
              </div>
            )}
          </div>

          <Link
            to="/cart"
            onClick={closePanels}
            className="relative order-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-[color:rgba(255,255,255,0.06)] text-slate-100 transition hover:border-[color:rgba(214,178,94,0.38)] hover:text-[var(--color-brand-champagne-soft)] lg:order-none"
          >
            <ShoppingCart size={18} />

            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 rounded-full bg-red-500 px-2 py-[2px] text-xs text-white">
                {cart.length}
              </span>
            )}
          </Link>
          <div className="order-1 h-0 basis-full lg:hidden" />
      </div>
    </nav>
  );
}

export default Navbar;
