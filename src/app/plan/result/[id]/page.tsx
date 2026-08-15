/**
 * PRD §21 결과 화면 — 여행 전 정보, 일자별 타임라인, YouTube 출처 최대 3개,
 * 블로그 출처 최대 3개, 지도 동선, 일차 토글, 일정 저장. 공유/PDF/이미지 내보내기는 백로그.
 */
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import type { Itinerary, Source } from "@/types";
import { SaveItineraryButton } from "@/components/trip/save-itinerary-button";

async function getItinerary(id: string): Promise<Itinerary | undefined> {
  const [row] = await db.select().from(schema.itineraries).where(eq(schema.itineraries.id, id)).limit(1);
  if (!row) return undefined;
  return {
    id: row.id,
    userId: row.userId,
    destination: row.destination,
    destinationName: row.destinationName,
    region: row.region as Itinerary["region"],
    memberType: row.memberType as Itinerary["memberType"],
    memberCount: row.memberCount,
    nights: row.nights,
    month: row.month,
    purposes: row.purposes as Itinerary["purposes"],
    notes: row.notes ?? undefined,
    days: row.days as Itinerary["days"],
    estimatedTotalCost: row.estimatedTotalCost ?? undefined,
    currency: row.currency ?? undefined,
    tripTips: row.tripTips ?? undefined,
    createdAt: row.createdAt.toISOString(),
  };
}

export default async function PlanResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const itinerary = await getItinerary(id);
  if (!itinerary) notFound();

  const youtubeSources = (itinerary.sources ?? []).filter((s: Source) => s.sourceType === "youtube").slice(0, 3);
  const blogSources = (itinerary.sources ?? []).filter((s: Source) => s.sourceType === "blog").slice(0, 3);

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <header className="mb-8 flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-blue-600">
            {itinerary.region === "domestic" ? "국내" : "해외"} · {itinerary.nights}박{itinerary.nights + 1}일
          </p>
          <h1 className="text-2xl font-bold">{itinerary.destinationName}</h1>
        </div>
        <SaveItineraryButton itineraryId={itinerary.id} />
      </header>

      <div className="flex flex-col gap-6">
        {itinerary.days.map((day) => (
          <section key={day.day} className="rounded-xl border border-slate-200 p-5 dark:border-slate-800">
            <h2 className="mb-3 font-semibold">
              DAY {day.day} {day.dayRegion ? `· ${day.dayRegion}` : ""}
            </h2>
            <ol className="space-y-2">
              {day.items.map((item, index) => (
                <li key={index} className="flex items-baseline gap-3 text-sm">
                  <span className="w-16 shrink-0 text-slate-400">{item.startTime ?? ""}</span>
                  <span className="text-slate-800 dark:text-slate-200">{item.name}</span>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>

      <section className="mt-10 grid gap-6 sm:grid-cols-2">
        <div>
          <h3 className="mb-3 text-sm font-semibold text-slate-500">참고한 YouTube 영상</h3>
          <ul className="space-y-2">
            {youtubeSources.map((source) => (
              <li key={source.sourceId}>
                <a href={source.url} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline">
                  {source.title}
                </a>
              </li>
            ))}
            {youtubeSources.length === 0 && <p className="text-sm text-slate-400">출처 없음</p>}
          </ul>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold text-slate-500">참고한 블로그</h3>
          <ul className="space-y-2">
            {blogSources.map((source) => (
              <li key={source.sourceId}>
                <a href={source.url} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline">
                  {source.title}
                </a>
              </li>
            ))}
            {blogSources.length === 0 && <p className="text-sm text-slate-400">출처 없음</p>}
          </ul>
        </div>
      </section>
    </main>
  );
}
