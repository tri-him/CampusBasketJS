import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CalendarRange,
  CircleDollarSign,
  Package,
  ShoppingCart,
  Trophy,
  TrendingUp,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import useAuth from "../context/useAuth";
import useBusinessMode from "../context/useBusinessMode";
import {
  getSellerCustomers,
  getSellerDashboardStats,
  getSellerOrders,
  getSellerProductsForStore,
  normalizeCatalogType,
  syncMarketplaceProducts,
  syncSellerOrders,
} from "../lib/marketplaceStore";

const formatCurrency = (value) =>
  `GHS ${Number(value || 0).toLocaleString("en-GH")}`;

const getSellerModeRevenue = (order, mode) =>
  order.sellerItems
    .filter((item) => item.mode === mode)
    .reduce((sum, item) => {
      const unitPrice =
        item.mode === "wholesale"
          ? Number(item.wholesalePrice) || 0
          : Number(item.retailPrice) || 0;

      return sum + unitPrice * item.quantity;
    }, 0);

function Dashboard() {
  const { user } = useAuth();
  const { mode } = useBusinessMode();
  const sellerId = user?.id || "";
  const [, setRefreshKey] = useState(0);

  useEffect(() => {
    const loadSellerData = async () => {
      await Promise.all([syncMarketplaceProducts(), syncSellerOrders()]);
      setRefreshKey((current) => current + 1);
    };

    if (sellerId && user?.role !== "ADMIN") {
      void loadSellerData();
    }
  }, [sellerId, user?.role]);

  if (user?.role === "ADMIN") {
    return <Navigate to="/dashboard/support" replace />;
  }

  const stats = getSellerDashboardStats(sellerId, mode);
  const sellerProducts = getSellerProductsForStore(sellerId);
  const sellerOrders = getSellerOrders(sellerId);
  const modeProducts = sellerProducts.filter((product) => {
    const catalogType = normalizeCatalogType(product.catalogType);
    return catalogType === "all" || catalogType === mode;
  });
  const modeOrders = sellerOrders
    .filter((order) => order.sellerItems.some((item) => item.mode === mode))
    .sort(
      (firstOrder, secondOrder) =>
        new Date(secondOrder.date) - new Date(firstOrder.date),
    );
  const pendingOrders = modeOrders.filter((order) =>
    order.sellerItems.some(
      (item) =>
        item.mode === mode &&
        !["Delivered", "Cancelled"].includes(item.sellerStatus || "New"),
    ),
  ).length;
  const modeCustomerIds = new Set(
    modeOrders.map(
      (order) =>
        order.customer?.email || order.shipping?.email || `guest-${order.id}`,
    ),
  );
  const modeCustomers = getSellerCustomers(sellerId).filter((customer) =>
    modeCustomerIds.has(customer.id),
  );
  const repeatCustomers = modeCustomers.filter(
    (customer) => customer.totalOrders > 1,
  ).length;
  const deliveredOrders = modeOrders.filter((order) =>
    order.sellerItems.some(
      (item) => item.mode === mode && item.sellerStatus === "Delivered",
    ),
  ).length;
  const currentDate = new Date();
  const currentMonthStart = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1,
  );
  const previousMonthStart = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() - 1,
    1,
  );
  const currentMonthOrders = modeOrders.filter(
    (order) => new Date(order.date) >= currentMonthStart,
  );
  const previousMonthOrders = modeOrders.filter((order) => {
    const orderDate = new Date(order.date);
    return orderDate >= previousMonthStart && orderDate < currentMonthStart;
  });
  const currentMonthRevenue = currentMonthOrders.reduce(
    (sum, order) => sum + getSellerModeRevenue(order, mode),
    0,
  );
  const previousMonthRevenue = previousMonthOrders.reduce(
    (sum, order) => sum + getSellerModeRevenue(order, mode),
    0,
  );
  const monthlyRevenueDelta =
    previousMonthRevenue > 0
      ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100
      : currentMonthRevenue > 0
        ? 100
        : 0;
  const averageOrderValue =
    modeOrders.length > 0 ? stats.revenue / modeOrders.length : 0;
  const fulfilmentRate =
    modeOrders.length > 0 ? (deliveredOrders / modeOrders.length) * 100 : 0;
  const lowStockProducts = modeProducts
    .filter((product) => Number(product.inventory || 0) <= 15)
    .sort(
      (firstProduct, secondProduct) =>
        Number(firstProduct.inventory || 0) -
        Number(secondProduct.inventory || 0),
    )
    .slice(0, 4);
  const topProductPerformance = Object.values(
    modeOrders.reduce((summary, order) => {
      order.sellerItems
        .filter((item) => item.mode === mode)
        .forEach((item) => {
          const unitPrice =
            item.mode === "wholesale"
              ? Number(item.wholesalePrice) || 0
              : Number(item.retailPrice) || 0;

          if (!summary[item.id]) {
            const matchedProduct = sellerProducts.find((product) => product.id === item.id);
            summary[item.id] = {
              id: item.id,
              name: item.name,
              category: item.category || "General",
              units: 0,
              revenue: 0,
              orders: 0,
              inventory: Number(matchedProduct?.inventory || 0),
            };
          }

          summary[item.id].units += item.quantity;
          summary[item.id].revenue += unitPrice * item.quantity;
          summary[item.id].orders += 1;
        });

      return summary;
    }, {}),
  )
    .sort((firstProduct, secondProduct) => {
      if (secondProduct.revenue !== firstProduct.revenue) {
        return secondProduct.revenue - firstProduct.revenue;
      }

      return secondProduct.units - firstProduct.units;
    })
    .slice(0, 4);
  const categoryPerformanceMap = modeOrders.reduce((summary, order) => {
    const categoriesInOrder = new Set();

    order.sellerItems
      .filter((item) => item.mode === mode)
      .forEach((item) => {
        const category = item.category || "General";
        const unitPrice =
          item.mode === "wholesale"
            ? Number(item.wholesalePrice) || 0
            : Number(item.retailPrice) || 0;

        if (!summary[category]) {
          summary[category] = { revenue: 0, items: 0, orders: 0 };
        }

        summary[category].revenue += unitPrice * item.quantity;
        summary[category].items += item.quantity;

        if (!categoriesInOrder.has(category)) {
          summary[category].orders += 1;
          categoriesInOrder.add(category);
        }
      });

    return summary;
  }, {});
  const categoryPerformance = Object.entries(categoryPerformanceMap)
    .sort((firstCategory, secondCategory) => {
      return secondCategory[1].revenue - firstCategory[1].revenue;
    })
    .slice(0, 4);
  const maxCategoryRevenue = Math.max(
    ...categoryPerformance.map(([, entry]) => Number(entry.revenue || 0)),
    1,
  );
  const revenueTrend = Object.entries(
    modeOrders.reduce((summary, order) => {
      const label = new Date(order.date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
      });

      const orderRevenue = getSellerModeRevenue(order, mode);

      summary[label] = (summary[label] || 0) + orderRevenue;
      return summary;
    }, {}),
  ).slice(0, 6);
  const maxRevenuePoint = Math.max(
    ...revenueTrend.map(([, amount]) => Number(amount || 0)),
    1,
  );

  const statCards = [
    {
      label: "Live Products",
      value: stats.productsCount,
      helper: "Visible in the active catalog",
      icon: Package,
      accent: "emerald",
    },
    {
      label: "Open Orders",
      value: pendingOrders,
      helper: `${stats.ordersCount} total orders in ${mode}`,
      icon: ShoppingCart,
      accent: "cyan",
    },
    {
      label: "Customers",
      value: stats.customersCount,
      helper: "Unique buyers for this mode",
      icon: Users,
      accent: "amber",
    },
    {
      label: "Revenue",
      value: formatCurrency(stats.revenue),
      helper: "Gross store revenue",
      icon: CircleDollarSign,
      accent: "rose",
    },
  ];

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-950 px-6 py-8 text-white shadow-[0_24px_70px_rgba(15,23,42,0.18)] sm:px-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr),360px]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-200/80">
              Seller Control Center
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              {user?.storeName || user?.name} is live in the {mode} marketplace.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
              Add products, manage orders, and build repeat customers from one
              premium dashboard. Products published here appear directly in the
              public retail or wholesale storefront based on the catalog type
              you choose.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/dashboard/products"
                className="inline-flex items-center gap-2 rounded-full bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
              >
                Manage Products
                <ArrowRight size={16} />
              </Link>

              <Link
                to="/dashboard/orders"
                className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-5 py-3 text-sm font-semibold text-white transition hover:border-slate-500 hover:bg-white/[0.04]"
              >
                Review Orders
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
              Store Snapshot
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                <p className="text-sm text-slate-400">Current catalog</p>
                <p className="mt-2 text-2xl font-bold text-white">
                  {modeProducts.length} products
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                <p className="text-sm text-slate-400">Recent customer base</p>
                <p className="mt-2 text-2xl font-bold text-white">
                  {modeCustomers.length} active buyers
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-4">
        {statCards.map((card) => {
          const StatIcon = card.icon;

          return (
            <div
              key={card.label}
              className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    {card.label}
                  </p>
                  <p className="mt-3 text-3xl font-black text-slate-950">
                    {card.value}
                  </p>
                </div>
                <span
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                    card.accent === "emerald"
                      ? "bg-emerald-100 text-emerald-700"
                      : card.accent === "cyan"
                        ? "bg-cyan-100 text-cyan-700"
                        : card.accent === "amber"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-rose-100 text-rose-700"
                  }`}
                >
                  <StatIcon size={22} />
                </span>
              </div>
              <p className="mt-4 text-sm text-slate-500">{card.helper}</p>
            </div>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr),420px]">
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-bold text-slate-950">Recent Orders</h3>
              <p className="mt-1 text-sm text-slate-500">
                Latest order activity for your {mode} catalog.
              </p>
            </div>

            <Link
              to="/dashboard/orders"
              className="text-sm font-semibold text-slate-700 transition hover:text-slate-950"
            >
              View all
            </Link>
          </div>

          <div className="mt-5 space-y-4">
            {modeOrders.slice(0, 4).map((order) => {
              const orderItems = order.sellerItems.filter((item) => item.mode === mode);
              const orderRevenue = orderItems.reduce((sum, item) => {
                const unitPrice =
                  item.mode === "wholesale"
                    ? Number(item.wholesalePrice) || 0
                    : Number(item.retailPrice) || 0;

                return sum + unitPrice * item.quantity;
              }, 0);

              return (
                <div
                  key={order.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-semibold text-slate-950">{order.id}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {order.shipping?.name || order.customer?.name} from{" "}
                        {order.shipping?.city || "Unknown city"}
                      </p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="font-semibold text-emerald-700">
                        {formatCurrency(orderRevenue)}
                      </p>
                      <p className="text-sm text-slate-500">
                        {new Date(order.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}

            {modeOrders.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                <p className="text-base font-semibold text-slate-900">
                  No orders in this catalog yet.
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Publish products and customer orders will start appearing here.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-bold text-slate-950">
                  Revenue Trend
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  A quick view of how your latest {mode} order revenue is moving.
                </p>
              </div>

              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700">
                <BarChart3 size={20} />
              </span>
            </div>

            <div className="mt-6 grid grid-cols-6 items-end gap-3">
              {revenueTrend.length > 0 ? (
                revenueTrend.map(([label, amount]) => (
                  <div key={label} className="flex flex-col items-center gap-3">
                    <div className="flex h-40 w-full items-end">
                      <div
                        className="w-full rounded-t-2xl bg-gradient-to-t from-cyan-500 to-emerald-400"
                        style={{
                          height: `${Math.max(
                            16,
                            (Number(amount || 0) / maxRevenuePoint) * 100,
                          )}%`,
                        }}
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-semibold text-slate-700">
                        {formatCurrency(amount)}
                      </p>
                      <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-slate-400">
                        {label}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
                  Revenue bars will appear after the first few orders land in
                  this catalog.
                </div>
              )}
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Delivered orders
                </p>
                <p className="mt-2 flex items-center gap-2 text-xl font-bold text-slate-950">
                  <TrendingUp size={18} className="text-emerald-600" />
                  {deliveredOrders}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Repeat customers
                </p>
                <p className="mt-2 text-xl font-bold text-slate-950">
                  {repeatCustomers}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-bold text-slate-950">
                  Monthly Summary
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Current-month momentum for your active {mode} catalog.
                </p>
              </div>

              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                <CalendarRange size={20} />
              </span>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  This month revenue
                </p>
                <p className="mt-2 text-xl font-bold text-slate-950">
                  {formatCurrency(currentMonthRevenue)}
                </p>
                <p
                  className={`mt-2 text-sm font-semibold ${
                    monthlyRevenueDelta >= 0 ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {monthlyRevenueDelta >= 0 ? "+" : ""}
                  {monthlyRevenueDelta.toFixed(1)}% vs last month
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Average order value
                </p>
                <p className="mt-2 text-xl font-bold text-slate-950">
                  {formatCurrency(averageOrderValue)}
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  {currentMonthOrders.length} orders this month
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Fulfilment rate
                </p>
                <p className="mt-2 text-xl font-bold text-slate-950">
                  {fulfilmentRate.toFixed(0)}%
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Based on delivered orders in this mode
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Previous month
                </p>
                <p className="mt-2 text-xl font-bold text-slate-950">
                  {formatCurrency(previousMonthRevenue)}
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Benchmark for current store momentum
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-bold text-slate-950">
                  Low Stock Alerts
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Products that may need replenishment soon.
                </p>
              </div>

              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                <AlertTriangle size={20} />
              </span>
            </div>

            <div className="mt-5 space-y-3">
              {lowStockProducts.length > 0 ? (
                lowStockProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between rounded-2xl bg-amber-50 px-4 py-3"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">{product.name}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {product.category}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
                        {Number(product.inventory || 0)} left
                      </span>
                      <p
                        className={`mt-2 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                          Number(product.inventory || 0) <= 5
                            ? "text-rose-600"
                            : "text-amber-600"
                        }`}
                      >
                        {Number(product.inventory || 0) <= 5 ? "Critical" : "Reorder soon"}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
                  Your inventory looks healthy for this catalog right now.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-bold text-slate-950">
              Category Performance
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Revenue and order contribution by top-selling categories.
            </p>

            <div className="mt-5 space-y-4">
              {categoryPerformance.map(([category, entry]) => (
                <div key={category} className="rounded-2xl bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-slate-900">{category}</span>
                    <span className="text-sm font-semibold text-slate-700">
                      {formatCurrency(entry.revenue)}
                    </span>
                  </div>

                  <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-500"
                      style={{
                        width: `${Math.max(
                          12,
                          (Number(entry.revenue || 0) / maxCategoryRevenue) * 100,
                        )}%`,
                      }}
                    />
                  </div>

                  <div className="mt-3 flex flex-wrap gap-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    <span>{entry.orders} orders</span>
                    <span>{entry.items} units</span>
                  </div>
                </div>
              ))}

              {categoryPerformance.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
                  Category performance will appear after products start selling.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-bold text-slate-950">
                  Best-Selling Products
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Track which products are pulling the most revenue right now.
                </p>
              </div>

              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-100 text-rose-700">
                <Trophy size={20} />
              </span>
            </div>

            <div className="mt-5 space-y-4">
              {topProductPerformance.length > 0 ? (
                topProductPerformance.map((product, index) => (
                  <div key={product.id} className="rounded-2xl bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                          #{index + 1} product
                        </p>
                        <p className="mt-2 font-semibold text-slate-950">
                          {product.name}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {product.category}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-emerald-700">
                        {formatCurrency(product.revenue)}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      <span>{product.units} units sold</span>
                      <span>{product.orders} order touches</span>
                      <span>{product.inventory} in stock</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
                  Product-level rankings will appear after customers start buying.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-bold text-slate-950">Store Actions</h3>
            <div className="mt-5 space-y-3">
              <Link
                to="/dashboard/products"
                className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-slate-950"
              >
                Publish new product
                <ArrowRight size={16} />
              </Link>
              <Link
                to="/dashboard/customers"
                className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-cyan-300 hover:text-slate-950"
              >
                Review customer base
                <ArrowRight size={16} />
              </Link>
              <Link
                to="/dashboard/settings"
                className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-rose-300 hover:text-slate-950"
              >
                Update store settings
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Dashboard;
