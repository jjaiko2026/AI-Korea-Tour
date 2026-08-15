/**
 * PRD §43 관리자 콘텐츠 생성 UI — 여행 일정 상세에서 Blog/YouTube/Shorts 체크박스와
 * Shorts 개수를 지정해 Content Job을 시작한다. 사용자용 화면에는 이 UI를 제공하지 않는다.
 */
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { ContentJobForm } from "@/components/admin/content-job-form";

export default async function AdminContentJobsPage({
  searchParams,
}: {
  searchParams: Promise<{ tripId?: string }>;
}) {
  const { tripId } = await searchParams;

  const [trip, jobs] = await Promise.all([
    tripId ? db.select().from(schema.itineraries).where(eq(schema.itineraries.id, tripId)).limit(1) : Promise.resolve([]),
    db.select().from(schema.contentJobs).orderBy(desc(schema.contentJobs.createdAt)).limit(50),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold">콘텐츠 Job</h1>

      {trip[0] && (
        <section className="rounded-xl border border-slate-200 p-6 dark:border-slate-800">
          <h2 className="mb-1 font-semibold">
            {trip[0].destinationName} / {trip[0].memberType} / {trip[0].nights}박{trip[0].nights + 1}일
          </h2>
          <ContentJobForm tripId={trip[0].id} />
        </section>
      )}

      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-500">최근 Job</h2>
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 dark:bg-slate-900">
              <tr>
                <th className="px-4 py-3">Trip</th>
                <th className="px-4 py-3">타입</th>
                <th className="px-4 py-3">상태</th>
                <th className="px-4 py-3">우선순위</th>
                <th className="px-4 py-3">생성일</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="px-4 py-3 font-mono text-xs">{job.tripId}</td>
                  <td className="px-4 py-3">{job.type}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs dark:bg-slate-800">
                      {job.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">{job.priority}</td>
                  <td className="px-4 py-3 text-slate-500">{job.createdAt.toLocaleString("ko-KR")}</td>
                </tr>
              ))}
              {jobs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                    Job이 없습니다. 여행 일정 목록에서 콘텐츠 생성을 시작하세요.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
