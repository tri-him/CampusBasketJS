import { apiBaseUrl } from "../services/api";

const encodeSvg = (svg) =>
  `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;

const hashString = (value = "") =>
  String(value)
    .split("")
    .reduce((total, character) => total + character.charCodeAt(0), 0);

const palettes = [
  ["#0f172a", "#10b981", "#ecfdf5"],
  ["#7c2d12", "#f59e0b", "#fff7ed"],
  ["#1e1b4b", "#818cf8", "#eef2ff"],
  ["#134e4a", "#2dd4bf", "#f0fdfa"],
  ["#581c87", "#d946ef", "#fdf4ff"],
];

const resolvePalette = (name = "") => palettes[hashString(name) % palettes.length];
const apiOrigin = apiBaseUrl.replace(/\/api\/?$/, "");
const mediaProxyPath = "/api/media/proxy";
const mediaVariantMarker = "::CampusBasket-view=";
const buildRemoteImageProxyUrl = (value) =>
  `${apiOrigin}/api/media/proxy?url=${encodeURIComponent(value)}`;

const parseMediaUrl = (value = "") => {
  const rawValue = String(value || "").trim();

  if (!rawValue) {
    return null;
  }

  try {
    if (rawValue.startsWith("/")) {
      return new URL(rawValue, apiOrigin);
    }

    return new URL(rawValue);
  } catch {
    return null;
  }
};

export const createProductPlaceholder = ({
  name = "CampusBasket Product",
  category = "Premium catalog",
} = {}) => {
  const [background, accent, surface] = resolvePalette(name);

  return encodeSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${background}" />
          <stop offset="100%" stop-color="${accent}" />
        </linearGradient>
      </defs>
      <rect width="1200" height="900" fill="url(#bg)" />
      <rect x="100" y="96" width="1000" height="708" rx="52" fill="#ffffff" fill-opacity="0.16" />
      <rect x="160" y="166" width="360" height="430" rx="40" fill="${surface}" fill-opacity="0.42" />
      <rect x="610" y="208" width="320" height="42" rx="21" fill="#ffffff" fill-opacity="0.16" />
      <rect x="610" y="286" width="404" height="156" rx="30" fill="#ffffff" fill-opacity="0.12" />
      <text x="610" y="510" font-size="58" font-weight="700" font-family="Arial, Helvetica, sans-serif" fill="#ffffff">${name}</text>
      <text x="610" y="568" font-size="28" font-family="Arial, Helvetica, sans-serif" fill="#ffffff" fill-opacity="0.82">${category}</text>
      <text x="610" y="648" font-size="32" font-weight="700" font-family="Arial, Helvetica, sans-serif" fill="#ffffff">Image refreshed by CampusBasket</text>
    </svg>
  `);
};

export const getProductFallbackImage = (product = {}) =>
  createProductPlaceholder({
    name: product.name || "CampusBasket Product",
    category: product.category || "Premium catalog",
  });

export const resolveProductMediaUrl = (value = "") => {
  const url = String(value || "").trim();

  if (!url) {
    return "";
  }

  if (url.startsWith("/api/")) {
    return `${apiOrigin}${url}`;
  }

  if (url.startsWith(apiOrigin)) {
    return url;
  }

  if (/^https?:\/\//i.test(url)) {
    return buildRemoteImageProxyUrl(url);
  }

  return url;
};

export const getEditableProductMediaUrl = (value = "") => {
  const url = String(value || "").trim();

  if (!url) {
    return "";
  }

  const parsedUrl = parseMediaUrl(url);

  if (!parsedUrl) {
    return url;
  }

  if (parsedUrl.pathname === mediaProxyPath) {
    return parsedUrl.searchParams.get("url") || url;
  }

  return url;
};

export const isGeneratedCatalogMediaUrl = (value = "") => {
  const url = String(value || "").trim();

  if (!url) {
    return false;
  }

  return url.includes("/api/media/catalog/");
};

export const getProductMediaBaseUrl = (value = "") =>
  String(value || "").trim().split(mediaVariantMarker)[0] || "";

export const getProductMediaVariant = (value = "") => {
  const url = String(value || "").trim();

  if (!url.includes(mediaVariantMarker)) {
    return "primary";
  }

  return url.split(mediaVariantMarker)[1] || "primary";
};


export const getProductGalleryEntries = (product = {}) => {
  const rawEntries = Array.from(
    new Set(
      [product.image, ...(product.gallery || [])]
        .map((value) => String(value || "").trim())
        .filter(Boolean),
    ),
  );

  // Only return real product images — filter out generated catalog placeholders
  return rawEntries.filter((entry) => !isGeneratedCatalogMediaUrl(entry));
};

export const getProductMediaPresentation = (value = "") => {
  const variant = getProductMediaVariant(value);

  if (variant === "angle") {
    return {
      objectPosition: "22% center",
      transform: "scale(1.08)",
    };
  }

  if (variant === "detail") {
    return {
      objectPosition: "78% center",
      transform: "scale(1.14)",
    };
  }

  return {
    objectPosition: "center",
    transform: "scale(1)",
  };
};

export const getProductImageCandidates = (product = {}) =>
  Array.from(
    new Set(
      [product.image, ...(product.gallery || [])]
        .map((value) => resolveProductMediaUrl(value))
        .filter(Boolean)
        .filter((url) => !isGeneratedCatalogMediaUrl(url)),
    ),
  );
