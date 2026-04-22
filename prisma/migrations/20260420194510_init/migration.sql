-- CreateTable
CREATE TABLE "State" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "City" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "stateId" INTEGER NOT NULL,
    CONSTRAINT "City_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "State" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Stop" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "latitude" REAL NOT NULL,
    "longitude" REAL NOT NULL,
    "cityId" INTEGER NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'REGULAR',
    "hasShelter" BOOLEAN NOT NULL DEFAULT false,
    "hasWaiting" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Stop_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Authority" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "state" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Route" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "routeNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "authorityId" INTEGER NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'ORDINARY',
    "frequencyMinutes" INTEGER NOT NULL DEFAULT 30,
    "totalMinutes" INTEGER NOT NULL,
    "totalKm" REAL NOT NULL,
    "baseFare" REAL NOT NULL,
    "reliability" REAL NOT NULL DEFAULT 0.85,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "Route_authorityId_fkey" FOREIGN KEY ("authorityId") REFERENCES "Authority" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RouteStop" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "routeId" INTEGER NOT NULL,
    "stopId" INTEGER NOT NULL,
    "stopName" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "distanceKm" REAL NOT NULL,
    "timeMinutes" INTEGER NOT NULL,
    "latitude" REAL NOT NULL,
    "longitude" REAL NOT NULL,
    CONSTRAINT "RouteStop_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Bus" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "busNumber" TEXT NOT NULL,
    "routeId" INTEGER NOT NULL,
    "authorityId" INTEGER NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 55,
    "type" TEXT NOT NULL DEFAULT 'ORDINARY',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "simSegment" INTEGER NOT NULL DEFAULT 0,
    "simProgress" REAL NOT NULL DEFAULT 0,
    "simOccupancy" INTEGER NOT NULL DEFAULT 0,
    "simDelay" INTEGER NOT NULL DEFAULT 0,
    "simStatus" TEXT NOT NULL DEFAULT 'ON_ROUTE',
    CONSTRAINT "Bus_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Bus_authorityId_fkey" FOREIGN KEY ("authorityId") REFERENCES "Authority" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Report" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'MEDIUM',
    "description" TEXT NOT NULL,
    "busNumber" TEXT,
    "busId" INTEGER,
    "routeId" INTEGER,
    "stopId" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Report_busId_fkey" FOREIGN KEY ("busId") REFERENCES "Bus" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Report_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Report_stopId_fkey" FOREIGN KEY ("stopId") REFERENCES "Stop" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "State_code_key" ON "State"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Stop_code_key" ON "Stop"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Authority_code_key" ON "Authority"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Route_routeNumber_key" ON "Route"("routeNumber");

-- CreateIndex
CREATE UNIQUE INDEX "RouteStop_routeId_sequence_key" ON "RouteStop"("routeId", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "Bus_busNumber_key" ON "Bus"("busNumber");
