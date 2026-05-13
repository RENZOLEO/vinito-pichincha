-- AlterTable
ALTER TABLE "Wine" ADD COLUMN "cost" INTEGER;

-- CreateTable
CREATE TABLE "Drink" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "price" INTEGER,
    "imageUrl" TEXT,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Dish" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subSection" TEXT,
    "description" TEXT,
    "price" INTEGER,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ValuationSnapshot" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "takenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalUnits" INTEGER NOT NULL,
    "totalCostValue" INTEGER NOT NULL,
    "totalPriceValue" INTEGER NOT NULL,
    "byCategoryJson" TEXT NOT NULL,
    "byZoneJson" TEXT NOT NULL,
    "byWineryJson" TEXT NOT NULL,
    "wineCount" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "birthDate" DATETIME,
    "visits" INTEGER NOT NULL DEFAULT 0,
    "firstVisit" DATETIME,
    "lastVisit" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Reservation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME NOT NULL,
    "time" TEXT NOT NULL,
    "guests" INTEGER NOT NULL,
    "tables" TEXT NOT NULL,
    "floor" TEXT NOT NULL,
    "returning" BOOLEAN NOT NULL DEFAULT false,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "feedbackSent" BOOLEAN NOT NULL DEFAULT false,
    "customerId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Reservation_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'ADMIN2'
);
INSERT INTO "new_User" ("email", "id", "name", "passwordHash", "role") SELECT "email", "id", "name", "passwordHash", "role" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Drink_category_idx" ON "Drink"("category");

-- CreateIndex
CREATE INDEX "Drink_available_idx" ON "Drink"("available");

-- CreateIndex
CREATE INDEX "Dish_category_idx" ON "Dish"("category");

-- CreateIndex
CREATE INDEX "Dish_available_idx" ON "Dish"("available");

-- CreateIndex
CREATE INDEX "ValuationSnapshot_takenAt_idx" ON "ValuationSnapshot"("takenAt");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_phone_key" ON "Customer"("phone");

-- CreateIndex
CREATE INDEX "Customer_phone_idx" ON "Customer"("phone");

-- CreateIndex
CREATE INDEX "Reservation_date_idx" ON "Reservation"("date");

-- CreateIndex
CREATE INDEX "Reservation_customerId_idx" ON "Reservation"("customerId");

-- CreateIndex
CREATE INDEX "Reservation_completed_idx" ON "Reservation"("completed");
