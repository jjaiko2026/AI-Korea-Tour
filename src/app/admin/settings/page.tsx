/**
 * PRD §41.3 Shorts 기본 생성 개수 등 운영 설정. 초기에는 환경변수로 관리하고,
 * 필요 시 이 화면에서 조정 가능한 설정 테이블로 확장한다.
 */
export default function AdminSettingsPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">설정</h1>
      <div className="max-w-lg rounded-xl border border-slate-200 p-6 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400">
        <p className="mb-2">현재 운영 설정은 환경변수로 관리됩니다 (.env.example 참고).</p>
        <ul className="list-inside list-disc space-y-1">
          <li>YOUTUBE_DAILY_SEARCH_LIMIT / YOUTUBE_MAX_CONCURRENT_JOBS</li>
          <li>TOUR_API_DAILY_LIMIT / TOUR_API_MAX_CONCURRENT_JOBS</li>
          <li>CACHE_TTL_YOUTUBE_DAYS / CACHE_TTL_BLOG_DAYS</li>
          <li>CONTENT_JOB_MAX_RETRIES</li>
          <li>DEFAULT_SHORTS_COUNT</li>
        </ul>
      </div>
    </div>
  );
}
