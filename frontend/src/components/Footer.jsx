import { Link } from "react-router-dom";
import { ArrowRight, Mail, Phone, ShieldCheck, Truck } from "lucide-react";
import BrandLogo from "./BrandLogo";

function Footer() {
  return (
    <footer className="border-t border-[color:rgba(214,178,94,0.24)] bg-[linear-gradient(180deg,var(--color-brand-ivory-soft)_0%,#ffffff_100%)]">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-[1.3fr,1fr,1fr,1fr]">
        <div>
          <BrandLogo theme="light" />
          <p className="mt-5 max-w-sm text-sm leading-6 text-[var(--color-brand-muted)]">
            CampusBasket helps modern shoppers discover premium everyday products
            while giving sellers a smarter way to grow retail and wholesale
            revenue.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm text-[var(--color-brand-muted)]">
            <span className="inline-flex items-center gap-2 rounded-full border border-[color:rgba(16,185,129,0.18)] bg-white px-3 py-2 shadow-sm">
              <ShieldCheck size={15} className="text-[var(--color-brand-emerald-deep)]" />
              Secure checkout
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-[color:rgba(214,178,94,0.22)] bg-white px-3 py-2 shadow-sm">
              <Truck size={15} className="text-[var(--color-brand-champagne-deep)]" />
              Fast delivery
            </span>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--color-brand-slate)]">
            Explore
          </h3>
          <div className="mt-5 space-y-3 text-sm text-[var(--color-brand-muted)]">
            <Link to="/retail" className="block transition hover:text-[var(--color-brand-emerald-deep)]">
              Retail Shopping
            </Link>
            <Link
              to="/wholesale"
              className="block transition hover:text-[var(--color-brand-champagne-deep)]"
            >
              Wholesale Deals
            </Link>
            <Link to="/orders" className="block transition hover:text-[var(--color-brand-emerald-deep)]">
              Order Tracking
            </Link>
            <Link to="/cart" className="block transition hover:text-[var(--color-brand-emerald-deep)]">
              Cart and Checkout
            </Link>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--color-brand-slate)]">
            Sellers
          </h3>
          <div className="mt-5 space-y-3 text-sm text-[var(--color-brand-muted)]">
            <Link to="/register" className="block transition hover:text-[var(--color-brand-champagne-deep)]">
              Register Store
            </Link>
            <Link to="/login" className="block transition hover:text-[var(--color-brand-champagne-deep)]">
              Seller Login
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 font-medium text-[var(--color-brand-champagne-deep)] transition hover:text-[var(--color-brand-slate)]"
            >
              Seller Dashboard
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--color-brand-slate)]">
            Contact
          </h3>
          <div className="mt-5 space-y-3 text-sm text-[var(--color-brand-muted)]">
            <p className="inline-flex items-center gap-2">
              <Mail size={15} className="text-[var(--color-brand-champagne-deep)]" />
              support@CampusBasket.com
            </p>
            <p className="inline-flex items-center gap-2">
              <Phone size={15} className="text-[var(--color-brand-champagne-deep)]" />
              +91 98765 43210
            </p>
            <p>Mon - Sat, 9:00 AM to 7:00 PM</p>
          </div>
        </div>
      </div>

      <div className="border-t border-[color:rgba(214,178,94,0.2)] px-6 py-5 text-center text-sm text-[var(--color-brand-muted)]">
        Copyright 2026 CampusBasket. Crafted for premium retail and wholesale commerce.
      </div>
    </footer>
  );
}

export default Footer;
