import { prisma } from "../../lib/prisma.js";
import { createAuditLog, createNotification } from "../../lib/activity.js";
import { sendEmail } from "../../lib/mailer.js";
import { sendSms } from "../../lib/sms.js";
import AppError from "../../utils/app-error.js";
import {
  buildOrderConfirmationEmail,
  buildOrderStatusUpdateEmail,
} from "../../utils/order-email.js";
import {
  buildOrderConfirmationSms,
  buildOrderStatusSms,
} from "../../utils/order-sms.js";
import {
  buildOrderNumber,
  normalizeCatalogType,
  normalizeOrderMode,
} from "../../utils/order-helpers.js";

export const orderInclude = {
  customer: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  },
  items: {
    include: {
      product: true,
    },
  },
  emailLogs: {
    orderBy: {
      createdAt: "desc",
    },
  },
  smsLogs: {
    orderBy: {
      createdAt: "desc",
    },
  },
  payment: true,
};

export const buildOrderLookupWhere = (orderId) => ({
  OR: [{ id: orderId }, { orderNumber: orderId }],
});

export const deriveOrderStatusFromSellerItems = (items) => {
  const sellerStatuses = items.map((item) => item.sellerStatus);

  if (sellerStatuses.length === 0 || sellerStatuses.every((status) => status === "NEW")) {
    return "PLACED";
  }

  if (sellerStatuses.every((status) => status === "CANCELLED")) {
    return "CANCELLED";
  }

  if (sellerStatuses.every((status) => status === "DELIVERED")) {
    return "DELIVERED";
  }

  if (sellerStatuses.every((status) => ["SHIPPED", "DELIVERED"].includes(status))) {
    return "SHIPPED";
  }

  return "PROCESSING";
};

const buildOrderItemData = (cartItem, product) => {
  const mode = normalizeOrderMode(cartItem.mode);
  const catalogTypeSnapshot = normalizeCatalogType(product.catalogType);
  const retailPrice = Number(product.retailPrice);
  const wholesalePrice = Number(product.wholesalePrice);
  const quantity = Number(cartItem.quantity || 1);

  if (mode === "WHOLESALE" && quantity < product.minWholesaleQty) {
    throw new AppError(
      400,
      `${product.name} requires at least ${product.minWholesaleQty} units for wholesale purchase.`,
    );
  }

  if (product.inventory < quantity) {
    throw new AppError(400, `${product.name} does not have enough inventory.`);
  }

  const unitPrice = mode === "WHOLESALE" ? wholesalePrice : retailPrice;

  return {
    productId: product.id,
    sellerId: product.sellerId,
    sellerNameSnapshot: product.seller.storeName || product.seller.name,
    productNameSnapshot: product.name,
    imageUrlSnapshot: product.imageUrl,
    categorySnapshot: product.category,
    catalogTypeSnapshot,
    mode,
    quantity,
    retailPrice,
    wholesalePrice,
    unitPrice,
    lineTotal: unitPrice * quantity,
  };
};

export const prepareOrderDraft = async (payload) => {
  const productIds = [...new Set(payload.items.map((item) => item.id))];
  const products = await prisma.product.findMany({
    where: {
      id: { in: productIds },
      isActive: true,
    },
    include: {
      seller: {
        select: {
          id: true,
          name: true,
          storeName: true,
        },
      },
    },
  });

  if (products.length !== productIds.length) {
    throw new AppError(404, "One or more products no longer exist in the catalog.");
  }

  const productMap = new Map(products.map((product) => [product.id, product]));
  const items = payload.items.map((item) => {
    const product = productMap.get(item.id);

    if (!product) {
      throw new AppError(404, `Product ${item.id} was not found.`);
    }

    return buildOrderItemData(item, product);
  });

  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const shippingCharge = 0;
  const amount = subtotal + shippingCharge;

  return {
    items,
    subtotal,
    shippingCharge,
    amount,
  };
};

const createEmailLogIfMissing = async ({ order, type, payload }) => {
  const existingLog = order.emailLogs.find((entry) => entry.type === type);

  if (existingLog) {
    return existingLog;
  }

  return prisma.emailLog.create({
    data: {
      orderId: order.id,
      type,
      toEmail: order.shippingEmail,
      subject: payload.subject,
      body: payload.text,
      status: "PREPARED",
    },
  });
};

const createSmsLogIfMissing = async ({ order, type, payload }) => {
  const existingLog = order.smsLogs.find((entry) => entry.type === type);

  if (existingLog) {
    return existingLog;
  }

  return prisma.smsLog.create({
    data: {
      orderId: order.id,
      type,
      toPhone: order.shippingPhone,
      message: payload.message,
      provider: null,
      externalId: null,
      status: "PREPARED",
    },
  });
};

const shouldSendSmsForOrderStatus = (status) =>
  ["SHIPPED", "DELIVERED", "CANCELLED"].includes(status);

const sendOrderSmsIfPossible = async ({
  order,
  type,
  payload,
  skipIfSent = false,
}) => {
  if (!order.shippingPhone?.trim()) {
    return null;
  }

  const smsLog =
    type === "ORDER_CONFIRMATION"
      ? await createSmsLogIfMissing({ order, type, payload })
      : await prisma.smsLog.create({
          data: {
            orderId: order.id,
            type,
            toPhone: order.shippingPhone,
            message: payload.message,
            provider: null,
            externalId: null,
            status: "PREPARED",
          },
        });

  if (skipIfSent && smsLog.status === "SENT") {
    return smsLog;
  }

  try {
    const delivery = await sendSms({
      to: smsLog.toPhone,
      message: payload.message,
    });

    await prisma.smsLog.update({
      where: { id: smsLog.id },
      data: {
        status: "SENT",
        message: payload.message,
        provider: delivery.provider,
        externalId: delivery.externalId || null,
      },
    });

    await createAuditLog({
      action: "ORDER_SMS_SENT",
      entityType: "ORDER",
      entityId: order.id,
      details: {
        type,
        toPhone: smsLog.toPhone,
        provider: delivery.provider,
        status: order.status,
      },
    });

    if (delivery.usedFallback && delivery.preview) {
      console.info(`[sms] Order SMS preview for ${smsLog.toPhone}\n${delivery.preview}`);
    }
  } catch (error) {
    console.error("[sms] Failed to send order SMS update.", error);

    await prisma.smsLog.update({
      where: { id: smsLog.id },
      data: {
        status: "FAILED",
      },
    });
  }

  return prisma.smsLog.findUnique({
    where: { id: smsLog.id },
  });
};

export const sendOrderConfirmationForOrder = async (orderId) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: orderInclude,
  });

  if (!order) {
    throw new AppError(404, "Order not found.");
  }

  const emailPayload = buildOrderConfirmationEmail(order);
  const smsPayload = buildOrderConfirmationSms(order);
  const emailLog = await createEmailLogIfMissing({
    order,
    type: "ORDER_CONFIRMATION",
    payload: emailPayload,
  });

  if (
    emailLog.status === "SENT" &&
    (!order.shippingPhone ||
      order.smsLogs.some(
        (entry) => entry.type === "ORDER_CONFIRMATION" && entry.status === "SENT",
      ))
  ) {
    return order;
  }

  try {
    const delivery = await sendEmail({
      to: emailLog.toEmail,
      subject: emailPayload.subject,
      text: emailPayload.text,
      html: emailPayload.html,
    });

    await prisma.emailLog.update({
      where: { id: emailLog.id },
      data: {
        status: "SENT",
        subject: emailPayload.subject,
        body: emailPayload.text,
      },
    });

    await createAuditLog({
      action: "ORDER_EMAIL_SENT",
      entityType: "ORDER",
      entityId: order.id,
      details: {
        type: "ORDER_CONFIRMATION",
        toEmail: emailLog.toEmail,
      },
    });

    if (delivery.usedFallback && delivery.preview) {
      console.info(
        `[mail] Order confirmation preview for ${emailLog.toEmail}\n${delivery.preview}`,
      );
    }
  } catch (error) {
    console.error("[mail] Failed to send order confirmation email.", error);

    await prisma.emailLog.update({
      where: { id: emailLog.id },
      data: {
        status: "FAILED",
      },
    });
  }

  await sendOrderSmsIfPossible({
    order,
    type: "ORDER_CONFIRMATION",
    payload: smsPayload,
    skipIfSent: true,
  });

  return prisma.order.findUnique({
    where: { id: orderId },
    include: orderInclude,
  });
};

export const sendOrderStatusUpdateForOrder = async (orderId) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: orderInclude,
  });

  if (!order) {
    throw new AppError(404, "Order not found.");
  }

  const emailPayload = buildOrderStatusUpdateEmail(order);
  const smsPayload = buildOrderStatusSms(order);
  const emailLog = await prisma.emailLog.create({
    data: {
      orderId: order.id,
      type: "ORDER_STATUS_UPDATE",
      toEmail: order.shippingEmail,
      subject: emailPayload.subject,
      body: emailPayload.text,
      status: "PREPARED",
    },
  });

  try {
    const delivery = await sendEmail({
      to: emailLog.toEmail,
      subject: emailPayload.subject,
      text: emailPayload.text,
      html: emailPayload.html,
    });

    await prisma.emailLog.update({
      where: { id: emailLog.id },
      data: {
        status: "SENT",
      },
    });

    await Promise.all([
      createNotification({
        userId: order.customerId,
        type: "ORDER_STATUS_CHANGED",
        title: `Order ${order.orderNumber} is ${order.status.toLowerCase()}`,
        message: `Your CampusBasket order is now ${order.status.toLowerCase().replaceAll("_", " ")}.`,
        orderId: order.id,
        details: {
          orderNumber: order.orderNumber,
          status: order.status,
        },
      }),
      createAuditLog({
        action: "ORDER_EMAIL_SENT",
        entityType: "ORDER",
        entityId: order.id,
        details: {
          type: "ORDER_STATUS_UPDATE",
          toEmail: emailLog.toEmail,
          status: order.status,
        },
      }),
    ]);

    if (delivery.usedFallback && delivery.preview) {
      console.info(
        `[mail] Order status update preview for ${emailLog.toEmail}\n${delivery.preview}`,
      );
    }
  } catch (error) {
    console.error("[mail] Failed to send order status update email.", error);

    await prisma.emailLog.update({
      where: { id: emailLog.id },
      data: {
        status: "FAILED",
      },
    });
  }

  if (shouldSendSmsForOrderStatus(order.status)) {
    await sendOrderSmsIfPossible({
      order,
      type: "ORDER_STATUS_UPDATE",
      payload: smsPayload,
    });
  }

  return prisma.order.findUnique({
    where: { id: orderId },
    include: orderInclude,
  });
};

export const persistOrderFromPayment = async ({
  customer,
  payload,
  paymentInput,
  draft = null,
  sendConfirmation = true,
}) => {
  const orderDraft = draft || (await prepareOrderDraft(payload));

  const createdOrder = await prisma.$transaction(async (transaction) => {
    const order = await transaction.order.create({
      data: {
        orderNumber: buildOrderNumber(),
        customerId: customer?.id,
        guestEmail: customer ? null : payload.shipping.email,
        subtotal: orderDraft.subtotal,
        shippingCharge: orderDraft.shippingCharge,
        amount: orderDraft.amount,
        paymentMethod: paymentInput.method,
        status: paymentInput.status === "CAPTURED" ? "CONFIRMED" : "PLACED",
        shippingName: payload.shipping.name,
        shippingEmail: payload.shipping.email,
        shippingPhone: payload.shipping.phone,
        shippingAddress: payload.shipping.address,
        shippingCity: payload.shipping.city,
        shippingPincode: payload.shipping.pincode,
        items: {
          create: orderDraft.items,
        },
      },
    });

    await transaction.payment.create({
      data: {
        orderId: order.id,
        provider: paymentInput.provider,
        method: paymentInput.method,
        status: paymentInput.status,
        amount: orderDraft.amount,
        currency: paymentInput.currency || "INR",
        reference: paymentInput.reference,
        payerLabel: paymentInput.payerLabel || null,
        gatewayOrderId: paymentInput.gatewayOrderId || null,
        gatewayPaymentId: paymentInput.gatewayPaymentId || null,
        gatewaySignature: paymentInput.gatewaySignature || null,
        failureReason: paymentInput.failureReason || null,
        paidAt: paymentInput.paidAt || null,
      },
    });

    await Promise.all(
      orderDraft.items.map((item) =>
        transaction.product.update({
          where: { id: item.productId },
          data: {
            inventory: {
              decrement: item.quantity,
            },
          },
        }),
      ),
    );

    return order;
  });

  await createNotification({
    userId: customer?.id,
    type: "ORDER_PLACED",
    title: `Order ${createdOrder.orderNumber} placed successfully`,
    message: "Your CampusBasket order has been placed and is ready for fulfilment updates.",
    orderId: createdOrder.id,
    details: {
      orderNumber: createdOrder.orderNumber,
      paymentMethod: paymentInput.method,
    },
  });

  if (sendConfirmation) {
    return sendOrderConfirmationForOrder(createdOrder.id);
  }

  return prisma.order.findUnique({
    where: { id: createdOrder.id },
    include: orderInclude,
  });
};

export const buildSimulationPaymentRecord = ({ paymentMethod, paymentDetails, amount }) => {
  if (paymentMethod === "COD") {
    return {
      provider: "COD_SIMULATION",
      method: "COD",
      status: "PENDING",
      reference: `COD-${Date.now()}-${Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, "0")}`,
      payerLabel: "Cash on delivery",
      paidAt: null,
      currency: "INR",
      amount,
    };
  }

  if (paymentMethod === "UPI") {
    return {
      provider: "UPI_SIMULATION",
      method: "UPI",
      status: "CAPTURED",
      reference: `UPI-${Date.now()}-${Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, "0")}`,
      payerLabel: paymentDetails?.upiId || "UPI payment",
      paidAt: new Date(),
      currency: "INR",
      amount,
    };
  }

  return {
    provider: "CARD_SIMULATION",
    method: "CARD",
    status: "CAPTURED",
    reference: `CARD-${Date.now()}-${Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0")}`,
    payerLabel: `${paymentDetails?.cardNetwork || "Card"} ending ${paymentDetails?.cardLast4 || "0000"}`,
    paidAt: new Date(),
    currency: "INR",
    amount,
  };
};
