import { formatCurrency, formatStatusLabel } from "./email-layout.js";

const buildOrderShortSummary = (order) => {
  const firstItem = order.items?.[0]?.productNameSnapshot || "your item";
  const extraItemCount = Math.max(0, (order.items?.length || 0) - 1);
  return extraItemCount > 0
    ? `${firstItem} +${extraItemCount} more`
    : firstItem;
};

export const buildOrderConfirmationSms = (order) => ({
  type: "ORDER_CONFIRMATION",
  message: `CampusBasket: Order ${order.orderNumber} confirmed for ${buildOrderShortSummary(order)}. Total ${formatCurrency(order.amount)}. We will email you full details shortly.`,
});

export const buildOrderStatusSms = (order) => {
  const statusLabel = formatStatusLabel(order.status);
  const nextStep =
    order.status === "SHIPPED"
      ? "Your order is on the way."
      : order.status === "DELIVERED"
        ? "Your order has been delivered."
        : order.status === "CANCELLED"
          ? "Your order has been cancelled."
          : `Status is now ${statusLabel}.`;

  return {
    type: "ORDER_STATUS_UPDATE",
    message: `CampusBasket: Order ${order.orderNumber} update. ${nextStep} Current status: ${statusLabel}.`,
  };
};
