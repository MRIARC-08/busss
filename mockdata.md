PART 7: MOCK JSON DATASET STRUCTURE
7.1 states.json
JSON

[
  { "id": 1, "code": "DL", "name": "Delhi" },
  { "id": 2, "code": "HR", "name": "Haryana" },
  { "id": 3, "code": "UP", "name": "Uttar Pradesh" },
  { "id": 4, "code": "PB", "name": "Punjab" }
]
7.2 stops.json
JSON

[
  {
    "id": 1,
    "code": "SNP001",
    "name": "Sonipat Bus Stand",
    "cityName": "Sonipat",
    "stateCode": "HR",
    "latitude": 28.9952,
    "longitude": 77.0151,
    "type": "TERMINAL",
    "hasWaitingArea": true,
    "hasShelter": true
  },
  {
    "id": 2,
    "code": "NAR001",
    "name": "Narela Bus Stand",
    "cityName": "Delhi",
    "stateCode": "DL",
    "latitude": 28.8527,
    "longitude": 77.0924,
    "type": "MAJOR",
    "hasWaitingArea": true,
    "hasShelter": true
  },
  {
    "id": 3,
    "code": "KG001",
    "name": "Kashmere Gate ISBT",
    "cityName": "Delhi",
    "stateCode": "DL",
    "latitude": 28.6677,
    "longitude": 77.2285,
    "type": "ISBT",
    "hasWaitingArea": true,
    "hasShelter": true
  },
  {
    "id": 4,
    "code": "BAW001",
    "name": "Bawana Chowk",
    "cityName": "Delhi",
    "stateCode": "DL",
    "latitude": 28.8011,
    "longitude": 77.0362,
    "type": "REGULAR",
    "hasWaitingArea": false,
    "hasShelter": true
  },
  {
    "id": 5,
    "code": "CHD001",
    "name": "Chandigarh ISBT Sector 17",
    "cityName": "Chandigarh",
    "stateCode": "PB",
    "latitude": 30.7333,
    "longitude": 76.7794,
    "type": "ISBT",
    "hasWaitingArea": true,
    "hasShelter": true
  },
  {
    "id": 6,
    "code": "ANV001",
    "name": "Anand Vihar ISBT",
    "cityName": "Delhi",
    "stateCode": "DL",
    "latitude": 28.6471,
    "longitude": 77.3159,
    "type": "ISBT",
    "hasWaitingArea": true,
    "hasShelter": true
  }
]
7.3 routes.json
JSON

[
  {
    "id": 1,
    "routeNumber": "HR-29",
    "name": "Sonipat - Kashmere Gate",
    "authorityCode": "HRTC",
    "type": "ORDINARY",
    "baseFrequencyMinutes": 20,
    "estimatedTotalMinutes": 90,
    "totalDistanceKm": 48.5,
    "baseFare": 45,
    "reliabilityScore": 0.87,
    "isActive": true,
    "stops": [
      {
        "sequence": 1,
        "stopId": 1,
        "stopName": "Sonipat Bus Stand",
        "distanceFromOriginKm": 0,
        "timeFromOriginMin": 0,
        "latitude": 28.9952,
        "longitude": 77.0151
      },
      {
        "sequence": 2,
        "stopId": 7,
        "stopName": "Kundli",
        "distanceFromOriginKm": 12.3,
        "timeFromOriginMin": 22,
        "latitude": 28.8890,
        "longitude": 77.0600
      },
      {
        "sequence": 3,
        "stopId": 2,
        "stopName": "Narela Bus Stand",
        "distanceFromOriginKm": 24.1,
        "timeFromOriginMin": 42,
        "latitude": 28.8527,
        "longitude": 77.0924
      },
      {
        "sequence": 4,
        "stopId": 4,
        "stopName": "Bawana Chowk",
        "distanceFromOriginKm": 32.7,
        "timeFromOriginMin": 58,
        "latitude": 28.8011,
        "longitude": 77.0362
      },
      {
        "sequence": 5,
        "stopId": 3,
        "stopName": "Kashmere Gate ISBT",
        "distanceFromOriginKm": 48.5,
        "timeFromOriginMin": 90,
        "latitude": 28.6677,
        "longitude": 77.2285
      }
    ]
  },
  {
    "id": 2,
    "routeNumber": "HR-15E",
    "name": "Sonipat - Delhi Express",
    "authorityCode": "HRTC",
    "type": "EXPRESS",
    "baseFrequencyMinutes": 45,
    "estimatedTotalMinutes": 60,
    "totalDistanceKm": 48.5,
    "baseFare": 60,
    "reliabilityScore": 0.72,
    "isActive": true,
    "stops": [
      {
        "sequence": 1,
        "stopId": 1,
        "stopName": "Sonipat Bus Stand",
        "distanceFromOriginKm": 0,
        "timeFromOriginMin": 0,
        "latitude": 28.9952,
        "longitude": 77.0151
      },
      {
        "sequence": 2,
        "stopId": 2,
        "stopName": "Narela Bus Stand",
        "distanceFromOriginKm": 24.1,
        "timeFromOriginMin": 30,
        "latitude": 28.8527,
        "longitude": 77.0924
      },
      {
        "sequence": 3,
        "stopId": 3,
        "stopName": "Kashmere Gate ISBT",
        "distanceFromOriginKm": 48.5,
        "timeFromOriginMin": 60,
        "latitude": 28.6677,
        "longitude": 77.2285
      }
    ]
  },
  {
    "id": 3,
    "routeNumber": "DTC-420",
    "name": "Narela - Kashmere Gate Local",
    "authorityCode": "DTC",
    "type": "ORDINARY",
    "baseFrequencyMinutes": 15,
    "estimatedTotalMinutes": 40,
    "totalDistanceKm": 24.4,
    "baseFare": 25,
    "reliabilityScore": 0.91,
    "isActive": true,
    "stops": [
      {
        "sequence": 1,
        "stopId": 2,
        "stopName": "Narela Bus Stand",
        "distanceFromOriginKm": 0,
        "timeFromOriginMin": 0,
        "latitude": 28.8527,
        "longitude": 77.0924
      },
      {
        "sequence": 2,
        "stopId": 4,
        "stopName": "Bawana Chowk",
        "distanceFromOriginKm": 8.6,
        "timeFromOriginMin": 12,
        "latitude": 28.8011,
        "longitude": 77.0362
      },
      {
        "sequence": 3,
        "stopId": 3,
        "stopName": "Kashmere Gate ISBT",
        "distanceFromOriginKm": 24.4,
        "timeFromOriginMin": 40,
        "latitude": 28.6677,
        "longitude": 77.2285
      }
    ]
  }
]
7.4 buses.json
JSON

[
  {
    "id": "BUS001",
    "busNumber": "HR-29-4521",
    "routeId": 1,
    "routeNumber": "HR-29",
    "authorityCode": "HRTC",
    "capacity": 55,
    "type": "ORDINARY",
    "isAC": false,
    "isActive": true,
    "simulation": {
      "currentSegment": 1,
      "segmentProgress": 35,
      "occupancy": 28,
      "delayMinutes": 0,
      "status": "ON_ROUTE"
    }
  },
  {
    "id": "BUS002",
    "busNumber": "HR-15E-8823",
    "routeId": 2,
    "routeNumber": "HR-15E",
    "authorityCode": "HRTC",
    "capacity": 45,
    "type": "EXPRESS",
    "isAC": false,
    "isActive": true,
    "simulation": {
      "currentSegment": 0,
      "segmentProgress": 70,
      "occupancy": 42,
      "delayMinutes": 5,
      "status": "ON_ROUTE"
    }
  },
  {
    "id": "BUS003",
    "busNumber": "DTC-420-3301",
    "routeId": 3,
    "routeNumber": "DTC-420",
    "authorityCode": "DTC",
    "capacity": 60,
    "type": "ORDINARY",
    "isAC": false,
    "isActive": true,
    "simulation": {
      "currentSegment": 0,
      "segmentProgress": 20,
      "occupancy": 15,
      "delayMinutes": 0,
      "status": "ON_ROUTE"
    }
  }
]
7.5 API Response Sample: Route Suggestion
JSON

{
  "success": true,
  "query": {
    "from": "Sonipat Bus Stand",
    "to": "Kashmere Gate ISBT",
    "requestTime": "2024-01-15T08:30:00Z"
  },
  "recommendations": {
    "RECOMMENDED": {
      "label": "⭐ Recommended",
      "routePlan": {
        "legs": [
          {
            "routeNumber": "HR-29",
            "authority": "HRTC",
            "from": "Sonipat Bus Stand",
            "to": "Kashmere Gate ISBT",
            "departureETA": "08:35 AM",
            "arrivalETA": "09:50 AM",
            "durationMinutes": 75,
            "distanceKm": 48.5,
            "isTransfer": false
          }
        ],
        "summary": {
          "totalDurationMinutes": 75,
          "totalDistanceKm": 48.5,
          "transfers": 0,
          "estimatedFare": 45,
          "crowdLevel": "MEDIUM",
          "score": 82,
          "reliabilityRating": "87%"
        },
        "reasoning": [
          "Best overall score of 82/100",
          "Good balance of travel time (75 min) and comfort (Medium crowd)",
          "87% on-time reliability rating",
          "Direct route — no transfers needed"
        ]
      }
    },
    "FASTEST": {
      "label": "🚀 Fastest",
      "routePlan": {
        "legs": [
          {
            "routeNumber": "HR-15E",
            "authority": "HRTC",
            "from": "Sonipat Bus Stand",
            "to": "Kashmere Gate ISBT",
            "departureETA": "08:45 AM",
            "arrivalETA": "09:45 AM",
            "durationMinutes": 60,
            "isTransfer": false
          }
        ],
        "summary": {
          "totalDurationMinutes": 60,
          "transfers": 0,
          "estimatedFare": 60,
          "crowdLevel": "HIGH",
          "score": 71,
          "reliabilityRating": "72%"
        },
        "reasoning": [
          "Fastest option — saves 15 minutes",
          "Express route with fewer stops",
          "Note: Currently showing HIGH crowd level",
          "Lower reliability rating (72%)"
        ]
      }
    },
    "LEAST_CROWDED": {
      "label": "😌 Least Crowded",
      "routePlan": {
        "legs": [
          {
            "routeNumber": "HR-29",
            "from": "Sonipat Bus Stand",
            "to": "Narela Bus Stand",
            "durationMinutes": 42
          },
          {
            "type": "WAIT",
            "location": "Narela Bus Stand",
            "waitMinutes": 8
          },
          {
            "routeNumber": "DTC-420",
            "from": "Narela Bus Stand",
            "to": "Kashmere Gate ISBT",
            "durationMinutes": 40
          }
        ],
        "summary": {
          "totalDurationMinutes": 90,
          "transfers": 1,
          "estimatedFare": 55,
          "crowdLevel": "LOW",
          "score": 68
        },
        "reasoning": [
          "Lowest crowd level across all stops",
          "Better chance of getting a seat",
          "Suitable for elderly or passengers with luggage",
          "1 transfer at Narela — covered waiting area available"
        ]
      }
    }
  }
}
