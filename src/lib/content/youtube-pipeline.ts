/**
 * PRD §40.4 영상 생성과 발행 분리 — 대본 생성까지는 독립적으로 완료하고, 실제
 * 렌더링/업로드는 관리자 승인 이후 별도 단계(§47)에서 수행한다.
 */
import { randomUUID } from "node:crypto";
import { and, desc, eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import type { TravelContentBrief } from "@/types";
import { generateYouTubeScript } from "./agents/youtube-agent";
import { runEditorialGuard } from "./agents/editorial-guard";

export async function generateYouTubeContent(input: {
  brief: TravelContentBrief;
  tripId: string;
  jobId: string;
  forceNewVersion?: boolean;
}): Promise<{ id: string; status: string }> {
  if (!input.forceNewVersion) {
    const [existing] = await db
      .select()
      .from(schema.youtubeContents)
      .where(and(eq(schema.youtubeContents.tripId, input.tripId), sql`${schema.youtubeContents.status} != 'failed'`))
      .orderBy(desc(schema.youtubeContents.createdAt))
      .limit(1);
    if (existing) return { id: existing.id, status: existing.status };
  }

  const script = await generateYouTubeScript(input.brief);
  const guard = await runEditorialGuard(script.narration);
  const status = guard.passed ? "review_required" : "changes_requested";

  const id = randomUUID();
  await db.insert(schema.youtubeContents).values({
    id,
    tripId: input.tripId,
    jobId: input.jobId,
    title: script.title,
    script,
    scenePlan: script.chapters,
    description: script.description,
    tags: script.tags,
    thumbnailData: { text: script.thumbnailText },
    status,
  });

  return { id, status };
}
