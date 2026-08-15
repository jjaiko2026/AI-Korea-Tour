/**
 * PRD §20 지도/장소 — 국내는 Naver 지역검색/Naver Maps, 해외는 Google Geocoding/Maps.
 */
import type { GeocodeResult, MapProvider } from "./types";

const GOOGLE_KEY = process.env.GOOGLE_MAPS_API_KEY;

export const googleMapProvider: MapProvider = {
  async geocode(address: string): Promise<GeocodeResult | undefined> {
    if (!GOOGLE_KEY) throw new Error("GOOGLE_MAPS_API_KEY is not set (see .env.example)");
    const params = new URLSearchParams({ address, key: GOOGLE_KEY });
    const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`);
    if (!res.ok) throw new Error(`Google geocode failed: ${res.status}`);
    const json = (await res.json()) as {
      results: { formatted_address: string; geometry: { location: { lat: number; lng: number } } }[];
    };
    const first = json.results[0];
    if (!first) return undefined;
    return {
      latitude: first.geometry.location.lat,
      longitude: first.geometry.location.lng,
      formattedAddress: first.formatted_address,
    };
  },

  async getDistanceMatrix(origins, destinations): Promise<number[][]> {
    // 좌표 간 haversine 거리(미터)로 근사한다. 실제 이동시간이 필요하면
    // Distance Matrix API 호출로 교체하되 이 인터페이스는 유지한다.
    return origins.map((origin) => destinations.map((dest) => haversineMeters(origin, dest)));
  },
};

function haversineMeters(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
): number {
  const R = 6_371_000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
