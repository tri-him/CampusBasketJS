import "dotenv/config";

const smtpPort = Number(process.env.SMTP_PORT ?? 587);
const clientUrls = String(process.env.CLIENT_URLS ?? process.env.CLIENT_URL ?? "http://localhost:5173")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  clientUrl: clientUrls[0] ?? "http://localhost:5173",
  clientUrls,
  databaseUrl: process.env.DATABASE_URL ?? "",
  jwtSecret: process.env.JWT_SECRET ?? "replace-with-a-strong-secret",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  emailFrom: process.env.EMAIL_FROM ?? "CampusBasket <no-reply@CampusBasket.local>",
  emailReplyTo: process.env.EMAIL_REPLY_TO ?? "",
  smtpHost: process.env.SMTP_HOST ?? "",
  smtpPort: Number.isFinite(smtpPort) ? smtpPort : 587,
  smtpSecure: process.env.SMTP_SECURE === "true",
  smtpUser: process.env.SMTP_USER ?? "",
  smtpPass: process.env.SMTP_PASS ?? "",
  smsProvider: process.env.SMS_PROVIDER ?? "",
  smsFromNumber:
    process.env.SMS_FROM_NUMBER ??
    process.env.TWILIO_PHONE_NUMBER ??
    "",
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID ?? "",
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN ?? "",
  razorpayKeyId: process.env.RAZORPAY_KEY_ID ?? "",
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET ?? "",
  razorpayWebhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET ?? "",
};
