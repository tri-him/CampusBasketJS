import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");
const imageOutputDir = path.join(repoRoot, "frontend", "public", "product-images");
const manifestPath = path.join(repoRoot, "frontend", "src", "data", "productImageManifest.js");
const attributionPath = path.join(imageOutputDir, "ATTRIBUTIONS.md");

const productImageTargets = [
  {
    slug: "eco-bamboo-bottle-platform",
    name: "Eco Bamboo Bottle",
    queries: ["bamboo water bottle", "reusable bamboo bottle"],
  },
  {
    slug: "organic-cotton-bag-platform",
    name: "Organic Cotton Bag",
    queries: ["organic cotton tote bag", "canvas shopping tote"],
  },
  {
    slug: "wooden-cutlery-set-platform",
    name: "Wooden Cutlery Set",
    queries: ["wooden cutlery set", "wooden utensils set"],
  },
  {
    slug: "smoke-product-1775322771308-771738",
    name: "Smoke Product",
    queries: ["incense sticks smoke", "incense holder smoke"],
  },
  {
    slug: "jacket-497317",
    name: "Jacket",
    queries: ["fashion jacket clothing", "casual jacket"],
  },
  {
    slug: "bag-709422",
    name: "Bag",
    queries: ["fashion handbag", "shoulder bag"],
  },
  {
    slug: "organic-cotton-tote-platform",
    name: "Organic Cotton Tote",
    queries: ["organic cotton tote bag", "eco tote bag"],
  },
  {
    slug: "stoneware-serve-bowl-platform",
    name: "Stoneware Serve Bowl",
    queries: ["stoneware serving bowl", "ceramic serving bowl"],
  },
  {
    slug: "soy-candle-trio-platform",
    name: "Soy Candle Trio",
    queries: ["soy candle set", "decorative candles set"],
  },
  {
    slug: "matcha-ceramic-mug-platform",
    name: "Matcha Ceramic Mug",
    queries: ["ceramic mug", "tea mug ceramic"],
  },
  {
    slug: "linen-desk-organizer-platform",
    name: "Linen Desk Organizer",
    queries: ["desk organizer tray", "workspace organizer"],
  },
  {
    slug: "glass-pantry-jar-set-platform",
    name: "Glass Pantry Jar Set",
    queries: ["glass pantry jars", "kitchen storage jars"],
  },
  {
    slug: "travel-journal-kit-platform",
    name: "Travel Journal Kit",
    queries: ["travel journal notebook", "journal kit"],
  },
  {
    slug: "cotton-waffle-towel-set-platform",
    name: "Cotton Waffle Towel Set",
    queries: ["waffle towel set", "bath towel set"],
  },
  {
    slug: "botanical-reed-diffuser-platform",
    name: "Botanical Reed Diffuser",
    queries: ["reed diffuser bottle", "aroma diffuser reeds"],
  },
  {
    slug: "minimalist-table-lamp-platform",
    name: "Minimalist Table Lamp",
    queries: ["minimalist table lamp", "modern bedside lamp"],
  },
  {
    slug: "compostable-cup-carton-platform",
    name: "Compostable Cup Carton",
    queries: ["paper cups carton", "coffee cup pack"],
  },
  {
    slug: "hotel-slipper-kit-platform",
    name: "Hotel Slipper Kit",
    queries: ["hotel slippers", "spa slippers"],
  },
  {
    slug: "restaurant-napkin-bundle-platform",
    name: "Restaurant Napkin Bundle",
    queries: ["restaurant napkins", "table napkins"],
  },
  {
    slug: "boutique-hanger-set-platform",
    name: "Boutique Hanger Set",
    queries: ["clothes hangers", "boutique hangers"],
  },
  {
    slug: "corporate-welcome-box-platform",
    name: "Corporate Welcome Box",
    queries: ["corporate gift box", "welcome gift box"],
  },
  {
    slug: "bamboo-cutlery-bulk-pack-platform",
    name: "Bamboo Cutlery Bulk Pack",
    queries: ["bamboo cutlery set", "bamboo utensils"],
  },
  {
    slug: "office-snack-pantry-box-platform",
    name: "Office Snack Pantry Box",
    queries: ["snack box assortment", "office snacks"],
  },
  {
    slug: "amenity-bottle-refill-set-platform",
    name: "Amenity Bottle Refill Set",
    queries: ["refillable amenity bottles", "bathroom amenity bottles"],
  },
  {
    slug: "retail-display-basket-set-platform",
    name: "Retail Display Basket Set",
    queries: ["display basket set", "retail baskets"],
  },
  {
    slug: "wellness-studio-towel-pack-platform",
    name: "Wellness Studio Towel Pack",
    queries: ["spa towels stack", "salon towels"],
  },
  {
    slug: "artisan-soap-bar-tray-platform",
    name: "Artisan Soap Bar Tray",
    queries: ["artisan soap bars", "soap tray display"],
  },
  {
    slug: "co-working-desk-kit-platform",
    name: "Co-working Desk Kit",
    queries: ["desk stationery kit", "workspace desk accessories"],
  },
  {
    slug: "marble-coaster-set-platform",
    name: "Marble Coaster Set",
    queries: ["marble coaster set", "stone coasters"],
  },
  {
    slug: "canvas-storage-bin-platform",
    name: "Canvas Storage Bin",
    queries: ["canvas storage bin", "fabric storage basket"],
  },
  {
    slug: "event-table-runner-pack-platform",
    name: "Event Table Runner Pack",
    queries: ["table runner event", "dining table runner"],
  },
];

const userAgent = "CampusBasketProductImageBot/1.0 (+https://CampusBasket.local)";

const sanitizeText = (value = "") =>
  String(value || "")
    .replace(/\r?\n/g, " ")
    .replace(/\|/g, "\\|")
    .trim();

const detectFileExtension = (contentType = "", url = "") => {
  const normalizedType = String(contentType || "").toLowerCase();

  if (normalizedType.includes("jpeg") || normalizedType.includes("jpg")) {
    return "jpg";
  }

  if (normalizedType.includes("png")) {
    return "png";
  }

  if (normalizedType.includes("webp")) {
    return "webp";
  }

  if (normalizedType.includes("gif")) {
    return "gif";
  }

  const urlWithoutQuery = String(url || "").split("?")[0];
  const detectedExtension = path.extname(urlWithoutQuery).replace(".", "").toLowerCase();

  return detectedExtension || "jpg";
};

const searchOpenverse = async (query) => {
  const searchUrl = new URL("https://api.openverse.org/v1/images/");
  searchUrl.searchParams.set("q", query);
  searchUrl.searchParams.set("page_size", "12");
  searchUrl.searchParams.set("license_type", "commercial");
  searchUrl.searchParams.set("mature", "false");

  const response = await fetch(searchUrl, {
    headers: {
      "User-Agent": userAgent,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Openverse search failed with status ${response.status}.`);
  }

  const payload = await response.json();
  return Array.isArray(payload.results) ? payload.results : [];
};

const downloadImageBuffer = async (url) => {
  const response = await fetch(url, {
    headers: {
      "User-Agent": userAgent,
      Accept: "image/*,*/*;q=0.8",
    },
  });

  if (!response.ok) {
    throw new Error(`Image download failed with status ${response.status}.`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return {
    buffer: Buffer.from(arrayBuffer),
    contentType: response.headers.get("content-type") || "",
    finalUrl: response.url || url,
  };
};

const pickCandidate = (results = []) =>
  results.find((result) => result.thumbnail || result.url) || null;

const clearExistingFiles = async (slug) => {
  const existingFiles = await readdir(imageOutputDir).catch(() => []);
  const staleFiles = existingFiles.filter((fileName) =>
    fileName.startsWith(`${slug}.`),
  );

  await Promise.all(
    staleFiles.map((fileName) => rm(path.join(imageOutputDir, fileName), { force: true })),
  );
};

const fetchProductImage = async (target) => {
  for (const query of target.queries) {
    const results = await searchOpenverse(query);
    const candidate = pickCandidate(results);

    if (!candidate) {
      continue;
    }

    const sourceUrl = candidate.url || candidate.thumbnail;
    const thumbnailUrl = candidate.thumbnail || candidate.url;

    for (const mediaUrl of [sourceUrl, thumbnailUrl]) {
      if (!mediaUrl) {
        continue;
      }

      try {
        const { buffer, contentType, finalUrl } = await downloadImageBuffer(mediaUrl);
        const extension = detectFileExtension(contentType, finalUrl);
        const fileName = `${target.slug}.${extension}`;
        await clearExistingFiles(target.slug);
        await writeFile(path.join(imageOutputDir, fileName), buffer);

        return {
          localPath: `/product-images/${fileName}`,
          attribution: {
            productName: target.name,
            query,
            title: sanitizeText(candidate.title || target.name),
            creator: sanitizeText(candidate.creator || "Unknown creator"),
            license: sanitizeText(
              [candidate.license, candidate.license_version].filter(Boolean).join(" ") ||
                "Unknown license",
            ),
            provider: sanitizeText(candidate.source || "Openverse"),
            landingPage: candidate.foreign_landing_url || candidate.url || "",
          },
        };
      } catch {
        // Try the next media URL or next search query.
      }
    }
  }

  throw new Error(`No downloadable image found for ${target.name}.`);
};

const writeManifest = async (manifestEntries) => {
  const orderedEntries = Object.keys(manifestEntries)
    .sort()
    .map((slug) => `  "${slug}": ${JSON.stringify(manifestEntries[slug])},`)
    .join("\n");

  const contents = `const productImageManifest = {\n${orderedEntries}\n};\n\nexport default productImageManifest;\n`;
  await writeFile(manifestPath, contents);
};

const writeAttributionFile = async (attributions) => {
  const rows = attributions
    .map(
      (item) =>
        `| ${item.productName} | ${item.title} | ${item.creator} | ${item.license} | ${item.provider} | ${item.landingPage ? `[Source](${item.landingPage})` : ""} |`,
    )
    .join("\n");

  const contents = `# CampusBasket Product Image Attributions\n\nThese local product photos were downloaded from the Openverse catalog of openly licensed images. Please verify licenses before commercial use.\n\n| Product | Work | Creator | License | Provider | Link |\n| --- | --- | --- | --- | --- | --- |\n${rows}\n`;
  await writeFile(attributionPath, contents);
};

const run = async () => {
  await mkdir(imageOutputDir, { recursive: true });

  const manifestEntries = {};
  const attributions = [];

  for (const target of productImageTargets) {
    const result = await fetchProductImage(target);
    manifestEntries[target.slug] = [result.localPath];
    attributions.push(result.attribution);
    console.log(`Downloaded product image for ${target.name} -> ${result.localPath}`);
  }

  await writeManifest(manifestEntries);
  await writeAttributionFile(attributions);

  console.log(`Downloaded ${Object.keys(manifestEntries).length} product images.`);
};

run().catch((error) => {
  console.error("Failed to fetch product images:", error);
  process.exitCode = 1;
});
