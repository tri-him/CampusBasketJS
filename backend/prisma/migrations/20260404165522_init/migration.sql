-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CUSTOMER', 'SELLER', 'ADMIN');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "CatalogType" AS ENUM ('RETAIL', 'WHOLESALE', 'ALL');

-- CreateEnum
CREATE TYPE "OrderMode" AS ENUM ('RETAIL', 'WHOLESALE');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('UPI', 'CARD', 'COD');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PLACED', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SellerOrderStatus" AS ENUM ('NEW', 'ACCEPTED', 'PACKING', 'SHIPPED', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SupportPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "SupportTicketStatus" AS ENUM ('OPEN', 'IN_REVIEW', 'RESOLVED');

-- CreateEnum
CREATE TYPE "SupportChatStatus" AS ENUM ('ACTIVE', 'IN_REVIEW', 'CLOSED');

-- CreateEnum
CREATE TYPE "ChatSenderType" AS ENUM ('CUSTOMER', 'AGENT');

-- CreateEnum
CREATE TYPE "EmailLogType" AS ENUM ('ORDER_CONFIRMATION');

-- CreateEnum
CREATE TYPE "EmailLogStatus" AS ENUM ('PREPARED', 'SENT', 'FAILED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "gender" TEXT,
    "age" INTEGER,
    "phone" TEXT,
    "storeName" TEXT,
    "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "catalogType" "CatalogType" NOT NULL DEFAULT 'ALL',
    "sustainabilityScore" INTEGER NOT NULL DEFAULT 80,
    "retailPrice" DECIMAL(10,2) NOT NULL,
    "wholesalePrice" DECIMAL(10,2) NOT NULL,
    "minWholesaleQty" INTEGER NOT NULL DEFAULT 10,
    "inventory" INTEGER NOT NULL DEFAULT 0,
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "customerId" TEXT,
    "guestEmail" TEXT,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "shippingCharge" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "amount" DECIMAL(10,2) NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PLACED',
    "shippingName" TEXT NOT NULL,
    "shippingEmail" TEXT NOT NULL,
    "shippingPhone" TEXT NOT NULL,
    "shippingAddress" TEXT NOT NULL,
    "shippingCity" TEXT NOT NULL,
    "shippingPincode" TEXT NOT NULL,
    "placedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT,
    "sellerId" TEXT NOT NULL,
    "sellerNameSnapshot" TEXT NOT NULL,
    "productNameSnapshot" TEXT NOT NULL,
    "imageUrlSnapshot" TEXT,
    "categorySnapshot" TEXT,
    "catalogTypeSnapshot" "CatalogType" NOT NULL DEFAULT 'ALL',
    "mode" "OrderMode" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "retailPrice" DECIMAL(10,2) NOT NULL,
    "wholesalePrice" DECIMAL(10,2) NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "lineTotal" DECIMAL(10,2) NOT NULL,
    "sellerStatus" "SellerOrderStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductReview" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "orderItemId" TEXT,
    "productId" TEXT NOT NULL,
    "customerId" TEXT,
    "sellerId" TEXT,
    "sellerName" TEXT,
    "customerEmail" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "mode" "OrderMode" NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportTicket" (
    "id" TEXT NOT NULL,
    "ticketNumber" TEXT NOT NULL,
    "customerId" TEXT,
    "orderId" TEXT,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerPhone" TEXT,
    "category" TEXT NOT NULL,
    "priority" "SupportPriority" NOT NULL DEFAULT 'MEDIUM',
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "SupportTicketStatus" NOT NULL DEFAULT 'OPEN',
    "responseEta" TEXT NOT NULL DEFAULT 'Within 24 hours',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportChat" (
    "id" TEXT NOT NULL,
    "chatNumber" TEXT NOT NULL,
    "customerId" TEXT,
    "orderId" TEXT,
    "ticketId" TEXT,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "status" "SupportChatStatus" NOT NULL DEFAULT 'ACTIVE',
    "assignedAgentName" TEXT NOT NULL DEFAULT 'Aisha from CampusBasket Care',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportChat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportChatMessage" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "senderType" "ChatSenderType" NOT NULL,
    "senderName" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailLog" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "type" "EmailLogType" NOT NULL DEFAULT 'ORDER_CONFIRMATION',
    "toEmail" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" "EmailLogStatus" NOT NULL DEFAULT 'PREPARED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Address" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "label" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "addressLine" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT,
    "pincode" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WishlistItem" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "mode" "OrderMode" NOT NULL DEFAULT 'RETAIL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WishlistItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE INDEX "Product_sellerId_idx" ON "Product"("sellerId");

-- CreateIndex
CREATE INDEX "Product_category_catalogType_idx" ON "Product"("category", "catalogType");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");

-- CreateIndex
CREATE INDEX "Order_customerId_idx" ON "Order"("customerId");

-- CreateIndex
CREATE INDEX "Order_shippingEmail_idx" ON "Order"("shippingEmail");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_sellerId_idx" ON "OrderItem"("orderId", "sellerId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductReview_orderItemId_key" ON "ProductReview"("orderItemId");

-- CreateIndex
CREATE INDEX "ProductReview_productId_createdAt_idx" ON "ProductReview"("productId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ProductReview_orderId_productId_customerEmail_key" ON "ProductReview"("orderId", "productId", "customerEmail");

-- CreateIndex
CREATE UNIQUE INDEX "SupportTicket_ticketNumber_key" ON "SupportTicket"("ticketNumber");

-- CreateIndex
CREATE INDEX "SupportTicket_customerEmail_createdAt_idx" ON "SupportTicket"("customerEmail", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SupportChat_chatNumber_key" ON "SupportChat"("chatNumber");

-- CreateIndex
CREATE UNIQUE INDEX "SupportChat_ticketId_key" ON "SupportChat"("ticketId");

-- CreateIndex
CREATE INDEX "SupportChat_customerEmail_updatedAt_idx" ON "SupportChat"("customerEmail", "updatedAt");

-- CreateIndex
CREATE INDEX "SupportChatMessage_chatId_createdAt_idx" ON "SupportChatMessage"("chatId", "createdAt");

-- CreateIndex
CREATE INDEX "EmailLog_orderId_type_idx" ON "EmailLog"("orderId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "WishlistItem_customerId_productId_mode_key" ON "WishlistItem"("customerId", "productId", "mode");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductReview" ADD CONSTRAINT "ProductReview_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductReview" ADD CONSTRAINT "ProductReview_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductReview" ADD CONSTRAINT "ProductReview_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductReview" ADD CONSTRAINT "ProductReview_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportChat" ADD CONSTRAINT "SupportChat_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportChat" ADD CONSTRAINT "SupportChat_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportChat" ADD CONSTRAINT "SupportChat_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "SupportTicket"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportChatMessage" ADD CONSTRAINT "SupportChatMessage_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "SupportChat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailLog" ADD CONSTRAINT "EmailLog_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WishlistItem" ADD CONSTRAINT "WishlistItem_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WishlistItem" ADD CONSTRAINT "WishlistItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
