/**
 * PRD §7.2-7.3 SearchPlan — 10개 목적을 10번 검색하지 않는다. 기본 2~3개 핵심
 * 검색으로 압축한다.
 */
import type { SearchPlan, TripRequest } from "@/types";
import { PURPOSE_GROUPS, TRAVEL_PURPOSES } from "@/types/trip";
import { buildCacheKey } from "@/lib/search/search-key";

function purposeGroupsOf(purposeIds: string[]): string[] {
  const groups = Object.entries(PURPOSE_GROUPS)
    .filter(([, ids]) => ids.some((id) => purposeIds.includes(id)))
    .map(([group]) => group);
  return groups.length > 0 ? groups : ["관광"];
}

function purposeLabel(id: string): string {
  return TRAVEL_PURPOSES.find((p) => p.id === id)?.label.replace(/^\S+\s/, "") ?? id;
}

/**
 * §6.3 목적 우선순위(core=1.0 > important=0.7 > normal=0.4)를 반영해 상위 2개
 * 목적만 검색어에 편입하고, 3번째 쿼리는 목적지 일반 여행으로 둔다.
 */
export function buildSearchPlan(request: TripRequest): SearchPlan {
  const sortedPurposes = [...request.purposes].sort((a, b) => {
    const weight = { core: 3, important: 2, normal: 1 } as const;
    return weight[b.priority] - weight[a.priority];
  });

  const topPurposeIds = sortedPurposes.slice(0, 2).map((p) => p.id);
  const groups = purposeGroupsOf(topPurposeIds);

  const tripStyle = `${request.destination} ${memberTypeLabel(request.memberType)}여행 ${request.nights}박${request.nights + 1}일`;

  const primaryQueries = [tripStyle];
  for (const id of topPurposeIds) {
    primaryQueries.push(`${request.destination} ${memberTypeLabel(request.memberType)}여행 ${purposeLabel(id)}`);
  }

  const fallbackQueries = sortedPurposes
    .slice(2, 3)
    .map((p) => `${request.destination} ${purposeLabel(p.id)}`);

  const searchKeyBase = {
    destination: request.destination,
    memberType: request.memberType,
    nights: request.nights,
    month: request.month,
    purposeGroups: groups,
    regionCode: request.region === "domestic" ? "KR" : undefined,
    language: "ko",
  };

  const cacheKeys = primaryQueries.map((_, index) =>
    buildCacheKey({
      ...searchKeyBase,
      source: index === 0 ? "youtube" : "youtube",
    }),
  );

  return { primaryQueries, fallbackQueries, purposeGroups: groups, cacheKeys };
}

function memberTypeLabel(memberType: TripRequest["memberType"]): string {
  return { solo: "혼자", friend: "친구", family: "가족", couple: "커플", colleague: "동료" }[memberType];
}
