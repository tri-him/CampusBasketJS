import { ArrowRight, CheckCircle2, ChevronLeft, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { AUTH_VARIANTS } from "./authTheme";

function AuthShell({
  variant = "customer",
  badge,
  title,
  description,
  formTitle,
  formDescription,
  highlights = [],
  stats = [],
  alternateQuestion,
  alternateText,
  alternateTo,
  children,
}) {
  const theme = AUTH_VARIANTS[variant] || AUTH_VARIANTS.customer;

  return (
    <div className={`min-h-screen px-4 py-4 sm:py-6 sm:px-6 lg:px-8 ${theme.surface}`}>
      <div className="mx-auto flex max-w-7xl items-center justify-end pb-4 sm:pb-6">
        <Link
          to="/"
          className="inline-flex shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white/85 px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-white hover:text-slate-950 min-[380px]:px-4"
        >
          <ChevronLeft size={16} />
          Back to Store
        </Link>
      </div>

      {/* Mobile: form-first layout (like Flipkart). Desktop: side-by-side */}
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[minmax(0,1.05fr),520px]">

        {/* Form section — appears FIRST on mobile, SECOND on desktop */}
        <section className="order-1 lg:order-2 rounded-[1.75rem] sm:rounded-[2.25rem] border border-slate-200 bg-white p-5 shadow-[0_30px_80px_rgba(15,23,42,0.12)] sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                Secure Access
              </p>
              <h2 className="mt-2 text-2xl font-black text-slate-950 sm:text-3xl">
                {formTitle}
              </h2>
              <p className="mt-2 text-sm leading-7 text-slate-500 sm:mt-3">
                {formDescription}
              </p>
            </div>

            <div
              className={`hidden h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${theme.panel} text-slate-950 sm:flex`}
            >
              <ArrowRight size={20} />
            </div>
          </div>

          <div className="mt-6 sm:mt-8">{children}</div>

          <p className="mt-5 text-center text-sm text-slate-500 sm:mt-6">
            {alternateQuestion}{" "}
            <Link
              to={alternateTo}
              className={`font-semibold ${variant === "seller" ? "text-amber-700 hover:text-amber-800" : "text-cyan-700 hover:text-cyan-800"}`}
            >
              {alternateText}
            </Link>
          </p>
        </section>

        {/* Info section — hidden on mobile, visible on desktop (like Flipkart) */}
        <section className="order-2 lg:order-1 hidden lg:block overflow-hidden rounded-[2.25rem] border border-white/80 bg-white/78 p-6 text-slate-950 shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur sm:p-8">
          <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] ${theme.badge}`}>
            <ShieldCheck size={14} />
            {badge}
          </div>

          <h1 className="mt-6 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">
            {title}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
            {description}
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-3xl border border-slate-200 bg-white/85 p-4 shadow-sm"
              >
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  {stat.label}
                </p>
                <p className="mt-2 text-2xl font-black text-slate-950">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 grid gap-4 xl:grid-cols-2">
            {highlights.map((highlight) => (
              <div
                key={highlight.title}
                className="rounded-[1.75rem] border border-slate-200 bg-white/82 p-5 shadow-sm"
              >
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-2xl ${theme.icon}`}
                >
                  <highlight.icon size={20} />
                </div>
                <h2 className="mt-4 text-lg font-bold text-slate-950">
                  {highlight.title}
                </h2>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  {highlight.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-[1.75rem] border border-slate-200 bg-white/85 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              CampusBasket Promise
            </p>
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-3 text-sm text-slate-700">
                <CheckCircle2 size={16} className={theme.accentText} />
                Premium storefront and account experience
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-700">
                <CheckCircle2 size={16} className={theme.accentText} />
                Live accounts, orders, and support synced with CampusBasket backend
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-700">
                <CheckCircle2 size={16} className={theme.accentText} />
                Built for trust, speed, and clear user journeys
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default AuthShell;
