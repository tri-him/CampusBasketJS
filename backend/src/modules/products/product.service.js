import { prisma } from "../../lib/prisma.js";
import AppError from "../../utils/app-error.js";
import {
  buildProductSlug,
  normalizeCatalogType,
  normalizeProductMediaUrls,
} from "../../utils/product-helpers.js";

const productInclude = {
  seller: {
    select: {
      id: true,
      name: true,
      storeName: true,
      email: true,
    },
  },
};

const productDetailInclude = {
  seller: productInclude.seller,
  reviews: {
    select: {
      id: true,
      rating: true,
      title: true,
      comment: true,
      customerName: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 10,
  },
};

const normalizeUniqueStringList = (values = []) =>
  Array.from(
    new Set(
      (Array.isArray(values) ? values : [])
        .map((value) => String(value || "").trim())
        .filter(Boolean),
    ),
  );

const withProductMedia = (product) => {
  const galleryUrls = normalizeUniqueStringList([
    product.imageUrl || "",
    ...(product.galleryUrls || []),
  ]);

  return {
    ...product,
    featureList: normalizeUniqueStringList(product.featureList || []),
    galleryUrls,
  };
};

const withGuaranteedProductGallery = (product) => {
  const { imageUrl, galleryUrls } = normalizeProductMediaUrls({
    productSlug: product.slug,
    image: product.imageUrl || "",
    gallery: product.galleryUrls || [],
  });

  return withProductMedia({
    ...product,
    imageUrl,
    galleryUrls,
  });
};

const attachProductReviewSummary = async (products) => {
  if (products.length === 0) {
    return products;
  }

  const summaryRows = await prisma.productReview.groupBy({
    by: ["productId"],
    where: {
      productId: {
        in: products.map((product) => product.id),
      },
    },
    _avg: {
      rating: true,
    },
    _count: {
      productId: true,
    },
  });

  const summaryMap = new Map(
    summaryRows.map((row) => [
      row.productId,
      {
        rating: row._avg.rating ? Number(row._avg.rating) : null,
        reviewCount: row._count.productId,
      },
    ]),
  );

  return products.map((product) => {
    const summary = summaryMap.get(product.id);

    return withGuaranteedProductGallery({
      ...product,
      rating: summary?.rating ?? 0,
      reviewCount: summary?.reviewCount ?? 0,
    });
  });
};

const getFeaturedProducts = async () => {
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      inventory: {
        gt: 0,
      },
    },
    include: productInclude,
    orderBy: {
      createdAt: "desc",
    },
    take: 24,
  });

  const productsWithSummary = await attachProductReviewSummary(products);

  return productsWithSummary
    .sort((firstProduct, secondProduct) => {
      if ((secondProduct.reviewCount || 0) !== (firstProduct.reviewCount || 0)) {
        return (secondProduct.reviewCount || 0) - (firstProduct.reviewCount || 0);
      }

      if ((secondProduct.rating || 0) !== (firstProduct.rating || 0)) {
        return (secondProduct.rating || 0) - (firstProduct.rating || 0);
      }

      return new Date(secondProduct.createdAt) - new Date(firstProduct.createdAt);
    })
    .slice(0, 6);
};

const getRecentLandingReviews = async () => {
  const reviews = await prisma.productReview.findMany({
    orderBy: {
      createdAt: "desc",
    },
    take: 6,
    include: {
      product: {
        select: {
          id: true,
          name: true,
          imageUrl: true,
          category: true,
        },
      },
    },
  });

  return reviews.map((review) => ({
    id: review.id,
    rating: review.rating,
    title: review.title,
    comment: review.comment,
    customerName: review.customerName,
    customerEmail: review.customerEmail,
    productId: review.productId,
    productName: review.productName,
    createdAt: review.createdAt,
    product: review.product
      ? {
          id: review.product.id,
          name: review.product.name,
          imageUrl: review.product.imageUrl,
          category: review.product.category,
        }
      : null,
  }));
};

const buildProductData = ({ sellerId, payload, slug }) => {
  const featureList = normalizeUniqueStringList(payload.features || []);
  const { imageUrl, galleryUrls } = normalizeProductMediaUrls({
    productSlug: slug,
    image: payload.image,
    gallery: payload.gallery,
  });

  return {
    sellerId,
    name: payload.name,
    slug,
    description: payload.description,
    category: payload.category,
    featureList,
    catalogType: normalizeCatalogType(payload.catalogType),
    sustainabilityScore: payload.sustainabilityScore,
    retailPrice: payload.retailPrice,
    wholesalePrice: payload.wholesalePrice,
    minWholesaleQty: payload.minWholesaleQty,
    inventory: payload.inventory,
    imageUrl,
    galleryUrls,
  };
};

export const listProducts = async (query) => {
  const search = query.search?.trim();
  const category = query.category?.trim();
  const normalizedSection = query.section ? normalizeCatalogType(query.section) : null;
  const section = normalizedSection === "ALL" ? null : normalizedSection;
  const sellerId = query.sellerId?.trim();
  const whereClauses = [
    {
      isActive: true,
    },
  ];

  if (sellerId) {
    whereClauses.push({ sellerId });
  }

if (section) {
  whereClauses.push({
    OR: [
      { catalogType: "all" },
      { catalogType: section },
    ],
  });
}

  if (search) {
    whereClauses.push({
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { category: { contains: search, mode: "insensitive" } },
        { featureList: { hasSome: [search] } },
      ],
    });
  }

  if (category) {
    whereClauses.push({
      category: { contains: category, mode: "insensitive" },
    });
  }

  const products = await prisma.product.findMany({
    where: {
      AND: whereClauses,
    },
    include: productInclude,
    orderBy: {
      createdAt: "desc",
    },
  });

  return attachProductReviewSummary(products);
};

export const getLandingHighlights = async () => {
  const [
    featuredProducts,
    recentReviews,
    activeProducts,
    sellerBrands,
    ordersPlaced,
    customerReviews,
  ] =
    await Promise.all([
      getFeaturedProducts(),
      getRecentLandingReviews(),
      prisma.product.count({
        where: {
          isActive: true,
        },
      }),
      prisma.user.count({
        where: {
          role: "SELLER",
          status: "ACTIVE",
        },
      }),
      prisma.order.count(),
      prisma.productReview.count(),
    ]);

  return {
    featuredProducts,
    recentReviews,
    stats: [
      {
        value: activeProducts,
        label: "Live products",
      },
      {
        value: sellerBrands,
        label: "Seller brands",
      },
      {
        value: ordersPlaced,
        label: "Orders placed",
      },
      {
        value: customerReviews,
        label: "Customer reviews",
      },
    ],
  };
};

export const getProductById = async (productId) => {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: productDetailInclude,
  });

  if (!product || !product.isActive) {
    throw new AppError(404, "Product not found.");
  }

  const [productWithSummary] = await attachProductReviewSummary([product]);
  return productWithSummary;
};

export const createProduct = async ({ sellerId, payload }) => {
  const slug = buildProductSlug(payload.name);

  return prisma.product.create({
    data: buildProductData({ sellerId, payload, slug }),
    include: productDetailInclude,
  });
};

export const updateProduct = async ({ sellerId, productId, payload }) => {
  const existingProduct = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!existingProduct || !existingProduct.isActive) {
    throw new AppError(404, "Product not found.");
  }

  if (existingProduct.sellerId !== sellerId) {
    throw new AppError(403, "You can only update your own products.");
  }

  const slug =
    existingProduct.name === payload.name
      ? existingProduct.slug
      : buildProductSlug(payload.name);

  return prisma.product.update({
    where: { id: productId },
    data: {
      ...buildProductData({ sellerId, payload, slug }),
    },
    include: productDetailInclude,
  });
};

export const deleteProduct = async ({ sellerId, productId }) => {
  const existingProduct = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!existingProduct || !existingProduct.isActive) {
    throw new AppError(404, "Product not found.");
  }

  if (existingProduct.sellerId !== sellerId) {
    throw new AppError(403, "You can only archive your own products.");
  }

  await prisma.product.update({
    where: { id: productId },
    data: {
      isActive: false,
    },
  });
};
