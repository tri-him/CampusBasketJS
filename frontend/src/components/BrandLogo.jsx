import { Leaf, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";

function BrandLogo({
  to = "/",
  compact = false,
  onClick,
  theme = "dark",
  showTagline = true,
  className = "",
}) {
  const darkTheme = theme === "dark";
  const titleClass = darkTheme ? "text-white" : "text-[var(--color-brand-slate)]";
  const subtitleClass = darkTheme
    ? "text-[color:rgba(244,234,209,0.8)]"
    : "text-[var(--color-brand-muted)]";

  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex min-w-0 shrink-0 items-center gap-3 ${className}`}
    >
      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(145deg,var(--color-brand-slate)_0%,var(--color-brand-emerald)_58%,var(--color-brand-champagne)_100%)] text-white shadow-[0_18px_36px_rgba(15,23,42,0.24)]">
        <ShoppingBag size={compact ? 16 : 18} strokeWidth={2.3} />
        <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border border-[color:rgba(214,178,94,0.38)] bg-[var(--color-brand-ivory-soft)] text-[var(--color-brand-emerald-deep)] shadow-sm">
          <Leaf size={11} strokeWidth={2.4} />
        </div>
      </div>

      <div className="min-w-0">
        <p
          className={`truncate font-black uppercase tracking-[0.16em] sm:tracking-[0.22em] ${titleClass} ${
            compact ? "text-sm" : "text-base"
          }`}
        >
          CampusBasket
        </p>
        {showTagline && (
          <p
            className={`hidden uppercase tracking-[0.24em] min-[380px]:block ${subtitleClass} ${
              compact ? "text-[9px]" : "text-[10px]"
            }`}
          >
            Premium Marketplace
          </p>
        )}
      </div>
    </Link>
  );
}

export default BrandLogo;
