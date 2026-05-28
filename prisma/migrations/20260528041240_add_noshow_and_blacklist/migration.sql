/*
  Warnings:

  - A unique constraint covering the columns `[cancelToken]` on the table `Reservation` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Customer" ADD COLUMN "email" TEXT;

-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN "cancelToken" TEXT;

-- CreateTable
CREATE TABLE "Feedback" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "reservationId" INTEGER NOT NULL,
    "customerName" TEXT NOT NULL,
    "reservationDate" DATETIME NOT NULL,
    "rating" INTEGER,
    "comment" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Feedback_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WaitingList" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME NOT NULL,
    "guests" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "birthDate" DATETIME,
    "email" TEXT,
    "notified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Feedback_reservationId_key" ON "Feedback"("reservationId");

-- CreateIndex
CREATE INDEX "Feedback_reservationId_idx" ON "Feedback"("reservationId");

-- CreateIndex
CREATE INDEX "WaitingList_date_idx" ON "WaitingList"("date");

-- CreateIndex
CREATE INDEX "WaitingList_notified_idx" ON "WaitingList"("notified");

-- CreateIndex
CREATE UNIQUE INDEX "Reservation_cancelToken_key" ON "Reservation"("cancelToken");

-- CreateIndex
CREATE INDEX "Reservation_cancelToken_idx" ON "Reservation"("cancelToken");
