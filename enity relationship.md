State ──< City ──< Stop
                    │
                    └──< RouteStop >── Route ──< Bus
                                         │         │
                                         │         └──< TrackingLog
                                         │
                                    JourneyLeg >── JourneyPlan
                                         │
                                       Report (links Stop + Bus + Route)