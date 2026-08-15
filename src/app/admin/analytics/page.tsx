/**
 * PRD §54 관리자 분석 KPI — 사용자/여행/검색·인프라/TourAPI/콘텐츠 KPI 그룹.
 * 목표값은 PRD 원문을 그대로 표기하고, 실측치는 계측 파이프라인 연동 후 채운다.
 */
import { StatCard } from "@/components/admin/stat-card";

const KPI_GROUPS = [
  {
    title: "검색/인프라 KPI",
    items: [
      { label: "YouTube Cache Hit Rate", target: "≥ 70%" },
      { label: "캐시로 완전 처리되는 요청", target: "≥ 50%" },
      { label: "일정 1건 평균 search.list", target: "≤ 1.5회" },
      { label: "일정 1건 최대 search.list", target: "= 4회" },
      { label: "동일 검색 동시 중복 호출", target: "= 0건" },
      { label: "API quota 초과 실패율", target: "< 1%" },
    ],
  },
  {
    title: "TourAPI KPI",
    items: [
      { label: "TourAPI Cache Hit Rate", target: "≥ 70%" },
      { label: "캐시로 완전 처리되는 Tour 요청", target: "≥ 50%" },
      { label: "동일 Tour SearchKey 동시 중복", target: "= 0건" },
      { label: "TourAPI quota 초과 실패율", target: "< 1%" },
      { label: "행사정보 freshness 준수율", target: "≥ 95%" },
      { label: "장소 sourceId 매핑 성공률", target: "≥ 98%" },
    ],
  },
  {
    title: "콘텐츠 KPI",
    items: [
      { label: "콘텐츠 생성 Job 완료율", target: "-" },
      { label: "콘텐츠 검수 통과율", target: "-" },
      { label: "재생성률", target: "-" },
      { label: "콘텐츠 생성 평균 소요시간", target: "-" },
      { label: "콘텐츠 생성 실패율", target: "-" },
    ],
  },
] as const;

export default function AdminAnalyticsPage() {
  return (
    <div className="flex flex-col gap-10">
      <h1 className="text-2xl font-bold">분석</h1>
      {KPI_GROUPS.map((group) => (
        <section key={group.title}>
          <h2 className="mb-3 text-sm font-semibold text-slate-500">{group.title}</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {group.items.map((item) => (
              <StatCard key={item.label} label={item.label} value={item.target} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
