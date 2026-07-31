import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AuthShell from "../components/AuthShell";
import { AUTH_FIELD_BASE, AUTH_VARIANTS } from "../components/authTheme";
import useCustomerAuth from "../context/useCustomerAuth";
import { AlertCircle, Heart, LifeBuoy, Package } from "lucide-react";

const customerHighlights = [
  {
    icon: Package,
    title: "Orders in one place",
    description:
      "Track shipments, review delivered products, and manage the buyer journey from your account hub.",
  },
  {
    icon: Heart,
    title: "Saved shopping flow",
    description:
      "Keep products in your wishlist and return later with a cleaner, more premium shopping experience.",
  },
  {
    icon: LifeBuoy,
    title: "Support on standby",
    description:
      "Raise complaints, continue support chats, and keep customer-service history connected to your account.",
  },
];

function UserLogin() {
  const { loginCustomer } = useCustomerAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "";
  const theme = AUTH_VARIANTS.customer;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    const result = await loginCustomer(email, password);

    if (result === true) {
      navigate(redirectPath || "/account");
    } else {
      setErrorMessage(result || "Invalid email or password.");
    }
    setIsLoading(false);
  };

  return (
    <AuthShell
      variant="customer"
      badge="Customer Access"
      title="Sign in to continue your premium CampusBasket shopping journey."
      description="Access your account, orders, wishlist, saved addresses, and support history."
      formTitle="Customer Login"
      formDescription="Enter your email and password to continue."
      stats={[
        { label: "Orders", value: "Tracked" },
        { label: "Wishlist", value: "Saved" },
        { label: "Support", value: "Connected" },
      ]}
      highlights={customerHighlights}
      alternateQuestion="New to CampusBasket?"
      alternateText="Create account"
      alternateTo={redirectPath ? `/account/register?redirect=${encodeURIComponent(redirectPath)}` : "/account/register"}
    >
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
        {redirectPath && !errorMessage && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <p className="font-semibold">Please login to continue</p>
            <p className="mt-1 text-xs text-amber-700">Your cart items are saved and will sync after login.</p>
          </div>
        )}

        {errorMessage && (
          <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <AlertCircle size={18} className="mt-0.5 shrink-0 text-rose-500" />
            <div>
              <p className="font-semibold">Login failed</p>
              <p className="mt-0.5 text-rose-600">{errorMessage}</p>
            </div>
          </div>
        )}

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Email</span>
          <input
            type="email"
            placeholder="you@example.com"
            required
            className={`${AUTH_FIELD_BASE} ${theme.focus} ${errorMessage ? "border-rose-300" : ""}`}
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setErrorMessage("");
            }}
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Password</span>
          <input
            type="password"
            placeholder="Enter your password"
            required
            className={`${AUTH_FIELD_BASE} ${theme.focus} ${errorMessage ? "border-rose-300" : ""}`}
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setErrorMessage("");
            }}
          />
        </label>

        <button
          disabled={isLoading}
          className={`w-full rounded-2xl py-3.5 text-sm font-semibold transition disabled:opacity-60 ${theme.button}`}
        >
          {isLoading ? "Signing in..." : "Login"}
        </button>
      </form>
    </AuthShell>
  );
}

export default UserLogin;
