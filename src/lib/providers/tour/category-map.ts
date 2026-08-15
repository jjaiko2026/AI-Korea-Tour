/**
 * PRD §19.1.4 목적 → TourAPI 카테고리 매핑 — 목적을 API 호출 수만큼 1:1 매핑하지 않는다.
 * 실제 contentTypeId/cat1/cat2/cat3 값은 코드에 직접 복제하지 말고 categoryCode2와
 * 이 매핑 테이블을 통해서만 관리한다.
 */
import type { TravelPurposeId } from "@/types";

/** KorService2 contentTypeId 참고값 (공공데이터포털 명세 기준, 필요 시 이 표만 수정) */
export const TOUR_CONTENT_TYPE = {
  touristSpot: "12", // 관광지
  culturalFacility: "14", // 문화시설
  festival: "15", // 축제공연행사
  leisureSports: "28", // 레포츠
  accommodation: "32", // 숙박
  shopping: "38", // 쇼핑
  restaurant: "39", // 음식점
} as const;

export const PURPOSE_TO_CONTENT_TYPES: Record<TravelPurposeId, string[]> = {
  food: [TOUR_CONTENT_TYPE.restaurant],
  healing: [TOUR_CONTENT_TYPE.touristSpot, TOUR_CONTENT_TYPE.accommodation],
  nature: [TOUR_CONTENT_TYPE.touristSpot],
  attraction: [TOUR_CONTENT_TYPE.touristSpot, TOUR_CONTENT_TYPE.culturalFacility],
  cafe: [TOUR_CONTENT_TYPE.restaurant],
  activity: [TOUR_CONTENT_TYPE.leisureSports],
  culture: [TOUR_CONTENT_TYPE.culturalFacility, TOUR_CONTENT_TYPE.touristSpot],
  shopping: [TOUR_CONTENT_TYPE.shopping],
  festival: [TOUR_CONTENT_TYPE.festival],
  nightlife: [TOUR_CONTENT_TYPE.touristSpot, TOUR_CONTENT_TYPE.restaurant, TOUR_CONTENT_TYPE.shopping],
};

export function contentTypeIdsForPurposes(purposes: TravelPurposeId[]): string[] {
  const set = new Set<string>();
  for (const purpose of purposes) {
    for (const contentTypeId of PURPOSE_TO_CONTENT_TYPES[purpose]) set.add(contentTypeId);
  }
  return [...set];
}
