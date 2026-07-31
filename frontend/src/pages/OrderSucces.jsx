import { ArrowRight, CheckCircle2, Truck } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import BrandLogo from "../components/BrandLogo";
import { getOrderById, syncOrders } from "../lib/marketplaceStore";

const formatCurrency = (value) =>
  `GHS ${Number(value || 0).toLocaleString("en-GH")}`;

function OrderSuccess() {
  const lastOrderId = localStorage.getItem("CampusBasket-last-order-id") || "";
  const lastOrderEmail = localStorage.getItem("CampusBasket-last-order-email") || "";
  const [order, setOrder] = useState(() => getOrderById(lastOrderId));

  useEffect(() => {
    const loadOrder = async () => {
      await syncOrders(lastOrderEmail);
      setOrder(getOrderById(lastOrderId));
    };

    if (lastOrderId && lastOrderEmail) {
      void loadOrder();
    }
  }, [lastOrderEmail, lastOrderId]);

  const recipientEmail =
    order?.customer?.email || order?.shipping?.email || "Not available";

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.12),_transparent_30%),linear-gradient(180deg,_#f8fafc_0%,_#ecfeff_55%,_#f8fafc_100%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-950 px-6 py-10 text-white shadow-[0_30px_80px_rgba(15,23,42,0.18)] sm:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300">
              <CheckCircle2 size={36} />
            </div>
            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.28em] text-emerald-200/80">
              Order Successful
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
              Your CampusBasket order is confirmed.
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-300">
              We have locked in your order details, recorded the payment state,
              and made the order available in your premium tracking flow.
            </p>
          </div>
        </section>

        <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1.1fr),360px]">
          <section className="space-y-5">
            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <BrandLogo theme="light" compact showTagline={false} />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                    Confirmation Snapshot
                  </p>
                  <h2 className="text-2xl font-black text-slate-950">
                    {order?.id || "Order Ready"}
                  </h2>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    Total
                  </p>
                  <p className="mt-2 text-xl font-bold text-slate-950">
                    {formatCurrency(order?.amount)}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    Method
                  </p>
                  <p className="mt-2 text-xl font-bold text-slate-950">
                    {order?.paymentMethod || "N/A"}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    Payment Status
                  </p>
                  <p className="mt-2 text-xl font-bold text-slate-950">
                    {order?.paymentStatus || "Unavailable"}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    Buyer Email
                  </p>
                  <p className="mt-2 break-all text-sm font-bold leading-6 text-slate-950">
                    {recipientEmail}
                  </p>
                </div>
              </div>

              {order && (
                <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                      <Truck size={20} />
                    </span>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                        Shipping
                      </p>
                      <p className="text-base font-bold text-slate-950">
                        {order.shipping?.name}
                      </p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-slate-600">
                    {order.shipping?.address}, {order.shipping?.city},{" "}
                    {order.shipping?.pincode}
                  </p>
                  {order.paymentReference && (
                    <p className="mt-3 text-sm text-slate-500">
                      Payment Reference: {order.paymentReference}
                    </p>
                  )}
                  {order.paymentPayerLabel && (
                    <p className="mt-1 text-sm text-slate-500">
                      Payment Source: {order.paymentPayerLabel}
                    </p>
                  )}
                </div>
              )}

              {order && (
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {(order.items || []).map((item) => {
                    const unitPrice =
                      item.mode === "wholesale"
                        ? Number(item.wholesalePrice) || 0
                        : Number(item.retailPrice) || 0;

                    return (
                      <div
                        key={`${order.id}-${item.id}-${item.mode}`}
                        className="rounded-2xl border border-slate-200 bg-white p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-slate-900">{item.name}</p>
                            <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">
                              {item.mode} • Qty {item.quantity}
                            </p>
                          </div>
                          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                            {item.sellerStatus || "New"}
                          </span>
                        </div>

                        <p className="mt-4 text-sm text-slate-600">
                          {formatCurrency(unitPrice)} each
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          <aside className="space-y-5 xl:sticky xl:top-28 xl:self-start">
            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-black text-slate-950">
                Next Actions
              </h3>
              <div className="mt-5 space-y-3">
                <Link
                  to="/orders"
                  className="flex items-center justify-between rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
                >
                  View My Orders
                  <ArrowRight size={16} />
                </Link>
                <Link
                  to="/retail"
                  className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
                >
                  Continue Shopping
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default OrderSuccess;
