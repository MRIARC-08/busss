NEXT.JS API ROUTES (Backend)
│
├── /api/routes/suggest     → Route recommendation engine
├── /api/routes/cities      → Available cities list
├── /api/buses/track/[id]   → Bus live simulation data
├── /api/buses/nearby       → Buses near a stop
├── /api/reports/create     → Submit passenger report
├── /api/reports/list       → Admin view reports
├── /api/admin/stats        → Dashboard statistics
└── /api/stops/search       → Stop autocomplete search


1.4 Database Strategy
text

PRIMARY: Prisma ORM + SQLite (prototype phase)
         → Easy setup, zero configuration, file-based

MOCK DATA: JSON files in /data folder
         → Routes, stops, buses pre-loaded
         → Simulation reads from JSON, not live GPS

UPGRADE PATH: Switch SQLite → PostgreSQL by changing
              one line in prisma/schema.prisma




1.5 API Usage Strategy
text

STRATEGY: Mock-first, API-assisted where needed

Phase 1 (Core Prototype):
├── All routing → Custom JSON dataset logic
├── All tracking → Simulation engine
└── All maps     → Leaflet.js + OpenStreetMap (FREE)

Phase 2 (Enhancement - If time permits):
├── Google Maps → Validate real distances/ETA
├── GTFS Data   → Import real government stop data
└── Mapbox      → Better map rendering








