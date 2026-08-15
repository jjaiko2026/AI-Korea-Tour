/**
 * PRD §35.3 여행 일정 분석 — 필터(국내/해외, 여행지, 기간, 동행 유형 등), 정렬
 * (최신순/조회순/저장순/생성 빈도순/콘텐츠 생성 여부순). §35.4 콘텐츠 후보 선정으로 연결된다.
 */
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { Button } from "@/components/ui/button";

export default async function AdminItinerariesPage({
  searchParams,
}: {
  searchParams: Promise<{ region?: string }>;
}) {
  const { region } = await searchParams;

  const rows = await db
    .select()
    .from(schema.itineraries)
    .where(region ? eq(schema.itineraries.region, region) : undefined)
    .orderBy(desc(schema.itineraries.createdAt))
    .limit(50);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">여행 일정</h1>
        <div className="flex gap-2 text-sm">
          <Link href="/admin/itineraries">
            <Button variant={!region ? "primary" : "outline"}>전체</Button>
          </Link>
          <Link href="/admin/itineraries?region=domestic">
            <Button variant={region === "domestic" ? "primary" : "outline"}>국내</Button>
          </Link>
          <Link href="/admin/itineraries?region=international">
            <Button variant={region === "international" ? "primary" : "outline"}>해외</Button>
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 dark:bg-slate-900">
            <tr>
              <th className="px-4 py-3">여행지</th>
              <th className="px-4 py-3">동행</th>
              <th className="px-4 py-3">기간</th>
              <th className="px-4 py-3">생성일</th>
              <th className="px-4 py-3">콘텐츠 생성</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((trip) => (
              <tr key={trip.id} className="border-t border-slate-100 dark:border-slate-800">
                <td className="px-4 py-3">{trip.destinationName}</td>
                <td className="px-4 py-3">{trip.memberType} {trip.memberCount}명</td>
                <td className="px-4 py-3">{trip.nights}박{trip.nights + 1}일</td>
                <td className="px-4 py-3 text-slate-500">{trip.createdAt.toLocaleDateString("ko-KR")}</td>
                <td className="px-4 py-3">
                  <Link href={`/admin/content/jobs?tripId=${trip.id}`} className="text-blue-600 hover:underline">
                    콘텐츠 생성
                  </Link>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  아직 데이터가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
