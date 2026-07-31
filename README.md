# 🛒 CampusBasket

> **A sustainable full-stack multi-vendor e-commerce platform supporting both B2B and B2C commerce with retail & wholesale purchasing, role-based dashboards, secure authentication, and online payment integration.**

---

## 📖 Overview

CampusBasket is a full-stack multi-vendor e-commerce platform designed to support both **Business-to-Business (B2B)** and **Business-to-Consumer (B2C)** commerce in a single marketplace.

The platform enables customers to purchase products in **retail** or **wholesale** quantities while providing dedicated dashboards for **Customers**, **Sellers**, and **Administrators**. It is built with a scalable backend architecture using **Node.js, Express, PostgreSQL, and Prisma ORM**, with secure authentication using **JWT** and payment integration through **Razorpay**.

---

## ✨ Why CampusBasket?

- 🌱 Sustainable multi-vendor marketplace
- 🛍️ Supports both Retail & Wholesale purchasing
- 🏢 Dual-mode B2B & B2C commerce
- 👥 Dedicated dashboards for Customers, Sellers, and Admins
- 🔐 Secure JWT-based authentication & authorization
- 💳 Razorpay payment integration
- ⭐ Product reviews and ratings
- 📦 Inventory and order management
- 🎫 Customer support ticket & chat system
- 🔔 Notifications and activity logging

---

## 📸 Project Preview

# 📸 Project Preview

## 🏠 Home Page

<p align="center">
  <img src="./docs/screenshots/home.png.png" alt="CampusBasket Home Page" width="900">
</p>

## 📦 Product Listing

<p align="center">
  <img src="./docs/screenshots/product.png.png" alt="Product Listing" width="900">
</p>

## 👤 Customer Dashboard 

<p align="center"> 
  <img src="./docs/screenshots/user.png.png" alt="Customer Dashboard" width="900">
</p>

## 🏪 Seller Dashboard 

<p align="center">
  <img src="./docs/screenshots/seller.png.png" alt="Seller Dashboard" width="900">
</p>

## 🛠️ Admin Dashboard 

<p align="center">
  <img src="./docs/screenshots/admin.png.png" alt="Admin Dashboard" width="900">
</p>

---

## 🚀 Live Demo

Frontend:https://buy-blink.vercel.app/

Backend:https://CampusBasket-rnvr.onrender.com

---

# ✨ Features

## 👤 Customer

- User Registration & Login
- JWT Authentication
- Browse Products
- Retail & Wholesale Purchasing
- Product Search & Filtering
- Shopping Cart
- Wishlist
- Secure Razorpay Payments
- Order History
- Product Reviews & Ratings
- Customer Dashboard
- Support Ticket & Chat

---

## 🏪 Seller

- Seller Registration & Login
- Seller Dashboard
- Product Management
- Inventory Tracking
- Order Management
- Revenue Overview
- Store Profile Management

---

## 🛠️ Admin

- Admin Dashboard
- Manage Users
- Manage Sellers
- Product Moderation
- Support Ticket Management
- Chat Support
- User Suspension & Reactivation

---

## 🛠️ Tech Stack

### Frontend

- React 19
- Vite
- React Router 7
- Tailwind CSS

### Backend

- Node.js
- Express.js 5

### Database

- PostgreSQL
- Prisma ORM

### Authentication

- JWT (JSON Web Token)

### Validation

- Zod

### Payments

- Razorpay

### Additional Services

- SMTP Email Integration
- SMS Provider Support

### Version Control

- Git
- GitHub

---

# 🏗️ System Architecture
<p align="center">
  <img src="docs/screenshots/System_Architecture.png.png"
       alt="CampusBasket System Architecture"
       width="900">
</p>

CampusBasket follows a modular client-server architecture where the React frontend communicates with a RESTful Express backend. Authentication is handled using JWT, business logic is organized into modules, PostgreSQL serves as the relational database through Prisma ORM, and Razorpay powers secure payment processing.

# 🗄️ Database Design

<p align="center">
  <img src="docs/screenshots/ER_Diagram.png"
       alt="CampusBasket ER Diagram"
       width="900">
</p>

The PostgreSQL database is designed using Prisma ORM and models the core entities of the marketplace, including users, sellers, products, categories, orders, payments, reviews, notifications, support tickets, and chat messages.

### Core Entities

- Users
- Sellers
- Products
- Categories
- Orders
- Payments
- Reviews
- Wishlist
- Notifications
- Support Tickets
- Chat Messages

---

# 🔒 Security

CampusBasket follows secure backend development practices including:

- JWT Authentication
- Role-Based Authorization
- Protected API Routes
- Password Hashing
- Input Validation using Zod
- Secure Payment Verification
- Environment Variable Configuration

---

# 📂 Repository Structure

```text
CampusBasket/
│
├── frontend/
│   └── src/
│       ├── components/     # Reusable UI components
│       ├── context/        # Global state management
│       ├── layout/         # Layout components
│       ├── lib/            # Utility helpers
│       └── pages/          # Application pages
│
├── backend/
│   ├── prisma/             # Database schema & migrations
│   ├── src/
│   │   ├── config/         # Application configuration
│   │   ├── lib/            # Shared libraries
│   │   ├── middlewares/    # Authentication & middleware
│   │   ├── modules/        # Business logic
│   │   ├── routes/         # API endpoints
│   │   ├── scripts/        # Utility scripts
│   │   └── utils/          # Helper functions
│   │
│   └── tests/
│
├── docs/
└── README.md
```

---

# 👤 Demo Credentials

Running the backend seed creates the following accounts.

### Admin

```text
Email:
admin@CampusBasket.com

Password:
CampusBasket-admin
```

### Seller

```text
Email:
platform@CampusBasket.com

Password:
CampusBasket-platform
```

Customers can register directly from the application.

---

# 🚀 Getting Started

## Clone Repository

```bash
git clone https://github.com/Abhi3620v/CampusBasket.git
```

---

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Runs on:

```
http://localhost:5173
```

---

## Backend Setup

```bash
cd backend
npm install

cp .env.example .env

npm run prisma:generate

npm run prisma:migrate

npm run prisma:seed

npm run dev
```

Runs on:

```
http://localhost:4000
```

---

# ⚙️ Environment Variables

Configure the following variables.

```env
DATABASE_URL=

JWT_SECRET=

CLIENT_URL=http://localhost:5173

RAZORPAY_KEY_ID=

RAZORPAY_SECRET=
```

Optional integrations:

- SMTP Email
- Twilio SMS

---

# ✅ Verification

## Frontend

```bash
npm run lint
npm run build
```

## Backend

```bash
npm test

npx prisma validate
```

---

# 💡 Technical Highlights

- Full-stack architecture with React + Express
- PostgreSQL database using Prisma ORM
- Modular backend architecture
- Route-level lazy loading
- Secure JWT authentication
- Retail & Wholesale purchasing workflows
- Multi-vendor marketplace design
- Razorpay payment integration
- Customer support ticketing system
- Notification & activity logging

---

# 🚀 Future Enhancements

- AI-powered product recommendations
- Real-time notifications using WebSockets
- Sales analytics dashboard
- Docker containerization
- CI/CD pipeline
- Multi-language support
- Product recommendation engine
- Advanced search with Elasticsearch

---

# 👨‍💻 Author

**Abhishek Yadav**

GitHub: https://github.com/Abhi3620v

LinkedIn: https://www.linkedin.com/in/abhishekyadav4653/

---

# ⭐ Support

If you found this project interesting, consider giving it a ⭐ on GitHub.


