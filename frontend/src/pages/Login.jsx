import { BarChart3, Boxes, Headset, Store } from "lucide-react";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AuthShell from "../components/AuthShell";
import { AUTH_FIELD_BASE, AUTH_VARIANTS } from "../components/authTheme";
import useAuth from "../context/useAuth";

const sellerHighlights = [
  {
    icon: Store,
    title: "Store-first access",
    description:
      "Log in to manage your storefront, products, and customer activity from one seller workspace.",
  },
  {
    icon: Boxes,
    title: "Catalog control",
    description:
      "Add inventory once and route products into retail or wholesale with the right pricing setup.",
  },
  {
    icon: BarChart3,
    title: "Operational visibility",
    description:
      "Track orders, customers, and seller-side performance from the dashboard built for your store.",
  },
];

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = AUTH_VARIANTS.seller;
  const requestedRole = new URLSearchParams(location.search).get("role");
  const role = requestedRole === "ADMIN" ? "ADMIN" : "SELLER";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    const success = await login(email, password, role);

    if (success) {
      navigate("/dashboard");
    }
  };

  return (
    <AuthShell
      variant="seller"
      badge={role === "ADMIN" ? "Admin Access" : "Seller Access"}
      title={
        role === "ADMIN"
          ? "Sign in to manage CampusBasket support operations."
          : "Sign in to run your CampusBasket store with confidence."
      }
      description={
        role === "ADMIN"
          ? "Access the admin support workspace, review live tickets and chats, and keep customer issues moving toward resolution."
          : "Access your seller dashboard, manage products, fulfil orders, and stay in control of retail and wholesale operations from one premium workspace."
      }
      formTitle={role === "ADMIN" ? "Admin Login" : "Seller Login"}
      formDescription={
        role === "ADMIN"
          ? "Use your admin credentials to open the support dashboard and respond to customers."
          : "Use your seller credentials to enter the dashboard and continue managing your store."
      }
      stats={[
        { label: "Dashboard", value: "Live" },
        {
          label: role === "ADMIN" ? "Support Queue" : "Catalog",
          value: role === "ADMIN" ? "Tickets + Chats" : "Retail + Bulk",
        },
        { label: "Support", value: role === "ADMIN" ? "Admin Ready" : "Seller Ready" },
      ]}
      highlights={
        role === "ADMIN"
          ? [
              {
                icon: Headset,
                title: "Support operations",
                description:
                  "See open tickets, active chats, and customer issues from one admin queue.",
              },
              {
                icon: BarChart3,
                title: "Response visibility",
                description:
                  "Track what needs attention now and move conversations toward resolution faster.",
              },
              {
                icon: Store,
                title: "Platform-wide access",
                description:
                  "Manage support across the full CampusBasket marketplace instead of a single seller storefront.",
              },
            ]
          : sellerHighlights
      }
      alternateQuestion={
        role === "ADMIN" ? "Need seller access instead?" : "New seller on CampusBasket?"
      }
      alternateText={role === "ADMIN" ? "Open seller login" : "Register your store"}
      alternateTo={role === "ADMIN" ? "/login?role=SELLER" : "/register"}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Email</span>
          <input
            type="email"
            placeholder={role === "ADMIN" ? "admin@CampusBasket.com" : "seller@store.com"}
            required
            className={`${AUTH_FIELD_BASE} ${theme.focus}`}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Password</span>
          <input
            type="password"
            placeholder="Enter your password"
            required
            className={`${AUTH_FIELD_BASE} ${theme.focus}`}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>

        <div className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm leading-7 text-slate-600">
          {role === "ADMIN"
            ? "Admin access is separate from customer accounts so support operations stay secure and clearly organized."
            : "Seller login is separate from customer login so storefront management and buyer activity remain clearly organized."}
        </div>

        <button
          className={`w-full rounded-2xl py-3.5 text-sm font-semibold transition ${theme.button}`}
        >
          {role === "ADMIN" ? "Open Admin Support Dashboard" : "Open Seller Dashboard"}
        </button>
      </form>
    </AuthShell>
  );
}

export default Login;
