import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";
import AppError from "../utils/app-error.js";
import { catchAsync } from "../utils/catch-async.js";

const resolveUserFromToken = async (request) => {
  const authorizationHeader = request.headers.authorization || "";

  if (!authorizationHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authorizationHeader.replace("Bearer ", "").trim();
  if (!token) return null;

  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch (error) {
    // Gracefully transform JWT verify errors (expired/malformed) into a 401
    throw new AppError(401, "Invalid or expired authentication token.");
  }

  // Safely check both payload.userId and payload.id to prevent undefined queries
  const targetId = payload.userId || payload.id;
  if (!targetId) {
    throw new AppError(401, "Malformed token payload.");
  }

  const user = await prisma.user.findUnique({
    where: { id: targetId },
  });

  if (!user) {
    throw new AppError(401, "Authenticated user no longer exists.");
  }

  if (user.status === "SUSPENDED") {
    throw new AppError(
      403,
      "This account is suspended. Please contact CampusBasket support."
    );
  }

  return user;
};

export const authenticate = catchAsync(async (request, _response, next) => {
  const user = await resolveUserFromToken(request);

  if (!user) {
    throw new AppError(401, "Authentication token is required.");
  }

  request.user = user;
  next();
});

export const tryAuthenticate = catchAsync(async (request, _response, next) => {
  const authorizationHeader = request.headers.authorization || "";

  if (!authorizationHeader.startsWith("Bearer ")) {
    request.user = null;
    next();
    return;
  }

  try {
    request.user = await resolveUserFromToken(request);
  } catch (error) {
    // For optional auth (tryAuthenticate), an invalid token should just revert to guest mode
    request.user = null;
  }

  next();
});

export const authorize =
  (...roles) =>
  (request, _response, next) => {
    if (!request.user) {
      next(new AppError(401, "Authentication is required."));
      return;
    }

    if (!roles.includes(request.user.role)) {
      next(new AppError(403, "You do not have permission for this action."));
      return;
    }

    next();
  };