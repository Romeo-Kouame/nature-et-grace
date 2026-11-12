-- AlterTable
ALTER TABLE "StoreSettings" ADD COLUMN     "deliveryZones" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "legalInfo" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "waveNumber" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "deliveryFeeXof" INTEGER,
ADD COLUMN     "deliveryZone" TEXT;

-- CreateTable
CREATE TABLE "Image" (
    "id" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "private" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Image_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "productSlug" TEXT,
    "productName" TEXT,
    "rating" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

