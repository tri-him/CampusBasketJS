import { LogOut, Store } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import useAuth from "../context/useAuth";
import useBusinessMode from "../context/useBusinessMode";

const pageMeta = {
  "/dashboard": {
    title: "Seller Overview",
    subtitle: "Track live performance for the current storefront mode.",
  },
  "/dashboard/products": {
    title: "Product Management",
    subtitle: "Create products and publish them straight into the marketplace.",
  },
  "/dashboard/orders": {
    title: "Order Management",
    subtitle: "Update seller fulfilment status and monitor store revenue.",
  },
  "/dashboard/customers": {
    title: "Customer Management",
    subtitle: "See who buys from your store and spot repeat shoppers.",
  },
  "/dashboard/support": {
    title: "Support Desk",
    subtitle: "Monitor customer tickets and support chats across CampusBasket.",
  },
  "/dashboard/users": {
    title: "User Control",
    subtitle: "Review account health and suspend or reactivate marketplace users.",
  },
  "/dashboard/settings": {
    title: "Store Settings",
    subtitle: "Update the seller identity customers see across your storefront.",
  },
};

function Topbar() {
  const { user, logout } = useAuth();
  const { mode, setMode } = useBusinessMode();
  const location = useLocation();
  const navigate = useNavigate();
  const isAdmin = user?.role === "ADMIN";

  const currentMeta =
    pageMeta[location.pathname] ||
    (isAdmin ? pageMeta["/dashboard/support"] : pageMeta["/dashboard"]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="border-b border-slate-200/70 bg-white/80 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 sm:tracking-[0.24em]">
            {isAdmin ? "CampusBasket Support Admin" : user?.storeName || user?.name}
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-950">
            {currentMeta.title}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{currentMeta.subtitle}</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {!isAdmin && (
            <>
              <div className="inline-flex rounded-full border border-slate-200 bg-slate-100 p-1">
                {["retail", "wholesale"].map((sectionMode) => (
                  <button
                    key={sectionMode}
                    onClick={() => setMode(sectionMode)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      mode === sectionMode
                        ? "bg-slate-950 text-white shadow-sm"
                        : "text-slate-600 hover:text-slate-950"
                    }`}
                  >
                    {sectionMode === "retail" ? "Retail Mode" : "Wholesale Mode"}
                  </button>
                ))}
              </div>

              <Link
                to={mode === "wholesale" ? "/wholesale" : "/retail"}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
              >
                <Store size={16} />
                Open Storefront
              </Link>
            </>
          )}

          <button
            onClick={handleLogout}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-400"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}

export default Topbar;
