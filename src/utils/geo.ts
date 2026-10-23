// Geo calculation utilities for delivery routing and vehicle tracking

/**
 * Calculates bearing in degrees between two lat/lng coordinates (0 to 360)
 */
export function calculateBearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;

  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δλ = toRad(lon2 - lon1);

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

  const θ = Math.atan2(y, x);
  return (toDeg(θ) + 360) % 360;
}

/**
 * Haversine formula to calculate distance in km between two lat/lng points
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculates remaining distance along a coordinate route from a given index
 */
export function calculateRemainingRouteDistance(
  route: [number, number][],
  currentIndex: number
): number {
  if (currentIndex >= route.length - 1) return 0;
  let dist = 0;
  for (let i = currentIndex; i < route.length - 1; i++) {
    dist += calculateDistanceKm(
      route[i][0],
      route[i][1],
      route[i + 1][0],
      route[i + 1][1]
    );
  }
  return Math.round(dist * 100) / 100;
}

/**
 * Generates intermediate interpolated points along a polyline to create smooth vehicle motion
 */
export function densifyRoute(
  waypoints: [number, number][],
  pointsPerSegment: number = 8
): [number, number][] {
  if (waypoints.length <= 1) return waypoints;
  const dense: [number, number][] = [];

  for (let i = 0; i < waypoints.length - 1; i++) {
    const start = waypoints[i];
    const end = waypoints[i + 1];
    dense.push(start);

    for (let step = 1; step < pointsPerSegment; step++) {
      const fraction = step / pointsPerSegment;
      const lat = start[0] + (end[0] - start[0]) * fraction;
      const lng = start[1] + (end[1] - start[1]) * fraction;
      dense.push([lat, lng]);
    }
  }

  dense.push(waypoints[waypoints.length - 1]);
  return dense;
}

/**
 * Automatically find closest available riders to a given origin point (e.g. restaurant)
 */
export function findRidersByProximity(
  originCoords: [number, number],
  couriers: Array<{ id: string; name: string; currentCoords: [number, number]; status?: string }>,
  limit: number = 2
): { courier: any; distanceKm: number }[] {
  return couriers
    .map((c) => ({
      courier: c,
      distanceKm: Math.round(calculateDistanceKm(originCoords[0], originCoords[1], c.currentCoords[0], c.currentCoords[1]) * 10) / 10
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);
}

/**
 * Checks if an order qualifies as a bulk / high-volume order requiring a secondary backup courier
 */
export function checkIsBulkOrder(order: { items?: Array<{ quantity: number }>; totalPrice?: number; subtotal?: number }): { isBulk: boolean; reason?: string } {
  const totalItems = order.items?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 0;
  const amount = order.subtotal || order.totalPrice || 0;
  if (totalItems >= 5 || amount >= 3000) {
    const reasonParts = [];
    if (totalItems >= 5) reasonParts.push(`${totalItems} items`);
    if (amount >= 3000) reasonParts.push(`KSh ${amount.toLocaleString()}`);
    return {
      isBulk: true,
      reason: `Bulk volume detected (${reasonParts.join(', ')}). Exceeds single courier bag capacity — Secondary backup courier deployed!`
    };
  }
  return { isBulk: false };
}

