/**
 * PRD §8 검색어 정규화 — 자유 문장보다 구조화된 조건을 우선해 canonical key를 만든다.
 * 예: youtube::제주도::family::food::KR::ko
 */
import type { SearchKey } from "@/types";

export function buildCacheKey(key: SearchKey): string {
  const purposes = [...key.purposeGroups].sort().join("+") || "general";
  return [
    key.source,
    key.destination.trim().toLowerCase(),
    key.memberType ?? "any",
    purposes,
    key.regionCode ?? "any",
    key.language ?? "ko",
  ].join("::");
}

export function tourSearchKey(input: {
  destination: string;
  areaCode?: string;
  purposeGroups: string[];
}): SearchKey {
  return {
    source: "tour_api",
    destination: input.destination,
    purposeGroups: input.purposeGroups,
    regionCode: input.areaCode,
    language: "ko",
  };
}
