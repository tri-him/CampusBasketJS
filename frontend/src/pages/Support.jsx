import {
  CircleAlert,
  Headset,
  LifeBuoy,
  MessageSquare,
  MessageSquareWarning,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import useCustomerAuth from "../context/useCustomerAuth";
import {
  createSupportTicket,
  getOrders,
  getSupportTicketsForEmail,
  syncOrders,
  syncSupportTickets,
} from "../lib/marketplaceStore";

const issueCategories = [
  "Order Issue",
  "Delivery Delay",
  "Product Quality",
  "Refund and Return",
  "Payment Problem",
  "Seller Behavior",
  "Other",
];

const priorityOptions = ["Low", "Medium", "High"];

const statusClasses = {
  Open: "bg-amber-100 text-amber-700",
  "In Review": "bg-cyan-100 text-cyan-700",
  Resolved: "bg-emerald-100 text-emerald-700",
};

function Support() {
  const { customer } = useCustomerAuth();
  const [searchParams] = useSearchParams();
  const selectedOrderId = searchParams.get("order") || "";
  const lastOrderEmail = localStorage.getItem("CampusBasket-last-order-email") || "";
  const customerEmail = customer?.email || lastOrderEmail;
  const customerName = customer?.name || "";

  const orders = useMemo(
    () =>
      getOrders()
        .filter((order) => {
          const orderEmail = order.customer?.email || order.shipping?.email || "";
          return customerEmail ? orderEmail === customerEmail : true;
        })
        .sort(
          (firstOrder, secondOrder) =>
            new Date(secondOrder.date) - new Date(firstOrder.date),
        ),
    [customerEmail],
  );

  const [tickets, setTickets] = useState(() =>
    getSupportTicketsForEmail(customerEmail),
  );
  const [latestTicket, setLatestTicket] = useState(null);
  const [, setRefreshKey] = useState(0);
  const [formData, setFormData] = useState({
    customerName,
    customerEmail,
    customerPhone: "",
    orderId: selectedOrderId,
    category: issueCategories[0],
    priority: "Medium",
    subject: selectedOrderId
      ? `Help needed for order ${selectedOrderId}`
      : "",
    description: "",
  });

  const openTickets = tickets.filter((ticket) => ticket.status === "Open").length;
  const linkedOrders = tickets.filter((ticket) => ticket.orderId).length;

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        syncOrders(customerEmail),
        syncSupportTickets(customerEmail),
      ]);
      setTickets(getSupportTicketsForEmail(customerEmail));
      setRefreshKey((current) => current + 1);
    };

    if (customerEmail) {
      void loadData();
    }
  }, [customerEmail]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));

    if (name === "customerEmail") {
      setTickets(getSupportTicketsForEmail(value.trim()));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const createdTicket = await createSupportTicket(formData);

    setLatestTicket(createdTicket);
    setTickets(getSupportTicketsForEmail(formData.customerEmail.trim()));
    setFormData((currentForm) => ({
      ...currentForm,
      customerName: currentForm.customerName,
      customerEmail: currentForm.customerEmail,
      customerPhone: currentForm.customerPhone,
      orderId: "",
      category: issueCategories[0],
      priority: "Medium",
      subject: "",
      description: "",
    }));
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.12),_transparent_24%),radial-gradient(circle_at_bottom_left,_rgba(14,165,233,0.1),_transparent_28%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_48%,_#f8fafc_100%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-950 px-6 py-8 text-white shadow-[0_30px_80px_rgba(15,23,42,0.18)] sm:px-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr),380px] lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-200/80">
                Customer Service
              </p>
              <h1 className="mt-3 text-4xl font-black tracking-tight">
                Report any issue and keep every complaint in one place.
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
                Raise support tickets for orders, delivery, payments, product
                quality, or seller concerns. Your complaint is saved with a clear
                reference number so it is easier to track and trust.
              </p>

              <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-200">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2">
                  <ShieldCheck size={16} className="text-emerald-300" />
                  Structured complaint tracking
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2">
                  <LifeBuoy size={16} className="text-cyan-300" />
                  Order-linked issue resolution
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to="/support/chat"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
                >
                  <MessageSquare size={16} />
                  Open Live Support Chat
                </Link>
                <Link
                  to="/orders"
                  className="rounded-full border border-white/15 bg-white/[0.06] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.1]"
                >
                  View My Orders
                </Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Open Tickets
                </p>
                <p className="mt-2 text-2xl font-bold">{openTickets}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Your Orders
                </p>
                <p className="mt-2 text-2xl font-bold">{orders.length}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Order-linked Cases
                </p>
                <p className="mt-2 text-2xl font-bold">{linkedOrders}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.05fr),420px]">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
                <Headset size={24} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Raise Complaint
                </p>
                <h2 className="mt-2 text-3xl font-black text-slate-950">
                  Tell CampusBasket what went wrong.
                </h2>
                <p className="mt-2 text-sm leading-7 text-slate-500">
                  Add the issue details once and we will keep the complaint record
                  ready with a support ticket number for follow-up.
                </p>
              </div>
            </div>

            {latestTicket && (
              <div className="mt-6 rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">
                  Complaint Submitted
                </p>
                <p className="mt-2 text-lg font-bold text-slate-950">
                  {latestTicket.ticketNumber}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  We saved your issue under <strong>{latestTicket.subject}</strong>.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-slate-700">
                    Full Name
                  </span>
                  <input
                    type="text"
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleChange}
                    placeholder="Your full name"
                    required
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-400"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-slate-700">
                    Email
                  </span>
                  <input
                    type="email"
                    name="customerEmail"
                    value={formData.customerEmail}
                    onChange={handleChange}
                    placeholder="your@email.com"
                    required
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-400"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-slate-700">
                    Phone Number
                  </span>
                  <input
                    type="tel"
                    name="customerPhone"
                    value={formData.customerPhone}
                    onChange={handleChange}
                    placeholder="Optional contact number"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-400"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-slate-700">
                    Related Order
                  </span>
                  <select
                    name="orderId"
                    value={formData.orderId}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-400"
                  >
                    <option value="">No order selected</option>
                    {orders.map((order) => (
                      <option key={order.id} value={order.id}>
                        {order.id} - {order.shipping?.city || "CampusBasket order"}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-slate-700">
                    Issue Category
                  </span>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-400"
                  >
                    {issueCategories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-slate-700">
                    Priority
                  </span>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-400"
                  >
                    {priorityOptions.map((priority) => (
                      <option key={priority} value={priority}>
                        {priority}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-700">
                  Subject
                </span>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="Short summary of the issue"
                  required
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-400"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-700">
                  Complaint Details
                </span>
                <textarea
                  rows={6}
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe the issue clearly so customer service can understand what happened."
                  required
                  className="w-full rounded-[1.5rem] border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-400"
                />
              </label>

              <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
                <div className="inline-flex items-center gap-2">
                  <CircleAlert size={16} className="text-amber-500" />
                  Most cases should include order ID, issue category, and clear details.
                </div>
                <button className="rounded-full bg-slate-950 px-6 py-3 font-semibold text-white transition hover:bg-slate-800">
                  Submit Complaint
                </button>
              </div>
            </form>
          </div>

          <div className="space-y-6">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                Support Promise
              </p>
              <h2 className="mt-2 text-2xl font-black text-slate-950">
                Clean, trackable customer service flow.
              </h2>
              <div className="mt-5 space-y-3">
                <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  Complaint history stays attached to your email.
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  Order-linked support helps you raise delivery or seller issues faster.
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  Ticket numbers make follow-up more trustworthy for users.
                </div>
              </div>

              <Link
                to="/support/chat"
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                <MessageSquare size={16} />
                Continue in Support Chat
              </Link>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                    Recent Complaints
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-slate-950">
                    Your support history
                  </h2>
                </div>

                <Link
                  to="/orders"
                  className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
                >
                  View Orders
                </Link>
              </div>

              <div className="mt-5 space-y-4">
                {tickets.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-200 text-slate-500">
                      <MessageSquareWarning size={20} />
                    </div>
                    <p className="mt-4 text-base font-semibold text-slate-900">
                      No complaints raised yet.
                    </p>
                    <p className="mt-2 text-sm leading-7 text-slate-500">
                      When you submit an issue here, your support history will appear
                      in this panel.
                    </p>
                  </div>
                ) : (
                  tickets.map((ticket) => (
                    <article
                      key={ticket.id}
                      className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClasses[ticket.status] || "bg-slate-200 text-slate-700"}`}
                        >
                          {ticket.status}
                        </span>
                        <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
                          {ticket.priority}
                        </span>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500">
                          {ticket.category}
                        </span>
                      </div>

                      <h3 className="mt-4 text-lg font-bold text-slate-950">
                        {ticket.subject}
                      </h3>
                      <p className="mt-2 text-sm leading-7 text-slate-600">
                        {ticket.description}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        <span>{ticket.ticketNumber}</span>
                        <span>{new Date(ticket.createdAt).toLocaleDateString("en-IN")}</span>
                        {ticket.orderId && <span>Order {ticket.orderId}</span>}
                        <span>{ticket.responseEta}</span>
                      </div>

                      <div className="mt-4">
                        <Link
                          to={`/support/chat?ticket=${encodeURIComponent(ticket.id)}${ticket.orderId ? `&order=${encodeURIComponent(ticket.orderId)}` : ""}`}
                          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
                        >
                          <MessageSquare size={15} />
                          Open Chat
                        </Link>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Support;
