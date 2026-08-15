/**
 * PRD §46.1 GET /api/tour/places/search — §19.1.5 지역 기반 검색 (areaBasedList2)
 * 또는 키워드 검색(searchKeyword2). Cache → Dedup → Rate Limiter를 통과한다.
 */
import { NextResponse } from "next/server";
import { korService2Provider } from "@/lib/providers/tour/kor-service2-provider";
import { withTourCache, TOUR_TTL_MS } from "@/lib/providers/tour/cache";
import { buildCacheKey } from "@/lib/search/search-key";

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const areaCode = params.get("areaCode") ?? undefined;
  const sigunguCode = params.get("sigunguCode") ?? undefined;
  const contentTypeId = params.get("contentTypeId") ?? undefined;
  const keyword = params.get("keyword") ?? undefined;

  const cacheKey = buildCacheKey({
    source: "tour_api",
    destination: keyword ?? areaCode ?? "unknown",
    purposeGroups: contentTypeId ? [contentTypeId] : [],
    regionCode: areaCode,
  });

  try {
    const results = await withTourCache(
      cacheKey,
      TOUR_TTL_MS.placeBasic,
      { normalizedQuery: keyword ?? areaCode ?? "", areaCode, sigunguCode, contentTypeId },
      () =>
        keyword
          ? korService2Provider.searchKeyword({ keyword, areaCode, contentTypeId })
          : korService2Provider.searchPlaces({ areaCode, sigunguCode, contentTypeId }),
    );
    return NextResponse.json({ places: results });
  } catch (error) {
    console.error("[GET /api/tour/places/search] failed", error);
    // Rule 8.8: TourAPI 장애 시 유효한 Cache를 우선 사용하며, 없으면 사실을 추측하지 않고 빈 결과를 반환한다.
    return NextResponse.json({ places: [], degraded: true });
  }
}
