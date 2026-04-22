import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ── STATES ──────────────────────────────────────
  const delhi = await prisma.state.upsert({
    where: { code: "DL" },
    update: {},
    create: { code: "DL", name: "Delhi" },
  });

  const haryana = await prisma.state.upsert({
    where: { code: "HR" },
    update: {},
    create: { code: "HR", name: "Haryana" },
  });

  const up = await prisma.state.upsert({
    where: { code: "UP" },
    update: {},
    create: { code: "UP", name: "Uttar Pradesh" },
  });

  const punjab = await prisma.state.upsert({
    where: { code: "PB" },
    update: {},
    create: { code: "PB", name: "Punjab" },
  });

  // ── CITIES ──────────────────────────────────────
  const newDelhi = await prisma.city.create({
    data: { name: "New Delhi", stateId: delhi.id },
  });
  const sonipat = await prisma.city.create({
    data: { name: "Sonipat", stateId: haryana.id },
  });
  const chandigarh = await prisma.city.create({
    data: { name: "Chandigarh", stateId: punjab.id },
  });
  const noida = await prisma.city.create({
    data: { name: "Noida", stateId: up.id },
  });

  // ── STOPS ───────────────────────────────────────
  const stops = await Promise.all([
    prisma.stop.create({
      data: {
        code: "SNP001", name: "Sonipat Bus Stand",
        latitude: 28.9952, longitude: 77.0151,
        cityId: sonipat.id, type: "TERMINAL",
        hasShelter: true, hasWaiting: true,
      },
    }),
    prisma.stop.create({
      data: {
        code: "KND001", name: "Kundli",
        latitude: 28.8890, longitude: 77.0600,
        cityId: sonipat.id, type: "REGULAR",
        hasShelter: false, hasWaiting: false,
      },
    }),
    prisma.stop.create({
      data: {
        code: "NAR001", name: "Narela Bus Stand",
        latitude: 28.8527, longitude: 77.0924,
        cityId: newDelhi.id, type: "MAJOR",
        hasShelter: true, hasWaiting: true,
      },
    }),
    prisma.stop.create({
      data: {
        code: "BAW001", name: "Bawana Chowk",
        latitude: 28.8011, longitude: 77.0362,
        cityId: newDelhi.id, type: "REGULAR",
        hasShelter: true, hasWaiting: false,
      },
    }),
    prisma.stop.create({
      data: {
        code: "KSG001", name: "Kashmere Gate ISBT",
        latitude: 28.6677, longitude: 77.2285,
        cityId: newDelhi.id, type: "ISBT",
        hasShelter: true, hasWaiting: true,
      },
    }),
    prisma.stop.create({
      data: {
        code: "ANV001", name: "Anand Vihar ISBT",
        latitude: 28.6471, longitude: 77.3159,
        cityId: newDelhi.id, type: "ISBT",
        hasShelter: true, hasWaiting: true,
      },
    }),
    prisma.stop.create({
      data: {
        code: "CHD001", name: "Chandigarh ISBT Sector 17",
        latitude: 30.7333, longitude: 76.7794,
        cityId: chandigarh.id, type: "ISBT",
        hasShelter: true, hasWaiting: true,
      },
    }),
    prisma.stop.create({
      data: {
        code: "NOD001", name: "Noida Sector 37",
        latitude: 28.5672, longitude: 77.3210,
        cityId: noida.id, type: "MAJOR",
        hasShelter: true, hasWaiting: false,
      },
    }),
  ]);

  const [
    sonipatBS, kundli, narelaBS,
    bawana, kashmereGate, anandVihar,
    chandigarhISBT, noidaSec37
  ] = stops;

  // ── AUTHORITIES ─────────────────────────────────
  const hrtc = await prisma.authority.create({
    data: { code: "HRTC", name: "Haryana Roadways", state: "Haryana" },
  });
  const dtc = await prisma.authority.create({
    data: { code: "DTC", name: "Delhi Transport Corporation", state: "Delhi" },
  });
  const upsrtc = await prisma.authority.create({
    data: { code: "UPSRTC", name: "UP State Road Transport", state: "UP" },
  });
  const punbus = await prisma.authority.create({
    data: { code: "PUNBUS", name: "Punjab Roadways", state: "Punjab" },
  });

  // ── ROUTES ──────────────────────────────────────
  const routeHR29 = await prisma.route.create({
    data: {
      routeNumber: "HR-29",
      name: "Sonipat - Kashmere Gate",
      authorityId: hrtc.id,
      type: "ORDINARY",
      frequencyMinutes: 20,
      totalMinutes: 90,
      totalKm: 48.5,
      baseFare: 45,
      reliability: 0.87,
      stops: {
        create: [
          { sequence: 1, stopId: sonipatBS.id, stopName: "Sonipat Bus Stand", distanceKm: 0, timeMinutes: 0, latitude: 28.9952, longitude: 77.0151 },
          { sequence: 2, stopId: kundli.id, stopName: "Kundli", distanceKm: 12.3, timeMinutes: 22, latitude: 28.8890, longitude: 77.0600 },
          { sequence: 3, stopId: narelaBS.id, stopName: "Narela Bus Stand", distanceKm: 24.1, timeMinutes: 42, latitude: 28.8527, longitude: 77.0924 },
          { sequence: 4, stopId: bawana.id, stopName: "Bawana Chowk", distanceKm: 32.7, timeMinutes: 58, latitude: 28.8011, longitude: 77.0362 },
          { sequence: 5, stopId: kashmereGate.id, stopName: "Kashmere Gate ISBT", distanceKm: 48.5, timeMinutes: 90, latitude: 28.6677, longitude: 77.2285 },
        ],
      },
    },
  });

  const routeHR15E = await prisma.route.create({
    data: {
      routeNumber: "HR-15E",
      name: "Sonipat - Delhi Express",
      authorityId: hrtc.id,
      type: "EXPRESS",
      frequencyMinutes: 45,
      totalMinutes: 60,
      totalKm: 48.5,
      baseFare: 60,
      reliability: 0.72,
      stops: {
        create: [
          { sequence: 1, stopId: sonipatBS.id, stopName: "Sonipat Bus Stand", distanceKm: 0, timeMinutes: 0, latitude: 28.9952, longitude: 77.0151 },
          { sequence: 2, stopId: narelaBS.id, stopName: "Narela Bus Stand", distanceKm: 24.1, timeMinutes: 30, latitude: 28.8527, longitude: 77.0924 },
          { sequence: 3, stopId: kashmereGate.id, stopName: "Kashmere Gate ISBT", distanceKm: 48.5, timeMinutes: 60, latitude: 28.6677, longitude: 77.2285 },
        ],
      },
    },
  });

  const routeDTC420 = await prisma.route.create({
    data: {
      routeNumber: "DTC-420",
      name: "Narela - Kashmere Gate Local",
      authorityId: dtc.id,
      type: "ORDINARY",
      frequencyMinutes: 15,
      totalMinutes: 40,
      totalKm: 24.4,
      baseFare: 25,
      reliability: 0.91,
      stops: {
        create: [
          { sequence: 1, stopId: narelaBS.id, stopName: "Narela Bus Stand", distanceKm: 0, timeMinutes: 0, latitude: 28.8527, longitude: 77.0924 },
          { sequence: 2, stopId: bawana.id, stopName: "Bawana Chowk", distanceKm: 8.6, timeMinutes: 12, latitude: 28.8011, longitude: 77.0362 },
          { sequence: 3, stopId: kashmereGate.id, stopName: "Kashmere Gate ISBT", distanceKm: 24.4, timeMinutes: 40, latitude: 28.6677, longitude: 77.2285 },
        ],
      },
    },
  });

  const routePB01 = await prisma.route.create({
    data: {
      routeNumber: "PB-CHD-DL",
      name: "Chandigarh - Kashmere Gate",
      authorityId: punbus.id,
      type: "INTERCITY",
      frequencyMinutes: 60,
      totalMinutes: 270,
      totalKm: 260,
      baseFare: 350,
      reliability: 0.80,
      stops: {
        create: [
          { sequence: 1, stopId: chandigarhISBT.id, stopName: "Chandigarh ISBT", distanceKm: 0, timeMinutes: 0, latitude: 30.7333, longitude: 76.7794 },
          { sequence: 2, stopId: kashmereGate.id, stopName: "Kashmere Gate ISBT", distanceKm: 260, timeMinutes: 270, latitude: 28.6677, longitude: 77.2285 },
        ],
      },
    },
  });

  // ── BUSES ───────────────────────────────────────
  await prisma.bus.createMany({
    data: [
      { busNumber: "HR-29-4521", routeId: routeHR29.id, authorityId: hrtc.id, capacity: 55, type: "ORDINARY", simSegment: 1, simProgress: 35, simOccupancy: 28, simDelay: 0, simStatus: "ON_ROUTE" },
      { busNumber: "HR-29-4522", routeId: routeHR29.id, authorityId: hrtc.id, capacity: 55, type: "ORDINARY", simSegment: 0, simProgress: 60, simOccupancy: 40, simDelay: 3, simStatus: "ON_ROUTE" },
      { busNumber: "HR-15E-8823", routeId: routeHR15E.id, authorityId: hrtc.id, capacity: 45, type: "EXPRESS", simSegment: 0, simProgress: 70, simOccupancy: 42, simDelay: 5, simStatus: "ON_ROUTE" },
      { busNumber: "DTC-420-3301", routeId: routeDTC420.id, authorityId: dtc.id, capacity: 60, type: "ORDINARY", simSegment: 0, simProgress: 20, simOccupancy: 15, simDelay: 0, simStatus: "ON_ROUTE" },
      { busNumber: "PB-CHD-001", routeId: routePB01.id, authorityId: punbus.id, capacity: 50, type: "INTERCITY", simSegment: 0, simProgress: 45, simOccupancy: 30, simDelay: 0, simStatus: "ON_ROUTE" },
    ],
  });

  console.log("✅ Database seeded successfully!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
