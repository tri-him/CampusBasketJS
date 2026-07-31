import crypto from "crypto";
import { env } from "../config/env.js";
import AppError from "../utils/app-error.js";

export const isDemoMode = () => env.razorpayKeyId?.includes("dummy");

const ensureConfigured = () => {
  if (!env.razorpayKeyId || !env.razorpayKeySecret) {
    throw new AppError(
      503,
      "Razorpay is not configured yet. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in backend/.env.",
    );
  }
};

const buildAuthHeader = () =>
  `Basic ${Buffer.from(`${env.razorpayKeyId}:${env.razorpayKeySecret}`).toString("base64")}`;

export const createRazorpayOrder = async ({ amount, currency = "GHS", receipt, notes = {} }) => {
  ensureConfigured();

  if (isDemoMode()) {
    return {
      id: `order_dummy_${Date.now()}`,
      amount,
      currency,
      receipt,
      status: "created",
      attempts: 0,
      notes,
    };
  }

  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: buildAuthHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount,
      currency,
      receipt,
      notes,
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new AppError(
      502,
      data?.error?.description || "Unable to create a Razorpay order right now.",
    );
  }

  return data;
};

export const verifyRazorpaySignature = ({
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
}) => {
  ensureConfigured();

  if (isDemoMode() && razorpaySignature === "dummy_signature") {
    return true;
  }

  const generatedSignature = crypto
    .createHmac("sha256", env.razorpayKeySecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");

  return generatedSignature === razorpaySignature;
};

export const verifyRazorpayWebhookSignature = ({ rawBody, signature }) => {
  if (!env.razorpayWebhookSecret) {
    throw new AppError(
      503,
      "Razorpay webhook secret is not configured yet. Add RAZORPAY_WEBHOOK_SECRET in backend/.env.",
    );
  }

  const expectedSignature = crypto
    .createHmac("sha256", env.razorpayWebhookSecret)
    .update(rawBody)
    .digest("hex");

  const expectedBuffer = Buffer.from(expectedSignature, "utf8");
  const receivedBuffer = Buffer.from(String(signature || ""), "utf8");

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
};
