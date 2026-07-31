import {
  ArrowRight,
  Banknote,
  CheckCircle2,
  CreditCard,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import BrandLogo from "../components/BrandLogo";
import useCart from "../context/useCart";
import useCustomerAuth from "../context/useCustomerAuth";
import {
  cancelRazorpayCheckout,
  createRazorpayCheckout,
  placeOrder,
  verifyRazorpayPayment,
} from "../lib/marketplaceStore";

const formatCurrency = (value) =>
  `Rs.${Number(value || 0).toLocaleString("en-IN")}`;

const readShippingSnapshot = () => {
  try {
    return JSON.parse(localStorage.getItem("CampusBasket-shipping") || "{}");
  } catch {
    localStorage.removeItem("CampusBasket-shipping");
    return {};
  }
};

const paymentMethods = [
  {
    id: "UPI",
    title: "UPI via Razorpay",
    description: "Pay using a secure Razorpay checkout with your preferred UPI app.",
    icon: Smartphone,
    accent: "emerald",
  },
  {
    id: "CARD",
    title: "Card via Razorpay",
    description: "Open Razorpay's secure window for debit and credit card payments.",
    icon: CreditCard,
    accent: "cyan",
  },
  {
    id: "COD",
    title: "Cash on Delivery",
    description: "Place the order now and pay when it reaches your doorstep.",
    icon: Banknote,
    accent: "amber",
  },
];

const getShippingValidationMessage = (shipping) => {
  if (shipping.name?.trim().length < 2) {
    return "Full name must be at least 2 characters.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shipping.email || "")) {
    return "Enter a valid email address before payment.";
  }

  if (shipping.phone?.trim().length < 10) {
    return "Phone number must be at least 10 digits.";
  }

  if (shipping.address?.trim().length < 5) {
    return "Street address must be at least 5 characters before payment.";
  }

  if (shipping.city?.trim().length < 2) {
    return "City must be at least 2 characters.";
  }

  if (shipping.pincode?.trim().length < 4) {
    return "Pincode must be at least 4 characters.";
  }

  return "";
};

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

function Payment() {
  const { cart, total, clearCart } = useCart();
  const { customer, loading: customerLoading } = useCustomerAuth();
  const navigate = useNavigate();
  const shipping = readShippingSnapshot();
  const [selectedMethod, setSelectedMethod] = useState("UPI");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  if (!customerLoading && !customer) {
    return <Navigate to="/account/login?redirect=/payment" replace />;
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

  const shippingValidationMessage = getShippingValidationMessage(shipping);
  const shippingReady = !shippingValidationMessage;
  const isPaymentReady = cart.length > 0 && shippingReady;

  const storeOrderLocallyAndContinue = async (order) => {
    localStorage.setItem("CampusBasket-last-order-id", order.databaseId);
    localStorage.setItem("CampusBasket-last-order-email", shipping.email || "");
    localStorage.setItem("CampusBasket-last-order-email-status", order.emailStatus);
    await clearCart();
    navigate("/order-success");
  };

  const buildOrderPayload = () => ({
    paymentMethod: selectedMethod,
    shipping,
    items: cart.map((item) => ({
      id: item.id,
      mode: item.mode,
      quantity: item.quantity,
    })),
  });

  const handleCodOrder = async () => {
    const order = await placeOrder(buildOrderPayload()).catch((error) => {
      setErrorMessage(error.message || "Unable to place the order.");
      return null;
    });

    if (!order) {
      return;
    }

    await storeOrderLocallyAndContinue(order);
  };

  const handleRazorpayOrder = async () => {
    const scriptLoaded = await loadRazorpayScript();

    if (!scriptLoaded) {
      setErrorMessage("Unable to load Razorpay checkout right now. Please try again.");
      return;
    }

    const checkout = await createRazorpayCheckout(buildOrderPayload()).catch((error) => {
      setErrorMessage(error.message || "Unable to start Razorpay checkout.");
      return null;
    });

    if (!checkout) {
      return;
    }

    if (checkout.keyId?.includes("dummy")) {
      const mockResponse = {
        razorpay_order_id: checkout.razorpayOrderId,
        razorpay_payment_id: "pay_dummy_" + Date.now(),
        razorpay_signature: "dummy_signature",
      };

      setTimeout(async () => {
        const order = await verifyRazorpayPayment({
          razorpayOrderId: mockResponse.razorpay_order_id,
          razorpayPaymentId: mockResponse.razorpay_payment_id,
          razorpaySignature: mockResponse.razorpay_signature,
          email: shipping.email || undefined,
        }).catch((error) => {
          setErrorMessage(error.message || "Unable to verify Razorpay payment.");
          return null;
        });

        if (!order) {
          setIsSubmitting(false);
          return;
        }

        await storeOrderLocallyAndContinue(order);
        setIsSubmitting(false);
      }, 1000);

      return;
    }

    const razorpayWindow = new window.Razorpay({
      key: checkout.keyId,
      amount: checkout.amount,
      currency: checkout.currency,
      name: "CampusBasket",
      description: `CampusBasket order ${checkout.order.id}`,
      order_id: checkout.razorpayOrderId,
      prefill: {
        name: shipping.name,
        email: shipping.email,
        contact: shipping.phone,
      },
      notes: {
        CampusBasket_order_number: checkout.order.id,
        payment_method: selectedMethod,
      },
      theme: {
        color: "#10b981",
      },
      handler: async (response) => {
        const order = await verifyRazorpayPayment({
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature,
          email: shipping.email || undefined,
        }).catch((error) => {
          setErrorMessage(error.message || "Unable to verify Razorpay payment.");
          return null;
        });

        if (!order) {
          setIsSubmitting(false);
          return;
        }

        await storeOrderLocallyAndContinue(order);
        setIsSubmitting(false);
      },
      modal: {
        ondismiss: () => {
          void cancelRazorpayCheckout({
            razorpayOrderId: checkout.razorpayOrderId,
            orderId: checkout.order.databaseId,
            email: shipping.email || undefined,
          }).catch(() => {});

          setIsSubmitting(false);
          setErrorMessage("Razorpay checkout was closed before payment completed.");
        },
      },
    });

    razorpayWindow.open();
  };

  const handlePayment = async () => {
    if (!isPaymentReady || isSubmitting) {
      if (!shippingReady) {
        setErrorMessage(shippingValidationMessage);
      }
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    if (selectedMethod === "COD") {
      await handleCodOrder();
      setIsSubmitting(false);
      return;
    }

    await handleRazorpayOrder();
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(6,182,212,0.08),_transparent_30%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_55%,_#f8fafc_100%)] px-3 py-4 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <section className="overflow-hidden rounded-2xl sm:rounded-[2rem] border border-slate-200 bg-slate-950 px-4 py-5 text-white shadow-[0_30px_80px_rgba(15,23,42,0.18)] sm:px-8 sm:py-8">
          <div className="flex flex-col gap-4 sm:gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200/80">
                Payment Step
              </p>
              <h1 className="mt-2 text-xl font-black tracking-tight sm:mt-3 sm:text-4xl">
                Choose how to pay.
              </h1>
              <p className="mt-2 hidden max-w-2xl text-sm leading-7 text-slate-300 sm:block">
                UPI and card payments now open a real Razorpay checkout, while COD
                still places the order directly from CampusBasket.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-3">
              <div className="rounded-xl sm:rounded-2xl border border-white/10 bg-white/[0.05] p-3 sm:p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Order Total
                </p>
                <p className="mt-1 text-lg font-bold sm:mt-2 sm:text-2xl">{formatCurrency(total)}</p>
              </div>
              <div className="rounded-xl sm:rounded-2xl border border-white/10 bg-white/[0.05] p-3 sm:p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Buyer Email
                </p>
                <p className="mt-2 break-all text-sm font-bold leading-6">
                  {shipping.email || customer?.email || "Not provided"}
                </p>
              </div>
              <div className="col-span-2 rounded-xl sm:rounded-2xl border border-white/10 bg-white/[0.05] p-3 sm:p-4 lg:col-span-1">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Security
                </p>
                <p className="mt-2 text-xl font-bold">
                  {selectedMethod === "COD" ? "Pay on delivery" : "Razorpay secured"}
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1.15fr),380px]">
          <section className="space-y-5">
            {paymentMethods.map((method) => {
              const Icon = method.icon;
              const accentClasses =
                method.accent === "emerald"
                  ? "bg-emerald-100 text-emerald-700"
                  : method.accent === "cyan"
                    ? "bg-cyan-100 text-cyan-700"
                    : "bg-amber-100 text-amber-700";

              return (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setSelectedMethod(method.id)}
                  className={`group w-full rounded-[1.75rem] border bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(15,23,42,0.12)] sm:p-6 ${
                    selectedMethod === method.id
                      ? "border-emerald-400 ring-2 ring-emerald-100"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-start gap-4">
                      <span
                        className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${accentClasses}`}
                      >
                        <Icon size={24} />
                      </span>
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
                          Payment Method
                        </p>
                        <h2 className="mt-2 text-xl font-black text-slate-950 sm:text-2xl">
                          {method.title}
                        </h2>
                        <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-500">
                          {method.description}
                        </p>
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition group-hover:bg-slate-800">
                      {selectedMethod === method.id ? "Selected" : "Choose"}
                      <ArrowRight size={16} />
                    </span>
                  </div>
                </button>
              );
            })}

            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                Payment Details
              </p>
              <h2 className="mt-2 text-2xl font-black text-slate-950">
                {selectedMethod === "COD"
                  ? "Cash on delivery selected"
                  : "Secure checkout handled by Razorpay"}
              </h2>
              <p className="mt-2 text-sm leading-7 text-slate-500">
                {selectedMethod === "COD"
                  ? "Your order will be created immediately with a pending payment record."
                  : "Sensitive payment details are collected inside Razorpay's hosted checkout, not inside the CampusBasket form."}
              </p>
            </div>
          </section>

          <aside className="space-y-5 xl:sticky xl:top-28 xl:self-start">
            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <BrandLogo theme="light" compact showTagline={false} />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                    Final Summary
                  </p>
                  <h3 className="text-xl font-black text-slate-950">
                    One step left
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
                          {item.mode} / Qty {item.quantity}
                        </p>
                      </div>
                      <span className="font-semibold text-slate-950">
                        {formatCurrency(lineTotal)}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 rounded-2xl bg-slate-950 px-5 py-4 text-white">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">Total Due</span>
                  <span className="text-2xl font-black">
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-black text-slate-950">
                What happens next
              </h3>
              <div className="mt-5 space-y-4 text-sm text-slate-600">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                    <CheckCircle2 size={18} />
                  </span>
                  <div>
                    <p className="font-semibold text-slate-900">
                      Gateway payment gets verified
                    </p>
                    <p className="mt-1">
                      Razorpay sends the payment response, and CampusBasket verifies the
                      signature on the server before confirming the order.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700">
                    <ShieldCheck size={18} />
                  </span>
                  <div>
                    <p className="font-semibold text-slate-900">
                      Email confirmation is tracked
                    </p>
                    <p className="mt-1">
                      After successful verification, CampusBasket sends and tracks the
                      order confirmation email.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 border-t border-slate-100 pt-5">
                {errorMessage && (
                  <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {errorMessage}
                  </div>
                )}

                {!shippingReady && (
                  <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                    {shippingValidationMessage}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handlePayment}
                  disabled={!isPaymentReady || isSubmitting}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                >
                  {isSubmitting
                    ? "Processing..."
                    : selectedMethod === "COD"
                      ? "Confirm COD Order"
                      : `Pay with ${selectedMethod === "UPI" ? "Razorpay UPI" : "Razorpay Card"}`}
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default Payment;
