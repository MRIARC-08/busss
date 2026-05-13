Implementation Phase - Let's Build It
First, Tell Me These Things So I Can Give You Exact Code
text

I need your answers to start giving you 
copy-paste ready code:

1. Have you installed Node.js on your computer?
   YES / NO

2. Do you want to use:
   a) SQLite  (easier, no setup)
   b) PostgreSQL (more professional)

3. Do you want TypeScript or plain JavaScript?
   TypeScript / JavaScript

4. What is your team size?
   Solo / 2-3 people

5. How many days do you have?
   __ days
While You Answer — Let Me Start The Setup Right Now
STEP 1: Create The Project
Bash

# Run this in your terminal

npx create-next-app@latest smart-bus-navigator
text

When it asks questions, answer EXACTLY like this:

✔ Would you like to use TypeScript?          → Yes
✔ Would you like to use ESLint?              → Yes
✔ Would you like to use Tailwind CSS?        → Yes
✔ Would you like to use src/ directory?      → No
✔ Would you like to use App Router?          → Yes
✔ Would you like to customize import alias?  → No
STEP 2: Install All Dependencies At Once
Bash

# Go into project folder first
cd smart-bus-navigator

# Install everything in one command
npm install prisma @prisma/client lucide-react recharts swr csv-parse

npm install -D @types/node

# Install Leaflet for maps
npm install leaflet react-leaflet
npm install -D @types/leaflet
STEP 3: Initialize Prisma
Bash

npx prisma init --datasource-provider sqlite
STEP 4: Paste This Complete Prisma Schema
Bash

# Open this file:
# prisma/schema.prisma
# Delete everything and paste this:
prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model State {
  id     Int    @id @default(autoincrement())
  code   String @unique
  name   String
  cities City[]
}

model City {
  id      Int    @id @default(autoincrement())
  name    String
  stateId Int
  state   State  @relation(fields: [stateId], references: [id])
  stops   Stop[]
}

model Stop {
  id          Int     @id @default(autoincrement())
  code        String  @unique
  name        String
  latitude    Float
  longitude   Float
  cityId      Int
  city        City    @relation(fields: [cityId], references: [id])
  type        String  @default("REGULAR")
  hasShelter  Boolean @default(false)
  hasWaiting  Boolean @default(false)
  reports     Report[]
}

model Authority {
  id     Int     @id @default(autoincrement())
  code   String  @unique
  name   String
  state  String
  routes Route[]
  buses  Bus[]
}

model Route {
  id               Int       @id @default(autoincrement())
  routeNumber      String    @unique
  name             String
  authorityId      Int
  authority        Authority @relation(fields: [authorityId], references: [id])
  type             String    @default("ORDINARY")
  frequencyMinutes Int       @default(30)
  totalMinutes     Int
  totalKm          Float
  baseFare         Float
  reliability      Float     @default(0.85)
  isActive         Boolean   @default(true)
  stops            RouteStop[]
  buses            Bus[]
  reports          Report[]
}

model RouteStop {
  id             Int   @id @default(autoincrement())
  routeId        Int
  route          Route @relation(fields: [routeId], references: [id])
  stopId         Int
  stopName       String
  sequence       Int
  distanceKm     Float
  timeMinutes    Int
  latitude       Float
  longitude      Float

  @@unique([routeId, sequence])
}

model Bus {
  id           Int       @id @default(autoincrement())
  busNumber    String    @unique
  routeId      Int
  route        Route     @relation(fields: [routeId], references: [id])
  authorityId  Int
  authority    Authority @relation(fields: [authorityId], references: [id])
  capacity     Int       @default(55)
  type         String    @default("ORDINARY")
  isActive     Boolean   @default(true)
  simSegment   Int       @default(0)
  simProgress  Float     @default(0)
  simOccupancy Int       @default(0)
  simDelay     Int       @default(0)
  simStatus    String    @default("ON_ROUTE")
  reports      Report[]
}

model Report {
  id          Int      @id @default(autoincrement())
  type        String
  severity    String   @default("MEDIUM")
  description String
  busNumber   String?
  busId       Int?
  bus         Bus?     @relation(fields: [busId], references: [id])
  routeId     Int?
  route       Route?   @relation(fields: [routeId], references: [id])
  stopId      Int?
  stop        Stop?    @relation(fields: [stopId], references: [id])
  status      String   @default("OPEN")
  createdAt   DateTime @default(now())
}
STEP 5: Create The Environment File
Bash

# File: .env
# It was auto-created by prisma init
# Make sure it contains:
env

DATABASE_URL="file:./dev.db"
STEP 6: Create The Seed Data File
Bash

# Create this file:
# prisma/seed.ts
TypeScript

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
STEP 7: Add Seed Script to package.json
JSON

// In package.json, add this section:
{
  "prisma": {
    "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
  }
}
Bash

# Install ts-node for running seed
npm install -D ts-node
STEP 8: Run Database Setup
Bash

# Create database and tables
npx prisma migrate dev --name init

# Seed with real data
npx prisma db seed

# Optional: open visual database browser
npx prisma studio
STEP 9: Create Prisma Client Singleton
TypeScript

// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ log: ["query"] });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
STEP 10: Tailwind Config With Custom Colors
TypeScript

// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#eff6ff",
          100: "#dbeafe",
          500: "#1d4ed8",
          600: "#1e40af",
          700: "#1e3a8a",
          900: "#1e3a8a",
        },
        accent: {
          400: "#fb923c",
          500: "#f97316",
          600: "#ea580c",
        },
        crowd: {
          low:    "#22c55e",
          medium: "#eab308",
          high:   "#ef4444",
          very:   "#7f1d1d",
        },
      },
    },
  },
  plugins: [],
};

export default config;
STEP 11: Root Layout
TypeScript

// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Smart Bus Navigator | Multi-City Government Transport",
  description: "Intelligent government bus routing and decision support system",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 min-h-screen flex flex-col`}>
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
STEP 12: Navbar Component
TypeScript

// components/layout/Navbar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bus, MapPin, AlertCircle, LayoutDashboard } from "lucide-react";

const navLinks = [
  { href: "/",         label: "Home",      icon: Bus },
  { href: "/search",   label: "Find Route", icon: MapPin },
  { href: "/report",   label: "Report",    icon: AlertCircle },
  { href: "/admin",    label: "Admin",     icon: LayoutDashboard },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="bg-brand-700 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-accent-500 p-1.5 rounded-lg">
              <Bus className="h-5 w-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <p className="font-bold text-sm leading-none">SMART BUS</p>
              <p className="text-xs text-blue-200 leading-none">Navigator</p>
            </div>
          </Link>

          {/* Nav Links */}
          <div className="flex items-center gap-1">
            {navLinks.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors
                    ${isActive
                      ? "bg-white text-brand-700"
                      : "text-blue-100 hover:bg-brand-600"
                    }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              );
            })}
          </div>

        </div>
      </div>
    </nav>
  );
}
STEP 13: Landing Page
TypeScript

// app/page.tsx
import HeroSearchBox from "@/components/search/HeroSearchBox";
import FeatureCards from "@/components/layout/FeatureCards";
import PopularRoutes from "@/components/layout/PopularRoutes";

export default function HomePage() {
  return (
    <div className="min-h-screen">

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">

          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-sm mb-6">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Live simulation active
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold mb-4 leading-tight">
            Know Before You Go
          </h1>
          <p className="text-blue-100 text-lg mb-2">
            Smart multi-city government bus navigation
          </p>
          <p className="text-blue-200 text-sm mb-10">
            Delhi · Haryana · UP · Punjab
          </p>

          {/* Search Box */}
          <HeroSearchBox />

        </div>
      </div>

      {/* Feature Cards */}
      <FeatureCards />

      {/* Popular Routes */}
      <PopularRoutes />

    </div>
  );
}
STEP 14: Hero Search Box Component
TypeScript

// components/search/HeroSearchBox.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Search, ArrowRight } from "lucide-react";

const POPULAR_STOPS = [
  "Sonipat Bus Stand",
  "Kashmere Gate ISBT",
  "Narela Bus Stand",
  "Anand Vihar ISBT",
  "Chandigarh ISBT",
  "Bawana Chowk",
  "Noida Sector 37",
];

export default function HeroSearchBox() {
  const router = useRouter();
  const [from, setFrom] = useState("");
  const [to, setTo]     = useState("");
  const [fromSuggestions, setFromSuggestions] = useState<string[]>([]);
  const [toSuggestions, setToSuggestions]     = useState<string[]>([]);

  function filterStops(query: string) {
    if (!query || query.length < 2) return [];
    return POPULAR_STOPS.filter(s =>
      s.toLowerCase().includes(query.toLowerCase())
    );
  }

  function handleSearch() {
    if (!from.trim() || !to.trim()) {
      alert("Please enter both From and To locations");
      return;
    }
    router.push(
      `/search?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-6 text-gray-800 max-w-2xl mx-auto">

      <div className="space-y-4">

        {/* FROM */}
        <div className="relative">
          <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
            From
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-brand-500" />
            <input
              type="text"
              value={from}
              onChange={(e) => {
                setFrom(e.target.value);
                setFromSuggestions(filterStops(e.target.value));
              }}
              onBlur={() => setTimeout(() => setFromSuggestions([]), 200)}
              placeholder="Enter starting bus stop..."
              className="w-full pl-9 pr-4 py-3 border-2 border-gray-200 rounded-xl
                         focus:border-brand-500 focus:outline-none text-sm"
            />
          </div>
          {fromSuggestions.length > 0 && (
            <ul className="absolute z-10 w-full bg-white border border-gray-200
                           rounded-xl shadow-lg mt-1 overflow-hidden">
              {fromSuggestions.map((s) => (
                <li
                  key={s}
                  onMouseDown={() => { setFrom(s); setFromSuggestions([]); }}
                  className="px-4 py-2.5 text-sm hover:bg-blue-50 cursor-pointer
                             flex items-center gap-2"
                >
                  <MapPin className="h-3.5 w-3.5 text-gray-400" />
                  {s}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Swap Arrow */}
        <div className="flex justify-center">
          <button
            onClick={() => { const t = from; setFrom(to); setTo(t); }}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <ArrowRight className="h-4 w-4 text-gray-500 rotate-90" />
          </button>
        </div>

        {/* TO */}
        <div className="relative">
          <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
            To
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-accent-500" />
            <input
              type="text"
              value={to}
              onChange={(e) => {
                setTo(e.target.value);
                setToSuggestions(filterStops(e.target.value));
              }}
              onBlur={() => setTimeout(() => setToSuggestions([]), 200)}
              placeholder="Enter destination bus stop..."
              className="w-full pl-9 pr-4 py-3 border-2 border-gray-200 rounded-xl
                         focus:border-brand-500 focus:outline-none text-sm"
            />
          </div>
          {toSuggestions.length > 0 && (
            <ul className="absolute z-10 w-full bg-white border border-gray-200
                           rounded-xl shadow-lg mt-1 overflow-hidden">
              {toSuggestions.map((s) => (
                <li
                  key={s}
                  onMouseDown={() => { setTo(s); setToSuggestions([]); }}
                  className="px-4 py-2.5 text-sm hover:bg-blue-50 cursor-pointer
                             flex items-center gap-2"
                >
                  <MapPin className="h-3.5 w-3.5 text-gray-400" />
                  {s}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Search Button */}
        <button
          onClick={handleSearch}
          className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold
                     py-3.5 rounded-xl flex items-center justify-center gap-2
                     transition-colors text-sm shadow-md"
        >
          <Search className="h-4 w-4" />
          Find Best Route
        </button>

      </div>
    </div>
  );
}
STEP 15: Route Suggestion API
TypeScript

// app/api/routes/suggest/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from") || "";
  const to   = searchParams.get("to")   || "";

  if (!from || !to) {
    return NextResponse.json({ error: "from and to required" }, { status: 400 });
  }

  try {
    // Find stops matching from/to names
    const fromStop = await prisma.stop.findFirst({
      where: { name: { contains: from } },
    });
    const toStop = await prisma.stop.findFirst({
      where: { name: { contains: to } },
    });

    if (!fromStop || !toStop) {
      return NextResponse.json({
        success: false,
        message: "Could not find stops for given locations",
        from, to,
      }, { status: 404 });
    }

    // Get all routes with their stops
    const allRoutes = await prisma.route.findMany({
      where: { isActive: true },
      include: {
        stops: { orderBy: { sequence: "asc" } },
        authority: true,
        buses: { where: { isActive: true } },
      },
    });

    // ── FIND DIRECT ROUTES ───────────────────────
    const directPlans: any[] = [];
    const transferPlans: any[] = [];

    for (const route of allRoutes) {
      const fromIdx = route.stops.findIndex(s => s.stopId === fromStop.id);
      const toIdx   = route.stops.findIndex(s => s.stopId === toStop.id);

      if (fromIdx !== -1 && toIdx !== -1 && fromIdx < toIdx) {
        const fromStopData = route.stops[fromIdx];
        const toStopData   = route.stops[toIdx];
        const travelMin    = toStopData.timeMinutes - fromStopData.timeMinutes;
        const distanceKm   = toStopData.distanceKm  - fromStopData.distanceKm;
        const waitMin      = Math.floor(route.frequencyMinutes / 2);
        const totalMin     = travelMin + waitMin;
        const occupancy    = route.buses[0]?.simOccupancy ?? 20;
        const capacity     = route.buses[0]?.capacity ?? 55;
        const crowdLevel   = getCrowdLevel(occupancy, capacity);
        const fare         = route.baseFare *
          (distanceKm / route.totalKm);

        directPlans.push({
          type: "DIRECT",
          routeNumber: route.routeNumber,
          routeName: route.name,
          authority: route.authority.code,
          routeType: route.type,
          legs: [{
            routeNumber: route.routeNumber,
            authority:   route.authority.code,
            from:        fromStopData.stopName,
            to:          toStopData.stopName,
            durationMin: travelMin,
            distanceKm:  Math.round(distanceKm * 10) / 10,
            isTransfer:  false,
            waitMin,
          }],
          totalMin,
          travelMin,
          waitMin,
          walkMin: 0,
          transfers: 0,
          fare: Math.round(fare),
          distanceKm: Math.round(distanceKm * 10) / 10,
          crowdLevel,
          reliability: route.reliability,
          occupancy,
          capacity,
          busId: route.buses[0]?.id,
          busNumber: route.buses[0]?.busNumber,
          delayMin: route.buses[0]?.simDelay ?? 0,
        });
      }
    }

    // ── FIND 1-TRANSFER ROUTES ───────────────────
    for (const routeA of allRoutes) {
      const fromIdx = routeA.stops.findIndex(s => s.stopId === fromStop.id);
      if (fromIdx === -1) continue;

      const stopsAfterOrigin = routeA.stops.slice(fromIdx + 1);

      for (const routeB of allRoutes) {
        if (routeA.id === routeB.id) continue;
        const toIdx = routeB.stops.findIndex(s => s.stopId === toStop.id);
        if (toIdx === -1) continue;

        for (const midStop of stopsAfterOrigin) {
          const transferIdx = routeB.stops.findIndex(
            s => s.stopId === midStop.stopId
          );
          if (transferIdx === -1 || transferIdx >= toIdx) continue;

          const legAFrom = routeA.stops[fromIdx];
          const legATo   = midStop;
          const legBFrom = routeB.stops[transferIdx];
          const legBTo   = routeB.stops[toIdx];

          const legAMin  = legATo.timeMinutes - legAFrom.timeMinutes;
          const legBMin  = legBTo.timeMinutes - legBFrom.timeMinutes;
          const waitA    = Math.floor(routeA.frequencyMinutes / 2);
          const waitB    = Math.floor(routeB.frequencyMinutes / 2);
          const walkMin  = 4; // walking between stops
          const totalMin = legAMin + waitA + walkMin + legBMin + waitB;

          const occA = routeA.buses[0]?.simOccupancy ?? 20;
          const capA = routeA.buses[0]?.capacity     ?? 55;
          const occB = routeB.buses[0]?.simOccupancy ?? 20;
          const capB = routeB.buses[0]?.capacity     ?? 55;
          const avgOcc = (occA + occB) / 2;
          const avgCap = (capA + capB) / 2;

          const fareA = routeA.baseFare * ((legATo.distanceKm - legAFrom.distanceKm) / routeA.totalKm);
          const fareB = routeB.baseFare * ((legBTo.distanceKm - legBFrom.distanceKm) / routeB.totalKm);

          transferPlans.push({
            type: "TRANSFER",
            routeNumber: `${routeA.routeNumber} → ${routeB.routeNumber}`,
            authority: `${routeA.authority.code} + ${routeB.authority.code}`,
            legs: [
              {
                routeNumber: routeA.routeNumber,
                authority:   routeA.authority.code,
                from:        legAFrom.stopName,
                to:          legATo.stopName,
                durationMin: legAMin,
                isTransfer:  false,
                waitMin:     waitA,
              },
              {
                type:        "WALK",
                description: `Walk at ${midStop.stopName}`,
                durationMin: walkMin,
                isTransfer:  true,
              },
              {
                routeNumber: routeB.routeNumber,
                authority:   routeB.authority.code,
                from:        legBFrom.stopName,
                to:          legBTo.stopName,
                durationMin: legBMin,
                isTransfer:  false,
                waitMin:     waitB,
              },
            ],
            totalMin,
            travelMin: legAMin + legBMin,
            waitMin: waitA + waitB,
            walkMin,
            transfers: 1,
            transferStop: midStop.stopName,
            fare: Math.round(fareA + fareB),
            distanceKm: Math.round(
              (legATo.distanceKm - legAFrom.distanceKm +
               legBTo.distanceKm - legBFrom.distanceKm) * 10
            ) / 10,
            crowdLevel: getCrowdLevel(avgOcc, avgCap),
            reliability: (routeA.reliability + routeB.reliability) / 2,
            occupancy: Math.round(avgOcc),
            capacity:  Math.round(avgCap),
            busId: routeA.buses[0]?.id,
            busNumber: routeA.buses[0]?.busNumber,
            delayMin: routeA.buses[0]?.simDelay ?? 0,
          });

          break; // take first valid transfer
        }
      }
    }

    const allPlans = [...directPlans, ...transferPlans];

    if (allPlans.length === 0) {
      return NextResponse.json({
        success: false,
        message: "No routes found between these stops",
      }, { status: 404 });
    }

    // ── SCORE EACH PLAN ──────────────────────────
    const scored = allPlans.map(plan => ({
      ...plan,
      score: scoreRoute(plan, allPlans),
    }));

    // ── BUILD RECOMMENDATIONS ────────────────────
    const byScore      = [...scored].sort((a, b) => b.score - a.score);
    const bySpeed      = [...scored].sort((a, b) => a.totalMin - b.totalMin);
    const byCrowd      = [...scored].sort((a, b) =>
      crowdOrder(a.crowdLevel) - crowdOrder(b.crowdLevel));
    const byTransfers  = [...scored].sort((a, b) => a.transfers - b.transfers);

    const result = {
      success: true,
      from: fromStop.name,
      to:   toStop.name,
      totalFound: scored.length,
      recommendations: {
        RECOMMENDED:      { ...byScore[0],     label: "⭐ Recommended",    reasons: buildReasons(byScore[0],     "recommended") },
        FASTEST:          { ...bySpeed[0],      label: "🚀 Fastest",        reasons: buildReasons(bySpeed[0],      "fastest")     },
        LEAST_CROWDED:    { ...byCrowd[0],      label: "😌 Least Crowded",  reasons: buildReasons(byCrowd[0],      "crowd")       },
        LEAST_TRANSFERS:  { ...byTransfers[0],  label: "🔄 Least Transfers", reasons: buildReasons(byTransfers[0],  "transfers")   },
      },
    };

    return NextResponse.json(result);

  } catch (error) {
    console.error("Route suggestion error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ── HELPERS ──────────────────────────────────────
function getCrowdLevel(occupancy: number, capacity: number): string {
  const hour = new Date().getHours();
  const isPeak = (hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 20);
  const pct = (occupancy / capacity) * 100 * (isPeak ? 1.3 : 1);
  if (pct < 40) return "LOW";
  if (pct < 65) return "MEDIUM";
  if (pct < 85) return "HIGH";
  return "VERY_HIGH";
}

function crowdOrder(level: string) {
  return { LOW: 0, MEDIUM: 1, HIGH: 2, VERY_HIGH: 3 }[level] ?? 4;
}

function scoreRoute(plan: any, allPlans: any[]) {
  const minTime = Math.min(...allPlans.map(p => p.totalMin));
  const maxTime = Math.max(...allPlans.map(p => p.totalMin));
  const range   = maxTime - minTime || 1;

  const speedScore    = 30 * (1 - (plan.totalMin - minTime) / range);
  const crowdScore    = { LOW: 25, MEDIUM: 18, HIGH: 10, VERY_HIGH: 0 }[plan.crowdLevel] ?? 10;
  const transferScore = { 0: 20, 1: 13, 2: 6 }[plan.transfers as 0|1|2] ?? 0;
  const reliScore     = 15 * plan.reliability;
  const walkScore     = plan.walkMin <= 3 ? 10 : plan.walkMin <= 7 ? 7 : 4;

  return Math.round(speedScore + crowdScore + transferScore + reliScore + walkScore);
}

function buildReasons(plan: any, type: string): string[] {
  if (!plan) return [];
  const map: Record<string, string[]> = {
    recommended: [
      `Best overall score — balanced speed and comfort`,
      `Travel time: ${plan.totalMin} minutes with ${plan.transfers} transfer(s)`,
      `Crowd level: ${plan.crowdLevel.toLowerCase()} — comfortable journey`,
      `On-time reliability: ${Math.round(plan.reliability * 100)}%`,
      plan.delayMin > 0
        ? `Current delay: ${plan.delayMin} min — factor this in`
        : `Currently running on time`,
    ],
    fastest: [
      `Shortest total travel time: ${plan.totalMin} minutes`,
      plan.transfers === 0 ? `Direct route — no transfers needed` : `Fastest despite ${plan.transfers} transfer`,
      `Note: Crowd level is ${plan.crowdLevel.toLowerCase()}`,
      `Fare: ₹${plan.fare} approx`,
    ],
    crowd: [
      `Lowest crowd level: ${plan.crowdLevel.toLowerCase()}`,
      `Good chance of getting a seat`,
      `Recommended for elderly or passengers with luggage`,
      plan.transfers > 0
        ? `Has ${plan.transfers} transfer — transfer stop has waiting area`
        : `Direct route with comfortable journey`,
    ],
    transfers: [
      `Minimum transfers: ${plan.transfers}`,
      `Easiest route to navigate`,
      `Best for first-time travelers or unfamiliar passengers`,
      `Travel time: ${plan.totalMin} minutes`,
    ],
  };
  return map[type] ?? [];
}
STEP 16: Search Results Page
TypeScript

// app/search/page.tsx
"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import RouteResultCard from "@/components/search/RouteResultCard";
import { Loader2, AlertCircle } from "lucide-react";

function SearchContent() {
  const params  = useSearchParams();
  const from    = params.get("from") || "";
  const to      = params.get("to")   || "";

  const [data,      setData]      = useState<any>(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [activeTab, setActiveTab] = useState("RECOMMENDED");

  useEffect(() => {
    if (!from || !to) return;
    setLoading(true);

    fetch(`/api/routes/suggest?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => { setError("Failed to fetch routes"); setLoading(false); });
  }, [from, to]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Loader2 className="h-10 w-10 text-brand-500 animate-spin" />
        <p className="text-gray-500">Finding best routes for you...</p>
      </div>
    );
  }

  if (error || !data?.success) {
    return (
      <div className="max-w-xl mx-auto mt-16 p-6 bg-red-50 rounded-xl
                      border border-red-200 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
        <div>
          <p className="font-semibold text-red-700">No routes found</p>
          <p className="text-sm text-red-600 mt-1">
            {data?.message || "Try different stop names"}
          </p>
        </div>
      </div>
    );
  }

  const TABS = [
    { key: "RECOMMENDED",     label: "⭐ Recommended"     },
    { key: "FASTEST",         label: "🚀 Fastest"         },
    { key: "LEAST_CROWDED",   label: "😌 Least Crowded"   },
    { key: "LEAST_TRANSFERS", label: "🔄 Least Transfers"  },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          {from} → {to}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {data.totalFound} route option{data.totalFound !== 1 ? "s" : ""} found
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap
              transition-colors border
              ${activeTab === tab.key
                ? "bg-brand-600 text-white border-brand-600"
                : "bg-white text-gray-600 border-gray-200 hover:border-brand-300"
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Route Cards */}
      <div className="space-y-4">
        {TABS.map(tab => {
          const plan = data.recommendations[tab.key];
          if (!plan) return null;
          return (
            <RouteResultCard
              key={tab.key}
              plan={plan}
              isActive={activeTab === tab.key}
              label={tab.label}
            />
          );
        })}
      </div>

    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
STEP 17: Route Result Card (Most Important UI Component)
TypeScript

// components/search/RouteResultCard.tsx
"use client";

import { useRouter } from "next/navigation";
import {
  Clock, Users, ArrowRight,
  CheckCircle, ChevronDown, ChevronUp,
  Navigation, Banknote
} from "lucide-react";
import { useState } from "react";

const CROWD_CONFIG = {
  LOW:       { color: "text-green-600",  bg: "bg-green-50",  border: "border-green-200", label: "Low",       bar: "w-1/4  bg-green-500" },
  MEDIUM:    { color: "text-yellow-600", bg: "bg-yellow-50", border: "border-yellow-200",label: "Medium",    bar: "w-2/4  bg-yellow-500" },
  HIGH:      { color: "text-red-500",    bg: "bg-red-50",    border: "border-red-200",   label: "High",      bar: "w-3/4  bg-red-500" },
  VERY_HIGH: { color: "text-red-700",    bg: "bg-red-100",   border: "border-red-300",   label: "Very High", bar: "w-full bg-red-700" },
};

export default function RouteResultCard({
  plan, isActive, label
}: {
  plan: any; isActive: boolean; label: string;
}) {
  const router = useRouter();
  const [showReasons, setShowReasons] = useState(isActive);
  const crowd = CROWD_CONFIG[plan.crowdLevel as keyof typeof CROWD_CONFIG]
             ?? CROWD_CONFIG.MEDIUM;

  return (
    <div className={`bg-white rounded-2xl border-2 shadow-sm transition-all
      ${isActive ? "border-brand-500 shadow-md" : "border-gray-100"}`}>

      {/* Card Header */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <span className="inline-block text-xs font-semibold px-2.5 py-1
                             bg-brand-50 text-brand-700 rounded-full mb-2">
              {label}
            </span>
            <h3 className="font-bold text-gray-800 text-lg">
              {plan.routeNumber}
            </h3>
            <p className="text-sm text-gray-500">{plan.authority}</p>
          </div>
          {plan.score && (
            <div className="text-right">
              <div className="text-2xl font-bold text-brand-600">{plan.score}</div>
              <div className="text-xs text-gray-400">/ 100 score</div>
            </div>
          )}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">

          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <Clock className="h-4 w-4 text-brand-500 mx-auto mb-1" />
            <div className="font-bold text-gray-800 text-sm">{plan.totalMin} min</div>
            <div className="text-xs text-gray-400">Total time</div>
          </div>

          <div className={`${crowd.bg} ${crowd.border} border rounded-xl p-3 text-center`}>
            <Users className={`h-4 w-4 ${crowd.color} mx-auto mb-1`} />
            <div className={`font-bold text-sm ${crowd.color}`}>{crowd.label}</div>
            <div className="text-xs text-gray-400">Crowd</div>
          </div>

          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <ArrowRight className="h-4 w-4 text-gray-400 mx-auto mb-1" />
            <div className="font-bold text-gray-800 text-sm">{plan.transfers}</div>
            <div className="text-xs text-gray-400">Transfer{plan.transfers !== 1 ? "s" : ""}</div>
          </div>

          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <Banknote className="h-4 w-4 text-gray-400 mx-auto mb-1" />
            <div className="font-bold text-gray-800 text-sm">₹{plan.fare}</div>
            <div className="text-xs text-gray-400">Approx</div>
          </div>

        </div>

        {/* Crowd Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Crowd level</span>
            <span>{plan.occupancy}/{plan.capacity} seats</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${crowd.bar}`} />
          </div>
        </div>

        {/* Journey Path */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4
                        flex-wrap">
          {plan.legs.map((leg: any, i: number) => (
            <div key={i} className="flex items-center gap-2">
              {leg.type === "WALK" ? (
                <span className="text-xs bg-yellow-100 text-yellow-700
                                 px-2 py-0.5 rounded-full">
                  🚶 Walk {leg.durationMin}min
                </span>
              ) : (
                <>
                  <span className="font-medium text-brand-600">{leg.from}</span>
                  <span className="text-xs bg-blue-50 text-blue-600
                                   px-2 py-0.5 rounded-full">
                    {leg.routeNumber}
                  </span>
                  <span className="font-medium text-brand-600">{leg.to}</span>
                </>
              )}
              {i < plan.legs.length - 1 && (
                <ArrowRight className="h-3 w-3 text-gray-300 flex-shrink-0" />
              )}
            </div>
          ))}
        </div>

        {/* Delay Badge */}
        {plan.delayMin > 0 && (
          <div className="mb-4 text-xs bg-orange-50 text-orange-700
                          border border-orange-200 rounded-lg px-3 py-2">
            ⚠️ Current delay: {plan.delayMin} minutes
          </div>
        )}

        {/* Why Recommended Toggle */}
        <button
          onClick={() => setShowReasons(!showReasons)}
          className="flex items-center gap-1.5 text-sm text-brand-600
                     hover:text-brand-700 font-medium"
        >
          {showReasons ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          Why this route?
        </button>

        {/* Reasons Panel */}
        {showReasons && plan.reasons?.length > 0 && (
          <div className="mt-3 bg-blue-50 rounded-xl p-4 border border-blue-100">
            <p className="text-xs font-semibold text-blue-700 mb-2 uppercase tracking-wide">
              Smart Analysis
            </p>
            <ul className="space-y-1.5">
              {plan.reasons.map((reason: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-sm text-blue-800">
                  <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  {reason}
                </li>
              ))}
            </ul>
          </div>
        )}

      </div>

      {/* Card Footer */}
      <div className="border-t border-gray-100 px-5 py-3 flex gap-3">
        {plan.busId && (
          <button
            onClick={() => router.push(`/track/${plan.busId}`)}
            className="flex-1 bg-brand-600 hover:bg-brand-700 text-white
                       font-medium py-2.5 rounded-xl text-sm flex items-center
                       justify-center gap-2 transition-colors"
          >
            <Navigation className="h-4 w-4" />
            Track Bus Live
          </button>
        )}
        <button
          onClick={() => router.push(
            `/recommend?from=${encodeURIComponent(plan.legs[0]?.from || "")}&to=${encodeURIComponent(plan.legs[plan.legs.length-1]?.to || "")}`
          )}
          className="flex-1 border-2 border-brand-200 text-brand-600
                     hover:bg-brand-50 font-medium py-2.5 rounded-xl
                     text-sm flex items-center justify-center gap-2
                     transition-colors"
        >
          Compare All Routes
        </button>
      </div>

    </div>
  );
}
STEP 18: Bus Tracking API
TypeScript

// app/api/buses/track/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Simple in-memory simulation state
const simState = new Map<number, any>();

function getOrInitState(bus: any) {
  if (!simState.has(bus.id)) {
    simState.set(bus.id, {
      segment:    bus.simSegment,
      progress:   bus.simProgress,
      occupancy:  bus.simOccupancy,
      delay:      bus.simDelay,
      lastTick:   Date.now(),
    });
  }
  return simState.get(bus.id)!;
}

function tickBus(state: any, stops: any[]) {
  const now     = Date.now();
  const elapsed = (now - state.lastTick) / 1000;
  const speedKmh = 35;
  const speedMs  = (speedKmh * 1000) / 3600;

  if (state.segment >= stops.length - 1) {
    return { ...state, status: "COMPLETED" };
  }

  const segStart  = stops[state.segment];
  const segEnd    = stops[state.segment + 1];
  const segDistKm = haversine(segStart, segEnd);
  const segDistM  = segDistKm * 1000;

  const progressIncrease = (speedMs * elapsed / segDistM) * 100;
  let newProgress = state.progress + progressIncrease;
  let newSegment  = state.segment;

  if (newProgress >= 100) {
    newProgress = 0;
    newSegment  = state.segment + 1;
    // Simulate passenger change
    const alighting = Math.floor(state.occupancy * 0.2 * Math.random());
    const boarding   = Math.floor(Math.random() * 12);
    state.occupancy  = Math.max(0, state.occupancy - alighting + boarding);
  }

  return {
    ...state,
    segment:  newSegment,
    progress: newProgress,
    lastTick: now,
    status:   "ON_ROUTE",
  };
}

function haversine(a: any, b: any) {
  const R    = 6371;
  const dLat = deg2rad(b.latitude - a.latitude);
  const dLon = deg2rad(b.longitude - a.longitude);
  const x    = Math.sin(dLat/2)**2 +
               Math.cos(deg2rad(a.latitude)) *
               Math.cos(deg2rad(b.latitude)) *
               Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1-x));
}

function deg2rad(d: number) { return d * Math.PI / 180; }

function interpolate(a: any, b: any, pct: number) {
  const p = pct / 100;
  return {
    lat: a.latitude  + (b.latitude  - a.latitude)  * p,
    lon: a.longitude + (b.longitude - a.longitude) * p,
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const busId = parseInt(params.id);
  if (isNaN(busId)) {
    return NextResponse.json({ error: "Invalid bus ID" }, { status: 400 });
  }

  try {
    const bus = await prisma.bus.findUnique({
      where: { id: busId },
      include: {
        route: {
          include: {
            stops: { orderBy: { sequence: "asc" } },
            authority: true,
          },
        },
        authority: true,
      },
    });

    if (!bus) {
      return NextResponse.json({ error: "Bus not found" }, { status: 404 });
    }

    const stops = bus.route.stops;
    let   state = getOrInitState(bus);
    state = tickBus(state, stops);
    simState.set(busId, state);

    const seg     = Math.min(state.segment, stops.length - 1);
    const nextSeg = Math.min(state.segment + 1, stops.length - 1);

    const currentStop = stops[seg];
    const nextStop    = stops[nextSeg];

    const position = seg < stops.length - 1
      ? interpolate(currentStop, nextStop, state.progress)
      : { lat: currentStop.latitude, lon: currentStop.longitude };

    const distToNext = seg < stops.length - 1
      ? haversine(position, nextStop) 
      : 0;

    const etaMin = distToNext > 0
      ? Math.max(1, Math.round((distToNext / 35) * 60))
      : 0;

    const load = state.occupancy / bus.capacity;
    const crowdLevel = load < 0.4 ? "LOW"
                     : load < 0.65 ? "MEDIUM"
                     : load < 0.85 ? "HIGH"
                     : "VERY_HIGH";

    return NextResponse.json({
      busId,
      busNumber:    bus.busNumber,
      routeNumber:  bus.route.routeNumber,
      routeName:    bus.route.name,
      authority:    bus.authority.code,
      position,
      currentStop:  currentStop.stopName,
      nextStop:     nextStop.stopName,
      distanceToNextKm: Math.round(distToNext * 10) / 10,
      etaToNextStopMin: etaMin,
      occupancy:    state.occupancy,
      capacity:     bus.capacity,
      crowdLevel,
      status:       state.status,
      delayMin:     state.delay,
      allStops:     stops.map((s, i) => ({
        sequence:   s.sequence,
        name:       s.stopName,
        status:     i < seg ? "DEPARTED"
                  : i === seg ? "CURRENT"
                  : "UPCOMING",
        etaMin:     i <= seg ? null
                  : Math.round(etaMin + (s.timeMinutes - currentStop.timeMinutes)),
      })),
      lastUpdated:  new Date().toISOString(),
    });

  } catch (error) {
    console.error("Tracking error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
STEP 19: Live Tracking Page
TypeScript

// app/track/[busId]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Clock, Navigation2, Users,
  CheckCircle, Circle, AlertCircle, ArrowLeft
} from "lucide-react";
import dynamic from "next/dynamic";

// Load map without SSR (Leaflet requires browser)
const TrackingMap = dynamic(
  () => import("@/components/tracking/TrackingMap"),
  { ssr: false, loading: () => (
    <div className="h-64 bg-gray-100 rounded-xl flex items-center justify-center">
      <p className="text-gray-400">Loading map...</p>
    </div>
  )}
);

const CROWD_LABEL = {
  LOW:       { text: "Low",       color: "text-green-600",  bg: "bg-green-100"  },
  MEDIUM:    { text: "Medium",    color: "text-yellow-600", bg: "bg-yellow-100" },
  HIGH:      { text: "High",      color: "text-red-500",    bg: "bg-red-100"    },
  VERY_HIGH: { text: "Very High", color: "text-red-700",    bg: "bg-red-100"    },
};

export default function TrackPage() {
  const { busId } = useParams();
  const router    = useRouter();
  const [bus,     setBus]     = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tick,    setTick]    = useState(0);

  useEffect(() => {
    async function fetchBus() {
      try {
        const r = await fetch(`/api/buses/track/${busId}`);
        const d = await r.json();
        setBus(d);
        setLoading(false);
      } catch {
        setLoading(false);
      }
    }

    fetchBus();
    // Poll every 5 seconds
    const interval = setInterval(() => {
      fetchBus();
      setTick(t => t + 1);
    }, 5000);

    return () => clearInterval(interval);
  }, [busId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="text-center">
          <Navigation2 className="h-10 w-10 text-brand-500 animate-spin mx-auto mb-3" />
          <p className="text-gray-500">Locating bus...</p>
        </div>
      </div>
    );
  }

  if (!bus || bus.error) {
    return (
      <div className="max-w-xl mx-auto mt-16 p-6 text-center">
        <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-3" />
        <p className="text-gray-600">Bus not found or tracking unavailable</p>
        <button onClick={() => router.back()}
          className="mt-4 text-brand-600 underline text-sm">
          Go back
        </button>
      </div>
    );
  }

  const crowd = CROWD_LABEL[bus.crowdLevel as keyof typeof CROWD_LABEL]
             ?? CROWD_LABEL.MEDIUM;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()}
          className="p-2 rounded-lg hover:bg-gray-100">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="font-bold text-gray-800 text-lg">
            Bus {bus.busNumber}
          </h1>
          <p className="text-sm text-gray-500">{bus.routeName}</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 text-xs
                        bg-green-50 text-green-600 border border-green-200
                        rounded-full px-3 py-1">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          Live
        </div>
      </div>

      {/* Map */}
      <div className="mb-6 rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
        <TrackingMap
          position={bus.position}
          busNumber={bus.busNumber}
          stops={bus.allStops}
          routeStops={bus.allStops}
        />
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-brand-50 border border-brand-100 rounded-xl p-4 text-center">
          <Clock className="h-5 w-5 text-brand-500 mx-auto mb-1" />
          <div className="font-bold text-brand-700 text-xl">
            {bus.etaToNextStopMin}m
          </div>
          <div className="text-xs text-brand-500">To next stop</div>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
          <Navigation2 className="h-5 w-5 text-gray-500 mx-auto mb-1" />
          <div className="font-bold text-gray-700 text-xl">
            {bus.distanceToNextKm} km
          </div>
          <div className="text-xs text-gray-400">Distance</div>
        </div>
        <div className={`${crowd.bg} rounded-xl p-4 text-center border border-gray-200`}>
          <Users className={`h-5 w-5 ${crowd.color} mx-auto mb-1`} />
          <div className={`font-bold text-xl ${crowd.color}`}>{crowd.text}</div>
          <div className="text-xs text-gray-400">Crowd</div>
        </div>
      </div>

      {/* Current Info */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6 shadow-sm">
        <div className="flex justify-between text-sm mb-3">
          <span className="text-gray-500">Current stop</span>
          <span className="font-semibold text-gray-800">{bus.currentStop}</span>
        </div>
        <div className="flex justify-between text-sm mb-3">
          <span className="text-gray-500">Next stop</span>
          <span className="font-semibold text-brand-600">{bus.nextStop}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Status</span>
          <span className={`font-semibold ${bus.delayMin > 0 ? "text-orange-500" : "text-green-600"}`}>
            {bus.delayMin > 0 ? `⚠️ Delayed ${bus.delayMin}min` : "✅ On time"}
          </span>
        </div>
      </div>

      {/* Stop Timeline */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm mb-6">
        <h2 className="font-semibold text-gray-800 mb-4">All Stops</h2>
        <div className="space-y-3">
          {bus.allStops.map((stop: any, i: number) => (
            <div key={i} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                {stop.status === "DEPARTED" && (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                )}
                {stop.status === "CURRENT" && (
                  <div className="h-5 w-5 rounded-full bg-brand-500
                                  ring-4 ring-brand-100 flex items-center justify-center">
                    <div className="h-2 w-2 bg-white rounded-full" />
                  </div>
                )}
                {stop.status === "UPCOMING" && (
                  <Circle className="h-5 w-5 text-gray-300" />
                )}
                {i < bus.allStops.length - 1 && (
                  <div className={`w-0.5 h-6 mt-1
                    ${stop.status === "DEPARTED" ? "bg-green-300" : "bg-gray-200"}`}
                  />
                )}
              </div>
              <div className="flex-1 pb-1">
                <div className="flex justify-between">
                  <span className={`text-sm font-medium
                    ${stop.status === "CURRENT"  ? "text-brand-600 font-bold" :
                      stop.status === "DEPARTED" ? "text-gray-400" : "text-gray-700"}`}>
                    {stop.name}
                  </span>
                  {stop.status === "UPCOMING" && stop.etaMin && (
                    <span className="text-xs text-gray-400">
                      ~{stop.etaMin} min
                    </span>
                  )}
                  {stop.status === "CURRENT" && (
                    <span className="text-xs text-brand-500 font-medium">
                      🚌 Here now
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Report Button */}
      <button
        onClick={() => router.push(`/report?busNumber=${bus.busNumber}`)}
        className="w-full border-2 border-red-200 text-red-500 hover:bg-red-50
                   rounded-xl py-3 text-sm font-medium flex items-center
                   justify-center gap-2 transition-colors"
      >
        <AlertCircle className="h-4 w-4" />
        Report Issue With This Bus
      </button>

    </div>
  );
}
STEP 20: Tracking Map Component
TypeScript

// components/tracking/TrackingMap.tsx
"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:       "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:     "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const busIcon = L.divIcon({
  html: `<div style="
    background:#1d4ed8;color:white;
    border-radius:50%;width:32px;height:32px;
    display:flex;align-items:center;justify-content:center;
    font-size:16px;border:3px solid white;
    box-shadow:0 2px 8px rgba(0,0,0,0.3)">🚌</div>`,
  className: "",
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

interface Props {
  position: { lat: number; lon: number };
  busNumber: string;
  stops: { name: string; status: string }[];
  routeStops: any[];
}

export default function TrackingMap({ position, busNumber, stops }: Props) {
  const mapRef     = useRef<L.Map | null>(null);
  const markerRef  = useRef<L.Marker | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    mapRef.current = L.map(containerRef.current, {
      center: [position.lat, position.lon],
      zoom:   13,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(mapRef.current);

    markerRef.current = L.marker([position.lat, position.lon], { icon: busIcon })
      .addTo(mapRef.current)
      .bindPopup(`<strong>Bus ${busNumber}</strong><br/>Live position`);

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Update marker position on each tick
  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;
    markerRef.current.setLatLng([position.lat, position.lon]);
    mapRef.current.setView([position.lat, position.lon], 13);
  }, [position]);

  return <div ref={containerRef} className="h-72 w-full" />;
}
STEP 21: Report Issue API + Page
TypeScript

// app/api/reports/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, severity, description, busNumber, routeId, stopId } = body;

    if (!type || !description) {
      return NextResponse.json(
        { error: "type and description required" },
        { status: 400 }
      );
    }

    const report = await prisma.report.create({
      data: {
        type,
        severity: severity || "MEDIUM",
        description,
        busNumber: busNumber || null,
        routeId:   routeId  ? parseInt(routeId)  : null,
        stopId:    stopId   ? parseInt(stopId)   : null,
        status:    "OPEN",
      },
    });

    return NextResponse.json({ success: true, reportId: report.id });
  } catch (error) {
    console.error("Report error:", error);
    return NextResponse.json({ error: "Failed to submit" }, { status: 500 });
  }
}
TypeScript

// app/report/page.tsx
"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle, Clock, Users,
  Wind, Shield, DollarSign, Wrench,
  CheckCircle, Loader2
} from "lucide-react";
import { Suspense } from "react";

const ISSUE_TYPES = [
  { key: "LATE_BUS",       label: "Late Bus",       icon: Clock,        color: "text-orange-500 bg-orange-50 border-orange-200" },
  { key: "OVERCROWDING",   label: "Overcrowded",    icon: Users,        color: "text-red-500 bg-red-50 border-red-200"          },
  { key: "CLEANLINESS",    label: "Cleanliness",    icon: Wind,         color: "text-blue-500 bg-blue-50 border-blue-200"       },
  { key: "UNSAFE_BEHAVIOR",label: "Unsafe Behavior",icon: Shield,       color: "text-purple-500 bg-purple-50 border-purple-200" },
  { key: "FARE_ISSUE",     label: "Fare Issue",     icon: DollarSign,   color: "text-green-500 bg-green-50 border-green-200"    },
  { key: "VEHICLE_PROBLEM",label: "Vehicle Problem",icon: Wrench,       color: "text-gray-500 bg-gray-50 border-gray-200"       },
];

const SEVERITIES = ["LOW", "MEDIUM", "HIGH", "EMERGENCY"];

function ReportContent() {
  const params    = useSearchParams();
  const preBusNum = params.get("busNumber") || "";

  const [issueType,  setIssueType]  = useState("");
  const [severity,   setSeverity]   = useState("MEDIUM");
  const [description,setDescription]= useState("");
  const [busNumber,  setBusNumber]  = useState(preBusNum);
  const [loading,    setLoading]    = useState(false);
  const [submitted,  setSubmitted]  = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!issueType || !description) {
      alert("Please select an issue type and write a description");
      return;
    }
    setLoading(true);
    try {
      const r = await fetch("/api/reports/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: issueType, severity, description, busNumber }),
      });
      const d = await r.json();
      if (d.success) setSubmitted(true);
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto mt-16 text-center p-8">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Report Submitted!</h2>
        <p className="text-gray-500 mb-6">
          Thank you for helping improve government bus transport.
          Your report has been logged.
        </p>
        <button
          onClick={() => setSubmitted(false)}
          className="bg-brand-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium"
        >
          Submit Another
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <AlertCircle className="h-6 w-6 text-red-500" />
          Report a Bus Issue
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Help improve government transport for everyone
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Issue Type */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Issue Type *
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {ISSUE_TYPES.map(({ key, label, icon: Icon, color }) => (
              <button
                key={key}
                type="button"
                onClick={() => setIssueType(key)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2
                  text-sm font-medium transition-all
                  ${issueType === key ? color : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"}`}
              >
                <Icon className="h-5 w-5" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Bus Number */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Bus Number (if known)
          </label>
          <input
            type="text"
            value={busNumber}
            onChange={e => setBusNumber(e.target.value)}
            placeholder="e.g. HR-29-4521"
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3
                       focus:border-brand-500 focus:outline-none text-sm"
          />
        </div>

        {/* Severity */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Severity
          </label>
          <div className="flex gap-2">
            {SEVERITIES.map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setSeverity(s)}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold border-2 transition-all
                  ${severity === s
                    ? s === "EMERGENCY" ? "bg-red-600 text-white border-red-600"
                    : s === "HIGH"      ? "bg-orange-500 text-white border-orange-500"
                    : s === "MEDIUM"    ? "bg-yellow-500 text-white border-yellow-500"
                    :                    "bg-green-500 text-white border-green-500"
                    : "bg-white text-gray-500 border-gray-200"
                  }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Description *
          </label>
          <textarea
            rows={4}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Describe what happened in detail..."
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3
                       focus:border-brand-500 focus:outline-none text-sm resize-none"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold
                     py-3.5 rounded-xl flex items-center justify-center gap-2
                     transition-colors disabled:opacity-60"
        >
          {loading
            ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</>
            : <><AlertCircle className="h-4 w-4" /> Submit Report</>
          }
        </button>

      </form>
    </div>
  );
}

export default function ReportPage() {
  return (
    <Suspense fallback={<div className="py-24 text-center text-gray-400">Loading...</div>}>
      <ReportContent />
    </Suspense>
  );
}
STEP 22: Feature Cards + Popular Routes + Footer
TypeScript

// components/layout/FeatureCards.tsx
import { MapPin, Clock, BarChart3, Shield } from "lucide-react";

const features = [
  { icon: MapPin,    title: "Smart Routes",      desc: "AI-recommended route combinations across Delhi, Haryana, UP & Punjab",  color: "text-blue-500 bg-blue-50" },
  { icon: Clock,     title: "Live Simulation",   desc: "Real-time bus position tracking with arrival predictions",              color: "text-green-500 bg-green-50" },
  { icon: BarChart3, title: "Crowd Intelligence",desc: "Know crowd levels before you board — plan a comfortable journey",       color: "text-orange-500 bg-orange-50" },
  { icon: Shield,    title: "Report",    desc: "Report issues directly and track government response",                  color: "text-purple-500 bg-purple-50" },
];

export default function FeatureCards() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-14">
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">
        Why SMART Bus Navigator?
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {features.map(({ icon: Icon, title, desc, color }) => (
          <div key={title}
            className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className={`inline-flex p-3 rounded-xl ${color} mb-4`}>
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-gray-800 mb-2">{title}</h3>
            <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
TypeScript

// components/layout/PopularRoutes.tsx
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const routes = [
  { from: "Sonipat Bus Stand", to: "Kashmere Gate ISBT", crowd: "MEDIUM", time: "75 min" },
  { from: "Chandigarh ISBT",   to: "Kashmere Gate ISBT", crowd: "LOW",    time: "4.5 hr" },
  { from: "Narela Bus Stand",  to: "Kashmere Gate ISBT", crowd: "HIGH",   time: "40 min" },
];

const crowdBadge = {
  LOW:    "bg-green-100 text-green-700",
  MEDIUM: "bg-yellow-100 text-yellow-700",
  HIGH:   "bg-red-100 text-red-600",
};

export default function PopularRoutes() {
  return (
    <div className="bg-gray-50 border-t border-gray-100 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Popular Routes Today</h2>
        <div className="space-y-3">
          {routes.map((r, i) => (
            <Link
              key={i}
              href={`/search?from=${encodeURIComponent(r.from)}&to=${encodeURIComponent(r.to)}`}
              className="flex items-center justify-between bg-white rounded-xl
                         border border-gray-200 px-5 py-4 hover:border-brand-300
                         hover:shadow-sm transition-all group"
            >
              <div className="flex items-center gap-3 text-sm">
                <span className="font-medium text-gray-800">{r.from}</span>
                <ArrowRight className="h-4 w-4 text-gray-300" />
                <span className="font-medium text-gray-800">{r.to}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium
                  ${crowdBadge[r.crowd as keyof typeof crowdBadge]}`}>
                  {r.crowd}
                </span>
                <span className="text-xs text-gray-400">{r.time}</span>
                <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-brand-500
                                       group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
TypeScript

// components/layout/Footer.tsx
import { Bus } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-gray-400 py-8 px-4">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row
                      items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Bus className="h-4 w-4 text-brand-400" />
          <span className="text-sm text-gray-300 font-medium">
            Smart Bus Navigator
          </span>
        </div>
        <p className="text-xs text-center">
          Prototype · Student Project · Not for production use
        </p>
        <p className="text-xs">
          Data: OpenStreetMap · Simulation based
        </p>
      </div>
    </footer>
  );
}
FINAL: Run The App
Bash

# Terminal 1: Run database setup (only once)
npx prisma migrate dev --name init
npx prisma db seed

# Terminal 2: Start development server
npm run dev

# Open browser:
# http://localhost:3000
What You Have Now
text

✅ Landing page with route search
✅ Route suggestion API with scoring engine
✅ Decision support with "Why Recommended" explanations
✅ Search results with all 4 recommendation types
✅ Live bus tracking with simulation
✅ Interactive map with Leaflet + OpenStreetMap
✅ Report issue page + API
✅ Real database with Prisma + SQLite
✅ Mobile responsive design
✅ Crowd level indicators
✅ Stop timeline with status

NEXT THINGS TO ADD (in order of priority):
→ Admin dashboard page
→ Recommendation comparison page /recommend
→ More seed data (more routes/stops)
