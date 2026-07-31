import { Download, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import useAuth from "../context/useAuth";
import useBusinessMode from "../context/useBusinessMode";
import {
  getSellerOrders,
  syncSellerOrders,
  updateSellerOrderItemStatus,
} from "../lib/marketplaceStore";

const statusOptions = ["New", "Packed", "Shipped", "Delivered", "Cancelled"];

const formatCurrency = (value) =>
  `Rs.${Number(value || 0).toLocaleString("en-IN")}`;

function Order() {
  const { user } = useAuth();
  const { mode } = useBusinessMode();
  const sellerId = user?.id || "";
  const [orders, setOrders] = useState(() => getSellerOrders(sellerId));
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");

  const refreshOrders = () => {
    setOrders(getSellerOrders(sellerId));
  };

  useEffect(() => {
    const loadOrders = async () => {
      await syncSellerOrders();
      setOrders(getSellerOrders(sellerId));
    };

    if (sellerId) {
      void loadOrders();
    }
  }, [sellerId]);

  const filteredOrders = useMemo(
    () =>
      orders
        .filter((order) => order.sellerItems.some((item) => item.mode === mode))
        .filter((order) => {
          const orderItems = order.sellerItems.filter((item) => item.mode === mode);
          const currentStatus = orderItems[0]?.sellerStatus || "New";
          const query = searchTerm.trim().toLowerCase();
          const matchesSearch = query
            ? [
                order.id,
                order.shipping?.name,
                order.shipping?.email,
                order.shipping?.city,
              ]
                .filter(Boolean)
                .some((value) => value.toLowerCase().includes(query))
            : true;
          const matchesStatus =
            statusFilter === "all" ? true : currentStatus === statusFilter;
          const matchesPayment =
            paymentFilter === "all"
              ? true
              : order.paymentMethod === paymentFilter;

          return matchesSearch && matchesStatus && matchesPayment;
        })
        .sort(
          (firstOrder, secondOrder) =>
            new Date(secondOrder.date) - new Date(firstOrder.date),
        ),
    [mode, orders, paymentFilter, searchTerm, statusFilter],
  );

  const totalRevenue = filteredOrders.reduce((sum, order) => {
    const modeTotal = order.sellerItems
      .filter((item) => item.mode === mode)
      .reduce((itemSum, item) => {
        const unitPrice =
          item.mode === "wholesale"
            ? Number(item.wholesalePrice) || 0
            : Number(item.retailPrice) || 0;
        return itemSum + unitPrice * item.quantity;
      }, 0);

    return sum + modeTotal;
  }, 0);

  const newOrdersCount = filteredOrders.filter((order) =>
    order.sellerItems.some(
      (item) => item.mode === mode && (item.sellerStatus || "New") === "New",
    ),
  ).length;

  const downloadReport = () => {
    const rows = [
      [
        "Order ID",
        "Date",
        "Customer",
        "Email",
        "City",
        "Payment",
        "Payment Status",
        "Status",
        "Items",
        "Revenue",
      ],
      ...filteredOrders.map((order) => {
        const orderItems = order.sellerItems.filter((item) => item.mode === mode);
        const currentStatus = orderItems[0]?.sellerStatus || "New";
        const orderAmount = orderItems.reduce((sum, item) => {
          const unitPrice =
            item.mode === "wholesale"
              ? Number(item.wholesalePrice) || 0
              : Number(item.retailPrice) || 0;

          return sum + unitPrice * item.quantity;
        }, 0);

        return [
          order.id,
          new Date(order.date).toLocaleDateString(),
          order.shipping?.name || order.customer?.name || "Guest Customer",
          order.shipping?.email || order.customer?.email || "",
          order.shipping?.city || "",
          order.paymentMethod,
          order.paymentStatus || "Unavailable",
          currentStatus,
          orderItems.map((item) => `${item.name} x${item.quantity}`).join(" | "),
          Number(orderAmount || 0),
        ];
      }),
    ];

    const csv = rows
      .map((row) =>
        row
          .map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`)
          .join(","),
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `CampusBasket-${mode}-orders-report.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Seller Orders
            </p>
            <h2 className="mt-2 text-3xl font-black text-slate-950">
              Order flow for {mode} catalog
            </h2>
            <p className="mt-2 text-sm leading-7 text-slate-500">
              Update fulfilment status for your store items and monitor revenue
              coming from the active storefront mode.
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-3">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
              <div className="relative min-w-0 flex-1">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Search orders by ID, customer, email, or city"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-full border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-emerald-400"
                />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center xl:shrink-0">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-emerald-400"
                >
                  <option value="all">All statuses</option>
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>

                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                  className="rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-emerald-400"
                >
                  <option value="all">All payments</option>
                  {["UPI", "Card", "COD"].map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>

                <button
                  onClick={downloadReport}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  <Download size={16} />
                  Download Report
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Total orders</p>
            <p className="mt-2 text-2xl font-bold text-slate-950">
              {filteredOrders.length}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">New orders</p>
            <p className="mt-2 text-2xl font-bold text-slate-950">
              {newOrdersCount}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Revenue</p>
            <p className="mt-2 text-2xl font-bold text-slate-950">
              {formatCurrency(totalRevenue)}
            </p>
          </div>
        </div>
      </section>

      {filteredOrders.length === 0 ? (
        <section className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
          <h3 className="text-2xl font-bold text-slate-950">
            No seller orders yet.
          </h3>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-500">
            As soon as customers buy products from your {mode} catalog, their
            orders will show up here with shipping and status controls.
          </p>
        </section>
      ) : (
        <section className="space-y-5">
          {filteredOrders.map((order) => {
            const orderItems = order.sellerItems.filter((item) => item.mode === mode);
            const currentStatus = orderItems[0]?.sellerStatus || "New";
            const orderAmount = orderItems.reduce((sum, item) => {
              const unitPrice =
                item.mode === "wholesale"
                  ? Number(item.wholesalePrice) || 0
                  : Number(item.retailPrice) || 0;

              return sum + unitPrice * item.quantity;
            }, 0);

            return (
              <article
                key={order.id}
                className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-xl font-bold text-slate-950">{order.id}</h3>
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                        {mode}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-slate-500">
                      {order.shipping?.name || order.customer?.name} •{" "}
                      {order.shipping?.email || order.customer?.email || "No email"}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {order.shipping?.address}, {order.shipping?.city},{" "}
                      {order.shipping?.pincode}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {order.paymentMethod} payment is {order.paymentStatus} on{" "}
                      {new Date(order.date).toLocaleDateString()}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Ref {order.paymentReference || "generated at checkout"}
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:w-[360px]">
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                        Seller amount
                      </p>
                      <p className="mt-2 text-xl font-bold text-slate-950">
                        {formatCurrency(orderAmount)}
                      </p>
                    </div>

                    <label className="rounded-2xl bg-slate-50 p-4">
                      <span className="text-xs uppercase tracking-[0.2em] text-slate-500">
                        Fulfilment status
                      </span>
                      <select
                        value={currentStatus}
                        onChange={async (e) => {
                          await updateSellerOrderItemStatus(
                            order.id,
                            sellerId,
                            e.target.value,
                          );
                          refreshOrders();
                        }}
                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none transition focus:border-emerald-400"
                      >
                        {statusOptions.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {orderItems.map((item) => {
                    const unitPrice =
                      item.mode === "wholesale"
                        ? Number(item.wholesalePrice) || 0
                        : Number(item.retailPrice) || 0;

                    return (
                      <div
                        key={`${order.id}-${item.id}-${item.mode}`}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-slate-950">{item.name}</p>
                            <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">
                              {item.category}
                            </p>
                          </div>
                          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
                            Qty {item.quantity}
                          </span>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-500">
                          <span>Unit price: {formatCurrency(unitPrice)}</span>
                          <span>Status: {item.sellerStatus || "New"}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}

export default Order;
