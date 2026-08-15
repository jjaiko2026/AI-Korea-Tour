/**
 * PRD §44 콘텐츠 관리 및 검수 — Shorts #1, #2, ... 개별 상태.
 */
import { desc } from "drizzle-orm";
import { db, schema } from "@/db";

export default async function AdminContentShortsPage() {
  const rows = await db.select().from(schema.shortsContents).orderBy(desc(schema.shortsContents.createdAt)).limit(50);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Shorts 콘텐츠</h1>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {rows.map((content) => (
          <div key={content.id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
            <h2 className="text-sm font-semibold">{content.title}</h2>
            <span className="mt-2 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs dark:bg-slate-800">
              {content.status}
            </span>
          </div>
        ))}
        {rows.length === 0 && <p className="text-sm text-slate-400">생성된 Shorts 콘텐츠가 없습니다.</p>}
      </div>
    </div>
  );
}
