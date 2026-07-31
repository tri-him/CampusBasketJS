import slugify from "slugify";

const PRODUCT_MEDIA_VIEWS = ["hero", "angle", "detail"];
const MEDIA_PROXY_PATH = "/api/media/proxy";

export const normalizeCatalogType = (value = "ALL") => {
  const normalizedValue = String(value).trim().toUpperCase();

  if (["RETAIL", "WHOLESALE", "ALL"].includes(normalizedValue)) {
    return normalizedValue;
  }

  return "ALL";
};

export const buildProductSlug = (name) => {
  const baseSlug = slugify(name, {
    lower: true,
    strict: true,
    trim: true,
  });

  return `${baseSlug || "product"}-${Date.now().toString().slice(-6)}`;
};

export const formatProductNameFromSlug = (value = "") =>
  String(value)
    .trim()
    .replace(/-\d{6}$/, "")
    .split("-")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ") || "CampusBasket Product";

export const buildCatalogMediaPath = (productSlug = "product", view = "hero") =>
  `/api/media/catalog/${String(productSlug || "product").trim() || "product"}/${view}.svg`;

export const buildCatalogMediaGallery = (productSlug = "product") =>
  PRODUCT_MEDIA_VIEWS.map((view) => buildCatalogMediaPath(productSlug, view));

export const buildMediaProxyPath = (value = "") =>
  `${MEDIA_PROXY_PATH}?url=${encodeURIComponent(String(value || "").trim())}`;

export const isGeneratedCatalogMediaUrl = (value = "") =>
  String(value || "").trim().includes("/api/media/catalog/");

export const isSafeProductMediaUrl = (value = "") => {
  const normalizedValue = String(value || "").trim();

  if (!normalizedValue) {
    return false;
  }

  if (normalizedValue.startsWith("/api/media/")) {
    return true;
  }

  if (normalizedValue.startsWith("/")) {
    return true;
  }

  if (/^https?:\/\//i.test(normalizedValue)) {
    return true;
  }

  return /^data:image\//i.test(normalizedValue);
};

export const normalizeStoredProductMediaUrl = (value = "") => {
  const normalizedValue = String(value || "").trim();

  if (!isSafeProductMediaUrl(normalizedValue)) {
    return "";
  }

  if (/^https?:\/\//i.test(normalizedValue)) {
    return buildMediaProxyPath(normalizedValue);
  }

  return normalizedValue;
};

export const normalizeProductMediaUrls = ({
  productSlug = "product",
  image = "",
  gallery = [],
}) => {
  const fallbackGallery = buildCatalogMediaGallery(productSlug);
  const safeGallery = Array.from(
    new Set(
      [image, ...(Array.isArray(gallery) ? gallery : [])]
        .map(normalizeStoredProductMediaUrl)
        .filter(Boolean),
    ),
  );
  const userProvidedGallery = safeGallery.filter(
    (value) => !isGeneratedCatalogMediaUrl(value),
  );

  if (userProvidedGallery.length === 0) {
    return {
      imageUrl: fallbackGallery[0],
      galleryUrls: fallbackGallery,
    };
  }

  return {
    imageUrl: userProvidedGallery[0],
    galleryUrls: userProvidedGallery,
  };
};
