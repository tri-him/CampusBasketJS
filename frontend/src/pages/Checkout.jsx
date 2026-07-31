import {
  ArrowRight,
  CheckCircle2,
  MapPin,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import BrandLogo from "../components/BrandLogo";
import useCart from "../context/useCart";
import useCustomerAuth from "../context/useCustomerAuth";
import { userApi } from "../services/api";

const SHIPPING_KEY = "CampusBasket-shipping";

const formatCurrency = (value) =>
  `Rs.${Number(value || 0).toLocaleString("en-IN")}`;

const createEmptyShipping = (customer = null) => ({
  name: customer?.name || "",
  email: customer?.email || "",
  phone: customer?.phone || "",
  address: "",
  city: "",
  pincode: "",
});

const readLocalShipping = () => {
  try {
    return JSON.parse(localStorage.getItem(SHIPPING_KEY) || "{}");
  } catch {
    return {};
  }
};

const buildShippingFromAddress = (address, fallbackEmail = "") => ({
  name: address?.fullName || address?.name || "",
  email: address?.email || fallbackEmail || "",
  phone: address?.phone || "",
  address: address?.addressLine || address?.address || "",
  city: address?.city || "",
  pincode: address?.pincode || "",
});

const hasCompleteShipping = (shipping) =>
  shipping.name?.trim().length >= 2 &&
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shipping.email || "") &&
  shipping.phone?.trim().length >= 10 &&
  shipping.address?.trim().length >= 5 &&
  shipping.city?.trim().length >= 2 &&
  shipping.pincode?.trim().length >= 4;

const getShippingValidationMessage = (shipping) => {
  if (shipping.name?.trim().length < 2) {
    return "Full name must be at least 2 characters.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shipping.email || "")) {
    return "Enter a valid email address.";
  }

  if (shipping.phone?.trim().length < 10) {
    return "Phone number must be at least 10 digits.";
  }

  if (shipping.address?.trim().length < 5) {
    return "Street address must be at least 5 characters.";
  }

  if (shipping.city?.trim().length < 2) {
    return "City must be at least 2 characters.";
  }

  if (shipping.pincode?.trim().length < 4) {
    return "Pincode must be at least 4 characters.";
  }

  return "";
};

function Checkout() {
  const { cart, total } = useCart();
  const { customer, loading: customerLoading } = useCustomerAuth();
  const customerEmail = customer?.email || "";
  const customerId = customer?.id || null;
  const customerName = customer?.name || "";
  const customerPhone = customer?.phone || "";
  const navigate = useNavigate();
  const saveTimerRef = useRef(null);
  const hydratedRef = useRef(false);
  const [isHydrated, setIsHydrated] = useState(false);

  if (!customerLoading && !customer) {
    return <Navigate to="/account/login?redirect=/checkout" replace />;
  }

  if (customerLoading) {
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

  const [shipping, setShipping] = useState(() => {
    const savedShipping = readLocalShipping();

    return {
      ...createEmptyShipping(customer),
      ...savedShipping,
      email: customerEmail || savedShipping.email || "",
      name: customerName || savedShipping.name || "",
      phone: customerPhone || savedShipping.phone || "",
    };
  });
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [draftSaveState, setDraftSaveState] = useState("idle");
  const [formError, setFormError] = useState("");
  const isShippingComplete = useMemo(() => hasCompleteShipping(shipping), [shipping]);

  const savedAddressCards = useMemo(
    () =>
      savedAddresses.map((address) => ({
        ...address,
        shipping: buildShippingFromAddress(address, customer?.email || ""),
      })),
    [customer?.email, savedAddresses],
  );

  useEffect(() => {
    let cancelled = false;
    hydratedRef.current = false;

    const bootstrapCheckout = async () => {
      const localShipping = readLocalShipping();

      if (!customer) {
        if (!cancelled) {
          setSavedAddresses([]);
          setShipping({
            ...createEmptyShipping(null),
            ...localShipping,
          });
          hydratedRef.current = true;
          setIsHydrated(true);
        }

        return;
      }

      const [draftResponse, addressesResponse] = await Promise.all([
        userApi.getShippingDraft().catch(() => ({ data: null })),
        userApi.listAddresses().catch(() => ({ data: [] })),
      ]);

      if (cancelled) {
        return;
      }

      const addresses = addressesResponse.data || [];
      const backendDraft = draftResponse.data || null;
      const preferredShipping = backendDraft
        ? buildShippingFromAddress(backendDraft, customer.email)
        : addresses[0]
          ? buildShippingFromAddress(addresses[0], customer.email)
          : {
              ...createEmptyShipping(customer),
              ...localShipping,
            };

      setSavedAddresses(addresses);
      setShipping({
        name: preferredShipping.name || customerName || "",
        email: customerEmail || preferredShipping.email || "",
        phone: preferredShipping.phone || customerPhone || "",
        address: preferredShipping.address || "",
        city: preferredShipping.city || "",
        pincode: preferredShipping.pincode || "",
      });
      hydratedRef.current = true;
      setIsHydrated(true);
    };

    void bootstrapCheckout();

    return () => {
      cancelled = true;
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [customer, customerEmail, customerId, customerName, customerPhone]);

  useEffect(() => {
    localStorage.setItem(SHIPPING_KEY, JSON.stringify(shipping));

    if (!customer || !hydratedRef.current) {
      return;
    }

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    if (!isShippingComplete) {
      return;
    }

    saveTimerRef.current = setTimeout(() => {
      setDraftSaveState("saving");
      void userApi
        .saveShippingDraft(shipping)
        .then(() => {
          setDraftSaveState("saved");
        })
        .catch(() => {
          setDraftSaveState("error");
        });
    }, 500);

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [customer, isShippingComplete, shipping]);

  const draftStatus =
    !customer || !isHydrated
      ? ""
      : !isShippingComplete
        ? "Complete the form to save this shipping draft to your account."
        : draftSaveState === "saving"
          ? "Saving shipping draft..."
          : draftSaveState === "saved"
            ? "Shipping draft saved to your account."
            : draftSaveState === "error"
              ? "Unable to save shipping draft right now."
              : "";

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormError("");
    setDraftSaveState("idle");

    setShipping((currentShipping) => ({
      ...currentShipping,
      [name]: value,
      ...(name === "email" && customer ? { email: customer.email } : {}),
    }));
  };

  const handleUseSavedAddress = (address) => {
    setDraftSaveState("idle");
    setShipping({
      ...address.shipping,
      email: customer?.email || address.shipping.email,
      name: address.shipping.name || customer?.name || "",
    });
    setFormError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationMessage = getShippingValidationMessage(shipping);

    if (validationMessage) {
      setFormError(validationMessage);
      return;
    }

    localStorage.setItem(SHIPPING_KEY, JSON.stringify(shipping));

    if (customer && hasCompleteShipping(shipping)) {
      await userApi.saveShippingDraft(shipping).catch(() => {});
    }

    navigate("/payment");
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_rgba(34,197,94,0.08),_transparent_28%),linear-gradient(180deg,_#f8fafc_0%,_#f0fdfa_52%,_#f8fafc_100%)] px-3 py-4 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <section className="overflow-hidden rounded-2xl sm:rounded-[2rem] border border-slate-200 bg-slate-950 px-4 py-5 text-white shadow-[0_30px_80px_rgba(15,23,42,0.18)] sm:px-8 sm:py-8">
          <div className="flex flex-col gap-4 sm:gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-200/80">
                Shipping Step
              </p>
              <h1 className="mt-2 text-xl font-black tracking-tight sm:mt-3 sm:text-4xl">
                Where should we deliver?
              </h1>
              <p className="mt-2 hidden max-w-2xl text-sm leading-7 text-slate-300 sm:block">
                This address will be used for your order confirmation, seller
                fulfilment, and delivery updates.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="rounded-xl sm:rounded-2xl border border-white/10 bg-white/[0.05] p-3 sm:p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Cart Total
                </p>
                <p className="mt-1 text-lg font-bold sm:mt-2 sm:text-2xl">{formatCurrency(total)}</p>
              </div>
              <div className="rounded-xl sm:rounded-2xl border border-white/10 bg-white/[0.05] p-3 sm:p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Shipping
                </p>
                <p className="mt-1 text-lg font-bold sm:mt-2 sm:text-2xl">Free</p>
              </div>
              <div className="rounded-xl sm:rounded-2xl border border-white/10 bg-white/[0.05] p-3 sm:p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Buyer
                </p>
                <p className="mt-1 text-lg font-bold sm:mt-2 sm:text-xl">
                  {customer?.name || "Guest"}
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1.2fr),380px]">
          <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                <MapPin size={22} />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Delivery Address
                </p>
                <h2 className="text-2xl font-black text-slate-950">
                  Shipping Details
                </h2>
              </div>
            </div>

            {customer && savedAddressCards.length > 0 && (
              <div className="mt-8">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                      Saved Addresses
                    </p>
                    <h3 className="mt-2 text-xl font-black text-slate-950">
                      Reuse an address from your account
                    </h3>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {savedAddressCards.map((address) => (
                    <button
                      key={address.id}
                      type="button"
                      onClick={() => handleUseSavedAddress(address)}
                      className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-emerald-300 hover:bg-emerald-50"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          {address.label}
                        </span>
                        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                          Use this
                        </span>
                      </div>
                      <p className="mt-4 text-base font-semibold text-slate-950">
                        {address.name}
                      </p>
                      <p className="mt-2 text-sm leading-7 text-slate-600">
                        {address.addressLine}, {address.city}, {address.state},{" "}
                        {address.pincode}
                      </p>
                      <p className="mt-2 text-sm text-slate-500">{address.phone}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-slate-700">
                    Full Name
                  </span>
                  <input
                    name="name"
                    placeholder="Full Name"
                    required
                    minLength={2}
                    value={shipping.name}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-400"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-slate-700">
                    Email Address
                  </span>
                  <input
                    name="email"
                    type="email"
                    placeholder="Email Address"
                    required
                    value={shipping.email}
                    onChange={handleChange}
                    readOnly={Boolean(customer)}
                    className={`w-full rounded-2xl border px-4 py-3 outline-none transition ${
                      customer
                        ? "border-slate-200 bg-slate-50 text-slate-500"
                        : "border-slate-200 focus:border-emerald-400"
                    }`}
                  />
                </label>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-slate-700">
                    Phone Number
                  </span>
                  <input
                    name="phone"
                    placeholder="Phone Number"
                    required
                    minLength={10}
                    value={shipping.phone}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-400"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-slate-700">
                    Pincode
                  </span>
                  <input
                    name="pincode"
                    placeholder="Pincode"
                    required
                    minLength={4}
                    value={shipping.pincode}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-400"
                  />
                </label>
              </div>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-700">
                  Street Address
                </span>
                <input
                  name="address"
                  placeholder="Address"
                  required
                  minLength={5}
                  value={shipping.address}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-400"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-700">City</span>
                <input
                  name="city"
                  placeholder="City"
                  required
                  minLength={2}
                  value={shipping.city}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-400"
                />
              </label>

              {formError && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {formError}
                </div>
              )}

              {draftStatus && customer && (
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {draftStatus}
                </div>
              )}

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => navigate("/cart")}
                  className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
                >
                  Back to Cart
                </button>
                <button className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400">
                  Continue to Payment
                  <ArrowRight size={16} />
                </button>
              </div>
            </form>
          </section>

          <aside className="space-y-5 xl:sticky xl:top-28 xl:self-start">
            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <BrandLogo theme="light" compact showTagline={false} />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                    Order Summary
                  </p>
                  <h3 className="text-xl font-black text-slate-950">
                    Everything checks out
                  </h3>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {cart.map((item) => {
                  const lineTotal =
                    item.quantity *
                    (item.mode === "wholesale"
                      ? Number(item.wholesalePrice) || 0
                      : Number(item.retailPrice) || 0);

                  return (
                    <div
                      key={`${item.id}-${item.mode}`}
                      className="flex items-start justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3"
                    >
                      <div>
                        <p className="font-semibold text-slate-900">{item.name}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">
                          {item.mode} • Qty {item.quantity}
                        </p>
                      </div>
                      <span className="font-semibold text-slate-950">
                        {formatCurrency(lineTotal)}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 space-y-3 border-t border-slate-100 pt-5 text-sm">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span>{formatCurrency(total)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Shipping</span>
                  <span>Free</span>
                </div>
                <div className="flex items-center justify-between font-semibold text-slate-950">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-black text-slate-950">
                Checkout Confidence
              </h3>
              <div className="mt-5 space-y-4 text-sm text-slate-600">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                    <CheckCircle2 size={18} />
                  </span>
                  <div>
                    <p className="font-semibold text-slate-900">
                      Accurate shipping details
                    </p>
                    <p className="mt-1">
                      Your order history and confirmation will use this address.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700">
                    <ShieldCheck size={18} />
                  </span>
                  <div>
                    <p className="font-semibold text-slate-900">
                      Secure next step
                    </p>
                    <p className="mt-1">
                      Payment selection happens after shipping confirmation.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                    <Truck size={18} />
                  </span>
                  <div>
                    <p className="font-semibold text-slate-900">
                      Faster fulfilment
                    </p>
                    <p className="mt-1">
                      Sellers receive clean shipping data right after you pay.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default Checkout;
