-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    "stock" INTEGER NOT NULL DEFAULT 0,
    "fichaUrl" TEXT,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Wine" ("aging", "alcohol", "available", "category", "createdAt", "fichaUrl", "id", "name", "pairing", "price", "servingTemp", "subZone", "tastingNote", "updatedAt", "varietal", "vintage", "winery", "zone") SELECT "aging", "alcohol", "available", "category", "createdAt", "fichaUrl", "id", "name", "pairing", "price", "servingTemp", "subZone", "tastingNote", "updatedAt", "varietal", "vintage", "winery", "zone" FROM "Wine";
DROP TABLE "Wine";
ALTER TABLE "new_Wine" RENAME TO "Wine";
CREATE INDEX "Wine_category_idx" ON "Wine"("category");
CREATE INDEX "Wine_zone_idx" ON "Wine"("zone");
CREATE INDEX "Wine_varietal_idx" ON "Wine"("varietal");
CREATE INDEX "Wine_available_idx" ON "Wine"("available");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
