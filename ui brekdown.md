PART 2: UI PAGE BREAKDOWN
2.1 Page 1: Landing Page (/)
text

PURPOSE: First impression, explain value, guide user to search

┌─────────────────────────────────────────────────────┐
│  🚌 SMART BUS NAVIGATOR                    [Login]  │
│     Multi-City Government Transport System          │
├─────────────────────────────────────────────────────┤
│                                                     │
│    "Know Before You Go"                             │
│    Smart routing for Delhi · Haryana · UP · Punjab  │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │  FROM: [_________________]                  │   │
│  │  TO:   [_________________]                  │   │
│  │  DATE: [Today ▼]  TIME: [Now ▼]             │   │
│  │  [🔍 FIND BEST ROUTE]                       │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │🗺️ Smart  │ │⏱️ Real-  │ │📊 Crowd  │           │
│  │  Routes  │ │  time    │ │  Alerts  │           │
│  └──────────┘ └──────────┘ └──────────┘           │
│                                                     │
│  Popular Routes Today:                              │
│  • Sonipat → Kashmere Gate  (Crowd: Medium)        │
│  • Chandigarh → Delhi ISBT  (Crowd: Low)           │
│  • Noida → Anand Vihar      (Crowd: High ⚠️)      │
│                                                     │
└─────────────────────────────────────────────────────┘

COMPONENTS NEEDED:
- HeroSearchBox.tsx
- FeatureHighlightCards.tsx
- PopularRoutesStrip.tsx
- CitySelector.tsx
2.2 Page 2: Route Search & Results (/search)
text

PURPOSE: Core feature - show route options with recommendations

┌─────────────────────────────────────────────────────┐
│  ← Back   Sonipat → Kashmere Gate    [Modify]       │
├──────────────┬──────────────────────────────────────┤
│              │                                      │
│  FILTERS     │   ROUTES FOUND: 3                    │
│  ──────────  │                                      │
│  Priority:   │  ┌─────────────────────────────┐    │
│  ○ Fastest   │  │ ⭐ RECOMMENDED               │    │
│  ○ Least     │  │ Bus HR-29 → DTC 420          │    │
│    Crowded   │  │ Sonipat → Narela → Kashmere  │    │
│  ○ Fewest    │  │                              │    │
│    Transfers │  │ ETA: 1hr 15min               │    │
│  ○ Least     │  │ Crowd: 🟡 Medium             │    │
│    Walking   │  │ Transfers: 1                 │    │
│              │  │ Fare: ₹45 (approx)           │    │
│  City State: │  │                              │    │
│  ☑ Delhi     │  │ WHY RECOMMENDED?             │    │
│  ☑ Haryana   │  │ Best balance of speed and    │    │
│  ☐ UP        │  │ comfort. Low walking time.   │    │
│  ☐ Punjab    │  │                              │    │
│              │  │ [SELECT ROUTE] [TRACK BUS]   │    │
│              │  └─────────────────────────────┘    │
│              │                                      │
│              │  ┌─────────────────────────────┐    │
│              │  │ 🚀 FASTEST ROUTE             │    │
│              │  │ Bus HR-15 Express            │    │
│              │  │ ETA: 58 min | Crowd: 🔴 High │    │
│              │  │ Transfers: 0                 │    │
│              │  │ [SELECT] [DETAILS]           │    │
│              │  └─────────────────────────────┘    │
│              │                                      │
│              │  ┌─────────────────────────────┐    │
│              │  │ 😌 LEAST CROWDED             │    │
│              │  │ Bus HR-42 → DTC 101          │    │
│              │  │ ETA: 1hr 35min | Crowd: 🟢   │    │
│              │  │ Transfers: 2                 │    │
│              │  │ [SELECT] [DETAILS]           │    │
│              │  └─────────────────────────────┘    │
└──────────────┴──────────────────────────────────────┘

COMPONENTS NEEDED:
- RouteFilterPanel.tsx
- RouteResultCard.tsx        ← Most important component
- RecommendationBadge.tsx
- WhyRecommendedTooltip.tsx
- TransferTimeline.tsx
2.3 Page 3: Live Tracking Page (/track/[busId])
text

PURPOSE: Simulate real-time bus location and arrival prediction

┌─────────────────────────────────────────────────────┐
│  ← Routes   TRACKING: Bus HR-29   🟢 Live           │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │                                             │   │
│  │          [MAP VIEW - Leaflet.js]            │   │
│  │                                             │   │
│  │   🚌 ←←←←←←←    📍 YOUR STOP              │   │
│  │      1.2 km                                 │   │
│  │                                             │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌──────────────┐  ┌──────────────┐               │
│  │  ARRIVING IN │  │   DISTANCE   │               │
│  │   6 MINUTES  │  │   1.2 km     │               │
│  │     ⏱️       │  │     📍       │               │
│  └──────────────┘  └──────────────┘               │
│                                                     │
│  Status: 🟢 ON TIME                                │
│  Bus: HR-29 | Route: Sonipat - Kashmere Gate       │
│  Current Stop: Narela Bus Stand                    │
│  Next Stop: Bawana Chowk                           │
│                                                     │
│  UPCOMING STOPS:                                    │
│  ✅ Sonipat Bus Stand    → Departed 8:10 AM        │
│  ✅ Kundli               → Departed 8:24 AM        │
│  🚌 Narela Bus Stand     → Currently Here          │
│  ⏳ Bawana Chowk         → ETA 8:45 AM            │
│  ⏳ Kashmere Gate        → ETA 9:25 AM            │
│                                                     │
│  CROWD LEVEL AT NEXT STOP:                         │
│  ████████░░ 80% full                               │
│                                                     │
│  [⚠️ REPORT ISSUE WITH THIS BUS]                  │
│                                                     │
└─────────────────────────────────────────────────────┘

COMPONENTS NEEDED:
- LiveMapView.tsx (Leaflet integration)
- BusStatusCard.tsx
- ArrivalCountdown.tsx
- StopProgressTimeline.tsx
- CrowdMeter.tsx
2.4 Page 4: Decision Support / Recommendation Page (/recommend)
text

PURPOSE: Explain WHY we recommend a route - the key differentiator

┌─────────────────────────────────────────────────────┐
│  SMART ROUTE ADVISOR                                │
│  Sonipat → Kashmere Gate                           │
├─────────────────────────────────────────────────────┤
│                                                     │
│  📊 ROUTE COMPARISON DASHBOARD                     │
│  ┌──────────┬─────────┬──────────┬────────────┐   │
│  │ Route    │  ETA    │  Crowd   │ Transfers  │   │
│  ├──────────┼─────────┼──────────┼────────────┤   │
│  │ HR-29    │ 75 min  │ Medium   │     1      │   │
│  │ HR-15    │ 58 min  │ High     │     0      │   │
│  │ HR-42    │ 95 min  │ Low      │     2      │   │
│  └──────────┴─────────┴──────────┴────────────┘   │
│                                                     │
│  🧠 SYSTEM RECOMMENDATION: Route HR-29            │
│                                                     │
│  REASONING:                                        │
│  ✅ 17 min slower than fastest - acceptable        │
│  ✅ Significantly less crowded than HR-15          │
│  ✅ Only 1 transfer - manageable                   │
│  ✅ Transfer stop has covered waiting area         │
│  ✅ High reliability score (on-time: 87%)          │
│                                                     │
│  WHAT MATTERS TO YOU?                              │
│  ┌──────────────────────────────────────────────┐  │
│  │ Speed:      [────●──────────] 40%            │  │
│  │ Comfort:    [──────────●────] 70%            │  │
│  │ Cost:       [●─────────────] 10%             │  │
│  └──────────────────────────────────────────────┘  │
│  → Adjusting preferences updates recommendation    │
│                                                     │
│  JOURNEY BREAKDOWN:                                │
│  🟦 Sonipat BS → Narela (HR-29) = 35 min         │
│  🟨 Wait at Narela = 8 min                        │
│  🟦 Narela → Kashmere Gate (DTC 420) = 32 min    │
│  ────────────────────────────────                  │
│  Total: 75 min | ₹45 approx                       │
│                                                     │
│  [✅ START THIS JOURNEY]  [📋 SAVE ROUTE]         │
│                                                     │
└─────────────────────────────────────────────────────┘

COMPONENTS NEEDED:
- RouteComparisonTable.tsx
- ReasoningPanel.tsx          ← KEY COMPONENT
- PreferenceSliders.tsx
- JourneyBreakdownTimeline.tsx
- ScoreRadarChart.tsx (optional, using recharts)
2.5 Page 5: Report Issue Page (/report)
text

PURPOSE: Accountability and transparency feature

┌─────────────────────────────────────────────────────┐
│  📢 REPORT A BUS ISSUE                             │
│  Help improve government transport for everyone    │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ISSUE TYPE: (select one)                          │
│  ┌────────────┐ ┌────────────┐ ┌─────────────┐   │
│  │ 🕐 Late    │ │ 👥 Over-   │ │ 🧹 Cleanli- │   │
│  │    Bus     │ │   crowded  │ │    ness     │   │
│  └────────────┘ └────────────┘ └─────────────┘   │
│  ┌────────────┐ ┌────────────┐ ┌─────────────┐   │
│  │ ⚠️ Unsafe  │ │ 💰 Fare    │ │ 🔧 Vehicle  │   │
│  │  Behavior  │ │   Issue    │ │   Problem   │   │
│  └────────────┘ └────────────┘ └─────────────┘   │
│                                                     │
│  BUS NUMBER: [____________]                        │
│  ROUTE:      [____________]                        │
│  STOP NAME:  [____________]                        │
│  DATE/TIME:  [Today, Now ▼]                        │
│                                                     │
│  DESCRIPTION:                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │ Describe what happened...                    │  │
│  │                                              │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
│  SEVERITY:                                         │
│  ○ Low   ● Medium   ○ High   ○ Emergency           │
│                                                     │
│  [📸 ATTACH PHOTO] (optional)                     │
│                                                     │
│  [SUBMIT REPORT]                                   │
│                                                     │
│  📊 Community Reports Today:                       │
│  • 12 overcrowding reports on Delhi routes         │
│  • 3 late bus reports on Haryana routes            │
│                                                     │
└─────────────────────────────────────────────────────┘

COMPONENTS NEEDED:
- IssueTypeSelector.tsx
- ReportForm.tsx
- CommunityReportsFeed.tsx
- SubmitConfirmation.tsx
2.6 Page 6: Admin Dashboard (/admin) - Optional
text

PURPOSE: Oversight, accountability, report management

┌─────────────────────────────────────────────────────┐
│  🛡️ ADMIN DASHBOARD         [Logged in: Admin]     │
├──────────────┬──────────────────────────────────────┤
│              │                                      │
│  NAVIGATION  │  OVERVIEW STATS                      │
│  ──────────  │  ┌───────┐ ┌───────┐ ┌───────┐     │
│  📊 Overview │  │  247  │ │  38   │ │  12   │     │
│  🗺️ Routes  │  │Searches│ │Reports│ │Active │     │
│  🚌 Buses    │  │ Today  │ │ Open  │ │ Buses │     │
│  📢 Reports  │  └───────┘ └───────┘ └───────┘     │
│  ⚙️ Settings │                                      │
│              │  RECENT REPORTS (Unresolved)         │
│              │  ┌──────────────────────────────┐   │
│              │  │ 🔴 Overcrowding - HR-29      │   │
│              │  │    Narela Stop, 2h ago       │   │
│              │  │    [MARK RESOLVED] [VIEW]    │   │
│              │  ├──────────────────────────────┤   │
│              │  │ 🟡 Late Bus - DTC 420        │   │
│              │  │    Kashmere Gate, 3h ago     │   │
│              │  │    [MARK RESOLVED] [VIEW]    │   │
│              │  └──────────────────────────────┘   │
│              │                                      │
│              │  ROUTE PERFORMANCE                   │
│              │  HR-29:  On-time 87% ████████░░     │
│              │  HR-15:  On-time 72% ███████░░░     │
│              │  DTC 420: On-time 91% █████████░    │
│              │                                      │
└──────────────┴──────────────────────────────────────┘
