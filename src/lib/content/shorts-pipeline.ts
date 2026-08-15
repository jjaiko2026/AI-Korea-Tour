/**
 * PRD §41 Shorts Agent 결과를 저장한다. 개수는 shortCount(1..10)만큼 개별 레코드로 저장한다.
 */
import { randomUUID } from "node:crypto";
import { and, desc, eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import type { TravelContentBrief } from "@/types";
import { generateShorts } from "./agents/shorts-agent";
import { runEditorialGuard } from "./agents/editorial-guard";

export async function generateShortsContent(input: {
  brief: TravelContentBrief;
  tripId: string;
  jobId: string;
  shortCount: number;
  forceNewVersion?: boolean;
}): Promise<{ ids: string[]; status: string }> {
  if (!input.forceNewVersion) {
    const existing = await db
      .select()
      .from(schema.shortsContents)
      .where(and(eq(schema.shortsContents.tripId, input.tripId), sql`${schema.shortsContents.status} != 'failed'`))
      .orderBy(desc(schema.shortsContents.createdAt))
      .limit(input.shortCount);
    if (existing.length > 0) {
      return { ids: existing.map((row) => row.id), status: existing[0]!.status };
    }
  }

  const shorts = await generateShorts(input.brief, input.shortCount);
  const guards = await Promise.all(shorts.map((short) => runEditorialGuard(short.script)));

  const ids: string[] = [];
  for (let i = 0; i < shorts.length; i++) {
    const short = shorts[i];
    const guard = guards[i];
    if (!short || !guard) continue;
    const id = randomUUID();
    ids.push(id);
    await db.insert(schema.shortsContents).values({
      id,
      tripId: input.tripId,
      jobId: input.jobId,
      title: short.title,
      script: short,
      scenePlan: [],
      captionData: { hashtags: short.hashtags },
      status: guard.passed ? "review_required" : "changes_requested",
    });
  }

  return { ids, status: "review_required" };
}
