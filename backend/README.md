# CampusBasket Backend

Backend stack for CampusBasket:

- `Node.js + Express`
- `PostgreSQL`
- `Prisma ORM`
- `JWT + bcryptjs`

## Folder Structure

```text
backend/
  prisma/
    schema.prisma
  src/
    config/
    lib/
    middlewares/
    modules/
      auth/
      health/
      orders/
      products/
      reviews/
      support/
      users/
    routes/
    utils/
    app.js
    server.js
  .env.example
  package.json
```

## Main Modules

- `auth`: seller/customer registration, login, current user
- `products`: catalog listing and seller product CRUD
- `orders`: checkout order creation, customer orders, seller order views
- `reviews`: verified-buyer product reviews
- `support`: tickets, chats, and message flow
- `users`: customer profile, addresses, and wishlist

## Setup

1. Copy `.env.example` to `.env`
2. Create a PostgreSQL database named `CampusBasket`
3. Install dependencies with `npm install`
4. Generate Prisma client with `npm run prisma:generate`
5. Run migrations with `npm run prisma:migrate`
6. Seed curated marketplace products with `npm run prisma:seed`
7. Start the server with `npm run dev`

## Real Providers

To enable live order emails, SMS, and Razorpay payments, fill these values in `.env`.

### Razorpay

```env
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
```

### Email via SMTP

```env
EMAIL_FROM="CampusBasket <no-reply@yourdomain.com>"
EMAIL_REPLY_TO=support@yourdomain.com
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
```

### SMS via Twilio

```env
SMS_PROVIDER=TWILIO
SMS_FROM_NUMBER=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
```

## Integration Check

After updating `.env`, start the backend and open:

- `GET /api/health`
- `GET /api/health/integrations`

The integrations endpoint shows whether:

- database is connected
- Razorpay keys are configured
- Razorpay webhook secret is configured
- SMTP email is configured
- SMS provider is configured

## Verification Flow

Use this exact order to verify the live setup:

1. Start backend with `npm run dev`
2. Start frontend with `npm run dev`
3. Open `http://localhost:4000/api/health/integrations`
4. Confirm `razorpay.configured`, `email.configured`, and `sms.configured` are `true`
5. Log in as a customer and place one `COD` order
6. Confirm the customer receives the order confirmation email
7. Confirm the customer receives the order confirmation SMS
8. Log in as seller and update the order to `SHIPPED`
9. Confirm the customer receives shipped email + SMS
10. Update the same order to `DELIVERED`
11. Confirm the customer receives delivered email + SMS
12. Place a `UPI` or `CARD` order and complete Razorpay test payment
13. Confirm the order reaches `CONFIRMED` and email/SMS logs move to `SENT`

## Database Tables To Check

Open Prisma Studio or pgAdmin and inspect:

- `Order`
- `Payment`
- `EmailLog`
- `SmsLog`
- `Notification`

## Suggested Next Step

After this backend is running, we can replace the current frontend `localStorage` flows module by module:

1. Auth
2. Products
3. Orders and checkout
4. Reviews
5. Support
