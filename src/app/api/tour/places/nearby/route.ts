/**
 * PRD §46.1 GET /api/tour/places/nearby — §19.1.6 위치 기반 검색 (locationBasedList2)
 */
import { NextResponse } from "next/server";
import { korService2Provider } from "@/lib/providers/tour/kor-service2-provider";
import { withTourCache, TOUR_TTL_MS } from "@/lib/providers/tour/cache";
import { buildCacheKey } from "@/lib/search/search-key";

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const latitude = Number(params.get("latitude"));
  const longitude = Number(params.get("longitude"));
  const contentTypeId = params.get("contentTypeId") ?? undefined;

  if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
    return NextResponse.json({ error: "latitude/longitude가 필요합니다." }, { status: 400 });
  }

  const cacheKey = buildCacheKey({
    source: "tour_api",
    destination: `${latitude.toFixed(3)},${longitude.toFixed(3)}`,
    purposeGroups: contentTypeId ? [contentTypeId] : [],
  });

  try {
    const results = await withTourCache(
      cacheKey,
      TOUR_TTL_MS.placeBasic,
      { normalizedQuery: cacheKey, contentTypeId },
      () => korService2Provider.searchNearby({ latitude, longitude, contentTypeId }),
    );
    return NextResponse.json({ places: results });
  } catch (error) {
    console.error("[GET /api/tour/places/nearby] failed", error);
    return NextResponse.json({ places: [], degraded: true });
  }
}
