4.1 Core Algorithm Design
JavaScript

// lib/routeEngine.js
// ─────────────────────────────────────────────────────────────
// ROUTE RECOMMENDATION ENGINE
// ─────────────────────────────────────────────────────────────

/**
 * STEP 1: FIND ALL POSSIBLE ROUTES
 * 
 * Given: origin stop ID, destination stop ID
 * 
 * Logic:
 * 1. Find all direct routes (same route covers both stops)
 * 2. Find 1-transfer routes (route A → transfer stop → route B)
 * 3. Limit to max 2 transfers for prototype
 */

function findAllRoutes(originId, destinationId, routeData) {
  const directRoutes = [];
  const transferRoutes = [];

  // Check each route for direct coverage
  for (const route of routeData) {
    const stops = route.stops; // ordered array
    const originIndex = stops.findIndex(s => s.stopId === originId);
    const destIndex = stops.findIndex(s => s.stopId === destinationId);

    if (originIndex !== -1 && destIndex !== -1 && originIndex < destIndex) {
      // Direct route found
      directRoutes.push({
        type: "DIRECT",
        legs: [{ route, from: originIndex, to: destIndex }],
        transfers: 0,
      });
    }
  }

  // Find transfer routes: look for common intermediate stops
  for (const routeA of routeData) {
    const originIndex = routeA.stops.findIndex(s => s.stopId === originId);
    if (originIndex === -1) continue;

    for (const routeB of routeData) {
      if (routeA.id === routeB.id) continue;
      const destIndex = routeB.stops.findIndex(s => s.stopId === destinationId);
      if (destIndex === -1) continue;

      // Find common stops between routeA (after origin) and routeB (before destination)
      const routeAStopsAfterOrigin = routeA.stops.slice(originIndex + 1);
      
      for (const transferStop of routeAStopsAfterOrigin) {
        const transferInB = routeB.stops.findIndex(
          s => s.stopId === transferStop.stopId
        );
        if (transferInB !== -1 && transferInB < destIndex) {
          transferRoutes.push({
            type: "TRANSFER",
            legs: [
              { route: routeA, from: originIndex, to: transferStop },
              { route: routeB, from: transferInB, to: destIndex }
            ],
            transfers: 1,
            transferStop: transferStop.stopId,
          });
          break; // Take first valid transfer stop
        }
      }
    }
  }

  return [...directRoutes, ...transferRoutes];
}
4.2 Scoring System
JavaScript

/**
 * STEP 2: SCORE EACH ROUTE
 * 
 * Scoring Matrix (total 100 points):
 * 
 * ┌─────────────────────┬───────────┬─────────────────────────────┐
 * │ Factor              │ Max Score │ Calculation                 │
 * ├─────────────────────┼───────────┼─────────────────────────────┤
 * │ Speed (ETA)         │    30     │ Faster = Higher score       │
 * │ Crowd Level         │    25     │ Less crowd = Higher         │
 * │ Transfers           │    20     │ Fewer transfers = Higher    │
 * │ Reliability         │    15     │ On-time % from history      │
 * │ Walking Distance    │    10     │ Less walking = Higher       │
 * └─────────────────────┴───────────┴─────────────────────────────┘
 */

function scoreRoute(route, allRoutes) {
  const scores = {};

  // --- SPEED SCORE (30 points) ---
  const minETA = Math.min(...allRoutes.map(r => r.calculatedETA));
  const maxETA = Math.max(...allRoutes.map(r => r.calculatedETA));
  scores.speed = 30 * (1 - (route.calculatedETA - minETA) / (maxETA - minETA + 1));

  // --- CROWD SCORE (25 points) ---
  const crowdMap = { LOW: 25, MEDIUM: 18, HIGH: 10, VERY_HIGH: 0 };
  scores.crowd = crowdMap[route.crowdLevel] ?? 10;

  // --- TRANSFER SCORE (20 points) ---
  const transferPenalty = { 0: 20, 1: 13, 2: 6, 3: 0 };
  scores.transfers = transferPenalty[route.transfers] ?? 0;

  // --- RELIABILITY SCORE (15 points) ---
  // reliabilityScore is 0 to 1 from database
  scores.reliability = 15 * route.reliabilityScore;

  // --- WALKING SCORE (10 points) ---
  // walkingMinutes estimated from transfer stop quality
  scores.walking = route.walkingMinutes <= 3 ? 10 :
                   route.walkingMinutes <= 7 ? 7 :
                   route.walkingMinutes <= 12 ? 4 : 1;

  // TOTAL
  const total = Object.values(scores).reduce((a, b) => a + b, 0);

  return {
    total: Math.round(total),
    breakdown: scores,
  };
}
4.3 ETA Calculation
JavaScript

/**
 * STEP 3: CALCULATE ETA
 * 
 * Formula:
 * Total ETA = Bus Travel Time + Waiting Time + Transfer Walking Time
 */

function calculateETA(journeyPlan, buses) {
  let totalMinutes = 0;

  for (const leg of journeyPlan.legs) {
    // 1. Travel time from route data
    const legTravelTime = leg.route.estimatedTime *
      (leg.distanceFraction); // fraction of total route covered

    // 2. Waiting time for this bus
    const nextBus = getNextBus(leg.route.id, leg.fromStop, buses);
    const waitingTime = nextBus ? nextBus.minutesUntilArrival : leg.route.baseFrequency / 2;

    // 3. Transfer walking time (2-5 min penalty per transfer)
    const walkingTime = leg.isTransfer ? 4 : 0;

    // 4. Apply delay factor from simulation
    const delayFactor = nextBus?.delayMinutes ?? 0;

    totalMinutes += legTravelTime + waitingTime + walkingTime + delayFactor;
  }

  return Math.round(totalMinutes);
}
4.4 Crowd Simulation Logic
JavaScript

/**
 * CROWD LEVEL CALCULATION
 * 
 * Based on:
 * 1. Time of day (peak hours = more crowd)
 * 2. Route popularity score
 * 3. Current bus occupancy from simulation
 * 4. Historical patterns
 */

function calculateCrowdLevel(route, currentHour, occupancy, capacity) {
  // Peak hours: 8-10 AM, 5-8 PM
  const isPeakHour = (currentHour >= 8 && currentHour <= 10) ||
                     (currentHour >= 17 && currentHour <= 20);

  // Current load percentage
  const loadPercent = (occupancy / capacity) * 100;

  // Peak hour multiplier
  const adjustedLoad = isPeakHour ? loadPercent * 1.3 : loadPercent;

  if (adjustedLoad < 40) return "LOW";
  if (adjustedLoad < 65) return "MEDIUM";
  if (adjustedLoad < 85) return "HIGH";
  return "VERY_HIGH";
}
4.5 Recommendation Selection & Explanation
JavaScript

/**
 * STEP 4: ASSIGN RECOMMENDATION TYPES + GENERATE EXPLANATIONS
 */

function generateRecommendations(scoredRoutes) {
  // Sort by total score for RECOMMENDED
  const sorted = [...scoredRoutes].sort((a, b) => b.score.total - a.score.total);

  return {
    RECOMMENDED: {
      route: sorted[0],
      reason: buildReasonText(sorted[0], "recommended"),
    },
    FASTEST: {
      route: [...scoredRoutes].sort((a, b) => a.calculatedETA - b.calculatedETA)[0],
      reason: buildReasonText(null, "fastest"),
    },
    LEAST_CROWDED: {
      route: [...scoredRoutes].sort((a, b) =>
        crowdOrder(a.crowdLevel) - crowdOrder(b.crowdLevel))[0],
      reason: buildReasonText(null, "least_crowded"),
    },
    LEAST_TRANSFERS: {
      route: [...scoredRoutes].sort((a, b) => a.transfers - b.transfers)[0],
      reason: buildReasonText(null, "least_transfers"),
    },
  };
}

function buildReasonText(route, type) {
  const reasons = {
    recommended: [
      `Best overall score of ${route?.score.total}/100`,
      `Balances speed (${route?.calculatedETA} min) with comfort (${route?.crowdLevel} crowd)`,
      `Reliability rating: ${Math.round((route?.reliabilityScore ?? 0.8) * 100)}%`,
      `Only ${route?.transfers} transfer(s) required`,
    ],
    fastest: [
      "Shortest travel time to your destination",
      "Direct route, no waiting at transfer stops",
      "Note: May be more crowded during peak hours",
    ],
    least_crowded: [
      "Most comfortable journey with fewer co-passengers",
      "Better chance of getting a seat",
      "Recommended for elderly, differently-abled, or those with luggage",
    ],
    least_transfers: [
      "Simplest route — minimum chance of missing connections",
      "Great for first-time travelers on this route",
      "Less physical navigation between stops",
    ],
  };

  return reasons[type] ?? [];
}

function crowdOrder(level) {
  return { LOW: 0, MEDIUM: 1, HIGH: 2, VERY_HIGH: 3 }[level] ?? 4;
}
PART 5: SIMULATED REAL-TIME TRACKING STRATEGY
5.1 Simulation Architecture
text

SIMULATION ENGINE CONCEPT:
─────────────────────────────────────────────────────────
Each bus follows a pre-defined path (array of GPS coordinates).
The engine moves each bus forward on a timer interval.
Frontend polls the API every 5 seconds to get updated position.

Bus Path = [Stop1_coords → Stop2_coords → Stop3_coords → ...]
Between each stop: interpolate GPS coordinates over time
─────────────────────────────────────────────────────────
5.2 Bus Position Interpolation Logic
JavaScript

// lib/simulationEngine.js

/**
 * COORDINATE INTERPOLATION
 * 
 * Given start point and end point,
 * calculate bus position at any given progress percentage (0-100)
 */

function interpolatePosition(startCoord, endCoord, progressPercent) {
  const progress = progressPercent / 100;
  return {
    lat: startCoord.lat + (endCoord.lat - startCoord.lat) * progress,
    lon: startCoord.lon + (endCoord.lon - startCoord.lon) * progress,
  };
}

/**
 * MAIN SIMULATION TICK
 * Called every 5 seconds by a setInterval
 */

const BUS_STATES = new Map(); // In-memory store for simulation

function initSimulation(busesData) {
  for (const bus of busesData) {
    BUS_STATES.set(bus.id, {
      busId: bus.id,
      routeStops: bus.route.stops,   // Array of {stopId, lat, lon, seq}
      currentSegment: 0,             // Which stop-to-stop segment
      segmentProgress: 0,            // 0-100% through segment
      speed: getRandomSpeed(bus.routeType),
      occupancy: getInitialOccupancy(bus),
      delayMinutes: Math.random() < 0.2 ? Math.floor(Math.random() * 10) : 0,
      status: "ON_ROUTE",
      lastTick: Date.now(),
    });
  }
}

function tickSimulation() {
  for (const [busId, state] of BUS_STATES) {
    const now = Date.now();
    const elapsed = (now - state.lastTick) / 1000; // seconds

    // Calculate distance traveled in this tick
    const distanceKm = (state.speed * elapsed) / 3600; // km

    // Get current segment distance
    const currentStop = state.routeStops[state.currentSegment];
    const nextStop = state.routeStops[state.currentSegment + 1];

    if (!nextStop) {
      // Bus completed route
      BUS_STATES.set(busId, { ...state, status: "COMPLETED" });
      continue;
    }

    const segmentDistanceKm = haversineDistance(currentStop, nextStop);
    const progressIncrement = (distanceKm / segmentDistanceKm) * 100;

    let newProgress = state.segmentProgress + progressIncrement;

    if (newProgress >= 100) {
      // Bus reached next stop - simulate boarding/alighting pause
      newProgress = 0;
      const newSegment = state.currentSegment + 1;
      const newOccupancy = simulatePassengerChange(state.occupancy, nextStop);

      BUS_STATES.set(busId, {
        ...state,
        currentSegment: newSegment,
        segmentProgress: 0,
        occupancy: newOccupancy,
        status: "AT_STOP",
        lastTick: now,
      });

      // After 30 seconds, mark as ON_ROUTE again
      setTimeout(() => {
        const current = BUS_STATES.get(busId);
        if (current) BUS_STATES.set(busId, { ...current, status: "ON_ROUTE" });
      }, 30000);
    } else {
      BUS_STATES.set(busId, {
        ...state,
        segmentProgress: newProgress,
        status: "ON_ROUTE",
        lastTick: now,
      });
    }
  }
}

// Start simulation
setInterval(tickSimulation, 5000);

/**
 * GET BUS LOCATION (called by API route)
 */
function getBusLocation(busId) {
  const state = BUS_STATES.get(busId);
  if (!state) return null;

  const currentStop = state.routeStops[state.currentSegment];
  const nextStop = state.routeStops[state.currentSegment + 1];

  const position = nextStop
    ? interpolatePosition(currentStop, nextStop, state.segmentProgress)
    : { lat: currentStop.lat, lon: currentStop.lon };

  const distanceToNext = nextStop
    ? haversineDistance(position, nextStop) * (1 - state.segmentProgress / 100)
    : 0;

  const etaMinutes = nextStop
    ? Math.round((distanceToNext / state.speed) * 60)
    : 0;

  return {
    busId,
    position,
    currentStop: currentStop.name,
    nextStop: nextStop?.name ?? "Terminus",
    distanceToNextKm: distanceToNext.toFixed(1),
    etaToNextStop: etaMinutes,
    occupancy: state.occupancy,
    status: state.status,
    delayMinutes: state.delayMinutes,
    crowdLevel: getCrowdLevel(state.occupancy, state.capacity),
    speed: state.speed,
  };
}

// Utility: Haversine distance formula
function haversineDistance(coord1, coord2) {
  const R = 6371; // Earth radius km
  const dLat = deg2rad(coord2.lat - coord1.lat);
  const dLon = deg2rad(coord2.lon - coord1.lon);
  const a = Math.sin(dLat/2)**2 +
            Math.cos(deg2rad(coord1.lat)) *
            Math.cos(deg2rad(coord2.lat)) *
            Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function deg2rad(deg) { return deg * (Math.PI / 180); }

// Random speed based on route type
function getRandomSpeed(routeType) {
  const speeds = {
    EXPRESS: 55 + Math.random() * 15,    // 55-70 kmh
    ORDINARY: 25 + Math.random() * 15,   // 25-40 kmh
    AC: 40 + Math.random() * 15,
    INTERCITY: 60 + Math.random() * 20,
  };
  return speeds[routeType] ?? 35;
}

// Simulate passenger boarding/alighting at stops
function simulatePassengerChange(currentOccupancy, stop) {
  const alighting = Math.floor(Math.random() * (currentOccupancy * 0.3));
  const boarding = Math.floor(Math.random() * 15);
  return Math.max(0, currentOccupancy - alighting + boarding);
}
5.3 Frontend Polling Strategy
JavaScript

// hooks/useBusTracking.js
"use client";

import { useState, useEffect, useCallback } from "react";

export function useBusTracking(busId) {
  const [busData, setBusData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBusData = useCallback(async () => {
    try {
      const response = await fetch(`/api/buses/track/${busId}`);
      const data = await response.json();
      setBusData(data);
      setIsLoading(false);
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  }, [busId]);

  useEffect(() => {
    fetchBusData(); // Initial fetch

    // Poll every 5 seconds for simulated real-time updates
    const interval = setInterval(fetchBusData, 5000);

    return () => clearInterval(interval); // Cleanup on unmount
  }, [fetchBusData]);

  return { busData, isLoading, error };
}
