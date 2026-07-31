import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Boxes,
  Headphones,
  Quote,
  Star,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
} from "lucide-react";
import useAuth from "../context/useAuth";
import ProductCard from "../components/ProductCard";
import Footer from "../components/Footer";
import BrandLogo from "../components/BrandLogo";
import { getDemoMarketplaceProducts } from "../lib/fastProducts";
import {
  getProductFallbackImage,
  resolveProductMediaUrl,
} from "../lib/productMedia";
import { productApi } from "../services/api";

const features = [
  {
    icon: ShieldCheck,
    title: "Curated Premium Quality",
    description:
      "CampusBasket highlights products that look polished, feel reliable, and are ready for repeat orders.",
  },
  {
    icon: Truck,
    title: "Faster Buying Journey",
    description:
      "From product discovery to checkout, every interaction is designed to reduce friction and build confidence.",
  },
  {
    icon: Headphones,
    title: "Support That Feels Personal",
    description:
      "Customer shopping and seller growth are backed by one clean platform with clear guidance.",
  },
];

const categories = [
  {
    title: "Everyday Retail",
    description:
      "Premium consumer products for personal use, gifting, and quick reorder moments.",
    accent:
      "from-[color:rgba(16,185,129,0.18)] via-[var(--color-brand-ivory-soft)] to-white",
    to: "/retail",
    cta: "Shop retail essentials",
  },
  {
    title: "Business Wholesale",
    description:
      "Bulk-ready products for stores, cafes, workspaces, and procurement teams.",
    accent:
      "from-[color:rgba(214,178,94,0.22)] via-[var(--color-brand-ivory-soft)] to-white",
    to: "/wholesale",
    cta: "Open wholesale catalog",
  },
  {
    title: "Eco Lifestyle",
    description:
      "Modern sustainable products that make premium shelves feel more conscious and contemporary.",
    accent:
      "from-[color:rgba(15,23,42,0.08)] via-[var(--color-brand-ivory-soft)] to-white",
    to: "/retail?category=Fashion%20and%20Accessories",
    cta: "View style edit",
  },
];

const steps = [
  {
    title: "Browse",
    description:
      "Discover premium collections across retail and wholesale-ready categories.",
  },
  {
    title: "Compare",
    description:
      "Review clean pricing, bulk options, product details, and buyer-friendly presentation.",
  },
  {
    title: "Checkout",
    description:
      "Move through cart, shipping, and payment in a smooth and trustworthy flow.",
  },
  {
    title: "Grow",
    description:
      "Sellers can later expand with dashboard tools while customers continue enjoying a refined storefront.",
  },
];

const testimonials = [
  {
    quote:
      "This feels less like a student project and more like a real marketplace brand. The buying journey is much clearer.",
    name: "Riya Mehta",
    role: "Retail Customer",
  },
  {
    quote:
      "Wholesale shopping is easier when the experience feels premium instead of cluttered. CampusBasket gets that part right.",
    name: "Karan Malhotra",
    role: "Procurement Manager",
  },
  {
    quote:
      "The platform creates a stronger first impression for both shoppers and sellers, which matters a lot for trust.",
    name: "Ananya Verma",
    role: "Brand Consultant",
  },
];

const heroSlides = [
  {
    id: "hero-1",
    image: "/product-images/eco-bamboo-bottle-platform-optimized.webp",
    badge: "Retail Spotlight",
    title: "Premium product visuals that feel ready to shop.",
    description:
      "A stronger hero gallery helps visitors understand the marketplace from the first second.",
  },
  {
    id: "hero-2",
    image: "/product-images/organic-cotton-tote-platform.jpg",
    badge: "Lifestyle Edit",
    title: "Multiple hero images make the storefront feel more alive.",
    description:
      "Rotating images create a polished brand feel instead of relying on a single static banner.",
  },
  {
    id: "hero-3",
    image: "/product-images/co-working-desk-kit-platform.jpg",
    badge: "Business Ready",
    title: "Show retail and wholesale buying in one premium first view.",
    description:
      "The landing page now highlights more than one buying scenario so the marketplace feels broader.",
  },
  {
    id: "hero-4",
    image: "/product-images/cotton-waffle-towel-set-platform.jpg",
    badge: "Curated Quality",
    title: "Large photography gives shoppers more confidence to explore.",
    description:
      "A clean slider keeps the page elegant while still giving the hero section more visual variety.",
  },
];

const formatStatValue = (value) => Number(value || 0).toLocaleString("en-IN");
const normalizeLandingProduct = (product) => ({
  ...product,
  image: resolveProductMediaUrl(product.image || product.imageUrl || ""),
});
const normalizeLandingReview = (review) => ({
  ...review,
  product: review.product
    ? {
        ...review.product,
        image: resolveProductMediaUrl(
          review.product.image || review.product.imageUrl || "",
        ),
      }
    : null,
});
const getFallbackLandingData = () => {
  const products = getDemoMarketplaceProducts();

  return {
    stats: [
      { value: products.length, label: "Live products" },
      {
        value: new Set(products.map((product) => product.sellerName)).size,
        label: "Seller brands",
      },
      { value: 0, label: "Orders placed" },
      { value: 0, label: "Customer reviews" },
    ],
    featuredProducts: products.slice(0, 6),
    recentReviews: [],
  };
};
const formatReviewDate = (value) =>
  new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [landingStats, setLandingStats] = useState(
    () => getFallbackLandingData().stats,
  );
  const [featuredProducts, setFeaturedProducts] = useState(
    () => getFallbackLandingData().featuredProducts,
  );
  const [recentReviews, setRecentReviews] = useState(
    () => getFallbackLandingData().recentReviews,
  );
  const [landingLoading, setLandingLoading] = useState(false);
  const [activeHeroSlide, setActiveHeroSlide] = useState(0);
  const featuredSectionRef = useRef(null);
  const reviewsSectionRef = useRef(null);

  useEffect(() => {
    if (user) {
      return;
    }

    const loadLandingData = async () => {
      const response = await productApi.landingHighlights().catch(() => null);

      if (response?.data) {
        setLandingStats(response.data.stats || []);
        setFeaturedProducts(
          (response.data.featuredProducts || []).map(normalizeLandingProduct),
        );
        setRecentReviews(
          (response.data.recentReviews || []).map(normalizeLandingReview),
        );
      }

      setLandingLoading(false);
    };

    void loadLandingData();
  }, [user]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveHeroSlide((currentSlide) => (currentSlide + 1) % heroSlides.length);
    }, 3600);

    return () => window.clearInterval(interval);
  }, []);

  const handleStatClick = (label) => {
    if (label === "Live products") {
      navigate("/retail");
      return;
    }

    if (label === "Seller brands") {
      navigate("/wholesale");
      return;
    }

    if (label === "Orders placed") {
      featuredSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      return;
    }

    reviewsSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };
  const visibleReviews = recentReviews.slice(0, 2);
  const reviewPlaceholders = Array.from({
    length: Math.max(0, 2 - visibleReviews.length),
  });
  const currentHeroSlide = heroSlides[activeHeroSlide] || heroSlides[0];

  if (user) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="bg-[var(--color-brand-ivory)] text-[var(--color-brand-slate)]">
      <section className="relative overflow-hidden border-b border-[color:rgba(214,178,94,0.18)] bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.2),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(214,178,94,0.18),_transparent_28%),linear-gradient(180deg,var(--color-brand-ivory-soft)_0%,var(--color-brand-ivory)_100%)]">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:gap-14 sm:px-6 sm:py-20 lg:grid-cols-[1.08fr,0.92fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[color:rgba(214,178,94,0.32)] bg-[color:rgba(255,255,255,0.85)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.26em] text-[var(--color-brand-champagne-deep)] shadow-sm">
              <Sparkles size={14} />
              Modern premium commerce
            </div>

            <div className="mt-6">
              <BrandLogo theme="light" />
            </div>

            <h1 className="mt-7 max-w-3xl text-[2.55rem] font-black leading-[1.12] tracking-tight text-[var(--color-brand-slate)] sm:mt-8 sm:text-5xl sm:leading-tight md:text-6xl">
              One premium marketplace for retail shoppers and wholesale buyers.
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--color-brand-muted)] sm:mt-6 sm:text-lg sm:leading-8">
              CampusBasket combines premium presentation, elegant product discovery,
              and clean checkout into a storefront that feels professional from
              the first scroll to the final purchase.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
              <Link
                to="/retail"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,var(--color-brand-slate)_0%,#1f2937_100%)] px-6 py-3 text-sm font-semibold text-white shadow-[0_16px_32px_rgba(15,23,42,0.14)] transition hover:brightness-105"
              >
                Shop Retail
                <ArrowRight size={16} />
              </Link>
              <Link
                to="/wholesale"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[color:rgba(214,178,94,0.34)] bg-white px-6 py-3 text-sm font-semibold text-[var(--color-brand-slate)] transition hover:bg-[color:rgba(244,234,209,0.45)]"
              >
                Explore Wholesale
                <Boxes size={16} />
              </Link>
            </div>

            <div className="mt-8 grid gap-4 sm:mt-10 sm:grid-cols-3">
              {(landingStats.slice(0, 3).length > 0
                ? landingStats.slice(0, 3)
                : [
                    { value: 0, label: "Live products" },
                    { value: 0, label: "Seller brands" },
                    { value: 0, label: "Orders placed" },
                  ]
              ).map((item) => (
                <button
                  type="button"
                  key={item.label}
                  onClick={() => handleStatClick(item.label)}
                  className="rounded-2xl border border-white/80 bg-[color:rgba(255,255,255,0.92)] p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[color:rgba(214,178,94,0.28)] hover:shadow-lg"
                >
                  <p className="text-2xl font-black text-[var(--color-brand-slate)]">
                    {landingLoading ? "..." : formatStatValue(item.value)}
                  </p>
                  <p className="mt-1 text-sm text-[var(--color-brand-muted)]">{item.label}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute left-0 top-10 h-24 w-24 rounded-full bg-[color:rgba(16,185,129,0.2)] blur-3xl sm:-left-6" />
            <div className="absolute -right-3 bottom-10 h-28 w-28 rounded-full bg-[color:rgba(214,178,94,0.26)] blur-3xl" />

            <div className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-white/95 p-5 shadow-[0_28px_70px_rgba(15,23,42,0.12)]">
              <div className="relative h-[420px] overflow-hidden rounded-[1.6rem] bg-[color:rgba(244,234,209,0.25)]">
                {heroSlides.map((slide, index) => (
                  <div
                    key={slide.id}
                    className={`absolute inset-0 transition-all duration-700 ${
                      index === activeHeroSlide
                        ? "translate-x-0 opacity-100"
                        : "translate-x-6 opacity-0"
                    }`}
                  >
                    <img
                      src={slide.image}
                      alt={slide.title}
                      loading={index === 0 ? "eager" : "lazy"}
                      fetchPriority={index === 0 ? "high" : "auto"}
                      decoding="async"
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/55 via-slate-950/12 to-transparent" />
                  </div>
                ))}

                <div className="absolute bottom-6 left-6 right-6 flex flex-col gap-4 sm:bottom-8 sm:left-8 sm:right-8">
                  <div className="max-w-md rounded-3xl border border-white/25 bg-white/18 p-5 shadow-xl backdrop-blur-md">
                    <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[var(--color-brand-champagne-soft)]">
                      {currentHeroSlide.badge}
                    </p>
                    <h3 className="mt-2 text-xl font-bold text-white">
                      {currentHeroSlide.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-white/82">
                      {currentHeroSlide.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    {heroSlides.map((slide, index) => (
                      <button
                        key={`${slide.id}-dot`}
                        type="button"
                        onClick={() => setActiveHeroSlide(index)}
                        aria-label={`Show hero slide ${index + 1}`}
                        className={`h-2.5 rounded-full transition ${
                          index === activeHeroSlide
                            ? "w-10 bg-white"
                            : "w-2.5 bg-white/45 hover:bg-white/70"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-black tracking-tight text-[var(--color-brand-slate)] sm:text-4xl md:text-5xl">
            Features
          </h2>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <div
                key={feature.title}
                className="rounded-[1.75rem] border border-[color:rgba(15,23,42,0.08)] bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:border-[color:rgba(214,178,94,0.22)] hover:shadow-xl"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,var(--color-brand-emerald-soft)_0%,var(--color-brand-champagne-soft)_100%)] text-[var(--color-brand-emerald-deep)]">
                  <Icon size={22} />
                </div>
                <h3 className="mt-5 text-xl font-bold text-[var(--color-brand-slate)]">
                  {feature.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-[var(--color-brand-muted)]">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="border-y border-[color:rgba(214,178,94,0.18)] bg-white/75">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-black tracking-tight text-[var(--color-brand-slate)] sm:text-4xl md:text-5xl">
              Categories
            </h2>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {categories.map((category) => (
              <Link
                key={category.title}
                to={category.to}
                className={`group rounded-[1.8rem] border border-[color:rgba(15,23,42,0.08)] bg-gradient-to-br ${category.accent} p-6 shadow-sm transition hover:-translate-y-1 hover:border-[color:rgba(214,178,94,0.22)] hover:shadow-xl sm:p-8`}
              >
                <h3 className="text-2xl font-black text-[var(--color-brand-slate)]">
                  {category.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-[var(--color-brand-muted)]">
                  {category.description}
                </p>
                <p className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-brand-slate)] transition group-hover:text-[var(--color-brand-emerald-deep)]">
                  {category.cta}
                  <ArrowRight size={15} />
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section ref={featuredSectionRef} className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-black tracking-tight text-[var(--color-brand-slate)] sm:text-4xl md:text-5xl">
            Featured Products
          </h2>
        </div>

        <div className="mt-12 grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
          {featuredProducts.length > 0
            ? featuredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  mode="retail"
                  variant="featured"
                />
              ))
            : Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={`featured-skeleton-${index}`}
                  className="overflow-hidden rounded-[1.8rem] border border-[color:rgba(15,23,42,0.08)] bg-white shadow-sm"
                >
                  <div className="h-56 animate-pulse bg-[color:rgba(244,234,209,0.35)]" />
                  <div className="space-y-4 p-5">
                    <div className="h-6 w-3/4 animate-pulse rounded bg-[color:rgba(244,234,209,0.45)]" />
                    <div className="h-4 w-full animate-pulse rounded bg-[color:rgba(244,234,209,0.35)]" />
                    <div className="h-4 w-5/6 animate-pulse rounded bg-[color:rgba(244,234,209,0.35)]" />
                    <div className="h-10 w-full animate-pulse rounded-full bg-[color:rgba(217,244,231,0.55)]" />
                  </div>
                </div>
              ))}
        </div>
      </section>

      <section ref={reviewsSectionRef} className="border-y border-[color:rgba(214,178,94,0.18)] bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-black tracking-tight text-[var(--color-brand-slate)] sm:text-4xl">
              Verified Reviews
            </h2>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            {visibleReviews.map((review) => (
              <article
                key={review.id}
                className="rounded-[1.8rem] border border-[color:rgba(15,23,42,0.08)] bg-[linear-gradient(180deg,var(--color-brand-ivory-soft)_0%,#ffffff_100%)] p-6 shadow-sm"
              >
                <div className="flex items-start gap-4">
                  <img
                    src={
                      review.product?.image ||
                      getProductFallbackImage({
                        name: review.productName,
                        category: review.product?.category || "Marketplace product",
                      })
                    }
                    alt={review.productName}
                    onError={(event) => {
                      event.currentTarget.src = getProductFallbackImage({
                        name: review.productName,
                        category: review.product?.category || "Marketplace product",
                      });
                    }}
                    className="h-16 w-16 rounded-2xl object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[var(--color-brand-slate)]">
                      {review.customerName}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[var(--color-brand-muted)]">
                      {formatReviewDate(review.createdAt)}
                    </p>
                    <div className="mt-2 flex items-center gap-1 text-amber-500">
                      {[1, 2, 3, 4, 5].map((starNumber) => (
                        <Star
                          key={`${review.id}-${starNumber}`}
                          size={14}
                          className={
                            starNumber <= Math.round(Number(review.rating) || 0)
                              ? "fill-amber-400 text-amber-400"
                              : "text-amber-200"
                          }
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <h3 className="mt-5 text-lg font-bold text-[var(--color-brand-slate)]">
                  {review.title}
                </h3>
                <p className="mt-3 line-clamp-4 text-sm leading-7 text-[var(--color-brand-muted)]">
                  {review.comment}
                </p>

                <div className="mt-5 rounded-2xl border border-[color:rgba(214,178,94,0.18)] bg-white p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-brand-muted)]">
                    Reviewed product
                  </p>
                  <p className="mt-2 font-semibold text-[var(--color-brand-slate)]">
                    {review.productName}
                  </p>
                  <p className="mt-1 text-sm text-[var(--color-brand-muted)]">
                    {review.product?.category || "Marketplace product"}
                  </p>
                  <Link
                    to={`/products/${review.productId}`}
                    className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-brand-emerald-deep)] transition hover:text-[var(--color-brand-slate)]"
                  >
                    Open product
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </article>
            ))}

            {reviewPlaceholders.map((_, index) => (
              <div
                key={`review-placeholder-${index}`}
                className="rounded-[1.8rem] border border-dashed border-[color:rgba(214,178,94,0.36)] bg-[linear-gradient(180deg,var(--color-brand-ivory-soft)_0%,#ffffff_100%)] p-6 shadow-sm"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-[var(--color-brand-champagne-deep)]">
                    <Quote size={24} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[var(--color-brand-slate)]">
                      Next verified review
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[var(--color-brand-muted)]">
                      Will appear after the next completed order
                    </p>
                  </div>
                </div>

                <p className="mt-5 text-sm leading-7 text-[var(--color-brand-muted)]">
                  This section fills with real customer reviews as more orders are completed and reviewed on CampusBasket.
                </p>

                <div className="mt-5 rounded-2xl border border-[color:rgba(214,178,94,0.18)] bg-white p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-brand-muted)]">
                    Trust signal
                  </p>
                  <p className="mt-2 font-semibold text-[var(--color-brand-slate)]">
                    Reviews are connected to actual delivered orders
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-[color:rgba(214,178,94,0.18)] bg-white/75">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-black tracking-tight text-[var(--color-brand-slate)] sm:text-4xl md:text-5xl">
              How It Works
            </h2>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="rounded-[1.75rem] border border-[color:rgba(15,23,42,0.08)] bg-[linear-gradient(180deg,var(--color-brand-ivory-soft)_0%,#ffffff_100%)] p-7 shadow-sm"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--color-brand-slate)_0%,var(--color-brand-champagne-deep)_100%)] text-sm font-bold text-white">
                  0{index + 1}
                </div>
                <h3 className="mt-5 text-xl font-bold text-[var(--color-brand-slate)]">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-[var(--color-brand-muted)]">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-black tracking-tight text-[var(--color-brand-slate)] sm:text-4xl">
            Testimonials
          </h2>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {testimonials.map((item) => (
            <div
              key={item.name}
              className="rounded-[1.8rem] border border-[color:rgba(15,23,42,0.08)] bg-white p-7 shadow-sm"
            >
              <Quote size={28} className="text-[var(--color-brand-champagne)]" />
              <p className="mt-5 leading-8 text-[var(--color-brand-muted)]">{item.quote}</p>
              <div className="mt-6">
                <p className="font-semibold text-[var(--color-brand-slate)]">{item.name}</p>
                <p className="text-sm text-[var(--color-brand-muted)]">{item.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-[color:rgba(214,178,94,0.18)] bg-[linear-gradient(180deg,var(--color-brand-ivory-soft)_0%,#ffffff_100%)]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-black tracking-tight text-[var(--color-brand-slate)] sm:text-4xl md:text-5xl">
              Statistics
            </h2>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {(landingStats.length > 0
              ? landingStats
              : [
                  { value: 0, label: "Live products" },
                  { value: 0, label: "Seller brands" },
                  { value: 0, label: "Orders placed" },
                  { value: 0, label: "Customer reviews" },
                ]
            ).map((stat) => (
              <button
                type="button"
                key={stat.label}
                onClick={() => handleStatClick(stat.label)}
                className="rounded-[1.75rem] border border-[color:rgba(15,23,42,0.08)] bg-white p-7 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-[color:rgba(214,178,94,0.28)] hover:shadow-lg"
              >
                <p className="text-3xl font-black tracking-tight text-[var(--color-brand-slate)] sm:text-4xl">
                  {landingLoading ? "..." : formatStatValue(stat.value)}
                </p>
                <p className="mt-3 text-sm uppercase tracking-[0.2em] text-[var(--color-brand-muted)]">
                  {stat.label}
                </p>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="overflow-hidden rounded-[2rem] border border-[color:rgba(214,178,94,0.22)] bg-[linear-gradient(135deg,var(--color-brand-slate)_0%,#162235_62%,#17352a_100%)] px-6 py-10 text-white shadow-[0_24px_60px_rgba(15,23,42,0.18)] sm:px-8 sm:py-12 lg:px-12">
          <div className="grid gap-10 lg:grid-cols-[1.1fr,0.9fr] lg:items-center">
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--color-brand-champagne-soft)]">
                Newsletter
              </p>
              <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
                Stay ahead of launches, offers, and premium buying insights
              </h2>
            </div>

            <div className="rounded-[1.8rem] border border-white/10 bg-[color:rgba(255,255,255,0.06)] p-6 backdrop-blur">
              <div className="space-y-4">
                <input
                  type="email"
                  placeholder="Enter your email address"
                  className="w-full rounded-full border border-white/10 bg-white/10 px-5 py-3 text-sm text-white outline-none placeholder:text-[color:rgba(255,255,255,0.45)] focus:border-[var(--color-brand-champagne)]"
                />
                <button className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,var(--color-brand-emerald)_0%,#34d399_100%)] px-5 py-3 text-sm font-semibold text-[var(--color-brand-slate)] transition hover:brightness-105">
                  Subscribe Now
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default Landing;
