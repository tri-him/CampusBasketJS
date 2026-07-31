import { PackageSearch, ShieldCheck, Store } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthShell from "../components/AuthShell";
import { AUTH_FIELD_BASE, AUTH_VARIANTS } from "../components/authTheme";
import useAuth from "../context/useAuth";

const sellerHighlights = [
  {
    icon: Store,
    title: "Launch a branded store",
    description:
      "Create your seller identity and start building a storefront that connects with CampusBasket shoppers.",
  },
  {
    icon: PackageSearch,
    title: "Retail and wholesale in one place",
    description:
      "Register once and later manage catalog type, stock, sustainability score, and pricing from the same dashboard.",
  },
  {
    icon: ShieldCheck,
    title: "Structured seller onboarding",
    description:
      "Keep business access separate from customer accounts so your operations stay focused and secure.",
  },
];

function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const theme = AUTH_VARIANTS.seller;
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    gender: "",
    age: "",
    storeName: "",
  });

  const handleChange = (event) => {
    setFormData((currentForm) => ({
      ...currentForm,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const success = await register(formData);

    if (success) {
      navigate("/login");
    }
  };

  return (
    <AuthShell
      variant="seller"
      badge="Seller Registration"
      title="Set up your CampusBasket seller account and open your store."
      description="Register your seller identity, connect it to your store name, and get ready to manage products, orders, and customers in the premium dashboard."
      formTitle="Seller Sign Up"
      formDescription="Create your seller account to unlock store setup, inventory management, and order operations."
      stats={[
        { label: "Store Setup", value: "Fast" },
        { label: "Modes", value: "Retail + Wholesale" },
        { label: "Growth", value: "Dashboard Ready" },
      ]}
      highlights={sellerHighlights}
      alternateQuestion="Already have a seller account?"
      alternateText="Sign in here"
      alternateTo="/login"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-5 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">
              Full Name
            </span>
            <input
              type="text"
              name="name"
              placeholder="Seller name"
              required
              className={`${AUTH_FIELD_BASE} ${theme.focus}`}
              value={formData.name}
              onChange={handleChange}
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">
              Store Name
            </span>
            <input
              type="text"
              name="storeName"
              placeholder="Your store name"
              required
              className={`${AUTH_FIELD_BASE} ${theme.focus}`}
              value={formData.storeName}
              onChange={handleChange}
            />
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Email</span>
          <input
            type="email"
            name="email"
            placeholder="seller@store.com"
            required
            className={`${AUTH_FIELD_BASE} ${theme.focus}`}
            value={formData.email}
            onChange={handleChange}
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Password</span>
          <input
            type="password"
            name="password"
            placeholder="Create a strong password"
            required
            className={`${AUTH_FIELD_BASE} ${theme.focus}`}
            value={formData.password}
            onChange={handleChange}
          />
        </label>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Age</span>
            <input
              type="number"
              name="age"
              placeholder="Age"
              required
              className={`${AUTH_FIELD_BASE} ${theme.focus}`}
              value={formData.age}
              onChange={handleChange}
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Gender</span>
            <select
              name="gender"
              required
              className={`${AUTH_FIELD_BASE} ${theme.focus}`}
              value={formData.gender}
              onChange={handleChange}
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </label>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm leading-7 text-slate-600">
          Your seller account stays separate from customer access so store operations, dashboard tools, and customer-facing activity remain cleanly divided.
        </div>

        <button
          className={`w-full rounded-2xl py-3.5 text-sm font-semibold transition ${theme.button}`}
        >
          Create Seller Account
        </button>
      </form>
    </AuthShell>
  );
}

export default Register;
