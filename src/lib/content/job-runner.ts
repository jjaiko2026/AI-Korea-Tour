/**
 * PRD §42 Content Job System — QUEUED → RESEARCHING → FACT_CHECKING → BRIEF_READY →
 * GENERATING → REVIEW_REQUIRED (→ APPROVED → PUBLISHED, §47/48에서 별도 처리).
 * Rule 16: Bundle 중 하나의 생성 실패가 다른 콘텐츠의 성공 결과를 삭제하지 않는다.
 */
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import type { ContentJobType } from "@/types";
import { loadTripContentInput } from "./trip-data-contract";
import { buildTravelContentBrief } from "./brief";
import { generateBlogContent } from "./blog-pipeline";
import { generateYouTubeContent } from "./youtube-pipeline";
import { generateShortsContent } from "./shorts-pipeline";

export type ContentJobOptions = {
  blog?: boolean;
  youtube?: boolean;
  shorts?: boolean;
  shortCount?: number;
};

export async function createContentJob(input: {
  tripId: string;
  type: ContentJobType;
  requestedBy: string;
  options: ContentJobOptions;
}): Promise<string> {
  const id = randomUUID();
  await db.insert(schema.contentJobs).values({
    id,
    tripId: input.tripId,
    type: input.type,
    status: "queued",
    requestedBy: input.requestedBy,
    priority: "manual",
    options: input.options,
  });

  // 실제 운영에서는 별도 워커/큐로 위임한다. 스캐폴드에서는 요청 컨텍스트 안에서
  // 바로 실행하되, 실패해도 Job 상태만 FAILED로 남기고 요청 자체는 202로 응답한다.
  void runContentJob(id).catch((error) => {
    console.error(`[content-job ${id}] failed`, error);
  });

  return id;
}

export async function runContentJob(jobId: string): Promise<void> {
  const [job] = await db.select().from(schema.contentJobs).where(eq(schema.contentJobs.id, jobId)).limit(1);
  if (!job) throw new Error(`Content job not found: ${jobId}`);

  const options = (job.options as ContentJobOptions | null) ?? {};

  try {
    await updateJob(jobId, { status: "researching", startedAt: new Date() });
    const tripInput = await loadTripContentInput(job.tripId);

    await updateJob(jobId, { status: "fact_checking", progress: 0.2 });
    const brief = await buildTravelContentBrief(tripInput);

    await db.insert(schema.travelContentBriefs).values({
      id: randomUUID(),
      tripId: job.tripId,
      version: 1,
      brief,
    });
    await updateJob(jobId, { status: "brief_ready", progress: 0.4 });

    await updateJob(jobId, { status: "generating", progress: 0.5 });

    // §50 Bundle 처리 — 각 콘텐츠는 독립적인 결과와 상태를 가지며, 하나가 실패해도
    // 다른 콘텐츠까지 전체 실패시키지 않는다.
    const results = await Promise.allSettled([
      options.blog ? generateBlogContent({ brief, tripId: job.tripId, jobId }) : Promise.resolve(undefined),
      options.youtube ? generateYouTubeContent({ brief, tripId: job.tripId, jobId }) : Promise.resolve(undefined),
      options.shorts
        ? generateShortsContent({ brief, tripId: job.tripId, jobId, shortCount: options.shortCount ?? 5 })
        : Promise.resolve(undefined),
    ]);

    const failures = results.filter((r) => r.status === "rejected") as PromiseRejectedResult[];
    for (const failure of failures) {
      console.error(`[content-job ${jobId}] partial failure`, failure.reason);
    }

    if (failures.length === results.filter((_, i) => [options.blog, options.youtube, options.shorts][i]).length) {
      // 요청한 모든 콘텐츠가 실패한 경우에만 Job 전체를 FAILED로 표시한다.
      await updateJob(jobId, {
        status: "failed",
        error: failures.map((f) => String(f.reason)).join("; "),
        completedAt: new Date(),
      });
      return;
    }

    await updateJob(jobId, { status: "review_required", progress: 1, completedAt: new Date() });
  } catch (error) {
    await updateJob(jobId, { status: "failed", error: String(error), completedAt: new Date() });
    throw error;
  }
}

async function updateJob(
  jobId: string,
  patch: Partial<{ status: string; progress: number; error: string; startedAt: Date; completedAt: Date }>,
): Promise<void> {
  await db.update(schema.contentJobs).set(patch).where(eq(schema.contentJobs.id, jobId));
}
