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
  const payload = jwt.verify(token, env.jwtSecret);

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
  });

  if (!user) {
    throw new AppError(401, "Authenticated user no longer exists.");
  }

  if (user.status === "SUSPENDED") {
    throw new AppError(403, "This account is suspended. Please contact CampusBasket support.");
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

  request.user = await resolveUserFromToken(request);
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
