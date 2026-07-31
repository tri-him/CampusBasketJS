import {
  ArrowRight,
  LogIn,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Truck,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import BrandLogo from "../components/BrandLogo";
import useCart from "../context/useCart";
import useCustomerAuth from "../context/useCustomerAuth";
import { getProductFallbackImage } from "../lib/productMedia";

const formatCurrency = (value) =>
  `Rs.${Number(value || 0).toLocaleString("en-IN")}`;

function Cart() {
  const { cart, total, removeFromCart, updateQuantity } = useCart();
  const { customer } = useCustomerAuth();
  const navigate = useNavigate();

  const handleProceedToCheckout = () => {
    if (!customer) {
      navigate("/account/login?redirect=/checkout");
      return;
    }
    navigate("/checkout");
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.08),_transparent_30%),linear-gradient(180deg,_#f8fafc_0%,_#ecfeff_55%,_#f8fafc_100%)] px-3 py-4 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <section className="overflow-hidden rounded-2xl sm:rounded-[2rem] border border-slate-200 bg-slate-950 px-4 py-5 text-white shadow-[0_30px_80px_rgba(15,23,42,0.18)] sm:px-8 sm:py-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-200/80">
                Premium Cart
              </p>
              <h1 className="mt-2 text-xl font-black tracking-tight sm:mt-3 sm:text-4xl">
                Review your order.
              </h1>
              <p className="mt-2 hidden max-w-2xl text-sm leading-7 text-slate-300 sm:block">
                Every item below keeps its retail or wholesale pricing mode, so
                your checkout totals stay accurate all the way through payment.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="rounded-xl sm:rounded-2xl border border-white/10 bg-white/[0.05] p-3 sm:p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Items
                </p>
                <p className="mt-1 text-lg font-bold sm:mt-2 sm:text-2xl">{cart.length}</p>
              </div>
              <div className="rounded-xl sm:rounded-2xl border border-white/10 bg-white/[0.05] p-3 sm:p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Shipping
                </p>
                <p className="mt-1 text-lg font-bold sm:mt-2 sm:text-2xl">Free</p>
              </div>
              <div className="rounded-xl sm:rounded-2xl border border-white/10 bg-white/[0.05] p-3 sm:p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Total
                </p>
                <p className="mt-2 text-2xl font-bold">{formatCurrency(total)}</p>
              </div>
            </div>
          </div>
        </section>

        {cart.length === 0 ? (
          <section className="mt-8 rounded-[2rem] border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <ShoppingBag size={30} />
            </div>
            <h2 className="mt-6 text-3xl font-black text-slate-950">
              Your cart is waiting for something special.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-500">
              Browse the premium retail and wholesale collections to start
              building your next CampusBasket order.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/retail"
                className="rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Shop Retail
              </Link>
              <Link
                to="/wholesale"
                className="rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
              >
                Explore Wholesale
              </Link>
            </div>
          </section>
        ) : (
          <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1.35fr),380px]">
            <section className="space-y-5">
              {cart.map((item) => {
                const unitPrice =
                  item.mode === "wholesale"
                    ? Number(item.wholesalePrice) || 0
                    : Number(item.retailPrice) || 0;
                const minimumQty =
                  item.mode === "wholesale"
                    ? Number(item.minWholesaleQty) || 1
                    : 1;
                const lineTotal = unitPrice * item.quantity;

                return (
                  <article
                    key={`${item.id}-${item.mode}`}
                    className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm"
                  >
                    <div className="grid gap-0 md:grid-cols-[180px,minmax(0,1fr)] lg:grid-cols-[200px,minmax(0,1fr)]">
                      <div className="bg-slate-100">
                        <img
                          src={
                            item.image ||
                            getProductFallbackImage({
                              name: item.name,
                              category: item.category,
                            })
                          }
                          alt={item.name}
                          onError={(event) => {
                            event.currentTarget.src = getProductFallbackImage({
                              name: item.name,
                              category: item.category,
                            });
                          }}
                          className="h-full min-h-[220px] w-full object-cover"
                        />
                      </div>

                      <div className="p-5 sm:p-6">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${
                                  item.mode === "wholesale"
                                    ? "bg-cyan-100 text-cyan-700"
                                    : "bg-emerald-100 text-emerald-700"
                                }`}
                              >
                                {item.mode}
                              </span>
                              {item.sellerName && (
                                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                                  {item.sellerName}
                                </span>
                              )}
                            </div>

                            <h2 className="mt-4 text-xl font-black text-slate-950 sm:text-2xl">
                              {item.name}
                            </h2>
                            <p className="mt-2 text-sm leading-7 text-slate-500">
                              {item.description}
                            </p>
                          </div>

                          <div className="text-left lg:text-right">
                            <p className="text-sm text-slate-500">Line total</p>
                            <p className="mt-2 text-2xl font-black text-slate-950">
                              {formatCurrency(lineTotal)}
                            </p>
                          </div>
                        </div>

                        <div className="mt-6 grid gap-4 sm:grid-cols-3">
                          <div className="rounded-2xl bg-slate-50 p-4">
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                              Unit Price
                            </p>
                            <p className="mt-2 text-xl font-bold text-slate-950">
                              {formatCurrency(unitPrice)}
                            </p>
                          </div>
                          <div className="rounded-2xl bg-slate-50 p-4">
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                              Quantity
                            </p>
                            <div className="mt-2 inline-flex items-center rounded-full border border-slate-200 bg-white">
                              <button
                                onClick={() =>
                                  updateQuantity(
                                    item.id,
                                    item.mode,
                                    Math.max(minimumQty, item.quantity - 1),
                                  )
                                }
                                className="px-4 py-2 text-slate-600 transition hover:text-slate-950"
                              >
                                <Minus size={16} />
                              </button>
                              <span className="min-w-12 px-3 text-center text-sm font-semibold text-slate-950">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() =>
                                  updateQuantity(
                                    item.id,
                                    item.mode,
                                    item.quantity + 1,
                                  )
                                }
                                className="px-4 py-2 text-slate-600 transition hover:text-slate-950"
                              >
                                <Plus size={16} />
                              </button>
                            </div>
                          </div>
                          <div className="rounded-2xl bg-slate-50 p-4">
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                              Order Rule
                            </p>
                            <p className="mt-2 text-xl font-bold text-slate-950">
                              {item.mode === "wholesale"
                                ? `Min ${minimumQty}`
                                : "Single unit"}
                            </p>
                          </div>
                        </div>

                        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
                          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                            <span className="inline-flex items-center gap-2">
                              <Truck size={16} className="text-emerald-600" />
                              Free delivery
                            </span>
                            <span className="inline-flex items-center gap-2">
                              <ShieldCheck
                                size={16}
                                className="text-cyan-600"
                              />
                              Secure checkout
                            </span>
                          </div>

                          <button
                            onClick={() => removeFromCart(item.id, item.mode)}
                            className="inline-flex items-center gap-2 rounded-full bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-400"
                          >
                            <Trash2 size={16} />
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>

            <aside className="space-y-5 xl:sticky xl:top-28 xl:self-start">
              <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <BrandLogo theme="light" compact showTagline={false} />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                      Checkout Summary
                    </p>
                    <h2 className="text-xl font-black text-slate-950">
                      Ready when you are
                    </h2>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <span>Subtotal</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <span>Shipping</span>
                    <span>Free</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <span>Protection</span>
                    <span>Included</span>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl bg-slate-950 px-5 py-4 text-white">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-300">Grand Total</span>
                    <span className="text-2xl font-black">
                      {formatCurrency(total)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleProceedToCheckout}
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
                >
                  Proceed to Shipping
                  <ArrowRight size={16} />
                </button>

                {!customer && (
                  <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-center">
                    <p className="flex items-center justify-center gap-2 text-sm font-semibold text-amber-800">
                      <LogIn size={15} />
                      Login required to checkout
                    </p>
                    <p className="mt-1 text-xs text-amber-700">
                      Your cart items are saved and will sync to your account after login.
                    </p>
                  </div>
                )}
              </div>

            </aside>
          </div>
        )}
      </div>
    </div>
  );
}

export default Cart;
