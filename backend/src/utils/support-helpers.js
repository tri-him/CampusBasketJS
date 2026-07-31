const prioritySlaMap = {
  HIGH: 2,
  MEDIUM: 8,
  LOW: 24,
};
const supportAssistantName = "CampusBasket Support Assistant";

const agentAssignments = [
  {
    match: ["refund", "return"],
    agent: "Riya from CampusBasket Returns",
  },
  {
    match: ["payment", "upi", "card"],
    agent: "Karan from CampusBasket Payments",
  },
  {
    match: ["delivery", "delay", "shipping", "logistics"],
    agent: "Aisha from CampusBasket Care",
  },
  {
    match: ["seller", "behavior", "quality"],
    agent: "Neha from CampusBasket Resolution",
  },
];

export const getSupportSlaHours = (priority) =>
  prioritySlaMap[String(priority || "MEDIUM").trim().toUpperCase()] || prioritySlaMap.MEDIUM;

export const getSupportResponseEta = (priority) => {
  const slaHours = getSupportSlaHours(priority);

  if (slaHours <= 2) {
    return "Within 2 hours";
  }

  if (slaHours <= 8) {
    return "Within 8 hours";
  }

  return "Within 24 hours";
};

export const getAssignedSupportAgent = ({ category, priority }) => {
  const normalizedCategory = String(category || "").trim().toLowerCase();
  const matchingAgent = agentAssignments.find((entry) =>
    entry.match.some((keyword) => normalizedCategory.includes(keyword)),
  );

  if (matchingAgent) {
    return matchingAgent.agent;
  }

  return String(priority || "").trim().toUpperCase() === "HIGH"
    ? "Neha from CampusBasket Resolution"
    : "Aisha from CampusBasket Care";
};

export const getSupportAssistantName = () => supportAssistantName;

export const buildSupportChatWelcomeMessage = (chat) => ({
  chatId: chat.id,
  senderType: "AGENT",
  senderName: supportAssistantName,
  text: `Hi ${chat.customerName || "there"}, I'm ${supportAssistantName}. I can help with order updates, refund basics, payment questions, and routing you to a human agent${chat.orderId ? ` for order ${chat.orderId}` : ""}. Ask your question, or reply "agent" any time for live support.`,
});

export const buildSupportAgentReply = (messageText, chat) => {
  const normalizedMessage = messageText.toLowerCase();

  if (normalizedMessage.includes("refund") || normalizedMessage.includes("return")) {
    return `I've marked this under refund and return support${chat.orderId ? ` for ${chat.orderId}` : ""}. Please share whether the item was damaged, incorrect, or no longer needed so we can guide the next action.`;
  }

  if (
    normalizedMessage.includes("late") ||
    normalizedMessage.includes("delay") ||
    normalizedMessage.includes("delivery") ||
    normalizedMessage.includes("where is")
  ) {
    return `I'm checking the delivery concern${chat.orderId ? ` for ${chat.orderId}` : ""}. Please confirm the latest status you saw so support can investigate the shipping timeline faster.`;
  }

  if (
    normalizedMessage.includes("payment") ||
    normalizedMessage.includes("charged") ||
    normalizedMessage.includes("upi") ||
    normalizedMessage.includes("card")
  ) {
    return "I've tagged this as a payment issue. Please avoid retrying multiple payments until support verifies the payment state and transaction details.";
  }

  if (
    normalizedMessage.includes("broken") ||
    normalizedMessage.includes("damaged") ||
    normalizedMessage.includes("quality") ||
    normalizedMessage.includes("defect")
  ) {
    return "Thanks for reporting the product condition. Please mention the exact quality issue and whether the packaging was damaged so the support team can assess it correctly.";
  }

  return `Thanks, I've logged that update${chat.orderId ? ` for ${chat.orderId}` : ""}. A customer support agent will continue from here, and you can keep replying in this thread with any extra details.`;
};

const includesAny = (message, keywords) =>
  keywords.some((keyword) => message.includes(keyword));

const buildAssistantFollowUp = () =>
  'If you want a human agent, reply "agent" or "human" and I will route this chat to the support team.';

const toTitleLabel = (value) =>
  String(value || "")
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(" ");

const getOrderReference = (chat) => chat?.order?.orderNumber || chat?.orderId || "";

const buildOrderAwareDeliveryReply = (chat) => {
  const orderReference = getOrderReference(chat);
  const orderStatus = String(chat?.order?.status || "").toUpperCase();

  if (!orderStatus) {
    return `I can help with delivery questions, but I do not see a linked order on this chat yet. Please attach the order to the chat or reply "agent" for manual help. ${buildAssistantFollowUp()}`;
  }

  if (orderStatus === "PLACED" || orderStatus === "CONFIRMED") {
    return `Your order ${orderReference} is currently ${toTitleLabel(orderStatus)}. That usually means the order has been accepted and is waiting for seller processing. If it stays in this stage longer than expected, reply "agent" and I will escalate it. ${buildAssistantFollowUp()}`;
  }

  if (orderStatus === "PROCESSING") {
    return `Your order ${orderReference} is currently Processing. The seller is preparing it for shipment. If you need a delivery investigation instead of a status update, reply "agent". ${buildAssistantFollowUp()}`;
  }

  if (orderStatus === "SHIPPED") {
    return `Your order ${orderReference} is marked as Shipped, so it is already on the way. If the delivery looks delayed beyond the promised timeline, reply "agent" and I will route this to a human support person. ${buildAssistantFollowUp()}`;
  }

  if (orderStatus === "DELIVERED") {
    return `Your order ${orderReference} is marked as Delivered. If the delivery was incomplete, damaged, or incorrect, reply "agent" and a human support person will take over right away. ${buildAssistantFollowUp()}`;
  }

  if (orderStatus === "CANCELLED") {
    return `Your order ${orderReference} is already marked as Cancelled. If this cancellation was unexpected or you need help with the refund status, reply "agent" and I will move this to a human. ${buildAssistantFollowUp()}`;
  }

  return `Your order ${orderReference} is currently ${toTitleLabel(orderStatus)}. If you need more than a status update, reply "agent" and I will route this chat to support. ${buildAssistantFollowUp()}`;
};

const buildOrderAwareRefundReply = (chat) => {
  const orderReference = getOrderReference(chat);
  const orderStatus = String(chat?.order?.status || "").toUpperCase();
  const paymentStatus = String(chat?.order?.payment?.status || "").toUpperCase();

  if (!orderStatus) {
    return `Refund and return requests depend on the linked order status. I do not see a linked order here yet, so reply "agent" if you want a human to review the case. ${buildAssistantFollowUp()}`;
  }

  if (orderStatus === "DELIVERED") {
    return `Order ${orderReference} is marked as Delivered, so a return or refund review can make sense depending on item condition and policy. If the item was damaged, wrong, or not as described, reply "agent" and I will hand this to a human support person now. ${buildAssistantFollowUp()}`;
  }

  if (orderStatus === "CANCELLED") {
    if (paymentStatus === "REFUNDED") {
      return `Order ${orderReference} is Cancelled and the payment is already marked as Refunded. If the refund has still not reached your account, reply "agent" and we will check it manually. ${buildAssistantFollowUp()}`;
    }

    if (paymentStatus === "CAPTURED" || paymentStatus === "PENDING") {
      return `Order ${orderReference} is Cancelled. The linked payment currently shows ${toTitleLabel(paymentStatus)}, so the refund may still be settling. If you want a human to review the payment timeline, reply "agent". ${buildAssistantFollowUp()}`;
    }

    return `Order ${orderReference} is Cancelled. If you need help checking the refund status, reply "agent" and I will route this to a human. ${buildAssistantFollowUp()}`;
  }

  return `Order ${orderReference} is currently ${toTitleLabel(orderStatus)}. In many cases, cancellation is more relevant than refund before delivery. If you want a human to check eligibility on this specific order, reply "agent". ${buildAssistantFollowUp()}`;
};

const buildOrderAwarePaymentReply = (chat) => {
  const orderReference = getOrderReference(chat);
  const paymentStatus = String(chat?.order?.payment?.status || "").toUpperCase();
  const paymentMethod = String(
    chat?.order?.payment?.method || chat?.order?.paymentMethod || "",
  ).toUpperCase();

  if (!getOrderReference(chat)) {
    return `I can answer payment questions better when the chat is linked to an order. I do not see one here yet, so reply "agent" if you want a human to check it manually. ${buildAssistantFollowUp()}`;
  }

  if (!paymentStatus) {
    return `I do not see a completed payment record yet for order ${orderReference}. If the amount was deducted and this looks wrong, reply "agent" and a human support person will review it. ${buildAssistantFollowUp()}`;
  }

  if (paymentStatus === "CAPTURED") {
    return `The payment for order ${orderReference} is marked as Captured${paymentMethod ? ` via ${paymentMethod}` : ""}. That means the order payment was recorded successfully. If you were charged more than once or the order still looks wrong, reply "agent". ${buildAssistantFollowUp()}`;
  }

  if (paymentStatus === "PENDING") {
    return `The payment for order ${orderReference} is still marked as Pending. Please avoid repeating payment attempts immediately. If it remains pending longer than expected, reply "agent" and I will route it to a human. ${buildAssistantFollowUp()}`;
  }

  if (paymentStatus === "FAILED") {
    return `The payment for order ${orderReference} is marked as Failed. If money was still deducted from your account, reply "agent" and we will have a human support person investigate it. ${buildAssistantFollowUp()}`;
  }

  if (paymentStatus === "REFUNDED") {
    return `The payment for order ${orderReference} is already marked as Refunded. If the amount has not appeared back in your account yet, reply "agent" and we will check the refund timeline manually. ${buildAssistantFollowUp()}`;
  }

  return `The latest payment state for order ${orderReference} is ${toTitleLabel(paymentStatus)}. If you want a human to verify this case, reply "agent". ${buildAssistantFollowUp()}`;
};

const buildOrderAwareChangeReply = (chat) => {
  const orderReference = getOrderReference(chat);
  const orderStatus = String(chat?.order?.status || "").toUpperCase();

  if (!orderStatus) {
    return `Order changes depend on the linked order stage, and I do not see a linked order here yet. Reply "agent" if you want a human to review it manually. ${buildAssistantFollowUp()}`;
  }

  if (["PLACED", "CONFIRMED"].includes(orderStatus)) {
    return `Order ${orderReference} is still in ${toTitleLabel(orderStatus)}, so change or cancellation requests may still be possible. If you want a human to act on this order, reply "agent" and I will route it now. ${buildAssistantFollowUp()}`;
  }

  if (orderStatus === "PROCESSING") {
    return `Order ${orderReference} is already Processing. Changes may be limited once seller preparation has started. Reply "agent" if you want a human support person to check whether the change is still possible. ${buildAssistantFollowUp()}`;
  }

  if (orderStatus === "SHIPPED") {
    return `Order ${orderReference} is already Shipped, so cancellation or address changes are usually no longer possible. If this is urgent, reply "agent" and I will escalate it. ${buildAssistantFollowUp()}`;
  }

  if (orderStatus === "DELIVERED") {
    return `Order ${orderReference} is already Delivered, so edits are no longer possible. If your real issue is return, refund, or delivery quality, reply "agent" and I will connect you to a human. ${buildAssistantFollowUp()}`;
  }

  if (orderStatus === "CANCELLED") {
    return `Order ${orderReference} is already Cancelled, so no further order changes are needed. If you need help with refund timing or a wrong cancellation, reply "agent". ${buildAssistantFollowUp()}`;
  }

  return `Order ${orderReference} is currently ${toTitleLabel(orderStatus)}. If you want a human to review a change request for this order, reply "agent". ${buildAssistantFollowUp()}`;
};

export const resolveSupportAssistantResponse = ({ messageText, attachment, chat }) => {
  const normalizedMessage = String(messageText || "").trim().toLowerCase();

  if (attachment?.url) {
    return {
      mode: "handoff",
      text: `Thanks for sharing that attachment${chat?.orderId ? ` for order ${chat.orderId}` : ""}. I've routed this chat to a human support agent so they can review it properly.`,
    };
  }

  if (
    includesAny(normalizedMessage, [
      "agent",
      "human",
      "real person",
      "support person",
      "representative",
      "customer care",
      "talk to someone",
      "speak to someone",
      "connect me",
    ])
  ) {
    return {
      mode: "handoff",
      text: `I've routed this conversation${chat?.orderId ? ` for order ${chat.orderId}` : ""} to a human support agent. Please keep this chat open and they will reply here.`,
    };
  }

  if (
    includesAny(normalizedMessage, [
      "damaged",
      "broken",
      "defect",
      "defective",
      "wrong item",
      "seller issue",
      "fraud",
      "scam",
      "chargeback",
      "complaint",
    ])
  ) {
    return {
      mode: "handoff",
      text: `This looks like an issue that needs a human support review${chat?.orderId ? ` for order ${chat.orderId}` : ""}. I've forwarded the chat to an agent now.`,
    };
  }

  if (
    includesAny(normalizedMessage, [
      "where is my order",
      "where is order",
      "track",
      "tracking",
      "delivery",
      "delay",
      "late",
      "shipping",
    ])
  ) {
    return {
      mode: "auto_reply",
      text: buildOrderAwareDeliveryReply(chat),
    };
  }

  if (
    includesAny(normalizedMessage, [
      "refund",
      "return",
      "return policy",
      "refund policy",
      "refund eligibility",
    ])
  ) {
    return {
      mode: "auto_reply",
      text: buildOrderAwareRefundReply(chat),
    };
  }

  if (
    includesAny(normalizedMessage, [
      "payment",
      "charged twice",
      "double charged",
      "upi",
      "card",
      "payment failed",
      "amount deducted",
    ])
  ) {
    return {
      mode: "auto_reply",
      text: buildOrderAwarePaymentReply(chat),
    };
  }

  if (
    includesAny(normalizedMessage, [
      "cancel order",
      "cancel my order",
      "change address",
      "update address",
      "edit order",
      "change phone",
    ])
  ) {
    return {
      mode: "auto_reply",
      text: buildOrderAwareChangeReply(chat),
    };
  }

  if (
    includesAny(normalizedMessage, [
      "support hours",
      "working hours",
      "contact number",
      "help line",
      "helpline",
      "email support",
    ])
  ) {
    return {
      mode: "auto_reply",
      text: `You can continue using this support chat any time, and a human agent can reply here when needed. For faster help on this case, just reply "agent" and I will move the conversation into the live support queue.`,
    };
  }

  return {
    mode: "handoff",
    text: `I couldn't safely answer that automatically${chat?.orderId ? ` for order ${chat.orderId}` : ""}, so I've routed this chat to a human support agent for you.`,
  };
};
