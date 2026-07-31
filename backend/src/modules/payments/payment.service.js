import { env } from "../../config/env.js";
import { prisma } from "../../lib/prisma.js";
import {
  createRazorpayOrder,
  verifyRazorpaySignature,
  verifyRazorpayWebhookSignature,
} from "../../lib/razorpay.js";
import AppError from "../../utils/app-error.js";
import {
  orderInclude,
  persistOrderFromPayment,
  prepareOrderDraft,
  sendOrderConfirmationForOrder,
} from "../orders/order.shared.js";

const toPaise = (amount) => Math.round(Number(amount) * 100);

const buildReceipt = () => `bb_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

const buildPayerLabel = ({ paymentMethod, shipping }) => {
  if (paymentMethod === "UPI") {
    return `Razorpay UPI for ${shipping.email}`;
  }

  return `Razorpay card checkout for ${shipping.name}`;
};

const resolvePaymentOwnership = ({ payment, user, email }) => {
  if (!payment?.order) {
    throw new AppError(404, "Payment order was not found.");
  }

  if (user?.role === "ADMIN") {
    return;
  }

  if (
    user?.role === "CUSTOMER" &&
    payment.order.customerId &&
    payment.order.customerId === user.id
  ) {
    return;
  }

  if (!user && email && payment.order.shippingEmail?.toLowerCase() === email.toLowerCase()) {
    return;
  }

  if (
    user?.role === "CUSTOMER" &&
    payment.order.shippingEmail?.toLowerCase() === user.email?.toLowerCase()
  ) {
    return;
  }

  throw new AppError(403, "You do not have access to this payment.");
};

const findRazorpayPaymentByOrderId = (gatewayOrderId) =>
  prisma.payment.findFirst({
    where: {
      provider: "RAZORPAY",
      gatewayOrderId,
    },
    include: {
      order: {
        include: orderInclude,
      },
    },
  });

const markPaymentCaptured = async ({
  paymentId,
  orderId,
  razorpayPaymentId,
  razorpaySignature = null,
}) => {
  await prisma.$transaction([
    prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: "CAPTURED",
        reference: razorpayPaymentId,
        gatewayPaymentId: razorpayPaymentId,
        gatewaySignature: razorpaySignature,
        failureReason: null,
        paidAt: new Date(),
      },
    }),
    prisma.order.update({
      where: { id: orderId },
      data: {
        status: "CONFIRMED",
      },
    }),
  ]);

  return sendOrderConfirmationForOrder(orderId);
};

const markPaymentFailed = async ({ paymentId, gatewayPaymentId = null, reason = null }) =>
  prisma.payment.update({
    where: { id: paymentId },
    data: {
      status: "FAILED",
      gatewayPaymentId: gatewayPaymentId || undefined,
      failureReason: reason || "Payment failed.",
    },
  });

const createGatewayOrderForPayment = async ({ payment, order }) => {
  const razorpayOrder = await createRazorpayOrder({
    amount: toPaise(payment.amount),
    currency: payment.currency || "GHS",
    receipt: buildReceipt(),
    notes: {
      source: "CampusBasket",
      payment_method: payment.method,
      customer_email: order.shippingEmail,
      CampusBasket_order_number: order.orderNumber,
    },
  });

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: "PENDING",
      reference: razorpayOrder.id,
      gatewayOrderId: razorpayOrder.id,
      gatewayPaymentId: null,
      gatewaySignature: null,
      failureReason: null,
      payerLabel: buildPayerLabel({
        paymentMethod: payment.method,
        shipping: {
          email: order.shippingEmail,
          name: order.shippingName,
        },
      }),
    },
  });

  return {
    keyId: env.razorpayKeyId,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    razorpayOrderId: razorpayOrder.id,
  };
};

export const createRazorpayCheckout = async ({ customer, payload }) => {
  const draft = await prepareOrderDraft(payload);
  const razorpayOrder = await createRazorpayOrder({
    amount: toPaise(draft.amount),
    currency: "INR",
    receipt: buildReceipt(),
    notes: {
      source: "CampusBasket",
      payment_method: payload.paymentMethod,
      customer_email: payload.shipping.email,
    },
  });

  const order = await persistOrderFromPayment({
    customer,
    payload,
    draft,
    sendConfirmation: false,
    paymentInput: {
      provider: "RAZORPAY",
      method: payload.paymentMethod,
      status: "PENDING",
      reference: razorpayOrder.id,
      payerLabel: buildPayerLabel(payload),
      gatewayOrderId: razorpayOrder.id,
      paidAt: null,
      currency: "INR",
      amount: draft.amount,
    },
  });

  return {
    keyId: env.razorpayKeyId,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    razorpayOrderId: razorpayOrder.id,
    order,
  };
};

export const verifyRazorpayCheckout = async ({
  user,
  email,
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
}) => {
  const payment = await findRazorpayPaymentByOrderId(razorpayOrderId);

  if (!payment || !payment.order) {
    throw new AppError(404, "Razorpay checkout order was not found.");
  }

  resolvePaymentOwnership({ payment, user, email });

  if (payment.status === "CAPTURED") {
    return payment.order;
  }

  const isValid = verifyRazorpaySignature({
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
  });

  if (!isValid) {
    await markPaymentFailed({
      paymentId: payment.id,
      gatewayPaymentId: razorpayPaymentId,
      reason: "Invalid Razorpay signature.",
    });

    throw new AppError(400, "Unable to verify Razorpay payment signature.");
  }

  return markPaymentCaptured({
    paymentId: payment.id,
    orderId: payment.orderId,
    razorpayPaymentId,
    razorpaySignature,
  });
};

export const retryRazorpayCheckout = async ({ user, email, orderId }) => {
  const order = await prisma.order.findFirst({
    where: {
      OR: [{ id: orderId }, { orderNumber: orderId }],
    },
    include: {
      payment: true,
    },
  });

  if (!order?.payment) {
    throw new AppError(404, "Order payment record was not found.");
  }

  resolvePaymentOwnership({
    payment: {
      order,
    },
    user,
    email,
  });

  if (order.payment.provider !== "RAZORPAY") {
    throw new AppError(400, "Only Razorpay payments can be retried here.");
  }

  if (order.payment.method === "COD") {
    throw new AppError(400, "Cash on delivery orders do not need payment retry.");
  }

  if (order.payment.status === "CAPTURED") {
    return {
      keyId: env.razorpayKeyId,
      amount: toPaise(order.payment.amount),
      currency: order.payment.currency || "INR",
      razorpayOrderId: order.payment.gatewayOrderId,
      order: await prisma.order.findUnique({
        where: { id: order.id },
        include: orderInclude,
      }),
      alreadyCaptured: true,
    };
  }

  const gatewayCheckout = await createGatewayOrderForPayment({
    payment: order.payment,
    order,
  });

  return {
    ...gatewayCheckout,
    order: await prisma.order.findUnique({
      where: { id: order.id },
      include: orderInclude,
    }),
    alreadyCaptured: false,
  };
};

export const cancelRazorpayCheckout = async ({ user, email, razorpayOrderId }) => {
  const payment = await findRazorpayPaymentByOrderId(razorpayOrderId);

  if (!payment || !payment.order) {
    return { cancelled: false };
  }

  resolvePaymentOwnership({ payment, user, email });

  if (payment.status !== "PENDING") {
    return { cancelled: false };
  }

  await prisma.$transaction(async (transaction) => {
    for (const item of payment.order.items) {
      if (item.productId) {
        await transaction.product.update({
          where: { id: item.productId },
          data: {
            inventory: {
              increment: item.quantity,
            },
          },
        });
      }
    }

    await transaction.order.delete({
      where: { id: payment.orderId },
    });
  });

  return { cancelled: true };
};

export const processRazorpayWebhook = async ({ rawBody, signature }) => {
  const isValid = verifyRazorpayWebhookSignature({
    rawBody,
    signature,
  });

  if (!isValid) {
    throw new AppError(400, "Invalid Razorpay webhook signature.");
  }

  const payload = JSON.parse(rawBody.toString("utf8"));
  const event = payload.event || "";
  const paymentEntity = payload?.payload?.payment?.entity || null;
  const gatewayOrderId = paymentEntity?.order_id || "";
  const gatewayPaymentId = paymentEntity?.id || "";

  if (!gatewayOrderId) {
    return { handled: false, event };
  }

  const payment = await findRazorpayPaymentByOrderId(gatewayOrderId);

  if (!payment) {
    return { handled: false, event };
  }

  if (event === "payment.captured" || event === "order.paid") {
    if (payment.status === "CAPTURED") {
      return { handled: true, event, orderId: payment.orderId };
    }

    await markPaymentCaptured({
      paymentId: payment.id,
      orderId: payment.orderId,
      razorpayPaymentId: gatewayPaymentId || payment.reference,
      razorpaySignature: payment.gatewaySignature || null,
    });

    return { handled: true, event, orderId: payment.orderId };
  }

  if (event === "payment.failed") {
    await markPaymentFailed({
      paymentId: payment.id,
      gatewayPaymentId,
      reason: paymentEntity?.error_description || paymentEntity?.description || "Payment failed.",
    });

    return { handled: true, event, orderId: payment.orderId };
  }

  return { handled: false, event, orderId: payment.orderId };
};
