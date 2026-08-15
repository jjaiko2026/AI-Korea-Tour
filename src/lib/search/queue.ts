/**
 * PRD §11 Search Job Queue — 사용자 요청과 외부 API 호출을 분리한다.
 * 우선순위: 1) 현재 사용자가 기다리는 검색 2) 동일 요청의 다른 사용자
 *          3) 인기 여행지 Pre-fetch 4) 오래된 캐시 갱신
 */
import { randomUUID } from "node:crypto";
import { and, asc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import type { SourceType } from "@/types";

export type JobPriority = "user" | "prefetch" | "refresh";

const PRIORITY_ORDER: Record<JobPriority, number> = {
  user: 0,
  prefetch: 1,
  refresh: 2,
};

export async function enqueueSearchJob(input: {
  sourceType: SourceType;
  cacheKey: string;
  query: string;
  priority: JobPriority;
}): Promise<string> {
  const id = randomUUID();
  await db.insert(schema.searchJobs).values({
    id,
    sourceType: input.sourceType,
    cacheKey: input.cacheKey,
    query: input.query,
    status: "pending",
    priority: input.priority,
    attempts: 0,
  });
  return id;
}

/** Worker가 다음으로 처리할 Job을 우선순위대로 가져온다. */
export async function claimNextJob() {
  const pending = await db
    .select()
    .from(schema.searchJobs)
    .where(eq(schema.searchJobs.status, "pending"))
    .orderBy(asc(schema.searchJobs.createdAt))
    .limit(20);

  if (pending.length === 0) return undefined;

  const next = [...pending].sort(
    (a, b) => PRIORITY_ORDER[a.priority as JobPriority] - PRIORITY_ORDER[b.priority as JobPriority],
  )[0];
  if (!next) return undefined;

  await db
    .update(schema.searchJobs)
    .set({ status: "running", startedAt: new Date(), attempts: next.attempts + 1 })
    .where(and(eq(schema.searchJobs.id, next.id), eq(schema.searchJobs.status, "pending")));

  return next;
}

export async function completeJob(jobId: string): Promise<void> {
  await db
    .update(schema.searchJobs)
    .set({ status: "completed", completedAt: new Date() })
    .where(eq(schema.searchJobs.id, jobId));
}

export async function failJob(jobId: string, error: string): Promise<void> {
  await db
    .update(schema.searchJobs)
    .set({ status: "failed", completedAt: new Date(), error })
    .where(eq(schema.searchJobs.id, jobId));
}
