import cors from "cors";
import express from "express";
import morgan from "morgan";
import { env } from "./config/env.js";
import { errorHandler } from "./middlewares/error-handler.js";
import { notFoundHandler } from "./middlewares/not-found.js";
import apiRouter from "./routes/index.js";

const app = express();

// Configure CORS
const allowedOrigins = [
  'https://campus-basket-js.vercel.app',
  env.CLIENT_URLS?.replace(/\/$/, '') // strips trailing slash if env has one
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or Postman)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("CORS policy: Not allowed by CORS"));
    },
    credentials: true,
  })
);

// Standard body parsing & logging middlewares
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({
  extended: true,
  limit: "50mb"
}));

app.use(morgan("dev"));

// API Router
app.use("/api", apiRouter);

// Error handling middlewares (MUST stay at the end)
app.use(notFoundHandler);
app.use(errorHandler);

export default app;