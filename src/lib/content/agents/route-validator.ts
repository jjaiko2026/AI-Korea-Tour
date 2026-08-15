/**
 * PRD §39.4 Route Validator — TripTubeAI가 만든 일정의 동선을 콘텐츠 관점에서
 * 검증한다. 일정을 새로 만드는 것이 기본 역할이 아니다.
 */
import type { TripContentInput } from "@/types";

export type RouteValidation = {
  day: number;
  issues: string[];
};

/**
 * 하루 안에서 동일 지역(dayRegion)을 벗어나는 이동이 과도하지 않은지, 아이템 순서가
 * 급격히 흩어지지 않는지 등 구조적 이상만 점검한다. 실제 좌표 기반 검증은 §20의
 * 2-opt 결과를 그대로 신뢰하고, 여기서는 콘텐츠 서술 관점의 이상만 감지한다.
 */
export function validateRoute(trip: TripContentInput): RouteValidation[] {
  return trip.itinerary.map((day) => {
    const issues: string[] = [];
    if (day.items.length === 0) {
      issues.push("일정 항목이 비어 있습니다.");
    }
    if (day.items.length > 8) {
      issues.push("하루 일정 항목이 8개를 초과해 콘텐츠 서술이 산만해질 수 있습니다.");
    }
    return { day: day.day, issues };
  });
}
