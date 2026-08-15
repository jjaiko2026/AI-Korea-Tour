/**
 * PRD §46.1 POST /api/trips/:tripId/place-candidates — TourAPI/Naver 지역검색 결과를
 * 조합해 일정 후보 장소를 반환하는 내부 API. 서버에서 인증·검증·Rate Limit·Cache
 * 정책을 적용한다.
 */
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { korService2Provider } from "@/lib/providers/tour/kor-service2-provider";
import { withTourCache, TOUR_TTL_MS } from "@/lib/providers/tour/cache";
import { buildCacheKey } from "@/lib/search/search-key";
import { contentTypeIdsForPurposes } from "@/lib/providers/tour/category-map";
import { decimalPlaces } from "@/lib/trip/route-optimizer";
import type { Place, TravelPurposeId } from "@/types";

const requestSchema = z.object({
  areaCode: z.string(),
  purposes: z.array(
    z.enum([
      "food",
      "healing",
      "nature",
      "attraction",
      "cafe",
      "activity",
      "culture",
      "shopping",
      "festival",
      "nightlife",
    ]),
  ),
});

export async function POST(req: Request, { params }: { params: Promise<{ tripId: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const { tripId } = await params;
  const parsed = requestSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const contentTypeIds = contentTypeIdsForPurposes(parsed.data.purposes as TravelPurposeId[]);

  const candidatesByType = await Promise.all(
    contentTypeIds.map((contentTypeId) => {
      const cacheKey = buildCacheKey({
        source: "tour_api",
        destination: `${tripId}:${parsed.data.areaCode}`,
        purposeGroups: [contentTypeId],
        regionCode: parsed.data.areaCode,
      });
      return withTourCache(
        cacheKey,
        TOUR_TTL_MS.placeBasic,
        { normalizedQuery: cacheKey, areaCode: parsed.data.areaCode, contentTypeId },
        () => korService2Provider.searchPlaces({ areaCode: parsed.data.areaCode, contentTypeId }),
      );
    }),
  );

  const places = candidatesByType.flat().filter(hasPreciseCoordinates);

  return NextResponse.json({ tripId, places });
}

/** §20 행정구역 수준의 부정확한 좌표(정밀도 낮은 값)를 제거한다. */
function hasPreciseCoordinates(place: Place): boolean {
  const location = place.location;
  if (!location) return false;
  return decimalPlaces(location.latitude) >= 3 && decimalPlaces(location.longitude) >= 3;
}
