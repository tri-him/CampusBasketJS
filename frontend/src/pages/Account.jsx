import {
  Heart,
  LifeBuoy,
  MapPin,
  MessageSquare,
  Package,
  PencilLine,
  Plus,
  ShoppingCart,
  Sparkles,
  Trash2,
  UserCircle2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import useCustomerAuth from "../context/useCustomerAuth";
import useWishlist from "../context/useWishlist";
import {
  getOrders,
  getSupportChatsForEmail,
  getSupportTicketsForEmail,
  syncOrders,
  syncSupportChats,
  syncSupportTickets,
} from "../lib/marketplaceStore";
import { userApi } from "../services/api";

const emptyAddressForm = {
  label: "Home",
  fullName: "",
  phone: "",
  addressLine: "",
  city: "",
  state: "",
  pincode: "",
};

const formatCurrency = (value) =>
  `Rs.${Number(value || 0).toLocaleString("en-IN")}`;

function Account() {
  const { customer, updateCustomerProfile } = useCustomerAuth();
  const { wishlistItems, wishlistCount } = useWishlist();
  const customerEmail = customer?.email || "";
  const profileSourceId = customer?.id || customer?.email || "guest";
  const baseProfileForm = useMemo(() => ({
    name: customer?.name || "",
    email: customer?.email || "",
    age: customer?.age || "",
    gender: customer?.gender || "",
    phone: customer?.phone || "",
  }), [customer?.age, customer?.email, customer?.gender, customer?.name, customer?.phone]);
  const [profileDraft, setProfileDraft] = useState(null);
  const [profileSaved, setProfileSaved] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [addressForm, setAddressForm] = useState(emptyAddressForm);
  const [, setRefreshKey] = useState(0);
  const profileForm =
    profileDraft?.sourceId === profileSourceId ? profileDraft.values : baseProfileForm;

  useEffect(() => {
    const loadAccountData = async () => {
      if (!customerEmail) {
        setAddresses([]);
        return;
      }

      await Promise.all([
        syncOrders(customerEmail),
        syncSupportTickets(customerEmail),
        syncSupportChats(customerEmail),
      ]);

      const response = await userApi.listAddresses().catch(() => ({ data: [] }));
      setAddresses(response.data || []);
      setRefreshKey((current) => current + 1);
    };

    if (customer) {
      void loadAccountData();
    }
  }, [customer, customerEmail]);
  const orders = useMemo(
    () =>
      getOrders()
        .filter((order) => {
          const orderEmail = order.customer?.email || order.shipping?.email || "";
          return customerEmail
            ? orderEmail.toLowerCase() === customerEmail.toLowerCase()
            : false;
        })
        .sort(
          (firstOrder, secondOrder) =>
            new Date(secondOrder.date) - new Date(firstOrder.date),
        ),
    [customerEmail],
  );
  const supportTickets = useMemo(
    () => getSupportTicketsForEmail(customerEmail),
    [customerEmail],
  );
  const supportChats = useMemo(
    () => getSupportChatsForEmail(customerEmail),
    [customerEmail],
  );

  const openTickets = supportTickets.filter(
    (ticket) => ticket.status !== "Resolved",
  ).length;
  const activeChats = supportChats.filter(
    (chat) => !["Resolved", "Closed"].includes(chat.status),
  ).length;
  const totalSpend = orders.reduce(
    (sum, order) => sum + (Number(order.amount) || 0),
    0,
  );

  const handleProfileChange = (event) => {
    const { name, value } = event.target;

    setProfileDraft((currentDraft) => ({
      sourceId: profileSourceId,
      values: {
        ...(currentDraft?.sourceId === profileSourceId ? currentDraft.values : baseProfileForm),
        [name]: value,
      },
    }));
    setProfileSaved(false);
  };

  const handleProfileSave = async (event) => {
    event.preventDefault();

    const success = await updateCustomerProfile({
      name: profileForm.name.trim(),
      age: profileForm.age ? Number(profileForm.age) : null,
      gender: profileForm.gender,
      phone: profileForm.phone.trim(),
    });

    if (success) {
      setProfileDraft(null);
      setProfileSaved(true);
    }
  };

  const handleAddressChange = (event) => {
    const { name, value } = event.target;

    setAddressForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  };

  const handleAddressSave = async (event) => {
    event.preventDefault();

    if (!customerEmail) {
      return;
    }

    const response = await userApi.createAddress(addressForm).catch((error) => {
      alert(error.message || "Unable to save address.");
      return null;
    });

    if (!response) {
      return;
    }

    setAddresses((currentAddresses) => [response.data, ...currentAddresses]);
    setAddressForm({
      ...emptyAddressForm,
      fullName: customer?.name || "",
      phone: profileForm.phone || "",
    });
  };

  const handleAddressDelete = async (addressId) => {
    const deleted = await userApi.deleteAddress(addressId).then(() => true).catch((error) => {
      alert(error.message || "Unable to delete address.");
      return false;
    });

    if (!deleted) {
      return;
    }

    setAddresses((currentAddresses) =>
      currentAddresses.filter((address) => address.id !== addressId),
    );
  };

  if (!customer) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_rgba(14,165,233,0.08),_transparent_24%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_52%,_#f8fafc_100%)] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-10">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 text-slate-500">
            <UserCircle2 size={32} />
          </div>
          <h1 className="mt-6 text-3xl font-black text-slate-950 sm:text-4xl">
            Sign in to open your account hub.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-500">
            Once you log in, this page will bring together your profile, address
            book, orders, wishlist, and customer support activity in one place.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/account/login"
              className="rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              User Login
            </Link>
            <Link
              to="/account/register"
              className="rounded-full bg-cyan-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_rgba(14,165,233,0.08),_transparent_24%),radial-gradient(circle_at_bottom_left,_rgba(244,114,182,0.08),_transparent_28%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_52%,_#f8fafc_100%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-950 px-6 py-8 text-white shadow-[0_30px_80px_rgba(15,23,42,0.18)] sm:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200/80">
                My Account
              </p>
              <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                Welcome back, {customer.name}.
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
                Manage your profile, saved addresses, wishlist, orders, and support
                activity from one premium customer hub.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Orders
                </p>
                <p className="mt-2 text-2xl font-bold">{orders.length}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Wishlist
                </p>
                <p className="mt-2 text-2xl font-bold">{wishlistCount}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Open Tickets
                </p>
                <p className="mt-2 text-2xl font-bold">{openTickets}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Active Chats
                </p>
                <p className="mt-2 text-2xl font-bold">{activeChats}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.05fr),380px]">
          <div className="space-y-6">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700">
                  <UserCircle2 size={24} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                    Profile Details
                  </p>
                  <h2 className="mt-2 text-3xl font-black text-slate-950">
                    Customer profile
                  </h2>
                </div>
              </div>

              <form onSubmit={handleProfileSave} className="mt-8 space-y-5">
                <div className="grid gap-5 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-slate-700">
                      Full Name
                    </span>
                    <input
                      type="text"
                      name="name"
                      value={profileForm.name}
                      onChange={handleProfileChange}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-cyan-400"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-slate-700">
                      Email
                    </span>
                    <input
                      type="email"
                      name="email"
                      value={profileForm.email}
                      readOnly
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-500 outline-none"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-slate-700">
                      Age
                    </span>
                    <input
                      type="number"
                      name="age"
                      value={profileForm.age}
                      onChange={handleProfileChange}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-cyan-400"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-slate-700">
                      Gender
                    </span>
                    <select
                      name="gender"
                      value={profileForm.gender}
                      onChange={handleProfileChange}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-cyan-400"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </label>
                </div>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-slate-700">
                    Phone Number
                  </span>
                  <input
                    type="tel"
                    name="phone"
                    value={profileForm.phone}
                    onChange={handleProfileChange}
                    placeholder="Add a contact number"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-cyan-400"
                  />
                </label>

                <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="inline-flex items-center gap-2 text-sm text-slate-600">
                    <PencilLine size={16} className="text-cyan-600" />
                    Keep your profile updated for smoother checkout and support.
                  </div>
                  <button className="rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
                    Save Profile
                  </button>
                </div>
              </form>

              {profileSaved && (
                <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  Profile saved successfully.
                </div>
              )}
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                  <MapPin size={24} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                    Saved Addresses
                  </p>
                  <h2 className="mt-2 text-3xl font-black text-slate-950">
                    Address book
                  </h2>
                </div>
              </div>

              <form onSubmit={handleAddressSave} className="mt-8 space-y-5">
                <div className="grid gap-5 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-slate-700">
                      Label
                    </span>
                    <select
                      name="label"
                      value={addressForm.label}
                      onChange={handleAddressChange}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-400"
                    >
                      <option value="Home">Home</option>
                      <option value="Work">Work</option>
                      <option value="Warehouse">Warehouse</option>
                    </select>
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-slate-700">
                      Full Name
                    </span>
                    <input
                      type="text"
                      name="fullName"
                      value={addressForm.fullName}
                      onChange={handleAddressChange}
                      placeholder="Receiver name"
                      required
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-400"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-slate-700">
                      Phone
                    </span>
                    <input
                      type="tel"
                      name="phone"
                      value={addressForm.phone}
                      onChange={handleAddressChange}
                      placeholder="Phone number"
                      required
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-400"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-slate-700">
                      Pincode
                    </span>
                    <input
                      type="text"
                      name="pincode"
                      value={addressForm.pincode}
                      onChange={handleAddressChange}
                      placeholder="Postal code"
                      required
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-400"
                    />
                  </label>
                </div>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-slate-700">
                    Address Line
                  </span>
                  <input
                    type="text"
                    name="addressLine"
                    value={addressForm.addressLine}
                    onChange={handleAddressChange}
                    placeholder="Street, area, building"
                    required
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-400"
                  />
                </label>

                <div className="grid gap-5 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-slate-700">
                      City
                    </span>
                    <input
                      type="text"
                      name="city"
                      value={addressForm.city}
                      onChange={handleAddressChange}
                      placeholder="City"
                      required
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-400"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-slate-700">
                      State
                    </span>
                    <input
                      type="text"
                      name="state"
                      value={addressForm.state}
                      onChange={handleAddressChange}
                      placeholder="State"
                      required
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-400"
                    />
                  </label>
                </div>

                <button className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400">
                  <Plus size={16} />
                  Save Address
                </button>
              </form>

              <div className="mt-8 grid gap-4 md:grid-cols-2">
                {addresses.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-sm leading-7 text-slate-500 md:col-span-2">
                    No saved addresses yet. Add one here to make future checkout faster.
                  </div>
                ) : (
                  addresses.map((address) => (
                    <article
                      key={address.id}
                      className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          {address.label}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleAddressDelete(address.id)}
                          className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-rose-300 hover:text-rose-600"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                      <p className="mt-4 text-base font-semibold text-slate-950">
                        {address.fullName || address.name}
                      </p>
                      <p className="mt-2 text-sm leading-7 text-slate-600">
                        {address.addressLine}, {address.city}, {address.state},{" "}
                        {address.pincode}
                      </p>
                      <p className="mt-2 text-sm text-slate-500">{address.phone}</p>
                    </article>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                Account Snapshot
              </p>
              <h2 className="mt-2 text-2xl font-black text-slate-950">
                Live customer overview
              </h2>
              <div className="mt-5 space-y-3">
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    Total Spend
                  </p>
                  <p className="mt-2 text-xl font-bold text-slate-950">
                    {formatCurrency(totalSpend)}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    Wishlist Items
                  </p>
                  <p className="mt-2 text-xl font-bold text-slate-950">
                    {wishlistCount}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    Saved Addresses
                  </p>
                  <p className="mt-2 text-xl font-bold text-slate-950">
                    {addresses.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                Quick Access
              </p>
              <h2 className="mt-2 text-2xl font-black text-slate-950">
                Your shopping and support shortcuts
              </h2>
              <div className="mt-5 space-y-3">
                <Link
                  to="/wishlist"
                  className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <span className="inline-flex items-center gap-2">
                    <Heart size={16} className="text-rose-500" />
                    Wishlist
                  </span>
                  <span>{wishlistCount}</span>
                </Link>
                <Link
                  to="/orders"
                  className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <span className="inline-flex items-center gap-2">
                    <Package size={16} className="text-cyan-600" />
                    Orders
                  </span>
                  <span>{orders.length}</span>
                </Link>
                <Link
                  to="/support"
                  className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <span className="inline-flex items-center gap-2">
                    <LifeBuoy size={16} className="text-amber-600" />
                    Support Tickets
                  </span>
                  <span>{openTickets}</span>
                </Link>
                <Link
                  to="/support/chat"
                  className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <span className="inline-flex items-center gap-2">
                    <MessageSquare size={16} className="text-emerald-600" />
                    Support Chat
                  </span>
                  <span>{activeChats}</span>
                </Link>
                <Link
                  to="/cart"
                  className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <span className="inline-flex items-center gap-2">
                    <ShoppingCart size={16} className="text-slate-700" />
                    Cart
                  </span>
                  <span>Open</span>
                </Link>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                Recent Activity
              </p>
              <h2 className="mt-2 text-2xl font-black text-slate-950">
                Latest account signals
              </h2>
              <div className="mt-5 space-y-4">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    Latest Order
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-950">
                    {orders[0]?.id || "No orders yet"}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {orders[0]
                      ? `${formatCurrency(orders[0].amount)} | ${orders[0].shipping?.city || "CampusBasket"}`
                      : "Place your first order to start building history."}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    Latest Saved Product
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-950">
                    {wishlistItems[0]?.product?.name || "No saved products yet"}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {wishlistItems[0]
                      ? `${wishlistItems[0].mode} mode saved for later`
                      : "Use the heart icon on products to build your shortlist."}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    Support Overview
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-950">
                    {openTickets + activeChats > 0
                      ? `${openTickets} open tickets and ${activeChats} active chats`
                      : "No active support issues"}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Customer service history stays visible here for quick follow-up.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </section>
      </div>
    </div>
  );
}

export default Account;
