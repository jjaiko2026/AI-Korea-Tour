/**
 * PRD §39 Content AI — Blog Pipeline: Travel Content Brief → Blog Writer →
 * Editorial/Copyright Guard → Blog. Rule 15: 동일 Trip + 동일 콘텐츠 유형의
 * 중복 Job/콘텐츠를 만들지 않는다 — 이미 정상 상태(review_required 이상)인 버전이
 * 있으면 재사용하고, 명시적 재생성 요청에서만 새 version을 만든다.
 */
import { randomUUID } from "node:crypto";
import { and, desc, eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import type { TravelContentBrief } from "@/types";
import { writeBlog } from "./agents/blog-writer";
import { runEditorialGuard } from "./agents/editorial-guard";

export async function generateBlogContent(input: {
  brief: TravelContentBrief;
  tripId: string;
  jobId: string;
  forceNewVersion?: boolean;
}): Promise<{ id: string; status: string }> {
  if (!input.forceNewVersion) {
    const [existing] = await db
      .select()
      .from(schema.blogContents)
      .where(and(eq(schema.blogContents.tripId, input.tripId), sql`${schema.blogContents.status} != 'failed'`))
      .orderBy(desc(schema.blogContents.createdAt))
      .limit(1);
    if (existing) return { id: existing.id, status: existing.status };
  }

  const draft = await writeBlog(input.brief);
  const guard = await runEditorialGuard(draft.markdown);

  const id = randomUUID();
  const status = guard.passed ? "review_required" : "changes_requested";

  await db.insert(schema.blogContents).values({
    id,
    tripId: input.tripId,
    jobId: input.jobId,
    title: draft.title,
    slug: draft.slug,
    markdown: draft.markdown,
    seo: { description: draft.seoDescription, keywords: draft.seoKeywords, guardIssues: guard.issues },
    status,
  });

  return { id, status };
}
