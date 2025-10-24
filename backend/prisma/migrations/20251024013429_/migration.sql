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

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "work_processes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "productIds" TEXT NOT NULL,
    "currentProductId" TEXT,
    "finishedProducts" INTEGER NOT NULL DEFAULT 0,
    "isFinished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "work_processes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "products_managementNumber_key" ON "products"("managementNumber");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
