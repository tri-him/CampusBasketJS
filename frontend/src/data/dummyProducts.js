import productImageManifest from "./productImageManifest.js";

const toMediaSlug = (value = "") =>
  String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const buildMediaPath = (mediaSlug, view) =>
  `/api/media/products/${mediaSlug}/${view}.svg`;

const buildGallery = (mediaSlug) => [
  buildMediaPath(mediaSlug, "hero"),
  buildMediaPath(mediaSlug, "angle"),
  buildMediaPath(mediaSlug, "detail"),
];

const getLocalGallery = (mediaSlug) =>
  Array.from(
    new Set([
      ...(productImageManifest[mediaSlug] || []),
      ...(productImageManifest[`${mediaSlug}-platform`] || []),
    ]),
  ).filter(Boolean);

export const createDemoProductMediaSvg = (product, view = "hero") => {
  const [background, accent, surface] = product.palette || [
    "#0f172a",
    "#10b981",
    "#ecfdf5",
  ];
  const notes = Array.isArray(product.galleryNotes) ? product.galleryNotes : [];
  const subtitleMap = {
    hero: notes[0] || "CampusBasket catalog preview",
    angle: notes[1] || notes[0] || "Alternate view",
    detail: notes[2] || notes[1] || "Detail preview",
  };
  const styleMap = {
    hero: { bg: background, accent, surface, text: "#ffffff" },
    angle: { bg: accent, accent: surface, surface: background, text: "#ffffff" },
    detail: { bg: surface, accent: background, surface: accent, text: "#0f172a" },
  };
  const style = styleMap[view] || styleMap.hero;
  const badgeMap = {
    hero: "CampusBasket HERO",
    angle: "PRODUCT ANGLE",
    detail: "DETAIL VIEW",
  };

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${style.bg}" />
          <stop offset="100%" stop-color="${style.accent}" />
        </linearGradient>
        <linearGradient id="panel" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${style.surface}" stop-opacity="0.94" />
          <stop offset="100%" stop-color="#ffffff" stop-opacity="0.78" />
        </linearGradient>
      </defs>
      <rect width="1200" height="900" fill="url(#bg)" />
      <circle cx="1030" cy="120" r="150" fill="#ffffff" fill-opacity="0.08" />
      <circle cx="170" cy="740" r="200" fill="#ffffff" fill-opacity="0.06" />
      <rect x="84" y="92" width="1032" height="716" rx="52" fill="url(#panel)" />
      <rect x="134" y="146" width="400" height="500" rx="42" fill="${style.accent}" fill-opacity="0.18" />
      <rect x="184" y="206" width="300" height="380" rx="34" fill="#ffffff" fill-opacity="0.24" />
      <rect x="650" y="174" width="280" height="44" rx="22" fill="#ffffff" fill-opacity="0.14" />
      <rect x="650" y="244" width="388" height="164" rx="32" fill="#ffffff" fill-opacity="0.1" />
      <rect x="650" y="446" width="188" height="18" rx="9" fill="#ffffff" fill-opacity="0.16" />
      <rect x="650" y="486" width="330" height="18" rx="9" fill="#ffffff" fill-opacity="0.12" />
      <rect x="650" y="526" width="288" height="18" rx="9" fill="#ffffff" fill-opacity="0.12" />
      <rect x="650" y="590" width="260" height="78" rx="26" fill="${style.bg}" fill-opacity="0.82" />
      <rect x="930" y="590" width="134" height="78" rx="26" fill="#ffffff" fill-opacity="0.14" />
      <text x="170" y="124" font-size="30" font-family="Arial, Helvetica, sans-serif" fill="${style.text}" fill-opacity="0.88" letter-spacing="8">${badgeMap[view] || badgeMap.hero}</text>
      <text x="650" y="230" font-size="62" font-weight="700" font-family="Arial, Helvetica, sans-serif" fill="${style.text}">${product.name}</text>
      <text x="650" y="486" font-size="28" font-family="Arial, Helvetica, sans-serif" fill="${style.text}" fill-opacity="0.84">${product.category}</text>
      <text x="650" y="648" font-size="34" font-weight="700" font-family="Arial, Helvetica, sans-serif" fill="#ffffff">${subtitleMap[view]}</text>
    </svg>
  `;
};

const rawProducts = [
  {
    id: 1,
    name: "Eco Bamboo Bottle",
    description: "Reusable insulated bottle designed for premium everyday hydration.",
    category: "Personal Care",
    catalogType: "retail",
    retailPrice: 499,
    wholesalePrice: 350,
    minWholesaleQty: 12,
    inventory: 320,
    palette: ["#0f766e", "#14b8a6", "#e6fffb"],
    galleryNotes: ["Travel ready finish", "Insulated all day", "Minimal premium profile"],
    sustainabilityScore: 94,
    features: ["Leak-safe cap", "Double-wall steel", "Desk and travel ready"],
  },
  {
    id: 2,
    name: "Organic Cotton Tote",
    description: "A modern reusable carry bag with a clean sustainable finish.",
    category: "Fashion and Accessories",
    catalogType: "retail",
    retailPrice: 329,
    wholesalePrice: 210,
    minWholesaleQty: 18,
    inventory: 260,
    palette: ["#7c5e3a", "#d6b25e", "#fbf4df"],
    galleryNotes: ["Everyday carry look", "Soft structured handles", "Premium shelf appeal"],
    sustainabilityScore: 89,
    features: ["Organic cotton weave", "Roomy daily capacity", "Easy fold design"],
  },
  {
    id: 3,
    name: "Stoneware Serve Bowl",
    description: "Elegant stoneware bowl for salads, fruit, and elevated table settings.",
    category: "Home and Kitchen",
    catalogType: "retail",
    retailPrice: 699,
    wholesalePrice: 480,
    minWholesaleQty: 10,
    inventory: 180,
    palette: ["#334155", "#64748b", "#f8fafc"],
    galleryNotes: ["Refined dining table mood", "Hand-finished curves", "Neutral premium glaze"],
    sustainabilityScore: 84,
    features: ["Stoneware body", "Serveware centerpiece", "Microwave safe"],
  },
  {
    id: 4,
    name: "Soy Candle Trio",
    description: "Three slow-burning fragrances packaged for gifting and calm home corners.",
    category: "Home Decor",
    catalogType: "retail",
    retailPrice: 899,
    wholesalePrice: 620,
    minWholesaleQty: 8,
    inventory: 140,
    palette: ["#4c1d95", "#8b5cf6", "#f3e8ff"],
    galleryNotes: ["Warm evening glow", "Gift-ready presentation", "Layered fragrance blend"],
    sustainabilityScore: 86,
    features: ["Soy wax blend", "Three scent collection", "Gift-ready box"],
  },
  {
    id: 5,
    name: "Matcha Ceramic Mug",
    description: "Textured ceramic mug made for premium tea rituals and slow mornings.",
    category: "Home and Kitchen",
    catalogType: "retail",
    retailPrice: 549,
    wholesalePrice: 360,
    minWholesaleQty: 12,
    inventory: 210,
    palette: ["#166534", "#22c55e", "#ecfdf5"],
    galleryNotes: ["Cafe-inspired profile", "Comfort grip handle", "Tabletop display ready"],
    sustainabilityScore: 82,
    features: ["Textured ceramic finish", "Balanced handle", "Heat-friendly glaze"],
  },
  {
    id: 6,
    name: "Linen Desk Organizer",
    description: "Soft-touch organizer tray for notes, accessories, and workspace calm.",
    category: "Office Essentials",
    catalogType: "retail",
    retailPrice: 629,
    wholesalePrice: 430,
    minWholesaleQty: 10,
    inventory: 230,
    palette: ["#1e293b", "#475569", "#f8fafc"],
    galleryNotes: ["Workspace styling uplift", "Multi-slot desktop layout", "Minimal executive tone"],
    sustainabilityScore: 80,
    features: ["Desktop declutter tray", "Soft linen texture", "Work-from-home friendly"],
  },
  {
    id: 7,
    name: "Glass Pantry Jar Set",
    description: "Stackable pantry jars with clean lids for visible, organized storage.",
    category: "Home and Kitchen",
    catalogType: "retail",
    retailPrice: 799,
    wholesalePrice: 560,
    minWholesaleQty: 10,
    inventory: 200,
    palette: ["#0f172a", "#38bdf8", "#ecfeff"],
    galleryNotes: ["Countertop organization", "Clear storage visibility", "Kitchen reset aesthetic"],
    sustainabilityScore: 83,
    features: ["Airtight lid seal", "Stack-friendly body", "Pantry edit ready"],
  },
  {
    id: 8,
    name: "Travel Journal Kit",
    description: "Premium notebook set with elastic band, inserts, and travel prompts.",
    category: "Stationery",
    catalogType: "retail",
    retailPrice: 459,
    wholesalePrice: 295,
    minWholesaleQty: 15,
    inventory: 260,
    palette: ["#7f1d1d", "#ef4444", "#fef2f2"],
    galleryNotes: ["Premium paper mood", "Structured daily notes", "Giftable traveler pick"],
    sustainabilityScore: 79,
    features: ["Soft-touch cover", "Prompt inserts", "Portable writing kit"],
  },
  {
    id: 9,
    name: "Cotton Waffle Towel Set",
    description: "Soft textured towels for elevated bathrooms, guest rooms, and gifting.",
    category: "Home Linen",
    catalogType: "retail",
    retailPrice: 949,
    wholesalePrice: 670,
    minWholesaleQty: 10,
    inventory: 170,
    palette: ["#9a3412", "#f97316", "#fff7ed"],
    galleryNotes: ["Spa-inspired bathroom look", "Lightweight absorbent feel", "Premium guest setup"],
    sustainabilityScore: 88,
    features: ["Waffle weave texture", "Quick-dry cotton", "Guest bathroom ready"],
  },
  {
    id: 10,
    name: "Botanical Reed Diffuser",
    description: "Quiet room fragrance with amber glass styling and modern scent notes.",
    category: "Home Decor",
    catalogType: "retail",
    retailPrice: 749,
    wholesalePrice: 510,
    minWholesaleQty: 10,
    inventory: 150,
    palette: ["#4a044e", "#d946ef", "#fdf4ff"],
    galleryNotes: ["Shelf styling accent", "Long-lasting room scent", "Amber bottle silhouette"],
    sustainabilityScore: 81,
    features: ["Amber glass bottle", "Clean scent blend", "Decor-led presentation"],
  },
  {
    id: 11,
    name: "Minimalist Table Lamp",
    description: "Soft ambient lamp for reading corners, desks, and nightstands.",
    category: "Lighting",
    catalogType: "retail",
    retailPrice: 1499,
    wholesalePrice: 1090,
    minWholesaleQty: 6,
    inventory: 95,
    palette: ["#111827", "#9ca3af", "#f3f4f6"],
    galleryNotes: ["Warm desk ambience", "Compact reading light", "Premium brushed finish"],
    sustainabilityScore: 76,
    features: ["Soft ambient glow", "Reading corner accent", "Compact metal base"],
  },
  {
    id: 12,
    name: "Compostable Cup Carton",
    description: "Bulk beverage cup pack for cafes, events, and takeaway counters.",
    category: "Food Service",
    catalogType: "wholesale",
    retailPrice: 1299,
    wholesalePrice: 840,
    minWholesaleQty: 30,
    inventory: 520,
    palette: ["#14532d", "#4ade80", "#f0fdf4"],
    galleryNotes: ["Cafe service pack", "Bulk takeaway ready", "Shelf-friendly carton finish"],
    sustainabilityScore: 93,
    features: ["Compostable paper build", "Bulk beverage service", "Cafe counter ready"],
  },
  {
    id: 13,
    name: "Hotel Slipper Kit",
    description: "Soft guest slipper packs designed for hotels, spas, and stays.",
    category: "Hospitality Supplies",
    catalogType: "wholesale",
    retailPrice: 999,
    wholesalePrice: 690,
    minWholesaleQty: 24,
    inventory: 410,
    palette: ["#0369a1", "#38bdf8", "#e0f2fe"],
    galleryNotes: ["Guest welcome essential", "Hospitality-ready carton", "Clean amenity setup"],
    sustainabilityScore: 78,
    features: ["Soft cotton feel", "Individually packed", "Guestroom ready"],
  },
  {
    id: 14,
    name: "Restaurant Napkin Bundle",
    description: "Large-format napkin bundle for modern dining rooms and events.",
    category: "Food Service",
    catalogType: "wholesale",
    retailPrice: 899,
    wholesalePrice: 590,
    minWholesaleQty: 28,
    inventory: 480,
    palette: ["#78350f", "#f59e0b", "#fffbeb"],
    galleryNotes: ["Dining table service", "High-turnover hospitality stock", "Premium event presentation"],
    sustainabilityScore: 85,
    features: ["Bulk dining pack", "Soft textured finish", "Event and cafe ready"],
  },
  {
    id: 15,
    name: "Boutique Hanger Set",
    description: "Display-grade hangers built for retail rails, lookbooks, and stores.",
    category: "Retail Fixtures",
    catalogType: "wholesale",
    retailPrice: 1399,
    wholesalePrice: 960,
    minWholesaleQty: 18,
    inventory: 290,
    palette: ["#312e81", "#6366f1", "#eef2ff"],
    galleryNotes: ["Store rail polish", "Premium display alignment", "Fashion stockroom ready"],
    sustainabilityScore: 74,
    features: ["Uniform rail display", "Boutique-ready finish", "Easy stock organization"],
  },
  {
    id: 16,
    name: "Corporate Welcome Box",
    description: "Bulk onboarding gift box for teams, clients, and launch events.",
    category: "Corporate Gifting",
    catalogType: "wholesale",
    retailPrice: 1899,
    wholesalePrice: 1360,
    minWholesaleQty: 15,
    inventory: 250,
    palette: ["#0f172a", "#10b981", "#ecfdf5"],
    galleryNotes: ["Team onboarding kit", "Premium unboxing look", "Event gifting format"],
    sustainabilityScore: 87,
    features: ["Curated corporate gift", "Premium presentation", "Event-ready boxing"],
  },
  {
    id: 17,
    name: "Bamboo Cutlery Bulk Pack",
    description: "Disposable-free cutlery set for cafes, offices, and catering teams.",
    category: "Food Service",
    catalogType: "wholesale",
    retailPrice: 1199,
    wholesalePrice: 790,
    minWholesaleQty: 25,
    inventory: 560,
    palette: ["#365314", "#84cc16", "#f7fee7"],
    galleryNotes: ["Bulk cafe utility", "Eco dining service", "Event table ready"],
    sustainabilityScore: 95,
    features: ["Bamboo flatware", "Bulk catering use", "Plastic-free service"],
  },
  {
    id: 18,
    name: "Office Snack Pantry Box",
    description: "Curated pantry box for office kitchens, lounges, and employee floors.",
    category: "Office Essentials",
    catalogType: "wholesale",
    retailPrice: 1599,
    wholesalePrice: 1120,
    minWholesaleQty: 12,
    inventory: 300,
    palette: ["#7c2d12", "#fb923c", "#fff7ed"],
    galleryNotes: ["Team pantry upgrade", "Break-room refill staple", "Organized shelf format"],
    sustainabilityScore: 72,
    features: ["Break-room assortment", "Bulk pantry setup", "Office hospitality ready"],
  },
  {
    id: 19,
    name: "Amenity Bottle Refill Set",
    description: "Refillable hospitality bottle set for hotels, resorts, and rentals.",
    category: "Hospitality Supplies",
    catalogType: "wholesale",
    retailPrice: 1499,
    wholesalePrice: 1010,
    minWholesaleQty: 20,
    inventory: 340,
    palette: ["#155e75", "#06b6d4", "#ecfeff"],
    galleryNotes: ["Bathroom amenity system", "Resort-ready labeling", "Refill station efficient"],
    sustainabilityScore: 90,
    features: ["Refillable bottle system", "Uniform bath display", "Hospitality bulk use"],
  },
  {
    id: 20,
    name: "Retail Display Basket Set",
    description: "Counter and shelf baskets designed for premium in-store merchandising.",
    category: "Retail Fixtures",
    catalogType: "wholesale",
    retailPrice: 1299,
    wholesalePrice: 870,
    minWholesaleQty: 16,
    inventory: 220,
    palette: ["#581c87", "#a855f7", "#faf5ff"],
    galleryNotes: ["Storefront merchandising", "Countertop product styling", "Premium retail texture"],
    sustainabilityScore: 77,
    features: ["Shelf display basket", "Countertop merchandising", "Stack-friendly storage"],
  },
  {
    id: 21,
    name: "Wellness Studio Towel Pack",
    description: "Fresh towel stock pack for salons, spas, and fitness studios.",
    category: "Hospitality Supplies",
    catalogType: "wholesale",
    retailPrice: 1799,
    wholesalePrice: 1240,
    minWholesaleQty: 14,
    inventory: 280,
    palette: ["#134e4a", "#2dd4bf", "#f0fdfa"],
    galleryNotes: ["Studio reception ready", "Backroom linen stock", "Spa service essential"],
    sustainabilityScore: 84,
    features: ["High-turnover studio use", "Soft-touch fabric", "Laundry-cycle ready"],
  },
  {
    id: 22,
    name: "Artisan Soap Bar Tray",
    description: "Bulk presentation tray for handcrafted soap counters and gifting.",
    category: "Retail Fixtures",
    catalogType: "wholesale",
    retailPrice: 1099,
    wholesalePrice: 740,
    minWholesaleQty: 18,
    inventory: 260,
    palette: ["#92400e", "#fbbf24", "#fffbeb"],
    galleryNotes: ["Countertop artisan display", "Boutique gifting shelf", "Refill tray assortment"],
    sustainabilityScore: 88,
    features: ["Soap display tray", "Gift shop presentation", "Bulk refill friendly"],
  },
  {
    id: 23,
    name: "Co-working Desk Kit",
    description: "Organized desk-start kit for flexible offices and workspace launches.",
    category: "Office Essentials",
    catalogType: "wholesale",
    retailPrice: 1699,
    wholesalePrice: 1180,
    minWholesaleQty: 12,
    inventory: 240,
    palette: ["#1e1b4b", "#818cf8", "#eef2ff"],
    galleryNotes: ["Workspace setup uniformity", "Team desk handoff", "Launch-day essentials"],
    sustainabilityScore: 79,
    features: ["Desk starter bundle", "Shared office rollout", "Workspace consistency"],
  },
  {
    id: 24,
    name: "Marble Coaster Set",
    description: "Polished table coasters for elevated coffee corners and hosting moments.",
    category: "Home Decor",
    catalogType: "retail",
    retailPrice: 579,
    wholesalePrice: 390,
    minWholesaleQty: 12,
    inventory: 190,
    palette: ["#1f2937", "#94a3b8", "#f8fafc"],
    galleryNotes: ["Coffee table accent", "Smooth stone texture", "Hosting-ready finish"],
    sustainabilityScore: 78,
    features: ["Stone coaster set", "Protective table styling", "Giftable home accent"],
  },
  {
    id: 25,
    name: "Canvas Storage Bin",
    description: "Structured fabric bin that keeps wardrobes, shelves, and nurseries tidy.",
    category: "Home Organization",
    catalogType: "retail",
    retailPrice: 689,
    wholesalePrice: 455,
    minWholesaleQty: 12,
    inventory: 205,
    palette: ["#854d0e", "#facc15", "#fefce8"],
    galleryNotes: ["Shelf reset essential", "Soft structured frame", "Neutral home styling"],
    sustainabilityScore: 85,
    features: ["Foldable fabric body", "Shelf-friendly size", "Home organization staple"],
  },
  {
    id: 26,
    name: "Event Table Runner Pack",
    description: "Premium textile runner set for events, restaurants, and styled service tables.",
    category: "Hospitality Supplies",
    catalogType: "wholesale",
    retailPrice: 1999,
    wholesalePrice: 1410,
    minWholesaleQty: 14,
    inventory: 210,
    palette: ["#4c0519", "#e11d48", "#fff1f2"],
    galleryNotes: ["Event styling layer", "Restaurant table service", "Premium venue setup"],
    sustainabilityScore: 82,
    features: ["Textile runner bundle", "Event-ready presentation", "High-turnover hospitality use"],
  },
];

const dummyProducts = rawProducts.map((product) => {
  const mediaSlug = toMediaSlug(product.name);
  const gallery = getLocalGallery(mediaSlug);
  const fallbackGallery = buildGallery(mediaSlug);
  const resolvedGallery = gallery.length > 0 ? gallery : fallbackGallery;

  return {
    ...product,
    mediaSlug,
    image: resolvedGallery[0],
    gallery: resolvedGallery,
  };
});

export const getDemoProductByMediaSlug = (mediaSlug) =>
  dummyProducts.find((product) => product.mediaSlug === mediaSlug) || null;

export default dummyProducts;
