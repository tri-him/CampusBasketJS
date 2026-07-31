import { Building2, Save, Settings2, Store, UserRound } from "lucide-react";
import { useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import useAuth from "../context/useAuth";

function Settings() {
  const { user, updateProfile } = useAuth();
  const formSourceId = user?.id || user?.email || "guest";
  const baseFormData = useMemo(() => ({
    name: user?.name || "",
    storeName: user?.storeName || "",
    email: user?.email || "",
    phone: user?.phone || "",
    age: user?.age ? String(user.age) : "",
    gender: user?.gender || "",
  }), [user?.age, user?.email, user?.gender, user?.name, user?.phone, user?.storeName]);
  const [formDraft, setFormDraft] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const formData =
    formDraft?.sourceId === formSourceId ? formDraft.values : baseFormData;

  if (user?.role === "ADMIN") {
    return <Navigate to="/dashboard/support" replace />;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormDraft((currentDraft) => ({
      sourceId: formSourceId,
      values: {
        ...(currentDraft?.sourceId === formSourceId ? currentDraft.values : baseFormData),
        [name]: value,
      },
    }));
    setIsSaved(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);

    const savedProfile = await updateProfile({
      name: formData.name.trim(),
      storeName: formData.storeName.trim(),
      phone: formData.phone.trim(),
      age: formData.age ? Number(formData.age) : null,
      gender: formData.gender.trim(),
    });

    if (savedProfile) {
      setFormDraft({
        sourceId: formSourceId,
        values: {
          name: savedProfile.name || "",
          storeName: savedProfile.storeName || "",
          email: savedProfile.email || formData.email,
          phone: savedProfile.phone || "",
          age: savedProfile.age ? String(savedProfile.age) : "",
          gender: savedProfile.gender || "",
        },
      });
      setIsSaved(true);
    }

    setIsSaving(false);
  };

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-slate-950 px-6 py-7 text-white shadow-sm">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr),340px]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-200/80">
              Seller Settings
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-tight">
              Shape how your store appears across CampusBasket.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
              Update your seller identity, keep contact details fresh, and make
              sure the storefront name customers see matches your brand.
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Live storefront
            </p>
            <div className="mt-4 rounded-2xl border border-white/10 bg-black/10 p-4">
              <p className="text-sm text-slate-400">Store name</p>
              <p className="mt-2 text-2xl font-bold text-white">
                {formData.storeName || formData.name || "Seller Store"}
              </p>
              <p className="mt-3 text-sm text-slate-400">{formData.email}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr),360px]">
        <form
          onSubmit={handleSubmit}
          className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-2xl font-bold text-slate-950">
                Store identity
              </h3>
              <p className="mt-2 text-sm leading-7 text-slate-500">
                These details appear in your seller dashboard and across product
                listings tied to your account.
              </p>
            </div>

            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <Settings2 size={22} />
            </span>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">
                Seller name
              </span>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                minLength={2}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-400"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">
                Store name
              </span>
              <input
                type="text"
                name="storeName"
                value={formData.storeName}
                onChange={handleChange}
                minLength={2}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-400"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Email</span>
              <input
                type="email"
                name="email"
                value={formData.email}
                readOnly
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-500 outline-none"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Phone</span>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-400"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Age</span>
              <input
                type="number"
                name="age"
                min="13"
                max="100"
                value={formData.age}
                onChange={handleChange}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-400"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Gender</span>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-400"
              >
                <option value="">Prefer not to say</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </label>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              Customers will see your updated store name on new product and order
              activity going forward.
            </p>

            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              <Save size={16} />
              {isSaving ? "Saving..." : "Save settings"}
            </button>
          </div>

          {isSaved && (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              Seller settings saved successfully.
            </div>
          )}
        </form>

        <div className="space-y-5">
          <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700">
                <Store size={22} />
              </span>
              <div>
                <h3 className="text-lg font-bold text-slate-950">Storefront label</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Keep your public-facing store name easy to recognise.
                </p>
              </div>
            </div>
          </article>

          <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                <Building2 size={22} />
              </span>
              <div>
                <h3 className="text-lg font-bold text-slate-950">Operational contact</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Updated phone details help with fulfilment and support follow-up.
                </p>
              </div>
            </div>
          </article>

          <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                <UserRound size={22} />
              </span>
              <div>
                <h3 className="text-lg font-bold text-slate-950">Seller identity</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Keep your account profile aligned with the business identity you use.
                </p>
              </div>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}

export default Settings;
