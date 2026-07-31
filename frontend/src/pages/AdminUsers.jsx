import { Ban, CheckCircle2, Search, ShieldCheck, UserCog, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import useAuth from "../context/useAuth";
import { userApi } from "../services/api";

const roleOptions = ["", "CUSTOMER", "SELLER", "ADMIN"];
const statusOptions = ["", "ACTIVE", "SUSPENDED"];
const defaultFilters = {
  search: "",
  role: "",
  status: "",
};

const toTitleCase = (value) =>
  String(value || "")
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(" ");

const formatDate = (value) =>
  new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

function AdminUsers() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState(defaultFilters);
  const [loading, setLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState("");
  const [pageError, setPageError] = useState("");

  const loadUsers = async (nextFilters = filters) => {
    setLoading(true);
    setPageError("");

    const response = await userApi.adminList(nextFilters).catch((error) => {
      setPageError(error.message || "Unable to load admin users.");
      return null;
    });

    if (response) {
      setUsers(response.data || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    let cancelled = false;

    if (user?.role !== "ADMIN") {
      return undefined;
    }

    const bootstrapUsers = async () => {
      const response = await userApi.adminList(defaultFilters).catch((error) => {
        if (!cancelled) {
          setPageError(error.message || "Unable to load admin users.");
          setLoading(false);
        }

        return null;
      });

      if (!response || cancelled) {
        return;
      }

      setUsers(response.data || []);
      setLoading(false);
    };

    void bootstrapUsers();

    return () => {
      cancelled = true;
    };
  }, [user?.role]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    const nextFilters = {
      ...filters,
      [name]: value,
    };

    setFilters(nextFilters);
    void loadUsers(nextFilters);
  };

  const handleStatusUpdate = async (targetUserId, nextStatus) => {
    setUpdatingUserId(targetUserId);
    setPageError("");

    const response = await userApi
      .adminUpdateStatus(targetUserId, { status: nextStatus })
      .catch((error) => {
        setPageError(error.message || "Unable to update user status.");
        return null;
      });

    if (response) {
      setUsers((currentUsers) =>
        currentUsers.map((entry) => (entry.id === targetUserId ? response.data : entry)),
      );
    }

    setUpdatingUserId("");
  };

  const stats = useMemo(() => {
    const total = users.length;
    const sellers = users.filter((entry) => entry.role === "SELLER").length;
    const suspended = users.filter((entry) => entry.status === "SUSPENDED").length;
    const active = users.filter((entry) => entry.status === "ACTIVE").length;

    return {
      total,
      sellers,
      suspended,
      active,
    };
  }, [users]);

  if (user?.role !== "ADMIN") {
    return <Navigate to="/dashboard/support" replace />;
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-950 px-6 py-8 text-white shadow-[0_24px_70px_rgba(15,23,42,0.18)] sm:px-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr),360px]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200/80">
              Admin User Control
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              Manage account health across the CampusBasket marketplace.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
              Review customer, seller, and admin accounts from one screen and
              suspend or reactivate access when moderation is needed.
            </p>
          </div>

          <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
              Access Rule
            </p>
            <p className="mt-4 text-lg font-bold text-white">
              Suspended users are blocked from login and protected routes.
            </p>
            <p className="mt-3 text-sm text-slate-400">
              This admin control is now enforced directly inside authentication.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-4">
        {[
          {
            label: "Accounts",
            value: stats.total,
            helper: "Visible under current filters",
            icon: Users,
            accent: "bg-cyan-100 text-cyan-700",
          },
          {
            label: "Active",
            value: stats.active,
            helper: "Accounts currently allowed",
            icon: CheckCircle2,
            accent: "bg-emerald-100 text-emerald-700",
          },
          {
            label: "Suspended",
            value: stats.suspended,
            helper: "Accounts currently blocked",
            icon: Ban,
            accent: "bg-rose-100 text-rose-700",
          },
          {
            label: "Sellers",
            value: stats.sellers,
            helper: "Seller accounts in this view",
            icon: UserCog,
            accent: "bg-amber-100 text-amber-700",
          },
        ].map((card) => {
          const CardIcon = card.icon;

          return (
            <article
              key={card.label}
              className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">{card.label}</p>
                  <p className="mt-3 text-3xl font-black text-slate-950">{card.value}</p>
                </div>
                <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${card.accent}`}>
                  <CardIcon size={22} />
                </span>
              </div>
              <p className="mt-4 text-sm text-slate-500">{card.helper}</p>
            </article>
          );
        })}
      </section>

      <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              User Filters
            </p>
            <h3 className="mt-2 text-2xl font-black text-slate-950">
              Narrow the admin user list
            </h3>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <div className="relative w-full min-w-0 sm:min-w-[260px]">
              <Search
                size={16}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                name="search"
                placeholder="Search name, email, store"
                value={filters.search}
                onChange={handleFilterChange}
                className="w-full rounded-full border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-cyan-400"
              />
            </div>

            <select
              name="role"
              value={filters.role}
              onChange={handleFilterChange}
              className="rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-cyan-400"
            >
              <option value="">All roles</option>
              {roleOptions
                .filter(Boolean)
                .map((role) => (
                  <option key={role} value={role}>
                    {toTitleCase(role)}
                  </option>
                ))}
            </select>

            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-cyan-400"
            >
              <option value="">All statuses</option>
              {statusOptions
                .filter(Boolean)
                .map((status) => (
                  <option key={status} value={status}>
                    {toTitleCase(status)}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </section>

      {pageError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {pageError}
        </div>
      )}

      <section className="grid gap-5 xl:grid-cols-2">
        {loading ? (
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm">
            Loading admin users...
          </div>
        ) : users.length === 0 ? (
          <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <ShieldCheck size={26} />
            </div>
            <h3 className="mt-5 text-2xl font-bold text-slate-950">No users match these filters.</h3>
            <p className="mt-3 text-sm leading-7 text-slate-500">
              Try a different name, email, role, or account status.
            </p>
          </div>
        ) : (
          users.map((entry) => {
            const isSuspended = entry.status === "SUSPENDED";
            const isCurrentAdmin = user?.id === entry.id;

            return (
              <article
                key={entry.id}
                className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                      {toTitleCase(entry.role)}
                    </p>
                    <h3 className="mt-2 text-2xl font-bold text-slate-950">{entry.name}</h3>
                    <p className="mt-2 text-sm text-slate-500">{entry.email}</p>
                    {entry.storeName && (
                      <p className="mt-1 text-sm text-slate-500">{entry.storeName}</p>
                    )}
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${
                      isSuspended
                        ? "bg-rose-100 text-rose-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {toTitleCase(entry.status)}
                  </span>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      Joined
                    </p>
                    <p className="mt-2 text-lg font-bold text-slate-950">
                      {formatDate(entry.createdAt)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      Contact
                    </p>
                    <p className="mt-2 text-lg font-bold text-slate-950">
                      {entry.phone || "Not provided"}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => handleStatusUpdate(entry.id, isSuspended ? "ACTIVE" : "SUSPENDED")}
                    disabled={updatingUserId === entry.id || isCurrentAdmin}
                    className={`rounded-full px-5 py-3 text-sm font-semibold transition ${
                      isSuspended
                        ? "bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                        : "bg-rose-500 text-white hover:bg-rose-400"
                    } disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500`}
                  >
                    {updatingUserId === entry.id
                      ? "Updating..."
                      : isSuspended
                        ? "Reactivate Account"
                        : "Suspend Account"}
                  </button>

                  {isCurrentAdmin && (
                    <span className="rounded-full border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-500">
                      Your current admin account
                    </span>
                  )}
                </div>
              </article>
            );
          })
        )}
      </section>
    </div>
  );
}

export default AdminUsers;
