-- CreateTable
CREATE TABLE "Sale" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "wineId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" INTEGER,
    "total" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Sale_wineId_fkey" FOREIGN KEY ("wineId") REFERENCES "Wine" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Sale_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'STAFF'
);
INSERT INTO "new_User" ("email", "id", "name", "passwordHash", "role") SELECT "email", "id", "name", "passwordHash", "role" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE TABLE "new_Wine" (
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
    "stock" INTEGER NOT NULL DEFAULT 1,
    "fichaUrl" TEXT,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Wine" ("aging", "alcohol", "available", "category", "createdAt", "fichaUrl", "id", "name", "pairing", "price", "servingTemp", "stock", "subZone", "tastingNote", "updatedAt", "varietal", "vintage", "winery", "zone") SELECT "aging", "alcohol", "available", "category", "createdAt", "fichaUrl", "id", "name", "pairing", "price", "servingTemp", "stock", "subZone", "tastingNote", "updatedAt", "varietal", "vintage", "winery", "zone" FROM "Wine";
DROP TABLE "Wine";
ALTER TABLE "new_Wine" RENAME TO "Wine";
CREATE INDEX "Wine_category_idx" ON "Wine"("category");
CREATE INDEX "Wine_zone_idx" ON "Wine"("zone");
CREATE INDEX "Wine_varietal_idx" ON "Wine"("varietal");
CREATE INDEX "Wine_available_idx" ON "Wine"("available");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Sale_wineId_idx" ON "Sale"("wineId");

-- CreateIndex
CREATE INDEX "Sale_userId_idx" ON "Sale"("userId");

-- CreateIndex
CREATE INDEX "Sale_createdAt_idx" ON "Sale"("createdAt");
