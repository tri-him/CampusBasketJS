import { prisma } from "../../lib/prisma.js";
import {
  listNotificationsForUser,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  createAuditLog,
  createNotification,
} from "../../lib/activity.js";
import AppError from "../../utils/app-error.js";
import { normalizeOrderMode } from "../../utils/order-helpers.js";

const publicUserSelect = {
  id: true,
  role: true,
  name: true,
  email: true,
  gender: true,
  age: true,
  phone: true,
  storeName: true,
  status: true,
  createdAt: true,
  updatedAt: true,
};

export const updateProfile = async (authUser, payload) => {
  const user = await prisma.user.update({
    where: { id: authUser.id },
    data: {
      name: payload.name,
      age: payload.age,
      gender: payload.gender,
      phone: payload.phone,
      storeName:
        authUser.role === "SELLER" || authUser.role === "ADMIN"
          ? payload.storeName
          : undefined,
    },
    select: publicUserSelect,
  });

  return user;
};

export const getAddresses = async (customerId) =>
  prisma.address.findMany({
    where: { customerId },
    orderBy: {
      createdAt: "desc",
    },
  });

export const createAddress = async (user, payload) =>
  prisma.address.create({
    data: {
      customerId: user.id,
      label: payload.label,
      name: payload.fullName,
      email: user.email,
      phone: payload.phone,
      addressLine: payload.addressLine,
      city: payload.city,
      state: payload.state,
      pincode: payload.pincode,
    },
  });

export const getShippingDraft = async (customerId) =>
  prisma.shippingDraft.findUnique({
    where: { customerId },
  });

export const upsertShippingDraft = async (user, payload) =>
  prisma.shippingDraft.upsert({
    where: { customerId: user.id },
    update: {
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      address: payload.address,
      city: payload.city,
      pincode: payload.pincode,
    },
    create: {
      customerId: user.id,
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      address: payload.address,
      city: payload.city,
      pincode: payload.pincode,
    },
  });

export const deleteShippingDraft = async (customerId) => {
  const draft = await prisma.shippingDraft.findUnique({
    where: { customerId },
  });

  if (!draft) {
    return;
  }

  await prisma.shippingDraft.delete({
    where: { customerId },
  });
};

export const deleteAddress = async (customerId, addressId) => {
  const address = await prisma.address.findUnique({
    where: { id: addressId },
  });

  if (!address || address.customerId !== customerId) {
    throw new AppError(404, "Address not found.");
  }

  await prisma.address.delete({
    where: { id: addressId },
  });
};

export const getWishlistItems = async (customerId) =>
  prisma.wishlistItem.findMany({
    where: { customerId },
    include: {
      product: {
        include: {
          seller: {
            select: {
              id: true,
              name: true,
              storeName: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

export const addWishlistItem = async (customerId, payload) => {
  const product = await prisma.product.findUnique({
    where: { id: payload.productId },
  });

  if (!product || !product.isActive) {
    throw new AppError(404, "Product not found.");
  }

  return prisma.wishlistItem.upsert({
    where: {
      customerId_productId_mode: {
        customerId,
        productId: payload.productId,
        mode: normalizeOrderMode(payload.mode),
      },
    },
    update: {
      createdAt: new Date(),
    },
    create: {
      customerId,
      productId: payload.productId,
      mode: normalizeOrderMode(payload.mode),
    },
    include: {
      product: {
        include: {
          seller: {
            select: {
              id: true,
              name: true,
              storeName: true,
            },
          },
        },
      },
    },
  });
};

export const deleteWishlistItem = async (customerId, productId, mode = "retail") => {
  const existingItem = await prisma.wishlistItem.findFirst({
    where: {
      customerId,
      productId,
      mode: normalizeOrderMode(mode),
    },
  });

  if (!existingItem) {
    throw new AppError(404, "Wishlist item not found.");
  }

  await prisma.wishlistItem.delete({
    where: { id: existingItem.id },
  });
};

export const getAdminUsers = async ({ search, role, status }) =>
  prisma.user.findMany({
    where: {
      ...(role ? { role } : {}),
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
              { storeName: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    select: publicUserSelect,
    orderBy: {
      createdAt: "desc",
    },
  });

export const updateAdminUserStatus = async ({ adminUser, userId, status }) => {
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    select: publicUserSelect,
  });

  if (!existingUser) {
    throw new AppError(404, "User not found.");
  }

  if (existingUser.id === adminUser.id && status === "SUSPENDED") {
    throw new AppError(400, "You cannot suspend your own admin account.");
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      status,
    },
    select: publicUserSelect,
  });

  await Promise.all([
    createAuditLog({
      actorUserId: adminUser.id,
      action: "USER_STATUS_CHANGED",
      entityType: "USER",
      entityId: updatedUser.id,
      details: {
        previousStatus: existingUser.status,
        nextStatus: updatedUser.status,
        targetRole: updatedUser.role,
      },
    }),
    createNotification({
      userId: updatedUser.id,
      type: "ACCOUNT_STATUS_CHANGED",
      title:
        updatedUser.status === "SUSPENDED"
          ? "Your CampusBasket account has been suspended"
          : "Your CampusBasket account is active again",
      message:
        updatedUser.status === "SUSPENDED"
          ? "Your account access has been temporarily blocked. Contact CampusBasket support if you think this is a mistake."
          : "Your account access has been restored and you can use CampusBasket again.",
      details: {
        previousStatus: existingUser.status,
        nextStatus: updatedUser.status,
      },
    }),
  ]);

  return updatedUser;
};

export const getMyNotifications = async (userId) => listNotificationsForUser(userId);

export const readMyNotification = async (userId, notificationId) => {
  const result = await markNotificationAsRead({ userId, notificationId });

  if (result.count === 0) {
    throw new AppError(404, "Notification not found.");
  }

  return prisma.notification.findUnique({
    where: {
      id: notificationId,
    },
  });
};

export const readAllMyNotifications = async (userId) => {
  await markAllNotificationsAsRead(userId);
  return listNotificationsForUser(userId);
};
