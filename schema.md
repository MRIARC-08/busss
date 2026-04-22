// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"          // Change to "postgresql" for production
  url      = env("DATABASE_URL")
}

// ─────────────────────────────────────────────
// GEOGRAPHY LAYER
// ─────────────────────────────────────────────

model State {
  id        Int      @id @default(autoincrement())
  code      String   @unique   // "DL", "HR", "UP", "PB"
  name      String             // "Delhi", "Haryana"
  cities    City[]
  createdAt DateTime @default(now())
}

model City {
  id          Int      @id @default(autoincrement())
  name        String             // "Sonipat", "New Delhi"
  stateId     Int
  state       State    @relation(fields: [stateId], references: [id])
  stops       Stop[]
  createdAt   DateTime @default(now())
}

model Stop {
  id          Int      @id @default(autoincrement())
  name        String             // "Kashmere Gate ISBT"
  code        String   @unique   // "KG001"
  latitude    Float              // 28.6677
  longitude   Float              // 77.2285
  cityId      Int
  city        City     @relation(fields: [cityId], references: [id])
  type        StopType @default(REGULAR)  // ISBT, TERMINAL, REGULAR
  hasWaiting  Boolean  @default(false)    // Covered waiting area?
  hasShelter  Boolean  @default(false)

  // Relationships
  routeStopsAsOrigin      RouteStop[] @relation("OriginStop")
  routeStopsAsDestination RouteStop[] @relation("DestinationStop")
  allRouteStops           RouteStop[] @relation("AllStops")
  reports                 Report[]

  createdAt   DateTime @default(now())
}

enum StopType {
  ISBT
  TERMINAL
  MAJOR
  REGULAR
}

// ─────────────────────────────────────────────
// TRANSPORT LAYER
// ─────────────────────────────────────────────

model TransportAuthority {
  id     Int     @id @default(autoincrement())
  code   String  @unique   // "DTC", "HRTC", "UPSRTC"
  name   String            // "Delhi Transport Corporation"
  state  String            // "Delhi"
  buses  Bus[]
  routes Route[]
}

model Route {
  id              Int      @id @default(autoincrement())
  routeNumber     String   @unique  // "HR-29", "DTC-420"
  name            String            // "Sonipat - Kashmere Gate"
  authorityId     Int
  authority       TransportAuthority @relation(fields: [authorityId], references: [id])
  type            RouteType @default(ORDINARY)
  baseFrequency   Int               // Minutes between buses
  estimatedTime   Int               // Total journey minutes
  totalDistance   Float             // Kilometers
  baseFare        Float             // Base fare in rupees
  isActive        Boolean  @default(true)
  reliabilityScore Float   @default(0.8)  // 0 to 1

  // Stops on this route in order
  stops           RouteStop[]
  buses           Bus[]
  reports         Report[]
  journeyLegs     JourneyLeg[]

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

enum RouteType {
  EXPRESS
  ORDINARY
  AC
  INTERCITY
}

model RouteStop {
  id            Int     @id @default(autoincrement())
  routeId       Int
  route         Route   @relation(fields: [routeId], references: [id])
  stopId        Int
  stop          Stop    @relation("AllStops", fields: [stopId], references: [id])
  sequence      Int               // Order: 1, 2, 3...
  distanceFromOrigin Float        // Km from first stop
  timeFromOrigin     Int          // Minutes from first stop
  isOrigin      Boolean @default(false)
  isDestination Boolean @default(false)

  @@unique([routeId, sequence])
  @@unique([routeId, stopId])
}

model Bus {
  id              Int      @id @default(autoincrement())
  busNumber       String   @unique  // "HR-29-1234"
  routeId         Int
  route           Route    @relation(fields: [routeId], references: [id])
  authorityId     Int
  authority       TransportAuthority @relation(fields: [authorityId], references: [id])
  capacity        Int      @default(50)
  type            BusType  @default(ORDINARY)
  isAC            Boolean  @default(false)
  isActive        Boolean  @default(true)

  // Simulation state (updated by simulation engine)
  currentLat      Float?
  currentLon      Float?
  currentStopId   Int?
  nextStopId      Int?
  currentSpeed    Float    @default(0)
  occupancy       Int      @default(0)   // Current passengers
  delayMinutes    Int      @default(0)
  status          BusStatus @default(SCHEDULED)
  lastUpdated     DateTime @default(now())

  reports         Report[]
  trackingLogs    TrackingLog[]

  createdAt       DateTime @default(now())
}

enum BusType {
  ORDINARY
  EXPRESS
  MINI
  ARTICULATED
}

enum BusStatus {
  SCHEDULED
  ON_ROUTE
  AT_STOP
  DELAYED
  COMPLETED
  CANCELLED
}

// ─────────────────────────────────────────────
// SIMULATION LAYER
// ─────────────────────────────────────────────

model TrackingLog {
  id          Int      @id @default(autoincrement())
  busId       Int
  bus         Bus      @relation(fields: [busId], references: [id])
  latitude    Float
  longitude   Float
  speed       Float
  occupancy   Int
  timestamp   DateTime @default(now())
}

// ─────────────────────────────────────────────
// JOURNEY / ROUTING LAYER
// ─────────────────────────────────────────────

model JourneyPlan {
  id              Int      @id @default(autoincrement())
  originStopId    Int
  destinationStopId Int
  totalETA        Int               // Total minutes
  totalTransfers  Int
  totalFare       Float
  totalDistance   Float
  crowdLevel      CrowdLevel
  recommendationType RecommendationType
  score           Float             // Composite score 0-100

  legs            JourneyLeg[]
  createdAt       DateTime @default(now())
}

model JourneyLeg {
  id              Int      @id @default(autoincrement())
  journeyPlanId   Int
  journeyPlan     JourneyPlan @relation(fields: [journeyPlanId], references: [id])
  routeId         Int
  route           Route   @relation(fields: [routeId], references: [id])
  boardingStopId  Int
  alightingStopId Int
  legSequence     Int
  legETA          Int               // Minutes for this leg
  legDistance     Float
  waitingMinutes  Int      @default(0)
}

enum CrowdLevel {
  LOW
  MEDIUM
  HIGH
  VERY_HIGH
}

enum RecommendationType {
  RECOMMENDED
  FASTEST
  LEAST_CROWDED
  LEAST_TRANSFERS
  LEAST_WALKING
}

// ─────────────────────────────────────────────
// ACCOUNTABILITY LAYER
// ─────────────────────────────────────────────

model Report {
  id          Int          @id @default(autoincrement())
  type        ReportType
  severity    Severity     @default(MEDIUM)
  description String
  busId       Int?
  bus         Bus?         @relation(fields: [busId], references: [id])
  routeId     Int?
  route       Route?       @relation(fields: [routeId], references: [id])
  stopId      Int?
  stop        Stop?        @relation(fields: [stopId], references: [id])
  busNumber   String?      // Free text if bus not in DB
  status      ReportStatus @default(OPEN)
  resolvedAt  DateTime?
  adminNotes  String?
  createdAt   DateTime     @default(now())
}

enum ReportType {
  LATE_BUS
  OVERCROWDING
  CLEANLINESS
  UNSAFE_BEHAVIOR
  FARE_ISSUE
  VEHICLE_PROBLEM
  OTHER
}

enum Severity {
  LOW
  MEDIUM
  HIGH
  EMERGENCY
}

enum ReportStatus {
  OPEN
  UNDER_REVIEW
  RESOLVED
  DISMISSED
}
