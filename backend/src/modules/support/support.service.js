import { prisma } from "../../lib/prisma.js";
import { createAuditLog, createNotification } from "../../lib/activity.js";
import { publishSupportEvent } from "../../lib/support-events.js";
import AppError from "../../utils/app-error.js";
import {
  getAssignedSupportAgent,
  getSupportAssistantName,
  getSupportResponseEta,
  buildSupportChatWelcomeMessage,
  resolveSupportAssistantResponse,
} from "../../utils/support-helpers.js";

const chatInclude = {
  messages: {
    orderBy: {
      createdAt: "asc",
    },
  },
  ticket: true,
  order: {
    select: {
      id: true,
      orderNumber: true,
      status: true,
      paymentMethod: true,
      shippingCity: true,
      shippingEmail: true,
      placedAt: true,
      payment: {
        select: {
          status: true,
          method: true,
          paidAt: true,
          reference: true,
        },
      },
    },
  },
};

const ticketInclude = {
  order: {
    select: {
      id: true,
      orderNumber: true,
      status: true,
      paymentMethod: true,
      shippingCity: true,
      shippingEmail: true,
      placedAt: true,
      payment: {
        select: {
          status: true,
          method: true,
          paidAt: true,
          reference: true,
        },
      },
    },
  },
  chat: {
    select: {
      id: true,
      chatNumber: true,
      status: true,
      updatedAt: true,
      assignedAgentName: true,
      unreadForAdmin: true,
      unreadForCustomer: true,
    },
  },
};

const resolveOrderFilter = (orderId) => ({
  OR: [{ id: orderId }, { orderNumber: orderId }],
});

const mapAttachmentToMessageFields = (attachment) => {
  if (!attachment?.url) {
    return {};
  }

  return {
    attachmentUrl: attachment.url,
    attachmentName: attachment.name || null,
    attachmentMimeType: attachment.mimeType || null,
    attachmentSizeBytes: attachment.sizeBytes || null,
  };
};

const emitSupportUpdate = ({ kind, chat, ticket }) => {
  publishSupportEvent({
    kind,
    chatId: chat?.id || null,
    ticketId: ticket?.id || chat?.ticketId || null,
    customerId: chat?.customerId || ticket?.customerId || null,
    customerEmail: chat?.customerEmail || ticket?.customerEmail || null,
  });
};

const notifyActiveAdmins = async ({
  type,
  title,
  message,
  orderId,
  supportTicketId,
  supportChatId,
  details,
}) => {
  const admins = await prisma.user.findMany({
    where: {
      role: "ADMIN",
      status: "ACTIVE",
    },
    select: {
      id: true,
    },
  });

  await Promise.all(
    admins.map((admin) =>
      createNotification({
        userId: admin.id,
        type,
        title,
        message,
        orderId,
        supportTicketId,
        supportChatId,
        details,
      }),
    ),
  );
};

export const getSupportTicketsForCustomer = async ({ customer, email }) => {
  const lookupEmail = email?.trim().toLowerCase() || customer?.email?.toLowerCase();

  if (!lookupEmail && !customer) {
    throw new AppError(400, "Email is required when you are not logged in.");
  }

  return prisma.supportTicket.findMany({
    where: customer
      ? {
          OR: [{ customerId: customer.id }, { customerEmail: lookupEmail }],
        }
      : {
          customerEmail: lookupEmail,
        },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const getAdminSupportOverview = async () => {
  const [ticketGroups, chatGroups, waitingForAgent, recentTickets, recentChats] =
    await Promise.all([
    prisma.supportTicket.groupBy({
      by: ["status"],
      _count: { status: true },
    }),
    prisma.supportChat.groupBy({
      by: ["status"],
      _count: { status: true },
    }),
    prisma.supportChat.count({
      where: {
        status: {
          in: ["ACTIVE", "IN_REVIEW"],
        },
        unreadForAdmin: {
          gt: 0,
        },
      },
    }),
    prisma.supportTicket.findMany({
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: ticketInclude,
    }),
    prisma.supportChat.findMany({
      orderBy: [{ unreadForAdmin: "desc" }, { updatedAt: "desc" }],
      take: 5,
      include: chatInclude,
    }),
    ]);

  const ticketCounts = Object.fromEntries(
    ticketGroups.map((entry) => [entry.status, entry._count.status]),
  );
  const chatCounts = Object.fromEntries(
    chatGroups.map((entry) => [entry.status, entry._count.status]),
  );

  return {
    tickets: {
      total: Object.values(ticketCounts).reduce((sum, count) => sum + count, 0),
      open: ticketCounts.OPEN || 0,
      inReview: ticketCounts.IN_REVIEW || 0,
      resolved: ticketCounts.RESOLVED || 0,
    },
    chats: {
      total: Object.values(chatCounts).reduce((sum, count) => sum + count, 0),
      active: chatCounts.ACTIVE || 0,
      inReview: chatCounts.IN_REVIEW || 0,
      closed: chatCounts.CLOSED || 0,
      waitingForAgent,
    },
    recentTickets,
    recentChats,
  };
};

export const getAdminSupportTickets = async ({ status, priority, search }) =>
  prisma.supportTicket.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(priority ? { priority } : {}),
      ...(search
        ? {
            OR: [
              { ticketNumber: { contains: search, mode: "insensitive" } },
              { customerName: { contains: search, mode: "insensitive" } },
              { customerEmail: { contains: search, mode: "insensitive" } },
              { subject: { contains: search, mode: "insensitive" } },
              { category: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: ticketInclude,
    orderBy: {
      updatedAt: "desc",
    },
  });

export const getAdminSupportChats = async ({ status, search }) =>
  prisma.supportChat.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { chatNumber: { contains: search, mode: "insensitive" } },
              { customerName: { contains: search, mode: "insensitive" } },
              { customerEmail: { contains: search, mode: "insensitive" } },
              { subject: { contains: search, mode: "insensitive" } },
              { category: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: chatInclude,
    orderBy: [{ unreadForAdmin: "desc" }, { updatedAt: "desc" }],
  });

export const updateAdminSupportTicket = async ({ ticketId, payload }) => {
  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
  });

  if (!ticket) {
    throw new AppError(404, "Support ticket not found.");
  }

  const updatedTicket = await prisma.supportTicket.update({
    where: { id: ticketId },
    data: {
      status: payload.status,
      ...(payload.responseEta ? { responseEta: payload.responseEta } : {}),
    },
    include: ticketInclude,
  });

  if (updatedTicket.chat?.id && payload.status === "RESOLVED") {
    await prisma.supportChat.update({
      where: { id: updatedTicket.chat.id },
      data: {
        status: "CLOSED",
        updatedAt: new Date(),
      },
    }).catch(() => {});
  }

  await Promise.all([
    createNotification({
      userId: updatedTicket.customerId,
      type: "SUPPORT_CHAT_UPDATED",
      title: `Support ticket ${updatedTicket.ticketNumber} is ${updatedTicket.status.toLowerCase().replaceAll("_", " ")}`,
      message: "Your support ticket status has been updated by CampusBasket support.",
      supportTicketId: updatedTicket.id,
      orderId: updatedTicket.orderId,
      details: {
        status: updatedTicket.status,
      },
    }),
    createAuditLog({
      action: "SUPPORT_STATUS_CHANGED",
      entityType: "SUPPORT_TICKET",
      entityId: updatedTicket.id,
      details: {
        status: updatedTicket.status,
        responseEta: updatedTicket.responseEta,
      },
    }),
  ]);

  emitSupportUpdate({
    kind: "ticket-status-changed",
    ticket: updatedTicket,
  });

  return updatedTicket;
};

export const updateAdminSupportChat = async ({ chatId, payload, actorUser }) => {
  const chat = await prisma.supportChat.findUnique({
    where: { id: chatId },
  });

  if (!chat) {
    throw new AppError(404, "Support chat not found.");
  }

  const updatedChat = await prisma.supportChat.update({
    where: { id: chatId },
    data: {
      status: payload.status,
      ...(payload.assignedAgentName
        ? { assignedAgentName: payload.assignedAgentName }
        : {}),
      ...(payload.assignedAgentId ? { assignedAgentId: payload.assignedAgentId } : {}),
      ...(payload.assignedAgentId || payload.assignedAgentName
        ? { assignedAt: new Date() }
        : {}),
      ...(payload.status === "IN_REVIEW" ? { unreadForAdmin: 0 } : {}),
      updatedAt: new Date(),
    },
    include: chatInclude,
  });

  if (updatedChat.ticketId) {
    await prisma.supportTicket.update({
      where: { id: updatedChat.ticketId },
      data: {
        status: payload.status === "CLOSED" ? "RESOLVED" : "IN_REVIEW",
      },
    }).catch(() => {});
  }

  await Promise.all([
    createNotification({
      userId: updatedChat.customerId,
      type: "SUPPORT_CHAT_UPDATED",
      title: `Support chat ${updatedChat.chatNumber} is ${updatedChat.status.toLowerCase().replaceAll("_", " ")}`,
      message: "Your support chat status has changed.",
      supportTicketId: updatedChat.ticketId,
      supportChatId: updatedChat.id,
      orderId: updatedChat.orderId,
      details: {
        status: updatedChat.status,
        assignedAgentName: updatedChat.assignedAgentName,
      },
    }),
    createAuditLog({
      actorUserId: actorUser?.id,
      action: "SUPPORT_STATUS_CHANGED",
      entityType: "SUPPORT_CHAT",
      entityId: updatedChat.id,
      details: {
        status: updatedChat.status,
        assignedAgentName: updatedChat.assignedAgentName,
        assignedAgentId: updatedChat.assignedAgentId,
      },
    }),
  ]);

  emitSupportUpdate({
    kind: "chat-status-changed",
    chat: updatedChat,
  });

  return updatedChat;
};

export const sendAdminSupportChatMessage = async ({
  chatId,
  messageText,
  senderName,
  senderId,
  closeTicket,
  attachment,
}) => {
  const chat = await prisma.supportChat.findUnique({
    where: { id: chatId },
    include: chatInclude,
  });

  if (!chat) {
    throw new AppError(404, "Support chat not found.");
  }

  const agentName = senderName || chat.assignedAgentName || "CampusBasket Support";
  const cleanedMessage = String(messageText || "").trim();

  if (!cleanedMessage && !attachment?.url) {
    throw new AppError(400, "Message text or an attachment is required.");
  }

  await prisma.supportChatMessage.create({
    data: {
      chatId: chat.id,
      senderType: "AGENT",
      senderName: agentName,
      text: cleanedMessage || "Attachment shared.",
      ...mapAttachmentToMessageFields(attachment),
    },
  });

  const updatedChat = await prisma.supportChat.update({
    where: { id: chat.id },
    data: {
      status: closeTicket ? "CLOSED" : "IN_REVIEW",
      assignedAgentName: agentName,
      ...(senderId ? { assignedAgentId: senderId } : {}),
      ...(senderId && senderId !== chat.assignedAgentId
        ? { assignedAt: new Date() }
        : {}),
      unreadForAdmin: 0,
      unreadForCustomer: {
        increment: 1,
      },
      lastRepliedBy: "AGENT",
      updatedAt: new Date(),
    },
    include: chatInclude,
  });

  if (updatedChat.ticketId) {
    await prisma.supportTicket.update({
      where: { id: updatedChat.ticketId },
      data: {
        status: closeTicket ? "RESOLVED" : "IN_REVIEW",
      },
    });
  }

  await Promise.all([
    createNotification({
      userId: updatedChat.customerId,
      type: "SUPPORT_CHAT_UPDATED",
      title: `New support reply on ${updatedChat.subject}`,
      message: "A CampusBasket support agent has replied to your support chat.",
      supportTicketId: updatedChat.ticketId,
      supportChatId: updatedChat.id,
      details: {
        subject: updatedChat.subject,
        closeTicket,
        hasAttachment: Boolean(attachment?.url),
      },
    }),
    createAuditLog({
      action: "SUPPORT_CHAT_REPLIED",
      entityType: "SUPPORT_CHAT",
      entityId: updatedChat.id,
      details: {
        senderName: agentName,
        closeTicket,
        assignedAgentId: senderId || null,
        hasAttachment: Boolean(attachment?.url),
      },
    }),
  ]);

  emitSupportUpdate({
    kind: "chat-message-added",
    chat: updatedChat,
  });

  return updatedChat;
};

export const createSupportTicket = async ({ customer, payload }) => {
  const order = payload.orderId
    ? await prisma.order.findFirst({
        where: {
          AND: [
            resolveOrderFilter(payload.orderId),
            customer
              ? {
                  OR: [{ customerId: customer.id }, { shippingEmail: payload.customerEmail }],
                }
              : {
                  shippingEmail: payload.customerEmail,
                },
          ],
        },
      })
    : null;

  if (payload.orderId && !order) {
    throw new AppError(404, "Order not found for this support request.");
  }

  const ticket = await prisma.supportTicket.create({
    data: {
      ticketNumber: `BB-CS-${Date.now()}`,
      customerId: customer?.id || null,
      orderId: order?.id || null,
      customerName: payload.customerName,
      customerEmail: payload.customerEmail,
      customerPhone: payload.customerPhone,
      category: payload.category,
      priority: payload.priority,
      subject: payload.subject,
      description: payload.description,
      status: "OPEN",
      responseEta: getSupportResponseEta(payload.priority),
    },
  });

  await Promise.all([
    createNotification({
      userId: customer?.id,
      type: "SUPPORT_TICKET_CREATED",
      title: `Support ticket ${ticket.ticketNumber} created`,
      message: "Your support request has been saved and will be reviewed by CampusBasket.",
      supportTicketId: ticket.id,
      orderId: ticket.orderId,
      details: {
        subject: ticket.subject,
        priority: ticket.priority,
      },
    }),
    createAuditLog({
      actorUserId: customer?.id,
      action: "SUPPORT_TICKET_CREATED",
      entityType: "SUPPORT_TICKET",
      entityId: ticket.id,
      details: {
        priority: ticket.priority,
        category: ticket.category,
      },
    }),
    notifyActiveAdmins({
      type: "SUPPORT_TICKET_CREATED",
      title: `New support ticket ${ticket.ticketNumber}`,
      message: `${ticket.customerName} opened a ${ticket.priority.toLowerCase()} priority support ticket.`,
      orderId: ticket.orderId,
      supportTicketId: ticket.id,
      details: {
        customerEmail: ticket.customerEmail,
        category: ticket.category,
        priority: ticket.priority,
      },
    }),
  ]);

  emitSupportUpdate({
    kind: "ticket-created",
    ticket,
  });

  return ticket;
};

export const getSupportChatsForCustomer = async ({ customer, email }) => {
  const lookupEmail = email?.trim().toLowerCase() || customer?.email?.toLowerCase();

  if (!lookupEmail && !customer) {
    throw new AppError(400, "Email is required when you are not logged in.");
  }

  return prisma.supportChat.findMany({
    where: customer
      ? {
          OR: [{ customerId: customer.id }, { customerEmail: lookupEmail }],
        }
      : {
          customerEmail: lookupEmail,
        },
    include: chatInclude,
    orderBy: [{ unreadForCustomer: "desc" }, { updatedAt: "desc" }],
  });
};

export const getOrCreateSupportChat = async ({ customer, payload }) => {
  const order = payload.orderId
    ? await prisma.order.findFirst({
        where: {
          AND: [
            resolveOrderFilter(payload.orderId),
            customer
              ? {
                  OR: [{ customerId: customer.id }, { shippingEmail: payload.customerEmail }],
                }
              : {
                  shippingEmail: payload.customerEmail,
                },
          ],
        },
        select: { id: true },
      })
    : null;
  const filters = [];

  if (payload.ticketId) {
    filters.push({ ticketId: payload.ticketId });
  }

  if (payload.orderId) {
    filters.push({
      orderId: order?.id || payload.orderId,
      subject: payload.subject,
    });
  }

  const existingChat =
    filters.length > 0
      ? await prisma.supportChat.findFirst({
          where: {
            ...(customer ? { customerId: customer.id } : {}),
            ...(customer ? {} : { customerEmail: payload.customerEmail }),
            OR: filters,
          },
          include: chatInclude,
        })
      : null;

  if (existingChat) {
    return existingChat;
  }

  const chat = await prisma.supportChat.create({
    data: {
      chatNumber: `BB-CHAT-${Date.now()}`,
      customerId: customer?.id || null,
      orderId: order?.id || null,
      ticketId: payload.ticketId || null,
      customerName: payload.customerName,
      customerEmail: payload.customerEmail,
      category: payload.category,
      subject: payload.subject,
      status: "ACTIVE",
      unreadForAdmin: 0,
      unreadForCustomer: 0,
      assignedAgentName: getAssignedSupportAgent({
        category: payload.category,
        priority: payload.priority,
      }),
    },
  });

  await prisma.supportChatMessage.create({
    data: buildSupportChatWelcomeMessage(chat),
  });

  emitSupportUpdate({
    kind: "chat-created",
    chat,
  });

  return prisma.supportChat.findUnique({
    where: { id: chat.id },
    include: chatInclude,
  });
};

export const sendSupportChatMessage = async ({
  customer,
  chatId,
  messageText,
  email,
  senderName,
  attachment,
}) => {
  const lookupEmail = email?.trim().toLowerCase() || customer?.email?.toLowerCase();
  const chat = await prisma.supportChat.findFirst({
    where: {
      id: chatId,
      ...(customer
        ? { OR: [{ customerId: customer.id }, { customerEmail: lookupEmail }] }
        : { customerEmail: lookupEmail }),
    },
    include: chatInclude,
  });

  if (!chat) {
    throw new AppError(404, "Support chat not found.");
  }

  const cleanedMessage = String(messageText || "").trim();

  if (!cleanedMessage && !attachment?.url) {
    throw new AppError(400, "Message text or an attachment is required.");
  }

  await prisma.supportChatMessage.create({
    data: {
      chatId: chat.id,
      senderType: "CUSTOMER",
      senderName: senderName || customer?.name || chat.customerName || "Customer",
      text: cleanedMessage || "Attachment shared.",
      ...mapAttachmentToMessageFields(attachment),
    },
  });

  const humanQueueAlreadyActive =
    Number(chat.unreadForAdmin) > 0 || chat.status === "IN_REVIEW";
  const assistantAction = humanQueueAlreadyActive
    ? {
        mode: "handoff",
        text: "I've added your latest update to the live support queue. A human agent will continue here shortly.",
      }
    : resolveSupportAssistantResponse({
        messageText: cleanedMessage,
        attachment,
        chat,
      });
  const shouldSendAssistantMessage =
    assistantAction.mode === "auto_reply" ||
    (assistantAction.mode === "handoff" && !humanQueueAlreadyActive);

  if (shouldSendAssistantMessage) {
    await prisma.supportChatMessage.create({
      data: {
        chatId: chat.id,
        senderType: "AGENT",
        senderName: getSupportAssistantName(),
        text: assistantAction.text,
      },
    });
  }

  const updatedChat = await prisma.supportChat.update({
    where: { id: chat.id },
    data: {
      status: "ACTIVE",
      unreadForAdmin:
        assistantAction.mode === "handoff"
          ? {
              increment: 1,
            }
          : 0,
      unreadForCustomer:
        shouldSendAssistantMessage
          ? {
              increment: 1,
            }
          : 0,
      lastRepliedBy:
        shouldSendAssistantMessage ? "AGENT" : "CUSTOMER",
      updatedAt: new Date(),
    },
    include: chatInclude,
  });

  if (assistantAction.mode === "handoff" && chat.ticketId) {
    await prisma.supportTicket
      .update({
        where: { id: chat.ticketId },
        data: {
          status: "OPEN",
          responseEta: getSupportResponseEta(updatedChat.ticket?.priority || "MEDIUM"),
        },
      })
      .catch(() => {});
  }

  await Promise.all([
    ...(assistantAction.mode === "handoff"
      ? [
          notifyActiveAdmins({
            type: "SUPPORT_CHAT_UPDATED",
            title: `Customer replied on ${updatedChat.subject}`,
            message: `${updatedChat.customerName} sent a new support message and is waiting for an agent.`,
            orderId: updatedChat.orderId,
            supportTicketId: updatedChat.ticketId,
            supportChatId: updatedChat.id,
            details: {
              customerEmail: updatedChat.customerEmail,
              assignedAgentName: updatedChat.assignedAgentName,
              queueState: "WAITING_FOR_AGENT",
              routedBy: getSupportAssistantName(),
            },
          }),
        ]
      : []),
    createAuditLog({
      actorUserId: customer?.id,
      action: "SUPPORT_CHAT_REPLIED",
      entityType: "SUPPORT_CHAT",
      entityId: updatedChat.id,
      details: {
        senderName: senderName || customer?.name || chat.customerName || "Customer",
        queueState:
          assistantAction.mode === "handoff" ? "WAITING_FOR_AGENT" : "AUTO_ASSISTED",
        assistantMode: assistantAction.mode,
        hasAttachment: Boolean(attachment?.url),
      },
    }),
  ]);

  emitSupportUpdate({
    kind: "chat-message-added",
    chat: updatedChat,
  });

  return updatedChat;
};

export const markSupportChatReadForCustomer = async ({ customer, chatId, email }) => {
  const lookupEmail = email?.trim().toLowerCase() || customer?.email?.toLowerCase();
  const chat = await prisma.supportChat.findFirst({
    where: {
      id: chatId,
      ...(customer
        ? { OR: [{ customerId: customer.id }, { customerEmail: lookupEmail }] }
        : { customerEmail: lookupEmail }),
    },
  });

  if (!chat) {
    throw new AppError(404, "Support chat not found.");
  }

  const updatedChat = await prisma.supportChat.update({
    where: { id: chat.id },
    data: {
      unreadForCustomer: 0,
      updatedAt: new Date(),
    },
    include: chatInclude,
  });

  emitSupportUpdate({
    kind: "chat-read-customer",
    chat: updatedChat,
  });

  return updatedChat;
};

export const markSupportChatReadForAdmin = async ({ chatId, adminUser }) => {
  const chat = await prisma.supportChat.findUnique({
    where: { id: chatId },
  });

  if (!chat) {
    throw new AppError(404, "Support chat not found.");
  }

  const nextAgentId = chat.assignedAgentId || adminUser?.id || null;
  const nextAgentName = chat.assignedAgentId
    ? chat.assignedAgentName
    : adminUser?.name || chat.assignedAgentName || "CampusBasket Support Admin";
  const updatedChat = await prisma.supportChat.update({
    where: { id: chat.id },
    data: {
      unreadForAdmin: 0,
      assignedAgentId: nextAgentId,
      assignedAgentName: nextAgentName,
      ...(chat.assignedAgentId ? {} : { assignedAt: new Date() }),
      updatedAt: new Date(),
    },
    include: chatInclude,
  });

  emitSupportUpdate({
    kind: "chat-read-admin",
    chat: updatedChat,
  });

  return updatedChat;
};
