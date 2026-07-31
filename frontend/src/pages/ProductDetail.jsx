import { Heart, Leaf, ShoppingBag, Star } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import Footer from "../components/Footer";
import useCart from "../context/useCart";
import useWishlist from "../context/useWishlist";
import {
  normalizeCatalogType,
  normalizeProductRecord,
} from "../lib/marketplaceStore";
import {
  getProductFallbackImage,
  getProductImageCandidates,
} from "../lib/productMedia";
import { productApi } from "../services/api";

const formatCurrency = (value) =>
  `GHS ${Number(value || 0).toLocaleString("en-GH")}`;

const formatReviewDate = (value) =>
  new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const buildFallbackFeatures = (product) =>
  [
    product.category ? `${product.category} category` : "",
    `Sustainability score ${product.sustainabilityScore || 80}/100`,
    `Inventory available: ${Number(product.inventory || 0)} units`,
    product.sellerName ? `Sold by ${product.sellerName}` : "",
  ].filter(Boolean);

function ProductDetail() {
  const { productId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [product, setProduct] = useState(null);
  const [activeImage, setActiveImage] = useState("");
  const [visibleGalleryImages, setVisibleGalleryImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    const loadProduct = async () => {
      setLoading(true);
      setLoadError("");

      try {
        const response = await productApi.getById(productId);
        const normalizedProduct = normalizeProductRecord(response.data);
        const initialGallery = getProductImageCandidates(normalizedProduct);
        setProduct(normalizedProduct);
        setVisibleGalleryImages(initialGallery);
        setActiveImage(initialGallery[0] || getProductFallbackImage(normalizedProduct));
      } catch (error) {
        setLoadError(error.message || "Unable to load this product right now.");
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      void loadProduct();
    }
  }, [productId]);

  const selectedMode = useMemo(() => {
    if (!product) {
      return searchParams.get("mode") === "wholesale" ? "wholesale" : "retail";
    }

    const modeFromQuery = searchParams.get("mode");
    const catalogType = normalizeCatalogType(product.catalogType);

    if (catalogType === "wholesale") {
      return "wholesale";
    }

    if (catalogType === "retail") {
      return "retail";
    }

    return modeFromQuery === "wholesale" ? "wholesale" : "retail";
  }, [product, searchParams]);

  const fallbackImage = useMemo(
    () => getProductFallbackImage(product || {}),
    [product],
  );
  const galleryImages = visibleGalleryImages.length > 0 ? visibleGalleryImages : [];
  const displayImage = activeImage || galleryImages[0] || fallbackImage;
  const productFeatures =
    product?.features?.length > 0 ? product.features : buildFallbackFeatures(product || {});
  const reviews = product?.reviews || [];
  const reviewAverage =
    reviews.length > 0
      ? reviews.reduce((sum, review) => sum + (Number(review.rating) || 0), 0) /
        reviews.length
      : Number(product?.rating) || 0;
  const wishlistMode = selectedMode === "wholesale" ? "wholesale" : "retail";
  const wishlistSelected = product ? isInWishlist(product.id, wishlistMode) : false;

  const handleModeChange = (nextMode) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("mode", nextMode);
    setSearchParams(nextParams, { replace: true });
  };

  const handleGalleryImageError = (brokenImage) => {
    setVisibleGalleryImages((currentImages) => {
      const nextImages = currentImages.filter((imageUrl) => imageUrl !== brokenImage);

      setActiveImage((currentActiveImage) => {
        if (currentActiveImage === brokenImage) {
          return nextImages[0] || fallbackImage;
        }

        return currentActiveImage;
      });

      return nextImages;
    });
  };

  if (loading) {
    return (
      <div className="bg-[#f7f7f2] px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.05fr,0.95fr]">
          <div className="space-y-4">
            <div className="h-[320px] animate-pulse rounded-[2rem] bg-slate-200 sm:h-[460px]" />
            <div className="grid grid-cols-3 gap-4 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={`gallery-loading-${index}`}
                  className="h-24 animate-pulse rounded-2xl bg-slate-200"
                />
              ))}
            </div>
          </div>
          <div className="space-y-5 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
            <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
            <div className="h-12 w-3/4 animate-pulse rounded bg-slate-200" />
            <div className="h-20 w-full animate-pulse rounded bg-slate-200" />
            <div className="h-12 w-40 animate-pulse rounded bg-slate-200" />
            <div className="h-28 w-full animate-pulse rounded bg-slate-200" />
          </div>
        </div>
      </div>
    );
  }

  if (loadError || !product) {
    return (
      <div className="bg-[#f7f7f2] px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-rose-200 bg-white p-10 text-center shadow-sm">
          <h1 className="text-3xl font-black text-slate-950">Product unavailable</h1>
          <p className="mt-4 text-base text-slate-600">
            {loadError || "We could not find this product in the catalog."}
          </p>
          <Link
            to="/retail"
            className="mt-6 inline-flex rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Back to storefront
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f7f7f2] text-slate-900">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-4 py-4 text-sm text-slate-500 sm:px-6 sm:py-5">
          <Link to="/" className="transition hover:text-slate-950">
            Home
          </Link>
          <span>/</span>
          <Link
            to={selectedMode === "wholesale" ? "/wholesale" : "/retail"}
            className="transition hover:text-slate-950"
          >
            {selectedMode === "wholesale" ? "Wholesale" : "Retail"}
          </Link>
          <span>/</span>
          <span className="text-slate-950">{product.name}</span>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 sm:py-12 lg:grid-cols-[1.05fr,0.95fr]">
        <div>
          <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
            <img
              src={displayImage}
              alt={product.name}
              onError={() => handleGalleryImageError(displayImage)}
              className="h-[320px] w-full object-cover sm:h-[420px] md:h-[560px]"
            />
          </div>

          {galleryImages.length > 1 && (
            <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-5">
              {galleryImages.map((imageUrl, index) => (
                <button
                  key={`${imageUrl.slice(0, 32)}-${index}`}
                  type="button"
                  onClick={() => setActiveImage(imageUrl)}
                  className={`overflow-hidden rounded-2xl border transition ${
                    activeImage === imageUrl
                      ? "border-slate-950 shadow-sm"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <img
                    src={imageUrl}
                    alt={`${product.name} view ${index + 1}`}
                    onError={() => handleGalleryImageError(imageUrl)}
                    className="h-20 w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              {product.category}
            </span>
            {galleryImages.length > 1 && (
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                {galleryImages.length} gallery views
              </span>
            )}
            <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
              {product.features?.length || productFeatures.length} key features
            </span>
          </div>

          <h1 className="mt-5 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            {product.name}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
            <span className="inline-flex items-center gap-2 text-amber-500">
              <Star size={16} className="fill-amber-400 text-amber-400" />
              {reviewAverage > 0 ? reviewAverage.toFixed(1) : "New"}
            </span>
            <span className="text-slate-500">
              {Number(product.reviewCount || reviews.length)} reviews
            </span>
            <span className="inline-flex items-center gap-2 text-emerald-700">
              <Leaf size={16} />
              Sustainability {product.sustainabilityScore}/100
            </span>
          </div>

          <p className="mt-5 text-base leading-8 text-slate-600">
            {product.description || "No detailed description has been added yet."}
          </p>

          {normalizeCatalogType(product.catalogType) === "all" && (
            <div className="mt-6 inline-flex rounded-full border border-slate-200 bg-slate-50 p-1">
              {["retail", "wholesale"].map((modeOption) => (
                <button
                  key={modeOption}
                  type="button"
                  onClick={() => handleModeChange(modeOption)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    selectedMode === modeOption
                      ? "bg-slate-950 text-white"
                      : "text-slate-600 hover:text-slate-950"
                  }`}
                >
                  {modeOption === "wholesale" ? "Wholesale price" : "Retail price"}
                </button>
              ))}
            </div>
          )}

          <div className="mt-6 rounded-[1.8rem] bg-slate-50 p-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-slate-500">
                  {selectedMode === "wholesale" ? "Wholesale price" : "Retail price"}
                </p>
                <p className="mt-2 text-3xl font-black text-slate-950 sm:text-4xl">
                  {selectedMode === "wholesale"
                    ? formatCurrency(product.wholesalePrice)
                    : formatCurrency(product.retailPrice)}
                </p>
              </div>
              <div className="text-left text-sm text-slate-500 sm:text-right">
                <p>Seller: {product.sellerName}</p>
                <p>
                  {selectedMode === "wholesale"
                    ? `Minimum ${product.minWholesaleQty || 1} units`
                    : `In stock: ${Number(product.inventory || 0)} units`}
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => addToCart(product, selectedMode)}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                <ShoppingBag size={16} />
                Add to Cart
              </button>
              <button
                type="button"
                onClick={() => toggleWishlist(product, selectedMode)}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
              >
                <Heart
                  size={16}
                  className={wishlistSelected ? "fill-rose-500 text-rose-500" : "text-rose-500"}
                />
                {wishlistSelected ? "Saved to wishlist" : "Save to wishlist"}
              </button>
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-xl font-bold text-slate-950">Product features</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {productFeatures.map((feature) => (
                <div
                  key={feature}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700"
                >
                  {feature}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">
                Reviews
              </p>
              <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                Buyer feedback from real orders
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-slate-500">
              Reviews shown here are coming from the backend product record, not a static mock.
            </p>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {reviews.length > 0 ? (
              reviews.map((review) => (
                <article
                  key={review.id}
                  className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-950">{review.customerName}</p>
                    <span className="text-sm text-slate-500">
                      {formatReviewDate(review.createdAt)}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-1 text-amber-500">
                    {[1, 2, 3, 4, 5].map((starNumber) => (
                      <Star
                        key={starNumber}
                        size={14}
                        className={
                          starNumber <= Math.round(Number(review.rating) || 0)
                            ? "fill-amber-400 text-amber-400"
                            : "text-amber-200"
                        }
                      />
                    ))}
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-slate-950">{review.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{review.comment}</p>
                </article>
              ))
            ) : (
              <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-slate-50 p-10 text-center md:col-span-2 xl:col-span-3">
                <h3 className="text-2xl font-bold text-slate-950">
                  No reviews yet for this product
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-500">
                  Once customers complete their orders, review activity will appear here.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default ProductDetail;
