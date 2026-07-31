import assert from "node:assert/strict";
import test from "node:test";
import { buildOrderNumber, normalizeCatalogType as normalizeOrderCatalogType, normalizeOrderMode } from "../src/utils/order-helpers.js";
import {
  buildCatalogMediaGallery,
  buildMediaProxyPath,
  buildProductSlug,
  formatProductNameFromSlug,
  normalizeCatalogType as normalizeProductCatalogType,
  normalizeProductMediaUrls,
} from "../src/utils/product-helpers.js";
import {
  buildSupportAgentReply,
  buildSupportChatWelcomeMessage,
  getAssignedSupportAgent,
  getSupportAssistantName,
  getSupportResponseEta,
  getSupportSlaHours,
  resolveSupportAssistantResponse,
} from "../src/utils/support-helpers.js";

test("product and order catalog helpers normalize expected values", () => {
  assert.equal(normalizeProductCatalogType("retail"), "RETAIL");
  assert.equal(normalizeProductCatalogType("unknown"), "ALL");
  assert.equal(normalizeOrderCatalogType("wholesale"), "WHOLESALE");
  assert.equal(normalizeOrderMode("retail"), "RETAIL");
  assert.equal(normalizeOrderMode("wholesale"), "WHOLESALE");
});

test("generated product slug is lowercase, strict, and timestamp-suffixed", () => {
  const slug = buildProductSlug("Eco Bottle Deluxe");

  assert.match(slug, /^eco-bottle-deluxe-\d{6}$/);
});

test("product media normalization preserves user-provided image sources", () => {
  const normalized = normalizeProductMediaUrls({
    productSlug: "artisan-mug-123456",
    image: "https://cdn.example.com/hero.jpg",
    gallery: [
      "data:image/png;base64,abc",
      "/api/media/products/eco-bamboo-bottle/angle.svg",
      "https://broken.example.com/alt.jpg",
    ],
  });

  assert.equal(normalized.imageUrl, buildMediaProxyPath("https://cdn.example.com/hero.jpg"));
  assert.deepEqual(normalized.galleryUrls, [
    buildMediaProxyPath("https://cdn.example.com/hero.jpg"),
    "data:image/png;base64,abc",
    "/api/media/products/eco-bamboo-bottle/angle.svg",
    buildMediaProxyPath("https://broken.example.com/alt.jpg"),
  ]);
});

test("product media normalization falls back to CampusBasket-owned catalog media", () => {
  const normalized = normalizeProductMediaUrls({
    productSlug: "premium-storefront-654321",
    image: "not-an-image",
    gallery: ["ftp://images.example.com/detail.jpg"],
  });

  assert.deepEqual(normalized, {
    imageUrl: "/api/media/catalog/premium-storefront-654321/hero.svg",
    galleryUrls: buildCatalogMediaGallery("premium-storefront-654321"),
  });
  assert.equal(formatProductNameFromSlug("premium-storefront-654321"), "Premium Storefront");
});

test("product media normalization keeps only the user image when no gallery is provided", () => {
  const normalized = normalizeProductMediaUrls({
    productSlug: "eco-bottle-111111",
    image: "https://images.example.com/photo.jpg",
    gallery: [],
  });

  assert.equal(normalized.imageUrl, buildMediaProxyPath("https://images.example.com/photo.jpg"));
  assert.deepEqual(normalized.galleryUrls, [buildMediaProxyPath("https://images.example.com/photo.jpg")]);
});

test("product media normalization strips predefined catalog views when real media exists", () => {
  const normalized = normalizeProductMediaUrls({
    productSlug: "eco-bottle-111111",
    image: buildMediaProxyPath("https://images.example.com/photo.jpg"),
    gallery: [
      buildMediaProxyPath("https://images.example.com/photo.jpg"),
      ...buildCatalogMediaGallery("eco-bottle-111111"),
    ],
  });

  assert.equal(normalized.imageUrl, buildMediaProxyPath("https://images.example.com/photo.jpg"));
  assert.deepEqual(normalized.galleryUrls, [buildMediaProxyPath("https://images.example.com/photo.jpg")]);
});

test("generated order number follows the CampusBasket prefix format", () => {
  assert.match(buildOrderNumber(), /^ORD-\d+$/);
});

test("support SLA helpers map priorities to hours and user-facing ETA labels", () => {
  assert.equal(getSupportSlaHours("HIGH"), 2);
  assert.equal(getSupportSlaHours("MEDIUM"), 8);
  assert.equal(getSupportSlaHours("LOW"), 24);
  assert.equal(getSupportResponseEta("HIGH"), "Within 2 hours");
  assert.equal(getSupportResponseEta("MEDIUM"), "Within 8 hours");
  assert.equal(getSupportResponseEta("LOW"), "Within 24 hours");
});

test("support agent assignment prefers category keyword matches and falls back by priority", () => {
  assert.equal(
    getAssignedSupportAgent({ category: "Refund and Return", priority: "LOW" }),
    "Riya from CampusBasket Returns",
  );
  assert.equal(
    getAssignedSupportAgent({ category: "Payment Problem", priority: "LOW" }),
    "Karan from CampusBasket Payments",
  );
  assert.equal(
    getAssignedSupportAgent({ category: "General Support", priority: "HIGH" }),
    "Neha from CampusBasket Resolution",
  );
});

test("support chat helpers produce contextual welcome and reply messages", () => {
  const chat = {
    id: "chat_123",
    customerName: "Abhi",
    assignedAgentName: "Aisha from CampusBasket Care",
    orderId: "ORD-101",
  };

  const welcomeMessage = buildSupportChatWelcomeMessage(chat);
  const refundReply = buildSupportAgentReply("I need a refund for a damaged item", chat);
  const paymentReply = buildSupportAgentReply("My card was charged twice", chat);

  assert.deepEqual(welcomeMessage, {
    chatId: "chat_123",
    senderType: "AGENT",
    senderName: getSupportAssistantName(),
    text: `Hi Abhi, I'm ${getSupportAssistantName()}. I can help with order updates, refund basics, payment questions, and routing you to a human agent for order ORD-101. Ask your question, or reply "agent" any time for live support.`,
  });
  assert.match(refundReply, /refund and return support/i);
  assert.match(paymentReply, /payment issue/i);
});

test("support assistant auto-replies to basic questions and escalates human requests", () => {
  const chat = {
    orderId: "ORD-202",
    order: {
      orderNumber: "ORD-202",
      status: "SHIPPED",
      paymentMethod: "CARD",
      payment: {
        status: "CAPTURED",
      },
    },
  };

  const deliveryReply = resolveSupportAssistantResponse({
    messageText: "Where is my order and why is delivery late?",
    chat,
  });
  const humanReply = resolveSupportAssistantResponse({
    messageText: "I want to talk to an agent",
    chat,
  });
  const attachmentReply = resolveSupportAssistantResponse({
    messageText: "",
    chat,
    attachment: {
      url: "data:image/png;base64,abc",
    },
  });

  assert.equal(deliveryReply.mode, "auto_reply");
  assert.match(deliveryReply.text, /reply "agent"/i);
  assert.equal(humanReply.mode, "handoff");
  assert.match(humanReply.text, /human support agent/i);
  assert.equal(attachmentReply.mode, "handoff");
  assert.match(attachmentReply.text, /attachment/i);
});

test("support assistant uses linked order and payment state in automated replies", () => {
  const refundedChat = {
    orderId: "ORD-303",
    order: {
      orderNumber: "ORD-303",
      status: "CANCELLED",
      paymentMethod: "CARD",
      payment: {
        status: "REFUNDED",
      },
    },
  };
  const pendingPaymentChat = {
    orderId: "ORD-404",
    order: {
      orderNumber: "ORD-404",
      status: "PLACED",
      paymentMethod: "UPI",
      payment: {
        status: "PENDING",
      },
    },
  };

  const refundReply = resolveSupportAssistantResponse({
    messageText: "What is my refund status?",
    chat: refundedChat,
  });
  const paymentReply = resolveSupportAssistantResponse({
    messageText: "My payment is pending",
    chat: pendingPaymentChat,
  });
  const cancelReply = resolveSupportAssistantResponse({
    messageText: "Can I cancel my order?",
    chat: pendingPaymentChat,
  });

  assert.equal(refundReply.mode, "auto_reply");
  assert.match(refundReply.text, /already marked as Refunded/i);
  assert.equal(paymentReply.mode, "auto_reply");
  assert.match(paymentReply.text, /order ORD-404 is still marked as Pending/i);
  assert.equal(cancelReply.mode, "auto_reply");
  assert.match(cancelReply.text, /may still be possible/i);
});
