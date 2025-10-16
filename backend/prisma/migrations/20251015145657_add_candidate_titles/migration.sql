-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_products" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "managementNumber" TEXT NOT NULL,
    "title" TEXT,
    "candidateTitles" TEXT NOT NULL DEFAULT '[]',
    "level" TEXT,
    "measurement" TEXT,
    "condition" TEXT,
    "category" TEXT,
    "shop1" TEXT,
    "shop2" TEXT,
    "shop3" TEXT,
    "images" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_products" ("candidateTitles", "category", "condition", "createdAt", "id", "images", "level", "managementNumber", "measurement", "shop1", "shop2", "shop3", "title", "updatedAt") SELECT coalesce("candidateTitles", '[]') AS "candidateTitles", "category", "condition", "createdAt", "id", "images", "level", "managementNumber", "measurement", "shop1", "shop2", "shop3", "title", "updatedAt" FROM "products";
DROP TABLE "products";
ALTER TABLE "new_products" RENAME TO "products";
CREATE UNIQUE INDEX "products_managementNumber_key" ON "products"("managementNumber");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
