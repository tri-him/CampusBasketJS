import {
  formatCurrency,
  formatOrderMode,
  formatStatusLabel,
  renderEmailLayout,
} from "./email-layout.js";

const buildOrderItemsText = (order) =>
  (order.items || [])
    .map(
      (item) =>
        `- ${item.productNameSnapshot} (${formatOrderMode(item.mode)}) x${item.quantity} - ${formatCurrency(item.lineTotal)}`,
    )
    .join("\n");

const buildOrderItemsHtml = (order) =>
  (order.items || [])
    .map(
      (item) => `
        <div style="padding:14px 16px;border:1px solid #e2e8f0;border-radius:18px;background:#ffffff;margin-bottom:10px;">
          <div style="font-size:15px;font-weight:700;color:#0f172a;">${item.productNameSnapshot}</div>
          <div style="margin-top:6px;font-size:13px;color:#64748b;">${formatOrderMode(item.mode)} | Qty ${item.quantity}</div>
          <div style="margin-top:8px;font-size:14px;font-weight:700;color:#059669;">${formatCurrency(item.lineTotal)}</div>
        </div>
      `,
    )
    .join("");

const buildShippingText = (order) =>
  `${order.shippingAddress}, ${order.shippingCity}, ${order.shippingPincode}`;

const buildShippingHtml = (order) =>
  `<div>${order.shippingAddress}</div><div>${order.shippingCity}, ${order.shippingPincode}</div>`;

export const buildOrderConfirmationEmail = (order) => {
  const subject = `CampusBasket Order Confirmation - ${order.orderNumber}`;
  const text = [
    `Hi ${order.shippingName || "Customer"},`,
    "",
    "Thank you for shopping with CampusBasket.",
    `Your order ${order.orderNumber} has been placed successfully.`,
    "",
    "Order Summary:",
    buildOrderItemsText(order),
    "",
    `Payment Method: ${order.paymentMethod}`,
    `Payment Status: ${formatStatusLabel(order.payment?.status || "PENDING")}`,
    ...(order.payment?.reference ? [`Payment Reference: ${order.payment.reference}`] : []),
    `Order Total: ${formatCurrency(order.amount)}`,
    "",
    "Shipping Address:",
    buildShippingText(order),
    "",
    "We will keep you updated as your order moves forward.",
    "",
    "Team CampusBasket",
  ].join("\n");

  const html = renderEmailLayout({
    preheader: `Your CampusBasket order ${order.orderNumber} is confirmed.`,
    eyebrow: "Order Confirmed",
    title: `Your order ${order.orderNumber} is in.`,
    intro:
      "Thanks for shopping with CampusBasket. We have saved your order details and will keep you posted as fulfilment moves forward.",
    badges: [
      { label: "Payment Method", value: order.paymentMethod },
      {
        label: "Payment Status",
        value: formatStatusLabel(order.payment?.status || "PENDING"),
      },
      { label: "Order Total", value: formatCurrency(order.amount) },
    ],
    sections: [
      {
        heading: "Order Summary",
        content: buildOrderItemsHtml(order),
      },
      {
        heading: "Shipping Address",
        content: buildShippingHtml(order),
      },
      {
        heading: "What Happens Next",
        content:
          "Your seller will begin processing the order soon. You will receive another email when the order status changes.",
      },
    ],
  });

  return { subject, text, html };
};

export const buildOrderStatusUpdateEmail = (order) => {
  const subject = `CampusBasket Order Update - ${order.orderNumber} is ${formatStatusLabel(order.status)}`;
  const statusText = formatStatusLabel(order.status);
  const text = [
    `Hi ${order.shippingName || "Customer"},`,
    "",
    `Your CampusBasket order ${order.orderNumber} is now ${statusText}.`,
    "",
    "Updated Items:",
    buildOrderItemsText(order),
    "",
    `Current Status: ${statusText}`,
    `Order Total: ${formatCurrency(order.amount)}`,
    "",
    "Shipping Address:",
    buildShippingText(order),
    "",
    "You can continue tracking the order from your CampusBasket account.",
    "",
    "Team CampusBasket",
  ].join("\n");

  const html = renderEmailLayout({
    preheader: `Your CampusBasket order ${order.orderNumber} is now ${statusText}.`,
    eyebrow: "Order Update",
    title: `Order ${order.orderNumber} is ${statusText}.`,
    intro:
      order.status === "CANCELLED"
        ? "We have recorded a cancellation update for your order."
        : "Here is the latest fulfilment progress for your CampusBasket order.",
    badges: [
      { label: "Current Status", value: statusText },
      { label: "Payment Method", value: order.paymentMethod },
      { label: "Order Total", value: formatCurrency(order.amount) },
    ],
    sections: [
      {
        heading: "Updated Items",
        content: buildOrderItemsHtml(order),
      },
      {
        heading: "Shipping Address",
        content: buildShippingHtml(order),
      },
      {
        heading: "Next Step",
        content:
          order.status === "SHIPPED"
            ? "Your order is on the move. Keep an eye on your account for the next delivery update."
            : order.status === "DELIVERED"
              ? "Your order has been marked as delivered. You can now review the purchased items inside CampusBasket."
              : order.status === "CANCELLED"
                ? "If this cancellation was unexpected, please contact CampusBasket support and share your order number."
                : "Your seller is actively progressing the order. We will send another update if anything changes.",
      },
    ],
  });

  return { subject, text, html };
};
