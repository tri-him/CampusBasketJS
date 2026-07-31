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
    name: "Fresh Fruit Mix Box",
    description: "A ready-to-eat selection of seasonal fruits and snacks perfect for student study breaks.",
    category: "Food & Snacks",
    catalogType: "retail",
    retailPrice: 599,
    wholesalePrice: 420,
    minWholesaleQty: 12,
    inventory: 280,
    palette: ["#3f6212", "#facc15", "#f2f7e9"],
    galleryNotes: ["Seasonal fruit selection", "Study break energy boost", "Campus snack ready"],
    sustainabilityScore: 88,
    features: ["Fresh fruit assortment", "Snacking portion pack", "Healthy campus choice"],
  },
  {
    id: 2,
    name: "Dorm Comfort Bedding Set",
    description: "Soft, easy-care bedding designed for smaller dorm beds and cozy campus rooms.",
    category: "Dorm Essentials",
    catalogType: "retail",
    retailPrice: 1299,
    wholesalePrice: 920,
    minWholesaleQty: 10,
    inventory: 150,
    palette: ["#0f172a", "#60a5fa", "#e2e8f0"],
    galleryNotes: ["Compact dorm fit", "Soft night comfort", "Easy care fabric"],
    sustainabilityScore: 82,
    features: ["Durable cotton blend", "Machine washable", "Cushioning gentle weave"],
  },
  {
    id: 3,
    name: "Study Desk Lamp",
    description: "Adjustable LED desk lamp with soft eye-care lighting for late-night reading and homework.",
    category: "Electronics",
    catalogType: "retail",
    retailPrice: 799,
    wholesalePrice: 540,
    minWholesaleQty: 8,
    inventory: 220,
    palette: ["#111827", "#f59e0b", "#f8fafc"],
    galleryNotes: ["Focused desk lighting", "Flexible study angle", "Sleep-friendly LEDs"],
    sustainabilityScore: 79,
    features: ["Adjustable brightness", "Compact clamp base", "Energy-saving LED"],
  },
  {
    id: 4,
    name: "Reusable Campus Bottle",
    description: "A durable reusable water bottle that keeps students hydrated through classes and campus activities.",
    category: "Personal Care",
    catalogType: "retail",
    retailPrice: 449,
    wholesalePrice: 310,
    minWholesaleQty: 12,
    inventory: 360,
    palette: ["#0f766e", "#34d399", "#ecfdf5"],
    galleryNotes: ["Campus hydration companion", "Leak-safe cap", "Sustainable everyday bottle"],
    sustainabilityScore: 92,
    features: ["BPA-free insulation", "Easy carry loop", "Classroom-friendly size"],
  },
  {
    id: 5,
    name: "Portable Phone Charger",
    description: "Compact power bank for grabbing a quick charge between classes and campus events.",
    category: "Electronics",
    catalogType: "retail",
    retailPrice: 999,
    wholesalePrice: 690,
    minWholesaleQty: 10,
    inventory: 240,
    palette: ["#1e293b", "#38bdf8", "#e0f2fe"],
    galleryNotes: ["Charge on the go", "Lightweight pocket size", "Class-ready energy"],
    sustainabilityScore: 78,
    features: ["Fast USB charging", "Compact travel-friendly", "Campus carry easy"],
  },
  {
    id: 6,
    name: "Campus Coffee Mug",
    description: "A sturdy mug designed for coffee, tea, and study fuel during early morning lectures.",
    category: "Drinkware",
    catalogType: "retail",
    retailPrice: 399,
    wholesalePrice: 250,
    minWholesaleQty: 12,
    inventory: 280,
    palette: ["#7c3aed", "#c4b5fd", "#faf5ff"],
    galleryNotes: ["Lecture-friendly style", "Insulated grip", "Breakfast study essential"],
    sustainabilityScore: 84,
    features: ["Ceramic comfort handle", "Wide base stability", "Dishwasher safe"],
  },
  {
    id: 7,
    name: "LED String Light Set",
    description: "Decorative LED lights that brighten dorm rooms and create a cozy campus ambiance.",
    category: "Dorm Decor",
    catalogType: "retail",
    retailPrice: 499,
    wholesalePrice: 330,
    minWholesaleQty: 12,
    inventory: 260,
    palette: ["#f97316", "#fef3c7", "#1e293b"],
    galleryNotes: ["Cozy room glow", "Dorm-friendly plug", "Campus mood lighting"],
    sustainabilityScore: 83,
    features: ["Low-power LED", "Flexible string design", "Warm white glow"],
  },
  {
    id: 8,
    name: "Pocket Stationery Pack",
    description: "A compact kit of pens, notebooks, and sticky notes for classes, study groups, and campus planning.",
    category: "Stationery",
    catalogType: "retail",
    retailPrice: 359,
    wholesalePrice: 240,
    minWholesaleQty: 18,
    inventory: 320,
    palette: ["#0f172a", "#fbbf24", "#f8fafc"],
    galleryNotes: ["Study-ready stationery", "Portable note kit", "Organized campus essentials"],
    sustainabilityScore: 81,
    features: ["Gel pen set", "Mini notebook", "Tabbed note cards"],
  },
  {
    id: 9,
    name: "Healthy Granola Bars",
    description: "A pack of nutrient-rich bars made for quick fuel between classes and long campus days.",
    category: "Food & Snacks",
    catalogType: "retail",
    retailPrice: 349,
    wholesalePrice: 220,
    minWholesaleQty: 24,
    inventory: 400,
    palette: ["#92400e", "#f59e0b", "#fff7ed"],
    galleryNotes: ["Study snack energy", "Whole grain goodness", "Campus friendly packaging"],
    sustainabilityScore: 90,
    features: ["Naturally sweetened", "Portable meal boost", "Bulk study snack"],
  },
  {
    id: 10,
    name: "Laundry Care Starter Kit",
    description: "Everything a student needs for dorm laundry day, with stain remover and eco-friendly wash pods.",
    category: "Dorm Essentials",
    catalogType: "retail",
    retailPrice: 799,
    wholesalePrice: 560,
    minWholesaleQty: 15,
    inventory: 210,
    palette: ["#0f766e", "#d9f99d", "#f0fdf4"],
    galleryNotes: ["Dorm laundry ready", "Stain-fighting essentials", "Weekend wash kit"],
    sustainabilityScore: 88,
    features: ["Concentrated detergent", "Stain treatment pen", "Compact travel size"],
  },
  {
    id: 11,
    name: "Noise-Reducing Headphones",
    description: "Comfortable headphones to block distractions during study sessions or campus commutes.",
    category: "Entertainment",
    catalogType: "retail",
    retailPrice: 1399,
    wholesalePrice: 940,
    minWholesaleQty: 10,
    inventory: 180,
    palette: ["#111827", "#6366f1", "#e0e7ff"],
    galleryNotes: ["Focus-friendly audio", "Cushioned ear cups", "Study session essential"],
    sustainabilityScore: 76,
    features: ["Soft memory foam", "Clear audio profile", "Foldable travel frame"],
  },
  {
    id: 12,
    name: "Campus Game Card Set",
    description: "A compact set of social card games designed for dorm nights, student lounges, and club events.",
    category: "Entertainment",
    catalogType: "retail",
    retailPrice: 529,
    wholesalePrice: 360,
    minWholesaleQty: 20,
    inventory: 230,
    palette: ["#7c2d12", "#fbbf24", "#fdf2f8"],
    galleryNotes: ["Dorm game night", "Portable fun set", "Student lounge favorite"],
    sustainabilityScore: 75,
    features: ["Compact tabletop game", "Easy group play", "Durable card stock"],
  },
  {
    id: 13,
    name: "Cozy Throw Blanket",
    description: "A plush throw blanket that keeps dorm rooms warm and adds comfort to quiet study evenings.",
    category: "Dorm Decor",
    catalogType: "retail",
    retailPrice: 999,
    wholesalePrice: 660,
    minWholesaleQty: 12,
    inventory: 190,
    palette: ["#4338ca", "#c7d2fe", "#eff6ff"],
    galleryNotes: ["Study corner comfort", "Soft touch throw", "Dorm room layering"],
    sustainabilityScore: 84,
    features: ["Ultra-soft knit", "Lightweight warmth", "Machine washable"],
  },
  {
    id: 14,
    name: "Campus Fruit Basket Case",
    description: "Wholesome fruit packages hand-picked for campus cafes, student housing, and wellness programs.",
    category: "Food Service",
    catalogType: "wholesale",
    retailPrice: 2199,
    wholesalePrice: 1490,
    minWholesaleQty: 16,
    inventory: 320,
    palette: ["#166534", "#bef264", "#f0fdf4"],
    galleryNotes: ["Bulk fruit delivery", "Snack station ready", "Healthy campus offering"],
    sustainabilityScore: 91,
    features: ["Seasonal fruit case", "Bulk student snacks", "Fresh campus catering"],
  },
  {
    id: 15,
    name: "Dorm Welcome Kit Bundle",
    description: "A complete bulk kit for move-in day with bedding, toiletries, and study essentials.",
    category: "Dorm Essentials",
    catalogType: "wholesale",
    retailPrice: 4299,
    wholesalePrice: 2980,
    minWholesaleQty: 12,
    inventory: 180,
    palette: ["#0c4a6e", "#38bdf8", "#eff6ff"],
    galleryNotes: ["Move-in day ready", "Student housing kit", "Campus welcome bundle"],
    sustainabilityScore: 86,
    features: ["Bedding and toiletries", "Desk supply essentials", "Bulk welcome delivery"],
  },
  {
    id: 16,
    name: "Bulk Reusable Water Bottles",
    description: "A wholesale case of reusable bottles ideal for student centers, clubs, and campus sustainability programs.",
    category: "Campus Supplies",
    catalogType: "wholesale",
    retailPrice: 1799,
    wholesalePrice: 1240,
    minWholesaleQty: 24,
    inventory: 420,
    palette: ["#047857", "#6ee7b7", "#f0fdf4"],
    galleryNotes: ["Sustainability program stock", "Reusable hydration solution", "Club and campus supply"],
    sustainabilityScore: 95,
    features: ["Durable stainless steel", "Campus-ready design", "Eco-aware refill option"],
  },
  {
    id: 17,
    name: "Orientation Event Snack Box",
    description: "Pre-packed snack boxes designed to keep students energized during orientations and campus fairs.",
    category: "Events & Hospitality",
    catalogType: "wholesale",
    retailPrice: 2499,
    wholesalePrice: 1690,
    minWholesaleQty: 20,
    inventory: 360,
    palette: ["#b45309", "#fde68a", "#fef9c3"],
    galleryNotes: ["Campus welcome snacks", "Event table handout", "Fresh grab-and-go"],
    sustainabilityScore: 82,
    features: ["Individually wrapped snacks", "Event-friendly packaging", "Orientation-ready case"],
  },
  {
    id: 18,
    name: "Campus Study Station Kit",
    description: "A bulk desk kit with pens, paper, and planning tools for student study lounges and residence halls.",
    category: "Stationery",
    catalogType: "wholesale",
    retailPrice: 1999,
    wholesalePrice: 1360,
    minWholesaleQty: 18,
    inventory: 260,
    palette: ["#1d4ed8", "#93c5fd", "#eff6ff"],
    galleryNotes: ["Study lounge supply", "Desk kit bulk case", "Campus learning essentials"],
    sustainabilityScore: 80,
    features: ["Desk organizer bundle", "Writing and planning tools", "Shared study ready"],
  },
  {
    id: 19,
    name: "Bulk Laundry Detergent Pack",
    description: "Large-format detergent packs made for residence halls, dorm co-ops, and student laundry services.",
    category: "Laundry & Cleaning",
    catalogType: "wholesale",
    retailPrice: 1999,
    wholesalePrice: 1330,
    minWholesaleQty: 20,
    inventory: 300,
    palette: ["#0f172a", "#7dd3fc", "#eff6ff"],
    galleryNotes: ["Residence hall laundry supply", "Bulk cleaning essentials", "High-turnover detergent case"],
    sustainabilityScore: 89,
    features: ["Eco-friendly formula", "Concentrated laundry packets", "Bulk student housing supply"],
  },
  {
    id: 20,
    name: "Wholesale Coffee Pod Case",
    description: "A case of coffee pods that keeps campus cafes, study lounges, and office kitchens stocked.",
    category: "Food Service",
    catalogType: "wholesale",
    retailPrice: 2199,
    wholesalePrice: 1470,
    minWholesaleQty: 18,
    inventory: 260,
    palette: ["#4b2725", "#f4d8c2", "#fefcf9"],
    galleryNotes: ["Campus cafe stock", "Brew-ready pod case", "Study lounge staple"],
    sustainabilityScore: 77,
    features: ["Single-serve coffee pods", "Cafe-ready case", "Bulk beverage refill"],
  },
  {
    id: 21,
    name: "Campus Welcome Kit Bundle",
    description: "A thoughtful bulk kit for clubs, orientation teams, and campus ambassadors to welcome new students.",
    category: "Events & Gifting",
    catalogType: "wholesale",
    retailPrice: 2599,
    wholesalePrice: 1760,
    minWholesaleQty: 14,
    inventory: 240,
    palette: ["#0f172a", "#d946ef", "#f5f3ff"],
    galleryNotes: ["New-student gift set", "Campus event bundle", "Club welcome essentials"],
    sustainabilityScore: 85,
    features: ["Welcome tote and goodies", "Event-ready packaging", "Bulk orientation delivery"],
  },
  {
    id: 22,
    name: "Dorm Room Storage Tote Set",
    description: "Durable storage totes made for organizing dorm closets, under-bed spaces, and student living areas.",
    category: "Organization",
    catalogType: "wholesale",
    retailPrice: 1699,
    wholesalePrice: 1140,
    minWholesaleQty: 16,
    inventory: 300,
    palette: ["#334155", "#c7d2fe", "#f8fafc"],
    galleryNotes: ["Campus closet order", "Under-bed storage stack", "Dorm room solution"],
    sustainabilityScore: 83,
    features: ["Foldable storage totes", "Reinforced handles", "Space-saving design"],
  },
  {
    id: 23,
    name: "Bulk LED Desk Lamps",
    description: "A wholesale set of compact LED lamps built for residence halls, study spaces, and workshop tables.",
    category: "Electronics",
    catalogType: "wholesale",
    retailPrice: 2899,
    wholesalePrice: 1960,
    minWholesaleQty: 14,
    inventory: 220,
    palette: ["#0f172a", "#22d3ee", "#eff6ff"],
    galleryNotes: ["Community study space lighting", "Campus desk lamp bulk", "Library-ready illumination"],
    sustainabilityScore: 80,
    features: ["Energy-efficient LEDs", "Adjustable neck", "Study space ready"],
  },
  {
    id: 24,
    name: "Student Club Party Pack",
    description: "A mix of party supplies and entertainment essentials for school clubs, dorm socials, and campus events.",
    category: "Entertainment",
    catalogType: "wholesale",
    retailPrice: 1999,
    wholesalePrice: 1300,
    minWholesaleQty: 18,
    inventory: 280,
    palette: ["#be185d", "#f472b6", "#fff1f2"],
    galleryNotes: ["Dorm social ready", "Club event supply", "Entertainment bulk pack"],
    sustainabilityScore: 76,
    features: ["Game night essentials", "Decor and snack items", "Party-ready bundle"],
  },
  {
    id: 25,
    name: "Campus Workshop Stationery Kit",
    description: "A wholesale stationery kit for campus workshops, club meetings, and creative classrooms.",
    category: "Stationery",
    catalogType: "wholesale",
    retailPrice: 1899,
    wholesalePrice: 1280,
    minWholesaleQty: 18,
    inventory: 250,
    palette: ["#0f766e", "#86efac", "#ecfdf5"],
    galleryNotes: ["Creative classroom supply", "Bulk workshop stationery", "Club meeting essentials"],
    sustainabilityScore: 82,
    features: ["Marker and paper set", "Group activity tools", "Bulk learning bundle"],
  },
  {
    id: 26,
    name: "Bulk Healthy Snack Packs",
    description: "A wholesale assortment of wholesome snacks designed for student lounges, clubs, and dining centers.",
    category: "Food Service",
    catalogType: "wholesale",
    retailPrice: 1699,
    wholesalePrice: 1120,
    minWholesaleQty: 20,
    inventory: 340,
    palette: ["#166534", "#a7f3d0", "#f0fdf4"],
    galleryNotes: ["Study lounge snack stock", "Healthy group servings", "Campus snack bulk"],
    sustainabilityScore: 90,
    features: ["Wholesome snack assortment", "Grab-and-go portions", "Campus nutrition support"],
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
