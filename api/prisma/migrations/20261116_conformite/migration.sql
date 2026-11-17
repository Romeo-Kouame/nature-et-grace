-- DropIndex
DROP INDEX "Order_status_idx";
-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "termsAcceptedAt" TIMESTAMP(3);
-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "clientKey" TEXT;
-- AlterTable
ALTER TABLE "StoreSettings" ADD COLUMN     "storeAddress" TEXT NOT NULL DEFAULT '';
-- CreateIndex
CREATE UNIQUE INDEX "Order_clientKey_key" ON "Order"("clientKey");
-- CreateIndex
CREATE INDEX "Order_customerId_createdAt_idx" ON "Order"("customerId", "createdAt");
-- CreateIndex
CREATE INDEX "Order_status_createdAt_idx" ON "Order"("status", "createdAt");
-- CreateIndex
CREATE INDEX "Product_active_category_idx" ON "Product"("active", "category");
-- CreateIndex
CREATE INDEX "Review_published_createdAt_idx" ON "Review"("published", "createdAt");
