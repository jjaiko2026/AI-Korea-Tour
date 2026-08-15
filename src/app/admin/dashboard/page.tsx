/**
 * PRD §35.1 Dashboard — 운영자가 서비스 상태를 한 화면에서 파악한다.
 * 누적 사용자/신규 사용자/일정 생성/완료/실패/저장, YouTube·TourAPI 호출,
 * Cache Hit Rate, Queue 대기 등. §26의 콘텐츠 지표는 콘텐츠 대시보드에서 별도 노출.
 */
import { eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { StatCard } from "@/components/admin/stat-card";

async function loadStats() {
  const [
    itineraryCount,
    savedCount,
    generateFailedCount,
    youtubeJobCount,
    tourJobCount,
    completedSearchJobs,
    totalSearchJobs,
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(schema.itineraries),
    db
      .select({ count: sql<number>`count(*)` })
      .from(schema.userEvents)
      .where(eq(schema.userEvents.eventType, "itinerary_save")),
    db
      .select({ count: sql<number>`count(*)` })
      .from(schema.userEvents)
      .where(eq(schema.userEvents.eventType, "trip_generate_failed")),
    db.select({ count: sql<number>`count(*)` }).from(schema.searchJobs),
    db.select({ count: sql<number>`count(*)` }).from(schema.tourSearchJobs),
    db
      .select({ count: sql<number>`count(*)` })
      .from(schema.searchJobs)
      .where(eq(schema.searchJobs.status, "completed")),
    db.select({ count: sql<number>`count(*)` }).from(schema.searchJobs),
  ]);

  const total = Number(totalSearchJobs[0]?.count ?? 0);
  const completed = Number(completedSearchJobs[0]?.count ?? 0);

  return {
    itineraries: Number(itineraryCount[0]?.count ?? 0),
    saved: Number(savedCount[0]?.count ?? 0),
    generateFailed: Number(generateFailedCount[0]?.count ?? 0),
    youtubeJobs: Number(youtubeJobCount[0]?.count ?? 0),
    tourJobs: Number(tourJobCount[0]?.count ?? 0),
    jobCompletionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}

export default async function AdminDashboardPage() {
  const stats = await loadStats();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">대시보드</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard label="일정 생성 완료" value={stats.itineraries} />
        <StatCard label="일정 저장" value={stats.saved} />
        <StatCard label="일정 생성 실패" value={stats.generateFailed} />
        <StatCard label="YouTube Search Job" value={stats.youtubeJobs} />
        <StatCard label="TourAPI Search Job" value={stats.tourJobs} />
        <StatCard label="Search Job 완료율" value={`${stats.jobCompletionRate}%`} hint="KPI 목표 ≥ 50%" />
      </div>
      <p className="mt-6 text-sm text-slate-500">
        인기 여행지/목적/동행 유형, Cache Hit Rate, quota 사용량 등 세부 지표는{" "}
        <a href="/admin/analytics" className="text-blue-600 hover:underline">
          분석 페이지
        </a>
        에서 확인하세요.
      </p>
    </div>
  );
}
