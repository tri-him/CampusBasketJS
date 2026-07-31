-- AlterTable
ALTER TABLE "SupportChat" ADD COLUMN     "assignedAgentId" TEXT,
ADD COLUMN     "assignedAt" TIMESTAMP(3),
ADD COLUMN     "lastRepliedBy" "ChatSenderType",
ADD COLUMN     "unreadForAdmin" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "unreadForCustomer" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "SupportChatMessage" ADD COLUMN     "attachmentMimeType" TEXT,
ADD COLUMN     "attachmentName" TEXT,
ADD COLUMN     "attachmentSizeBytes" INTEGER,
ADD COLUMN     "attachmentUrl" TEXT;

-- CreateIndex
CREATE INDEX "SupportChat_assignedAgentId_updatedAt_idx" ON "SupportChat"("assignedAgentId", "updatedAt");
