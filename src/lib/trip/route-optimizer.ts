/**
 * PRD §20 지도/장소 — 하루 단위 2-opt 동선 최적화. 행정구역 수준의 부정확한 좌표는
 * 사전에 제외한다는 전제 하에, 하루 일정 안의 방문 순서를 총 이동거리 기준으로 개선한다.
 */
export type RoutePoint = { id: string; latitude: number; longitude: number };

function distance(a: RoutePoint, b: RoutePoint): number {
  const R = 6_371_000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function totalDistance(route: RoutePoint[]): number {
  let sum = 0;
  for (let i = 0; i < route.length - 1; i++) {
    const a = route[i];
    const b = route[i + 1];
    if (a && b) sum += distance(a, b);
  }
  return sum;
}

/**
 * 시작점(route[0], 보통 숙소)은 고정하고 나머지 구간에 대해 2-opt swap을 반복 적용해
 * 총 이동거리를 지역 최적해까지 줄인다.
 */
export function twoOptOptimize(route: RoutePoint[], maxIterations = 200): RoutePoint[] {
  if (route.length < 4) return route;

  let best = [...route];
  let improved = true;
  let iterations = 0;

  while (improved && iterations < maxIterations) {
    improved = false;
    iterations += 1;

    for (let i = 1; i < best.length - 2; i++) {
      for (let k = i + 1; k < best.length - 1; k++) {
        const candidate = twoOptSwap(best, i, k);
        if (totalDistance(candidate) < totalDistance(best)) {
          best = candidate;
          improved = true;
        }
      }
    }
  }

  return best;
}

function twoOptSwap(route: RoutePoint[], i: number, k: number): RoutePoint[] {
  const head = route.slice(0, i);
  const middle = route.slice(i, k + 1).reverse();
  const tail = route.slice(k + 1);
  return [...head, ...middle, ...tail];
}

/** 행정구역 수준의 부정확한 좌표(소수점 2자리 미만 정밀도)를 제거한다. */
export function filterImpreciseCoordinates<T extends { latitude?: number; longitude?: number }>(
  points: T[],
): T[] {
  return points.filter((p) => {
    if (p.latitude === undefined || p.longitude === undefined) return false;
    const latPrecision = decimalPlaces(p.latitude);
    const lonPrecision = decimalPlaces(p.longitude);
    return latPrecision >= 3 && lonPrecision >= 3;
  });
}

export function decimalPlaces(value: number): number {
  const str = value.toString();
  const dot = str.indexOf(".");
  return dot === -1 ? 0 : str.length - dot - 1;
}
