import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AuthShell from "../components/AuthShell";
import { AUTH_FIELD_BASE, AUTH_VARIANTS } from "../components/authTheme";
import useCustomerAuth from "../context/useCustomerAuth";
import { AlertCircle, Heart, MapPin, ShoppingBag } from "lucide-react";

const customerHighlights = [
  {
    icon: ShoppingBag,
    title: "Faster premium shopping",
    description:
      "Create your account once and keep your order flow, cart progress, and account experience connected.",
  },
  {
    icon: Heart,
    title: "Wishlist and reviews",
    description:
      "Save favorites, come back later, and review products after delivery to build more buyer trust.",
  },
  {
    icon: MapPin,
    title: "Address-ready account",
    description:
      "Set up your customer profile first, then manage saved addresses and smoother checkout from your account hub.",
  },
];

function UserRegister() {
  const { registerCustomer } = useCustomerAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "";
  const theme = AUTH_VARIANTS.customer;
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    age: "",
    gender: "",
  });

  const handleChange = (event) => {
    setFormData((currentForm) => ({
      ...currentForm,
      [event.target.name]: event.target.value,
    }));
    setErrorMessage("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    const result = await registerCustomer(formData);

    if (result === true) {
      navigate(redirectPath || "/account");
    } else {
      setErrorMessage(result || "Unable to create customer account.");
    }
    setIsLoading(false);
  };

  return (
    <AuthShell
      variant="customer"
      badge="Customer Registration"
      title="Create your CampusBasket customer account and shop with confidence."
      description="Sign up to unlock orders, wishlist, saved addresses, and support tools."
      formTitle="Create Account"
      formDescription="Fill in your details to get started."
      stats={[
        { label: "Checkout", value: "Smoother" },
        { label: "Wishlist", value: "Enabled" },
        { label: "Account", value: "Ready" },
      ]}
      highlights={customerHighlights}
      alternateQuestion="Already have an account?"
      alternateText="Sign in"
      alternateTo={redirectPath ? `/account/login?redirect=${encodeURIComponent(redirectPath)}` : "/account/login"}
    >
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
        {errorMessage && (
          <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <AlertCircle size={18} className="mt-0.5 shrink-0 text-rose-500" />
            <div>
              <p className="font-semibold">Registration failed</p>
              <p className="mt-0.5 text-rose-600">{errorMessage}</p>
            </div>
          </div>
        )}

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Full Name
          </span>
          <input
            type="text"
            name="name"
            placeholder="Your full name"
            required
            className={`${AUTH_FIELD_BASE} ${theme.focus} ${errorMessage ? "border-rose-300" : ""}`}
            value={formData.name}
            onChange={handleChange}
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Email</span>
          <input
            type="email"
            name="email"
            placeholder="you@example.com"
            required
            className={`${AUTH_FIELD_BASE} ${theme.focus} ${errorMessage ? "border-rose-300" : ""}`}
            value={formData.email}
            onChange={handleChange}
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Password</span>
          <input
            type="password"
            name="password"
            placeholder="Create a password"
            required
            className={`${AUTH_FIELD_BASE} ${theme.focus} ${errorMessage ? "border-rose-300" : ""}`}
            value={formData.password}
            onChange={handleChange}
          />
        </label>

        <div className="grid grid-cols-2 gap-3 sm:gap-5">
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Age</span>
            <input
              type="number"
              name="age"
              placeholder="21"
              required
              className={`${AUTH_FIELD_BASE} ${theme.focus} ${errorMessage ? "border-rose-300" : ""}`}
              value={formData.age}
              onChange={handleChange}
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Gender</span>
            <select
              name="gender"
              required
              className={`${AUTH_FIELD_BASE} ${theme.focus} ${errorMessage ? "border-rose-300" : ""}`}
              value={formData.gender}
              onChange={handleChange}
            >
              <option value="">Select</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </label>
        </div>

        <button
          disabled={isLoading}
          className={`w-full rounded-2xl py-3.5 text-sm font-semibold transition disabled:opacity-60 ${theme.button}`}
        >
          {isLoading ? "Creating account..." : "Create Account"}
        </button>
      </form>
    </AuthShell>
  );
}

export default UserRegister;
