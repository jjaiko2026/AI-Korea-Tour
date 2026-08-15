/**
 * PRD §35.2 사용자 분석 — userId, 가입일, 최근 접속일, 일정 생성/저장/후기 횟수,
 * 선호 여행지/목적, 동행 유형. 민감한 개인정보는 관리자 화면에 불필요하게 노출하지 않는다.
 */
import { desc, sql } from "drizzle-orm";
import { db, schema } from "@/db";

async function loadUserSummaries() {
  const rows = await db
    .select({
      userId: schema.itineraries.userId,
      tripCount: sql<number>`count(*)`,
      lastCreatedAt: sql<string>`max(${schema.itineraries.createdAt})`,
      topDestination: sql<string>`mode() within group (order by ${schema.itineraries.destination})`,
    })
    .from(schema.itineraries)
    .groupBy(schema.itineraries.userId)
    .orderBy(desc(sql`max(${schema.itineraries.createdAt})`))
    .limit(50);

  return rows;
}

export default async function AdminUsersPage() {
  const users = await loadUserSummaries();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">사용자</h1>
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 dark:bg-slate-900">
            <tr>
              <th className="px-4 py-3">User ID</th>
              <th className="px-4 py-3">일정 생성 횟수</th>
              <th className="px-4 py-3">선호 여행지</th>
              <th className="px-4 py-3">최근 생성일</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.userId} className="border-t border-slate-100 dark:border-slate-800">
                <td className="px-4 py-3 font-mono text-xs">{user.userId}</td>
                <td className="px-4 py-3">{user.tripCount}</td>
                <td className="px-4 py-3">{user.topDestination}</td>
                <td className="px-4 py-3 text-slate-500">
                  {new Date(user.lastCreatedAt).toLocaleDateString("ko-KR")}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
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
