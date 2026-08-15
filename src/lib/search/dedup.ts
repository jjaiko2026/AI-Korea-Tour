/**
 * PRD §10 Request Deduplication — 동시에 같은 검색이 들어오면 하나의 Job만 실행한다.
 * 상태: PENDING → RUNNING → COMPLETED / FAILED
 * RUNNING인 동일 SearchKey가 있으면 새 API 호출을 만들지 않고 기존 결과를 기다린다. (Rule 4)
 */
import { randomUUID } from "node:crypto";
import { eq, gt, and } from "drizzle-orm";
import { db, schema } from "@/db";

const LOCK_TTL_MS = 60_000;

export type LockResult =
  | { acquired: true; jobId: string }
  | { acquired: false; jobId: string };

/**
 * cacheKey에 대한 실행 락을 시도한다. 이미 RUNNING인 락이 있으면 그 jobId를 반환하고
 * 새 Job/API 호출은 만들지 않는다(acquired: false) — 호출자는 해당 job의 완료를 기다린다.
 */
export async function acquireSearchLock(cacheKey: string): Promise<LockResult> {
  const existing = await db
    .select()
    .from(schema.searchLocks)
    .where(and(eq(schema.searchLocks.cacheKey, cacheKey), gt(schema.searchLocks.expiresAt, new Date())))
    .limit(1);

  const current = existing[0];
  if (current && current.status === "running") {
    return { acquired: false, jobId: current.jobId };
  }

  const jobId = randomUUID();
  await db
    .insert(schema.searchLocks)
    .values({
      cacheKey,
      jobId,
      status: "running",
      expiresAt: new Date(Date.now() + LOCK_TTL_MS),
    })
    .onConflictDoUpdate({
      target: schema.searchLocks.cacheKey,
      set: { jobId, status: "running", lockedAt: new Date(), expiresAt: new Date(Date.now() + LOCK_TTL_MS) },
    });

  return { acquired: true, jobId };
}

export async function releaseSearchLock(cacheKey: string, status: "completed" | "failed"): Promise<void> {
  await db
    .update(schema.searchLocks)
    .set({ status })
    .where(eq(schema.searchLocks.cacheKey, cacheKey));
}

/** RUNNING 락을 짧은 간격으로 폴링해 완료를 기다린다. Job Queue의 완료 콜백으로 대체 가능. */
export async function waitForLock(
  cacheKey: string,
  { timeoutMs = 15_000, intervalMs = 500 }: { timeoutMs?: number; intervalMs?: number } = {},
): Promise<"completed" | "failed" | "timeout"> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const rows = await db
      .select()
      .from(schema.searchLocks)
      .where(eq(schema.searchLocks.cacheKey, cacheKey))
      .limit(1);
    const status = rows[0]?.status;
    if (status === "completed" || status === "failed") return status;
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  return "timeout";
}
