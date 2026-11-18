-- Fiches produits modifiables, « mot de passe oublié », alertes de commande, nouveau numéro WhatsApp
-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "benefits" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "howToUse" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "ingredients" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "origin" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "StoreSettings" ADD COLUMN     "alertEmail" TEXT NOT NULL DEFAULT '',
ALTER COLUMN "whatsappNumber" SET DEFAULT '2250798419730';

-- CreateTable
CREATE TABLE "PasswordReset" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordReset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PasswordReset_customerId_createdAt_idx" ON "PasswordReset"("customerId", "createdAt");

-- AddForeignKey
ALTER TABLE "PasswordReset" ADD CONSTRAINT "PasswordReset_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
