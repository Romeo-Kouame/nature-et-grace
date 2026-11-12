-- Galerie de photos et pastille des produits
ALTER TABLE "Product" ADD COLUMN     "gallery" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "badge" TEXT;
