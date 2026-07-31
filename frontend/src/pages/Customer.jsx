import { Crown, Search, Star, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import useAuth from "../context/useAuth";
import useBusinessMode from "../context/useBusinessMode";
import {
  getSellerCustomers,
  getSellerOrders,
  syncSellerOrders,
} from "../lib/marketplaceStore";

const formatCurrency = (value) =>
  `GHS ${Number(value || 0).toLocaleString("en-GH")}`;

const getCustomerTier = (customer) => {
  if (customer.totalSpent >= 15000 || customer.totalOrders >= 5) {
    return "VIP";
  }

  if (customer.totalOrders >= 2) {
    return "Repeat";
  }

  return "New";
};

function Customer() {
  const { user } = useAuth();
  const { mode } = useBusinessMode();
  const sellerId = user?.id || "";
  const [searchTerm, setSearchTerm] = useState("");
  const [, setRefreshKey] = useState(0);

  useEffect(() => {
    const loadOrders = async () => {
      await syncSellerOrders();
      setRefreshKey((current) => current + 1);
    };

    if (sellerId) {
      void loadOrders();
    }
  }, [sellerId]);

  const sellerOrders = getSellerOrders(sellerId);
  const modeOrders = sellerOrders.filter((order) =>
    order.sellerItems.some((item) => item.mode === mode),
  );
  const modeCustomerIds = new Set(
    modeOrders.map(
      (order) =>
        order.customer?.email || order.shipping?.email || `guest-${order.id}`,
    ),
  );
  const customers = getSellerCustomers(sellerId).filter((customer) =>
    modeCustomerIds.has(customer.id),
  );

  const filteredCustomers = useMemo(
    () =>
      customers
        .filter((customer) => {
          const query = searchTerm.trim().toLowerCase();
          if (!query) {
            return true;
          }

          return [customer.name, customer.email, customer.city]
            .filter(Boolean)
            .some((value) => value.toLowerCase().includes(query));
        })
        .sort((firstCustomer, secondCustomer) => {
          return secondCustomer.totalSpent - firstCustomer.totalSpent;
        }),
    [customers, searchTerm],
  );

  const repeatCustomers = filteredCustomers.filter(
    (customer) => customer.totalOrders > 1,
  ).length;
  const vipCustomers = filteredCustomers.filter(
    (customer) => getCustomerTier(customer) === "VIP",
  ).length;
  const customerValue = filteredCustomers.reduce(
    (sum, customer) => sum + customer.totalSpent,
    0,
  );
  const averageCustomerValue =
    filteredCustomers.length > 0 ? customerValue / filteredCustomers.length : 0;
  const topCustomer = filteredCustomers[0] || null;

  return (
    <div className="space-y-6">
      <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Seller Customers
            </p>
            <h2 className="mt-2 text-3xl font-black text-slate-950">
              Buyers from your {mode} storefront
            </h2>
            <p className="mt-2 text-sm leading-7 text-slate-500">
              Review your customer base, identify repeat buyers, and understand
              how much value each customer brings to your store.
            </p>
          </div>

          <div className="relative w-full min-w-0 sm:min-w-[260px]">
            <Search
              size={16}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search customers"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-full border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-emerald-400"
            />
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Customers</p>
            <p className="mt-2 text-2xl font-bold text-slate-950">
              {filteredCustomers.length}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Repeat buyers</p>
            <p className="mt-2 text-2xl font-bold text-slate-950">
              {repeatCustomers}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">VIP customers</p>
            <p className="mt-2 text-2xl font-bold text-slate-950">
              {vipCustomers}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Average customer value</p>
            <p className="mt-2 text-2xl font-bold text-slate-950">
              {formatCurrency(averageCustomerValue)}
            </p>
          </div>
        </div>
      </section>

      {topCustomer && (
        <section className="rounded-[1.75rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-sm">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-200/80">
                Top Customer
              </p>
              <h3 className="mt-2 text-3xl font-black">
                {topCustomer.name} leads your {mode} customer list.
              </h3>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
                This profile currently represents the highest total spend in your
                filtered customer list.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Total spent
                </p>
                <p className="mt-2 text-xl font-bold">
                  {formatCurrency(topCustomer.totalSpent)}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Orders
                </p>
                <p className="mt-2 text-xl font-bold">{topCustomer.totalOrders}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Tier
                </p>
                <p className="mt-2 text-xl font-bold">
                  {getCustomerTier(topCustomer)}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {filteredCustomers.length === 0 ? (
        <section className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
          <h3 className="text-2xl font-bold text-slate-950">
            No customers for this catalog yet.
          </h3>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-500">
            Customer profiles will appear automatically as soon as shoppers
            place orders from your {mode} storefront.
          </p>
        </section>
      ) : (
        <section className="grid gap-5 xl:grid-cols-2">
          {filteredCustomers.map((customer) => {
            const customerTier = getCustomerTier(customer);
            const averageOrderValue =
              customer.totalOrders > 0
                ? customer.totalSpent / customer.totalOrders
                : 0;

            return (
              <article
                key={customer.id}
                className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Customer
                    </p>
                    <h3 className="mt-2 text-2xl font-bold text-slate-950">
                      {customer.name}
                    </h3>
                    <p className="mt-2 text-sm text-slate-500">{customer.email}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {customer.phone} • {customer.city}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${
                      customerTier === "VIP"
                        ? "bg-amber-100 text-amber-700"
                        : customerTier === "Repeat"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {customerTier}
                  </span>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      Total spent
                    </p>
                    <p className="mt-2 text-xl font-bold text-slate-950">
                      {formatCurrency(customer.totalSpent)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      Last order
                    </p>
                    <p className="mt-2 text-xl font-bold text-slate-950">
                      {new Date(customer.lastOrderDate).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      Orders placed
                    </p>
                    <p className="mt-2 flex items-center gap-2 text-xl font-bold text-slate-950">
                      <Users size={18} className="text-cyan-600" />
                      {customer.totalOrders}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      Avg order value
                    </p>
                    <p className="mt-2 flex items-center gap-2 text-xl font-bold text-slate-950">
                      {customerTier === "VIP" ? (
                        <Crown size={18} className="text-amber-600" />
                      ) : (
                        <Star size={18} className="text-emerald-600" />
                      )}
                      {formatCurrency(averageOrderValue)}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}

export default Customer;
