import { Router } from "express";
import {
  createDemoProductMediaSvg,
  getDemoProductByMediaSlug,
} from "../../../../frontend/src/data/dummyProducts.js";
import { formatProductNameFromSlug } from "../../utils/product-helpers.js";

const router = Router();
const allowedViews = new Set(["hero", "angle", "detail"]);

const createCatalogMediaSvg = ({ productSlug, view = "hero" }) => {
  const productName = formatProductNameFromSlug(productSlug);
  const paletteMap = {
    hero: {
      background: "#0f172a",
      accent: "#10b981",
      surface: "#ecfdf5",
      text: "#ffffff",
      badge: "CampusBasket CATALOG",
      note: "Deployment-safe product media",
    },
    angle: {
      background: "#17352a",
      accent: "#d6b25e",
      surface: "#fbf4df",
      text: "#ffffff",
      badge: "ALT VIEW",
      note: "Internal gallery angle",
    },
    detail: {
      background: "#f7f7f2",
      accent: "#d6b25e",
      surface: "#0f172a",
      text: "#0f172a",
      badge: "DETAIL VIEW",
      note: "CampusBasket-owned fallback asset",
    },
  };
  const theme = paletteMap[view] || paletteMap.hero;

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${theme.background}" />
          <stop offset="100%" stop-color="${theme.accent}" />
        </linearGradient>
      </defs>
      <rect width="1200" height="900" fill="url(#bg)" />
      <circle cx="1090" cy="144" r="180" fill="#ffffff" fill-opacity="0.08" />
      <circle cx="130" cy="774" r="220" fill="#ffffff" fill-opacity="0.06" />
      <rect x="82" y="82" width="1036" height="736" rx="54" fill="#ffffff" fill-opacity="0.12" />
      <rect x="132" y="138" width="414" height="528" rx="46" fill="${theme.surface}" fill-opacity="0.86" />
      <rect x="190" y="206" width="298" height="374" rx="34" fill="#ffffff" fill-opacity="0.18" />
      <rect x="634" y="190" width="336" height="42" rx="21" fill="#ffffff" fill-opacity="0.14" />
      <rect x="634" y="266" width="390" height="158" rx="32" fill="#ffffff" fill-opacity="0.1" />
      <rect x="634" y="478" width="242" height="18" rx="9" fill="#ffffff" fill-opacity="0.14" />
      <rect x="634" y="518" width="326" height="18" rx="9" fill="#ffffff" fill-opacity="0.12" />
      <rect x="634" y="586" width="292" height="82" rx="28" fill="${view === "detail" ? "#0f172a" : "rgba(15,23,42,0.8)"}" />
      <text x="160" y="122" font-size="28" font-family="Arial, Helvetica, sans-serif" fill="${theme.text}" fill-opacity="0.88" letter-spacing="8">${theme.badge}</text>
      <text x="634" y="248" font-size="60" font-weight="700" font-family="Arial, Helvetica, sans-serif" fill="${theme.text}">${productName}</text>
      <text x="634" y="492" font-size="28" font-family="Arial, Helvetica, sans-serif" fill="${theme.text}" fill-opacity="0.82">CampusBasket catalog image</text>
      <text x="634" y="640" font-size="32" font-weight="700" font-family="Arial, Helvetica, sans-serif" fill="#ffffff">${theme.note}</text>
    </svg>
  `;
};

const sendSvgResponse = (response, svg, statusCode = 200) => {
  response.status(statusCode);
  response.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
  response.setHeader("Cache-Control", "public, max-age=86400, s-maxage=86400");
  response.send(svg);
};

router.get("/proxy", async (request, response) => {
  const rawUrl = String(request.query.url || "").trim();

  if (!rawUrl) {
    response.status(400).json({
      success: false,
      message: "Image URL is required.",
    });
    return;
  }

  let targetUrl;

  try {
    targetUrl = new URL(rawUrl);
  } catch {
    response.status(400).json({
      success: false,
      message: "Invalid image URL.",
    });
    return;
  }

  if (!["http:", "https:"].includes(targetUrl.protocol)) {
    response.status(400).json({
      success: false,
      message: "Only http and https image URLs are supported.",
    });
    return;
  }

  try {
    const upstreamResponse = await fetch(targetUrl, {
      headers: {
        "User-Agent": "CampusBasket Media Proxy",
        Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      },
    });

    if (!upstreamResponse.ok) {
      response.status(502).json({
        success: false,
        message: "Unable to fetch image from the provided URL.",
      });
      return;
    }

    const contentType = upstreamResponse.headers.get("content-type") || "";

    if (!contentType.toLowerCase().startsWith("image/")) {
      response.status(415).json({
        success: false,
        message: "The provided URL did not return an image.",
      });
      return;
    }

    const imageBuffer = Buffer.from(await upstreamResponse.arrayBuffer());
    response.setHeader("Content-Type", contentType);
    response.setHeader("Cache-Control", "public, max-age=3600, s-maxage=3600");
    response.send(imageBuffer);
  } catch {
    response.status(502).json({
      success: false,
      message: "Unable to load image from the provided URL.",
    });
  }
});

router.get("/catalog/:productSlug/:view.svg", (request, response) => {
  const productSlug = String(request.params.productSlug || "").trim() || "product";
  const view = String(request.params.view || "hero").trim().toLowerCase();

  if (!allowedViews.has(view)) {
    sendSvgResponse(
      response,
      `
        <svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
          <rect width="800" height="600" fill="#0f172a" />
          <text x="80" y="320" font-size="40" font-family="Arial, Helvetica, sans-serif" fill="#ffffff">
            CampusBasket media not found
          </text>
        </svg>
      `,
      404,
    );
    return;
  }

  sendSvgResponse(response, createCatalogMediaSvg({ productSlug, view }));
});

router.get("/products/:mediaSlug/:view.svg", (request, response) => {
  const mediaSlug = String(request.params.mediaSlug || "").trim();
  const view = String(request.params.view || "hero").trim().toLowerCase();
  const product = getDemoProductByMediaSlug(mediaSlug);

  if (!product || !allowedViews.has(view)) {
    sendSvgResponse(
      response,
      `
        <svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
          <rect width="800" height="600" fill="#0f172a" />
          <text x="80" y="320" font-size="40" font-family="Arial, Helvetica, sans-serif" fill="#ffffff">
            CampusBasket media not found
          </text>
        </svg>
      `,
      404,
    );
    return;
  }

  sendSvgResponse(response, createDemoProductMediaSvg(product, view));
});

export default router;
