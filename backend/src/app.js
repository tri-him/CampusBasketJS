import cors from "cors";
import express from "express";
import morgan from "morgan";
import { env } from "./config/env.js";
import { errorHandler } from "./middlewares/error-handler.js";
import { notFoundHandler } from "./middlewares/not-found.js";
import apiRouter from "./routes/index.js";

const app = express();
const allowedOrigins = new Set(env.clientUrls);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.size === 0 || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Origin not allowed by CampusBasket CORS policy."));
    },
    credentials: true,
  }),
);
app.use("/api/payments/razorpay/webhook", express.raw({ type: "application/json" }));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));

app.get("/", (_request, response) => {
  response.json({
    success: true,
    message: "CampusBasket backend is running.",
  });
});

app.use("/api", apiRouter);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
