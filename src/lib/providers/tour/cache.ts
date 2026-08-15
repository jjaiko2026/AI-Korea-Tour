/**
 * PRD §19.1.9 TourAPI Cache / §19.1.11 Request Dedup — YouTube source_cache와
 * 별도로 TourAPI 데이터 특성에 맞는 캐시를 둔다. Rule 8.4/8.5: 동일 SearchKey가
 * RUNNING이면 새 호출을 만들지 않고, 모든 호출은 Cache → Rate Limiter를 통과한다.
 */
import { and, eq, gt } from "drizzle-orm";
import { db, schema } from "@/db";
import { acquireSearchLock, releaseSearchLock, waitForLock } from "@/lib/search/dedup";
import type { Place } from "@/types";

/** §19.1.10 TTL 정책 초기 권장값(ms). 실제 운영 데이터에 따라 환경변수로 조정한다. */
export const TOUR_TTL_MS = {
  areaCategory: Number(process.env.TOUR_TTL_AREA_CATEGORY_DAYS ?? 30) * 86_400_000,
  placeBasic: Number(process.env.TOUR_TTL_PLACE_BASIC_DAYS ?? 7) * 86_400_000,
  operationInfo: Number(process.env.TOUR_TTL_OPERATION_HOURS ?? 24) * 3_600_000,
  festival: Number(process.env.TOUR_TTL_FESTIVAL_HOURS ?? 6) * 3_600_000,
  images: Number(process.env.TOUR_TTL_IMAGES_DAYS ?? 7) * 86_400_000,
  stay: Number(process.env.TOUR_TTL_STAY_HOURS ?? 24) * 3_600_000,
  petTour: Number(process.env.TOUR_TTL_PET_TOUR_DAYS ?? 7) * 86_400_000,
} as const;

export async function getTourSearchCache(cacheKey: string): Promise<Place[] | undefined> {
  const rows = await db
    .select()
    .from(schema.tourSearchCache)
    .where(and(eq(schema.tourSearchCache.cacheKey, cacheKey), gt(schema.tourSearchCache.expiresAt, new Date())))
    .limit(1);
  return rows[0]?.results as Place[] | undefined;
}

export async function writeTourSearchCache(input: {
  cacheKey: string;
  normalizedQuery: string;
  areaCode?: string;
  sigunguCode?: string;
  contentTypeId?: string;
  results: Place[];
  ttlMs: number;
}): Promise<void> {
  await db
    .insert(schema.tourSearchCache)
    .values({
      cacheKey: input.cacheKey,
      normalizedQuery: input.normalizedQuery,
      areaCode: input.areaCode,
      sigunguCode: input.sigunguCode,
      contentTypeId: input.contentTypeId,
      results: input.results,
      expiresAt: new Date(Date.now() + input.ttlMs),
    })
    .onConflictDoUpdate({
      target: schema.tourSearchCache.cacheKey,
      set: { results: input.results, fetchedAt: new Date(), expiresAt: new Date(Date.now() + input.ttlMs) },
    });
}

/**
 * Cache → Dedup Lock → fetcher(Rate-limited Provider 호출) → Cache 저장 순으로 실행한다.
 * 동일 cacheKey가 RUNNING이면 새 fetcher 호출 없이 락 해제를 기다렸다가 캐시를 재조회한다.
 */
export async function withTourCache(
  cacheKey: string,
  ttlMs: number,
  meta: { normalizedQuery: string; areaCode?: string; sigunguCode?: string; contentTypeId?: string },
  fetcher: () => Promise<Place[]>,
): Promise<Place[]> {
  const cached = await getTourSearchCache(cacheKey);
  if (cached) return cached;

  const lock = await acquireSearchLock(cacheKey);
  if (!lock.acquired) {
    const outcome = await waitForLock(cacheKey);
    if (outcome === "completed") {
      return (await getTourSearchCache(cacheKey)) ?? [];
    }
    return [];
  }

  try {
    const results = await fetcher();
    await writeTourSearchCache({ cacheKey, ttlMs, ...meta, results });
    await releaseSearchLock(cacheKey, "completed");
    return results;
  } catch (error) {
    await releaseSearchLock(cacheKey, "failed");
    throw error;
  }
}
