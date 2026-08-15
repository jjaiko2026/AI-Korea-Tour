/**
 * PRD §30 참고 구현 — Cache → (부족분만) Dedup → Queue → Rate Limiter → Provider → Cache 공유.
 * Rule 1~7의 실제 구현체: 일정 항목마다 API를 호출하지 않고, 동일 요청은 여러 사용자가
 * 공유하며, RUNNING인 동일 SearchKey는 새 호출을 만들지 않는다.
 */
import type { SearchPlan, Source, SourceType } from "@/types";
import { getExactCache, isEnough, writeCache } from "./cache";
import { acquireSearchLock, releaseSearchLock, waitForLock } from "./dedup";
import { rankSources } from "@/lib/trip/ranking";

export type SourceFetcher = (query: string) => Promise<Source[]>;

/**
 * plan.cacheKeys 각각에 대해 캐시를 먼저 확인하고, 부족한 것만 dedup lock을 잡아
 * fetcher(외부 Provider)를 호출한다. 동일 cacheKey가 이미 RUNNING이면 fetcher를
 * 다시 호출하지 않고 락 해제를 기다렸다가 캐시를 재조회한다.
 */
export async function getSources(
  plan: SearchPlan,
  sourceType: SourceType,
  fetcher: SourceFetcher,
): Promise<Source[]> {
  const collected: Source[] = [];
  const missingQueries: { cacheKey: string; query: string }[] = [];

  const queries = [...plan.primaryQueries];
  for (let i = 0; i < queries.length; i++) {
    const cacheKey = plan.cacheKeys[i] ?? plan.cacheKeys[0];
    if (!cacheKey) continue;
    const cached = await getExactCache(cacheKey);
    if (cached.hit && isEnough(cached.sources)) {
      collected.push(...cached.sources);
    } else {
      const query = queries[i];
      if (query) missingQueries.push({ cacheKey, query });
    }
  }

  if (missingQueries.length === 0) {
    return rankSources(collected);
  }

  const fetched = await Promise.all(
    missingQueries.map(({ cacheKey, query }) => fetchWithDedup(cacheKey, query, sourceType, fetcher)),
  );

  return rankSources([...collected, ...fetched.flat()]);
}

async function fetchWithDedup(
  cacheKey: string,
  query: string,
  sourceType: SourceType,
  fetcher: SourceFetcher,
): Promise<Source[]> {
  const lock = await acquireSearchLock(cacheKey);

  if (!lock.acquired) {
    const outcome = await waitForLock(cacheKey);
    if (outcome === "completed") {
      const cached = await getExactCache(cacheKey);
      return cached.sources;
    }
    return [];
  }

  try {
    const sources = await fetcher(query);
    await writeCache({ cacheKey, sourceType, normalizedQuery: query, sources });
    await releaseSearchLock(cacheKey, "completed");
    return sources;
  } catch (error) {
    await releaseSearchLock(cacheKey, "failed");
    throw error;
  }
}
