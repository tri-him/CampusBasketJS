import "dotenv/config";
import bcrypt from "bcryptjs";
import slugify from "slugify";
import { prisma } from "../lib/prisma.js";
import dummyProducts from "../../../frontend/src/data/dummyProducts.js";

const platformEmail = "platform@CampusBasket.com";
const adminEmail = "admin@CampusBasket.com";

const buildSeedSlug = (name) =>
  `${slugify(name, { lower: true, strict: true, trim: true })}-platform`;

const buildSeedFeatures = (product) => [
  ...(Array.isArray(product.features) ? product.features : []),
  `${product.name} ready for premium everyday use`,
  `Built for ${product.category || "eco-conscious"} buyers`,
  `Wholesale-friendly with minimum order ${Number(product.minWholesaleQty) || 10}+`,
].filter(Boolean);

const buildSeedGallery = (product) =>
  Array.from(
    new Set([product.image || "", ...(product.gallery || [])].filter(Boolean)),
  );

const normalizeSeedCatalogType = (catalogType) => {
  const normalizedCatalogType = String(catalogType || "all").trim().toUpperCase();

  if (["RETAIL", "WHOLESALE", "ALL"].includes(normalizedCatalogType)) {
    return normalizedCatalogType;
  }

  return "ALL";
};

const run = async () => {
  const passwordHash = await bcrypt.hash("CampusBasket-platform", 10);
  const adminPasswordHash = await bcrypt.hash("CampusBasket-admin", 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: "CampusBasket Support Admin",
      status: "ACTIVE",
    },
    create: {
      role: "ADMIN",
      name: "CampusBasket Support Admin",
      email: adminEmail,
      passwordHash: adminPasswordHash,
      status: "ACTIVE",
    },
  });

  const platformSeller = await prisma.user.upsert({
    where: { email: platformEmail },
    update: {
      name: "CampusBasket Curated",
      storeName: "CampusBasket Curated",
    },
    create: {
      role: "SELLER",
      name: "CampusBasket Curated",
      email: platformEmail,
      passwordHash,
      storeName: "CampusBasket Curated",
      status: "ACTIVE",
    },
  });

  for (const product of dummyProducts) {
    const slug = buildSeedSlug(product.name);

    await prisma.product.upsert({
      where: { slug },
      update: {
        sellerId: platformSeller.id,
        name: product.name,
        description: product.description,
        category: product.category || "Eco Essentials",
        featureList: buildSeedFeatures(product),
        catalogType: normalizeSeedCatalogType(product.catalogType),
        sustainabilityScore: Number(product.sustainabilityScore) || 80,
        retailPrice: Number(product.retailPrice) || 0,
        wholesalePrice: Number(product.wholesalePrice) || 0,
        minWholesaleQty: Number(product.minWholesaleQty) || 10,
        inventory: Number(product.inventory) || 500,
        imageUrl: product.image || "",
        galleryUrls: buildSeedGallery(product),
        isActive: true,
      },
      create: {
        sellerId: platformSeller.id,
        name: product.name,
        slug,
        description: product.description,
        category: product.category || "Eco Essentials",
        featureList: buildSeedFeatures(product),
        catalogType: normalizeSeedCatalogType(product.catalogType),
        sustainabilityScore: Number(product.sustainabilityScore) || 80,
        retailPrice: Number(product.retailPrice) || 0,
        wholesalePrice: Number(product.wholesalePrice) || 0,
        minWholesaleQty: Number(product.minWholesaleQty) || 10,
        inventory: Number(product.inventory) || 500,
        imageUrl: product.image || "",
        galleryUrls: buildSeedGallery(product),
        isActive: true,
      },
    });
  }

  console.log("CampusBasket seed completed successfully.");
};

run()
  .catch((error) => {
    console.error("CampusBasket seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
