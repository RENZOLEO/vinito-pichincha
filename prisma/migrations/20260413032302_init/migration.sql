-- CreateTable
CREATE TABLE "Wine" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "winery" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "varietal" TEXT,
    "zone" TEXT NOT NULL,
    "subZone" TEXT,
    "vintage" INTEGER,
    "alcohol" REAL,
    "aging" TEXT,
    "servingTemp" TEXT,
    "pairing" TEXT,
    "tastingNote" TEXT,
    "price" INTEGER,
    "fichaUrl" TEXT,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'ADMIN'
);

-- CreateIndex
CREATE INDEX "Wine_category_idx" ON "Wine"("category");

-- CreateIndex
CREATE INDEX "Wine_zone_idx" ON "Wine"("zone");

-- CreateIndex
CREATE INDEX "Wine_varietal_idx" ON "Wine"("varietal");

-- CreateIndex
CREATE INDEX "Wine_available_idx" ON "Wine"("available");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
