/**
 * PRD §44 콘텐츠 관리 및 검수 — YouTube: 대본/Scene Plan/영상 렌더링 진행 상태.
 */
import { desc } from "drizzle-orm";
import { db, schema } from "@/db";

export default async function AdminContentYouTubePage() {
  const rows = await db.select().from(schema.youtubeContents).orderBy(desc(schema.youtubeContents.createdAt)).limit(50);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">YouTube 콘텐츠</h1>
      <div className="flex flex-col gap-3">
        {rows.map((content) => (
          <div key={content.id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">{content.title}</h2>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs dark:bg-slate-800">{content.status}</span>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              {content.youtubeVideoId ? `업로드됨: ${content.youtubeVideoId}` : "미발행"}
            </p>
          </div>
        ))}
        {rows.length === 0 && <p className="text-sm text-slate-400">생성된 YouTube 콘텐츠가 없습니다.</p>}
      </div>
    </div>
  );
}
