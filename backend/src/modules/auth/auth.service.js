import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import { prisma } from "../../lib/prisma.js";
import AppError from "../../utils/app-error.js";

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

const createToken = (userId) =>
  jwt.sign({ userId }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });

const createUser = async ({ role, name, email, password, age, gender, storeName }) => {
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new AppError(409, "An account with this email already exists.");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      role,
      name,
      email,
      passwordHash,
      age,
      gender,
      storeName,
    },
    select: publicUserSelect,
  });

  return {
    token: createToken(user.id),
    user,
  };
};

export const registerSeller = async (payload) =>
  createUser({
    role: "SELLER",
    ...payload,
  });

export const registerCustomer = async (payload) =>
  createUser({
    role: "CUSTOMER",
    ...payload,
  });

export const loginUser = async ({ email, password, role }) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new AppError(401, "Invalid email or password.");
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatches) {
    throw new AppError(401, "Invalid email or password.");
  }

  if (user.status === "SUSPENDED") {
    throw new AppError(403, "This account is suspended. Please contact CampusBasket support.");
  }

  if (role && user.role !== role) {
    throw new AppError(403, `This account is registered as ${user.role.toLowerCase()}.`);
  }

  const { passwordHash, ...safeUser } = user;

  return {
    token: createToken(user.id),
    user: safeUser,
  };
};

export const getCurrentUserProfile = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: publicUserSelect,
  });

  if (!user) {
    throw new AppError(404, "User not found.");
  }

  return user;
};
