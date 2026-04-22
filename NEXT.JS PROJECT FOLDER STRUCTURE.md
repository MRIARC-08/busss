smart-bus-navigator/
│
├── 📁 app/                              # Next.js App Router
│   ├── 📄 layout.tsx                   # Root layout (nav, footer)
│   ├── 📄 page.tsx                     # Landing page "/"
│   ├── 📄 globals.css                  # Global styles
│   │
│   ├── 📁 search/
│   │   └── 📄 page.tsx                 # Route search results "/search"
│   │
│   ├── 📁 track/
│   │   └── 📁 [busId]/
│   │       └── 📄 page.tsx             # Live tracking "/track/[busId]"
│   │
│   ├── 📁 recommend/
│   │   └── 📄 page.tsx                 # Decision support "/recommend"
│   │
│   ├── 📁 report/
│   │   └── 📄 page.tsx                 # Report issue "/report"
│   │
│   └── 📁 admin/
│       ├── 📄 layout.tsx               # Admin layout with auth check
│       └── 📄 page.tsx                 # Admin dashboard "/admin"
│
├── 📁 api/                             # API Routes (inside app/)
│   └── 📁 app/api/
│       ├── 📁 routes/
│       │   ├── 📁 suggest/
│       │   │   └── 📄 route.ts         # POST /api/routes/suggest
│       │   └── 📁 cities/
│       │       └── 📄 route.ts         # GET /api/routes/cities
│       ├── 📁 buses/
│       │   ├── 📁 track/
│       │   │   └── 📁 [id]/
│       │   │       └── 📄 route.ts     # GET /api/buses/track/[id]
│       │   └── 📁 nearby/
│       │       └── 📄 route.ts         # GET /api/buses/nearby
│       ├── 📁 stops/
│       │   └── 📁 search/
│       │       └── 📄 route.ts         # GET /api/stops/search
│       ├── 📁 reports/
│       │   ├── 📁 create/
│       │   │   └── 📄 route.ts         # POST /api/reports/create
│       │   └── 📁 list/
│       │       └── 📄 route.ts         # GET /api/reports/list
│       └── 📁 admin/
│           └── 📁 stats/
│               └── 📄 route.ts         # GET /api/admin/stats
│
├── 📁 components/                      # Reusable React Components
│   ├── 📁 ui/                          # Generic UI primitives
│   │   ├── 📄 Button.tsx
│   │   ├── 📄 Card.tsx
│   │   ├── 📄 Badge.tsx
│   │   ├── 📄 Input.tsx
│   │   ├── 📄 Select.tsx
│   │   ├── 📄 Modal.tsx
│   │   ├── 📄 Skeleton.tsx             # Loading states
│   │   └── 📄 Tooltip.tsx
│   │
│   ├── 📁 layout/                      # Layout components
│   │   ├── 📄 Navbar.tsx
│   │   ├── 📄 Footer.tsx
│   │   └── 📄 CitySelector.tsx
│   │
│   ├── 📁 search/                      # Route search components
│   │   ├── 📄 HeroSearchBox.tsx
│   │   ├── 📄 StopAutocomplete.tsx
│   │   ├── 📄 RouteFilterPanel.tsx
│   │   ├── 📄 RouteResultCard.tsx      # ← KEY COMPONENT
│   │   ├── 📄 RecommendationBadge.tsx
│   │   ├── 📄 WhyRecommendedPanel.tsx
│   │   └── 📄 TransferTimeline.tsx
│   │
│   ├── 📁 tracking/                    # Live tracking components
│   │   ├── 📄 LiveMapView.tsx          # Leaflet map
│   │   ├── 📄 BusMarker.tsx
│   │   ├── 📄 ArrivalCountdown.tsx
│   │   ├── 📄 StopProgressBar.tsx
│   │   ├── 📄 CrowdMeter.tsx
│   │   └── 📄 BusStatusBadge.tsx
│   │
│   ├── 📁 recommendation/             # Decision support components
│   │   ├── 📄 RouteComparisonTable.tsx
│   │   ├── 📄 ReasoningPanel.tsx      # ← KEY COMPONENT
│   │   ├── 📄 PreferenceSliders.tsx
│   │   ├── 📄 JourneyBreakdown.tsx
│   │   └── 📄 ScoreCard.tsx
│   │
│   ├── 📁 report/                     # Reporting components
│   │   ├── 📄 IssueTypeSelector.tsx
│   │   ├── 📄 ReportForm.tsx
│   │   └── 📄 CommunityFeed.tsx
│   │
│   └── 📁 admin/                      # Admin components
│       ├── 📄 StatCard.tsx
│       ├── 📄 ReportRow.tsx
│       └── 📄 RoutePerformanceBar.tsx
│
├── 📁 lib/                            # Core logic libraries
│   ├── 📄 routeEngine.js              # Route finding algorithm
│   ├── 📄 scoringEngine.js            # Route scoring logic
│   ├── 📄 simulationEngine.js         # Bus position simulation
│   ├── 📄 crowdCalculator.js          # Crowd level logic
│   ├── 📄 etaCalculator.js            # ETA computation
│   ├── 📄 recommendationEngine.js     # Recommendation + reasons
│   └── 📄 prisma.ts                   # Prisma client singleton
│
├── 📁 hooks/                          # Custom React Hooks
│   ├── 📄 useBusTracking.js           # Live polling hook
│   ├── 📄 useRouteSearch.js           # Search state management
│   └── 📄 useRecommendations.js       # Preference-based filtering
│
├── 📁 data/                           # Mock JSON datasets
│   ├── 📄 states.json
│   ├── 📄 cities.json
│   ├── 📄 stops.json
│   ├── 📄 routes.json
│   ├── 📄 buses.json
│   └── 📄 schedules.json
│
├── 📁 prisma/
│   ├── 📄 schema.prisma               # Database schema
│   ├── 📄 seed.ts                     # Seed script (loads JSON → DB)
│   └── 📁 migrations/
│
├── 📁 public/
│   ├── 📁 icons/
│   │   ├── 📄 bus-marker.svg
│   │   └── 📄 stop-marker.svg
│   └── 📄 favicon.ico
│
├── 📁 types/                          # TypeScript type definitions
│   ├── 📄 route.types.ts
│   ├── 📄 bus.types.ts
│   └── 📄 report.types.ts
│
├── 📄 .env                            # DATABASE_URL, API keys
├── 📄 .env.example                    # Template for team members
├── 📄 next.config.js
├── 📄 tailwind.config.ts
├── 📄 tsconfig.json
└── 📄 package.json