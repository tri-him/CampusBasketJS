import { orderApi, paymentApi, productApi, reviewApi, supportApi } from "../services/api";
import { resolveProductMediaUrl } from "./productMedia";

const PRODUCTS_KEY = "CampusBasket-products-cache";
const ORDERS_KEY = "CampusBasket-orders";
const ORDER_EMAILS_KEY = "CampusBasket-order-emails";
const PRODUCT_REVIEWS_KEY = "CampusBasket-product-reviews";
const SUPPORT_TICKETS_KEY = "CampusBasket-support-tickets";
const SUPPORT_CHATS_KEY = "CampusBasket-support-chats";

const DEFAULT_CATEGORY = "Eco Essentials";
const DEFAULT_SUSTAINABILITY_SCORE = 80;

const normalizeStringList = (values) =>
  Array.from(
    new Set(
      (Array.isArray(values) ? values : [])
        .map((value) => String(value || "").trim())
        .filter(Boolean),
    ),
  );

const readJson = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const writeJson = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const toTitleCaseStatus = (value) => {
  const status = String(value || "").trim().toUpperCase();

  if (status === "NEW") {
    return "New";
  }

  if (status === "PACKING" || status === "PACKED") {
    return "Packed";
  }

  if (status === "IN_REVIEW") {
    return "In Review";
  }

  if (status === "CLOSED") {
    return "Closed";
  }

  return status
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(" ");
};

const toPaymentLabel = (value) => {
  const method = String(value || "").trim().toUpperCase();

  if (method === "CARD") {
    return "Card";
  }

  if (method === "COD") {
    return "COD";
  }

  return "UPI";
};

const toPaymentStatusLabel = (value) => {
  const status = String(value || "").trim().toUpperCase();

  if (!status) {
    return "Unavailable";
  }

  if (status === "CAPTURED") {
    return "Captured";
  }

  if (status === "PENDING") {
    return "Pending";
  }

  if (status === "FAILED") {
    return "Failed";
  }

  if (status === "REFUNDED") {
    return "Refunded";
  }

  return toTitleCaseStatus(status);
};

const toCatalogLabel = (value) => {
  const normalizedValue = String(value || "").trim().toUpperCase();

  if (["RETAIL", "WHOLESALE", "ALL"].includes(normalizedValue)) {
    return normalizedValue.toLowerCase();
  }

  return "all";
};

const toOrderMode = (value) =>
  String(value || "").trim().toUpperCase() === "WHOLESALE"
    ? "wholesale"
    : "retail";

const getOrderCache = () => readJson(ORDERS_KEY, []);
const saveOrders = (orders) => writeJson(ORDERS_KEY, orders);
const getSupportTicketCache = () => readJson(SUPPORT_TICKETS_KEY, []);
const saveSupportTickets = (tickets) => writeJson(SUPPORT_TICKETS_KEY, tickets);
const getSupportChatCache = () => readJson(SUPPORT_CHATS_KEY, []);
const saveSupportChats = (chats) => writeJson(SUPPORT_CHATS_KEY, chats);
const getReviewCache = () => readJson(PRODUCT_REVIEWS_KEY, []);
const saveReviews = (reviews) => writeJson(PRODUCT_REVIEWS_KEY, reviews);
const getProductCache = () => readJson(PRODUCTS_KEY, []);
const saveProducts = (products) => writeJson(PRODUCTS_KEY, products);

const findCachedOrder = (orderId) =>
  getOrderCache().find(
    (order) => order.id === orderId || order.databaseId === orderId,
  ) || null;

const resolveDisplayOrderId = (orderId) => {
  if (!orderId) {
    return "";
  }

  const cachedOrder = findCachedOrder(orderId);
  return cachedOrder?.id || orderId;
};

export const normalizeCatalogType = (value) =>
  ["retail", "wholesale", "all"].includes(value) ? value : toCatalogLabel(value);

export const normalizeSustainabilityScore = (value) => {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return DEFAULT_SUSTAINABILITY_SCORE;
  }

  return Math.min(100, Math.max(1, Math.round(numericValue)));
};

export const normalizeProductRecord = (product) => {
  const image = resolveProductMediaUrl(product.image || product.imageUrl || "");
  const gallery = normalizeStringList([
    image,
    ...(product.gallery || product.galleryUrls || []).map(resolveProductMediaUrl),
  ]);

  return {
    id: String(product.id),
    sellerId: product.sellerId || product.seller?.id || "CampusBasket-platform",
    sellerName:
      product.sellerName ||
      product.seller?.storeName ||
      product.seller?.name ||
      "CampusBasket Curated",
    name: product.name,
    description: product.description || "",
    category: product.category || DEFAULT_CATEGORY,
    catalogType: normalizeCatalogType(product.catalogType),
    sustainabilityScore: normalizeSustainabilityScore(product.sustainabilityScore),
    retailPrice: Number(product.retailPrice) || 0,
    wholesalePrice: Number(product.wholesalePrice) || 0,
    minWholesaleQty: Number(product.minWholesaleQty) || 1,
    inventory: Number(product.inventory) || 0,
    image,
    gallery,
    features: normalizeStringList(product.features || product.featureList || []),
    reviews: Array.isArray(product.reviews) ? product.reviews : [],
    rating: Number(product.rating) || 4.8,
    reviewCount: Number(product.reviewCount) || 0,
    createdAt: product.createdAt || new Date().toISOString(),
    updatedAt: product.updatedAt || new Date().toISOString(),
  };
};

const normalizeOrderRecord = (order) => {
  const emailLog =
    (order.emailLogs || [])
      .slice()
      .sort(
        (firstLog, secondLog) =>
          new Date(secondLog.createdAt || 0) - new Date(firstLog.createdAt || 0),
      )[0] || null;
  const payment = order.payment || null;
  const derivedPaymentStatus = payment
    ? toPaymentStatusLabel(payment.status)
    : order.paymentMethod === "COD"
      ? "Pending"
      : "Captured";

  return {
    id: order.orderNumber || order.id,
    databaseId: order.id,
    amount: Number(order.amount) || 0,
    paymentMethod: toPaymentLabel(payment?.method || order.paymentMethod),
    paymentStatus: derivedPaymentStatus,
    paymentReference: payment?.reference || "",
    paymentPayerLabel: payment?.payerLabel || "",
    paymentPaidAt: payment?.paidAt || null,
    payment: {
      method: toPaymentLabel(payment?.method || order.paymentMethod),
      status: derivedPaymentStatus,
      reference: payment?.reference || "",
      payerLabel: payment?.payerLabel || "",
      paidAt: payment?.paidAt || null,
      provider: payment?.provider || "",
      amount: Number(payment?.amount ?? order.amount) || 0,
    },
    status: toTitleCaseStatus(order.status),
    date: order.placedAt || order.createdAt || new Date().toISOString(),
    shipping: {
      name: order.shippingName,
      email: order.shippingEmail,
      phone: order.shippingPhone,
      address: order.shippingAddress,
      city: order.shippingCity,
      pincode: order.shippingPincode,
    },
    customer: order.customer
      ? {
          id: order.customer.id,
          name: order.customer.name,
          email: order.customer.email,
        }
      : {
          name: order.shippingName || "Guest Customer",
          email: order.guestEmail || order.shippingEmail || "",
        },
    items: (order.items || []).map((item) => ({
      id: item.productId || item.id,
      orderItemId: item.id,
      name: item.productNameSnapshot || item.product?.name || "Product",
      image: resolveProductMediaUrl(item.imageUrlSnapshot || item.product?.imageUrl || ""),
      mode: toOrderMode(item.mode),
      quantity: Number(item.quantity) || 1,
      retailPrice: Number(item.retailPrice) || 0,
      wholesalePrice: Number(item.wholesalePrice) || 0,
      minWholesaleQty: Number(item.product?.minWholesaleQty) || 1,
      category: item.categorySnapshot || item.product?.category || DEFAULT_CATEGORY,
      catalogType: normalizeCatalogType(item.catalogTypeSnapshot),
      sellerId: item.sellerId,
      sellerName: item.sellerNameSnapshot || "Seller Store",
      sellerStatus: toTitleCaseStatus(item.sellerStatus),
    })),
    sellerItems: (order.items || []).map((item) => ({
      id: item.productId || item.id,
      orderItemId: item.id,
      name: item.productNameSnapshot || item.product?.name || "Product",
      quantity: Number(item.quantity) || 1,
      retailPrice: Number(item.retailPrice) || 0,
      wholesalePrice: Number(item.wholesalePrice) || 0,
      category: item.categorySnapshot || item.product?.category || DEFAULT_CATEGORY,
      mode: toOrderMode(item.mode),
      sellerId: item.sellerId,
      sellerName: item.sellerNameSnapshot || "Seller Store",
      sellerStatus: toTitleCaseStatus(item.sellerStatus),
    })),
    emailStatus: emailLog ? toTitleCaseStatus(emailLog.status) : "Unavailable",
  };
};

const normalizeReviewRecord = (review) => ({
  id: review.id,
  orderId: resolveDisplayOrderId(review.orderId),
  productId: review.productId,
  mode: toOrderMode(review.mode),
  sellerId: review.sellerId,
  sellerName: review.sellerName || "",
  customerEmail: review.customerEmail,
  customerName: review.customerName,
  productName: review.productName,
  rating: Number(review.rating) || 5,
  title: review.title,
  comment: review.comment,
  createdAt: review.createdAt,
  updatedAt: review.updatedAt || review.createdAt,
});

const normalizeSupportTicketRecord = (ticket) => ({
  id: ticket.id,
  ticketNumber: ticket.ticketNumber,
  customerName: ticket.customerName,
  customerEmail: ticket.customerEmail,
  customerPhone: ticket.customerPhone || "",
  orderId: resolveDisplayOrderId(ticket.orderId),
  category: ticket.category,
  priority: toTitleCaseStatus(ticket.priority),
  subject: ticket.subject,
  description: ticket.description,
  status: toTitleCaseStatus(ticket.status),
  createdAt: ticket.createdAt,
  updatedAt: ticket.updatedAt,
  responseEta: ticket.responseEta || "Within 24 hours",
});

const normalizeSupportChatRecord = (chat) => ({
  id: chat.id,
  chatNumber: chat.chatNumber,
  customerName: chat.customerName,
  customerEmail: chat.customerEmail,
  orderId: resolveDisplayOrderId(chat.orderId),
  ticketId: chat.ticketId || "",
  category: chat.category,
  subject: chat.subject,
  status: toTitleCaseStatus(chat.status),
  assignedAgent: chat.assignedAgent || chat.assignedAgentName || "Aisha from CampusBasket Care",
  assignedAgentId: chat.assignedAgentId || "",
  assignedAgentName: chat.assignedAgentName || chat.assignedAgent || "Aisha from CampusBasket Care",
  assignedAt: chat.assignedAt || null,
  unreadForAdmin: Number(chat.unreadForAdmin) || 0,
  unreadForCustomer: Number(chat.unreadForCustomer) || 0,
  lastRepliedBy: String(chat.lastRepliedBy || "").trim().toLowerCase(),
  createdAt: chat.createdAt,
  updatedAt: chat.updatedAt,
  messages: (chat.messages || []).map((message) => ({
    id: message.id,
    senderType: String(message.senderType || "")
      .trim()
      .toLowerCase(),
    senderName: message.senderName,
    text: message.text,
    attachmentUrl: message.attachmentUrl || "",
    attachmentName: message.attachmentName || "",
    attachmentMimeType: message.attachmentMimeType || "",
    attachmentSizeBytes: Number(message.attachmentSizeBytes) || 0,
    createdAt: message.createdAt,
  })),
});

const mergeById = (currentItems, nextItems) => {
  const map = new Map(currentItems.map((item) => [item.id, item]));
  nextItems.forEach((item) => {
    map.set(item.id, item);
  });
  return Array.from(map.values());
};

export const getMarketplaceProducts = () => getProductCache();

export const syncMarketplaceProducts = async (params = {}) => {
  const response = await productApi.list(params);

  console.log("PRODUCT API RESPONSE:", response);

  const rawProducts =
    response.data ||
    response.products ||
    response.items ||
    response;

  const products = Array.isArray(rawProducts)
    ? rawProducts.map(normalizeProductRecord)
    : [];

  saveProducts(products);

  return products;
};

export const getMarketplaceProductsForSection = (section) =>
  getMarketplaceProducts().filter((product) => {
    const catalogType = normalizeCatalogType(product.catalogType);
    return catalogType === "all" || catalogType === section;
  });

export const getSellerProductsForStore = (sellerId) =>
  getMarketplaceProducts().filter((product) => product.sellerId === sellerId);

export const upsertSellerProduct = async (nextProduct) => {
  const hasExistingId = Boolean(nextProduct.id);
  const response = hasExistingId
    ? await productApi.update(nextProduct.id, nextProduct)
    : await productApi.create(nextProduct);
  const normalizedProduct = normalizeProductRecord(response.data);
  const updatedProducts = mergeById(getProductCache(), [normalizedProduct]);
  saveProducts(updatedProducts);
  return normalizedProduct;
};

export const deleteSellerProduct = async (productId) => {
  await productApi.remove(productId);
  const updatedProducts = getProductCache().filter((product) => product.id !== productId);
  saveProducts(updatedProducts);
  return updatedProducts;
};

export const getOrders = () => getOrderCache();

export const syncOrders = async (email = "") => {
  const response = await orderApi.history(email);
  const orders = (response.data || []).map(normalizeOrderRecord);
  saveOrders(orders);

  const emailLogs = orders
    .filter((order) => order.shipping?.email)
    .map((order) => ({
      orderId: order.id,
      status: order.emailStatus,
      to: order.shipping.email,
    }));

  writeJson(ORDER_EMAILS_KEY, emailLogs);
  return orders;
};

export const syncSellerOrders = async () => {
  const response = await orderApi.sellerOrders();
  const orders = (response.data || []).map(normalizeOrderRecord);
  saveOrders(orders);
  return orders;
};

export const placeOrder = async (payload) => {
  const response = await orderApi.create(payload);
  const order = normalizeOrderRecord(response.data);
  const updatedOrders = [order, ...getOrderCache().filter((entry) => entry.id !== order.id)];
  saveOrders(updatedOrders);
  writeJson(ORDER_EMAILS_KEY, [
    {
      orderId: order.id,
      status: order.emailStatus,
      to: order.shipping?.email || "",
    },
    ...getOrderConfirmationEmails().filter((email) => email.orderId !== order.id),
  ]);
  return order;
};

export const cancelOrder = async (orderId) => {
  const response = await orderApi.cancel(orderId);
  const order = normalizeOrderRecord(response.data);
  const updatedOrders = [order, ...getOrderCache().filter((entry) => entry.id !== order.id)];
  saveOrders(updatedOrders);
  writeJson(ORDER_EMAILS_KEY, [
    {
      orderId: order.id,
      status: order.emailStatus,
      to: order.shipping?.email || "",
    },
    ...getOrderConfirmationEmails().filter((email) => email.orderId !== order.id),
  ]);
  return order;
};

export const createRazorpayCheckout = async (payload) => {
  const response = await paymentApi.createRazorpayOrder(payload);
  const order = normalizeOrderRecord(response.data.order);
  const updatedOrders = [order, ...getOrderCache().filter((entry) => entry.id !== order.id)];
  saveOrders(updatedOrders);
  return {
    ...response.data,
    order,
  };
};

export const retryRazorpayCheckout = async (payload) => {
  const response = await paymentApi.retryRazorpayOrder(payload);
  const order = normalizeOrderRecord(response.data.order);
  const updatedOrders = [order, ...getOrderCache().filter((entry) => entry.id !== order.id)];
  saveOrders(updatedOrders);
  return {
    ...response.data,
    order,
  };
};

export const verifyRazorpayPayment = async (payload) => {
  const response = await paymentApi.verifyRazorpayPayment(payload);
  const order = normalizeOrderRecord(response.data);
  const updatedOrders = [order, ...getOrderCache().filter((entry) => entry.id !== order.id)];
  saveOrders(updatedOrders);
  writeJson(ORDER_EMAILS_KEY, [
    {
      orderId: order.id,
      status: order.emailStatus,
      to: order.shipping?.email || "",
    },
    ...getOrderConfirmationEmails().filter((email) => email.orderId !== order.id),
  ]);
  return order;
};

export const cancelRazorpayCheckout = async (payload) => {
  const response = await paymentApi.cancelRazorpayOrder(payload);
  if (response.data?.cancelled && payload.orderId) {
    saveOrders(getOrderCache().filter((entry) => entry.databaseId !== payload.orderId));
  }
  return response.data;
};

export const getOrderById = (orderId) => findCachedOrder(orderId);

export const getOrderConfirmationEmails = () => readJson(ORDER_EMAILS_KEY, []);

export const getOrderConfirmationEmailForOrder = (orderId) =>
  getOrderConfirmationEmails().find((email) => email.orderId === orderId) || null;

const normalizeUiStatusToApi = (status) => {
  const normalizedStatus = String(status || "").trim().toUpperCase();

  if (normalizedStatus === "PACKED") {
    return "PACKING";
  }

  return normalizedStatus;
};

export const updateSellerOrderItemStatus = async (orderId, _sellerId, nextStatus) => {
  const response = await orderApi.updateSellerStatus(
    orderId,
    normalizeUiStatusToApi(nextStatus),
  );
  const normalizedOrder = normalizeOrderRecord(response.data);
  const updatedOrders = mergeById(getOrderCache(), [normalizedOrder]);
  saveOrders(updatedOrders);
  return updatedOrders;
};

export const getSellerOrders = (sellerId) =>
  getOrders()
    .map((order) => {
      const sellerItems = (order.items || []).filter((item) => item.sellerId === sellerId);

      if (sellerItems.length === 0) {
        return null;
      }

      return {
        ...order,
        sellerItems,
        sellerAmount: sellerItems.reduce((sum, item) => {
          const unitPrice =
            item.mode === "wholesale"
              ? Number(item.wholesalePrice) || 0
              : Number(item.retailPrice) || 0;

          return sum + unitPrice * item.quantity;
        }, 0),
      };
    })
    .filter(Boolean);

export const getSellerCustomers = (sellerId) => {
  const customerMap = new Map();

  getSellerOrders(sellerId).forEach((order) => {
    const customerEmail =
      order.customer?.email || order.shipping?.email || `guest-${order.id}`;

    const existingCustomer = customerMap.get(customerEmail) || {
      id: customerEmail,
      name: order.customer?.name || order.shipping?.name || "Guest Customer",
      email: order.customer?.email || order.shipping?.email || "Guest checkout",
      phone: order.shipping?.phone || "Not provided",
      city: order.shipping?.city || "Unknown",
      totalOrders: 0,
      totalSpent: 0,
      lastOrderDate: order.date,
    };

    existingCustomer.totalOrders += 1;
    existingCustomer.totalSpent += order.sellerAmount;
    existingCustomer.lastOrderDate =
      new Date(order.date) > new Date(existingCustomer.lastOrderDate)
        ? order.date
        : existingCustomer.lastOrderDate;

    customerMap.set(customerEmail, existingCustomer);
  });

  return Array.from(customerMap.values()).sort(
    (a, b) => new Date(b.lastOrderDate) - new Date(a.lastOrderDate),
  );
};

export const getSellerDashboardStats = (sellerId, mode) => {
  const products = getSellerProductsForStore(sellerId).filter((product) => {
    const catalogType = normalizeCatalogType(product.catalogType);
    return catalogType === "all" || catalogType === mode;
  });

  const orders = getSellerOrders(sellerId).filter((order) =>
    order.sellerItems.some((item) => item.mode === mode),
  );

  const revenue = orders.reduce((sum, order) => {
    const modeAmount = order.sellerItems
      .filter((item) => item.mode === mode)
      .reduce((itemSum, item) => {
        const unitPrice =
          item.mode === "wholesale"
            ? Number(item.wholesalePrice) || 0
            : Number(item.retailPrice) || 0;

        return itemSum + unitPrice * item.quantity;
      }, 0);

    return sum + modeAmount;
  }, 0);

  const customers = new Set(
    orders.map((order) => order.customer?.email || order.shipping?.email || order.id),
  );

  return {
    productsCount: products.length,
    ordersCount: orders.length,
    revenue,
    customersCount: customers.size,
  };
};

export const getAllProductReviews = () => getReviewCache();

export const getProductReviews = (productId) =>
  getAllProductReviews()
    .filter((review) => review.productId === productId)
    .sort(
      (firstReview, secondReview) =>
        new Date(secondReview.createdAt) - new Date(firstReview.createdAt),
    );

export const syncProductReviews = async (productId) => {
  const response = await reviewApi.listByProductId(productId);
  const normalizedReviews = (response.data || []).map(normalizeReviewRecord);
  const remainingReviews = getAllProductReviews().filter(
    (review) => review.productId !== productId,
  );
  saveReviews([...normalizedReviews, ...remainingReviews]);
  return normalizedReviews;
};

export const getProductReviewSummary = (
  productId,
  fallbackRating = 0,
  fallbackCount = 0,
) => {
  const reviews = getProductReviews(productId);

  if (reviews.length === 0) {
    return {
      rating: fallbackRating,
      reviewCount: fallbackCount,
      reviews,
    };
  }

  const totalRating = reviews.reduce(
    (sum, review) => sum + (Number(review.rating) || 0),
    0,
  );

  return {
    rating: totalRating / reviews.length,
    reviewCount: reviews.length,
    reviews,
  };
};

export const addProductReview = async (reviewInput) => {
  const order = findCachedOrder(reviewInput.orderId);
  const response = await reviewApi.create({
    orderId: order?.databaseId || reviewInput.orderId,
    productId: reviewInput.productId,
    mode: reviewInput.mode,
    sellerName: reviewInput.sellerName,
    rating: reviewInput.rating,
    title: reviewInput.title,
    comment: reviewInput.comment,
  });

  const savedReview = normalizeReviewRecord(response.data);
  const existingReviews = getAllProductReviews().filter(
    (review) =>
      !(
        review.orderId === savedReview.orderId &&
        review.productId === savedReview.productId &&
        review.customerEmail === savedReview.customerEmail
      ),
  );

  saveReviews([savedReview, ...existingReviews]);
  return savedReview;
};

export const getSupportTickets = () =>
  getSupportTicketCache().sort(
    (firstTicket, secondTicket) =>
      new Date(secondTicket.createdAt) - new Date(firstTicket.createdAt),
  );

export const syncSupportTickets = async (email) => {
  const response = await supportApi.listTickets(email);
  const tickets = (response.data || []).map(normalizeSupportTicketRecord);
  saveSupportTickets(tickets);
  return tickets;
};

export const getSupportTicketsForEmail = (email) => {
  if (!email) {
    return [];
  }

  return getSupportTickets().filter(
    (ticket) => ticket.customerEmail?.toLowerCase() === email.toLowerCase(),
  );
};

export const createSupportTicket = async (ticketInput) => {
  const order = findCachedOrder(ticketInput.orderId);
  const response = await supportApi.createTicket({
    ...ticketInput,
    orderId: order?.databaseId || ticketInput.orderId || "",
    priority: String(ticketInput.priority || "Medium").toUpperCase(),
  });
  const ticket = normalizeSupportTicketRecord(response.data);
  saveSupportTickets([ticket, ...getSupportTicketCache().filter((entry) => entry.id !== ticket.id)]);
  return ticket;
};

export const getSupportChats = () =>
  getSupportChatCache().sort(
    (firstChat, secondChat) =>
      (Number(secondChat.unreadForCustomer) || 0) -
        (Number(firstChat.unreadForCustomer) || 0) ||
      new Date(secondChat.updatedAt || secondChat.createdAt) -
        new Date(firstChat.updatedAt || firstChat.createdAt),
  );

export const syncSupportChats = async (email) => {
  const response = await supportApi.listChats(email);
  const chats = (response.data || []).map(normalizeSupportChatRecord);
  saveSupportChats(chats);
  return chats;
};

export const getSupportChatsForEmail = (email) => {
  if (!email) {
    return [];
  }

  return getSupportChats().filter(
    (chat) => chat.customerEmail?.toLowerCase() === email.toLowerCase(),
  );
};

export const getSupportChatById = (chatId) =>
  getSupportChats().find((chat) => chat.id === chatId) || null;

export const getOrCreateSupportChat = async (chatInput) => {
  const order = findCachedOrder(chatInput.orderId);
  const response = await supportApi.createChat({
    ...chatInput,
    orderId: order?.databaseId || chatInput.orderId || "",
  });
  const chat = normalizeSupportChatRecord(response.data);
  saveSupportChats([chat, ...getSupportChatCache().filter((entry) => entry.id !== chat.id)]);
  return chat;
};

export const sendSupportChatMessage = async (chatId, messageInput) => {
  const response = await supportApi.sendMessage(chatId, {
    text: messageInput.text,
    senderName: messageInput.senderName,
    customerEmail: messageInput.customerEmail,
    attachment: messageInput.attachment,
  });
  const updatedChat = normalizeSupportChatRecord(response.data);
  saveSupportChats(
    [updatedChat, ...getSupportChatCache().filter((entry) => entry.id !== updatedChat.id)],
  );
  return updatedChat;
};

export const markSupportChatAsRead = async (chatId, email = "") => {
  const response = await supportApi.markChatRead(chatId, {
    ...(email ? { customerEmail: email } : {}),
  });
  const updatedChat = normalizeSupportChatRecord(response.data);
  saveSupportChats(
    [updatedChat, ...getSupportChatCache().filter((entry) => entry.id !== updatedChat.id)],
  );
  return updatedChat;
};
