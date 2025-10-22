-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "managementNumber" TEXT NOT NULL,
    "title" TEXT,
    "candidateTitles" TEXT NOT NULL DEFAULT '[]',
    "measurementType" TEXT,
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

-- CreateIndex
CREATE UNIQUE INDEX "products_managementNumber_key" ON "products"("managementNumber");
