/**
 * PRD §9 Cache — 조회 순서:
 * 1. 정확히 일치하는 캐시
 * 2. 목적지 + 목적 그룹
 * 3. 목적지 일반 여행
 * 4. Pre-fetch 데이터
 * 5. 부족하면 외부 API
 *
 * §5.3 default TTL: YouTube 30일, 블로그 7~30일, 여행 전 정보 7일 (env로 조정)
 */
import { and, eq, gt } from "drizzle-orm";
import { db, schema } from "@/db";
import type { Source, SourceType } from "@/types";

const DAY_MS = 24 * 60 * 60 * 1000;

export const DEFAULT_TTL_MS: Record<SourceType, number> = {
  youtube: Number(process.env.CACHE_TTL_YOUTUBE_DAYS ?? 30) * DAY_MS,
  blog: Number(process.env.CACHE_TTL_BLOG_DAYS ?? 14) * DAY_MS,
};

export type CacheLookupResult = {
  hit: boolean;
  sources: Source[];
  cacheKey: string;
};

/** 정확히 일치하는 캐시를 조회한다. 없으면 fallback 없이 miss를 반환한다 — 상위 계층에서 §9의 4단계 조회를 조합한다. */
export async function getExactCache(cacheKey: string): Promise<CacheLookupResult> {
  const rows = await db
    .select()
    .from(schema.sourceCache)
    .where(
      and(eq(schema.sourceCache.cacheKey, cacheKey), gt(schema.sourceCache.expiresAt, new Date())),
    )
    .limit(1);

  const row = rows[0];
  if (!row) {
    return { hit: false, sources: [], cacheKey };
  }
  return { hit: true, sources: row.sources as Source[], cacheKey };
}

export function isEnough(sources: Source[], minCount = 6): boolean {
  return sources.length >= minCount;
}

export async function writeCache(input: {
  cacheKey: string;
  sourceType: SourceType;
  normalizedQuery: string;
  searchContext?: unknown;
  sources: Source[];
}): Promise<void> {
  const ttl = DEFAULT_TTL_MS[input.sourceType];
  const expiresAt = new Date(Date.now() + ttl);

  await db
    .insert(schema.sourceCache)
    .values({
      cacheKey: input.cacheKey,
      sourceType: input.sourceType,
      normalizedQuery: input.normalizedQuery,
      searchContext: input.searchContext,
      sources: input.sources,
      expiresAt,
    })
    .onConflictDoUpdate({
      target: schema.sourceCache.cacheKey,
      set: {
        sources: input.sources,
        fetchedAt: new Date(),
        expiresAt,
      },
    });
}
