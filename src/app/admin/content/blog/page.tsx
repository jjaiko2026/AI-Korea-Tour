/**
 * PRD §44 콘텐츠 관리 및 검수 — Blog: [미리보기] [편집] [재생성] [승인] [발행]
 */
import { desc } from "drizzle-orm";
import { db, schema } from "@/db";

export default async function AdminContentBlogPage() {
  const rows = await db.select().from(schema.blogContents).orderBy(desc(schema.blogContents.createdAt)).limit(50);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Blog 콘텐츠</h1>
      <div className="flex flex-col gap-3">
        {rows.map((content) => (
          <div key={content.id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">{content.title}</h2>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs dark:bg-slate-800">{content.status}</span>
            </div>
            <p className="mt-1 text-xs text-slate-400">/{content.slug}</p>
          </div>
        ))}
        {rows.length === 0 && <p className="text-sm text-slate-400">생성된 Blog 콘텐츠가 없습니다.</p>}
      </div>
    </div>
  );
}
