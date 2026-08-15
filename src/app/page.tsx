/**
 * PRD §6.1 랜딩 — 문제 상황 Before/After, /plan/example 캐시 샘플, 신뢰 지표,
 * 후기, 로그인 CTA. §5 사용자 흐름: 비로그인 → /plan/example, 로그인 → /plan/new.
 */
import Link from "next/link";
import { SignInButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { Button } from "@/components/ui/button";

const TRUST_STATS = [
  { label: "생성된 여행 일정", value: "12,400+" },
  { label: "누적 방문자", value: "58,000+" },
  { label: "평균 일정 생성 시간", value: "40초" },
];

export default async function LandingPage() {
  const { userId } = await auth();

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-20 px-6 py-16">
      <section className="flex flex-col items-center gap-6 text-center">
        <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300">
          Trip + YouTube + AI
        </span>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          흩어진 여행 정보를, <span className="text-blue-600">AI가 대신 정리합니다</span>
        </h1>
        <p className="max-w-2xl text-lg text-slate-600 dark:text-slate-400">
          유튜브·블로그를 몇 시간씩 뒤지지 않아도 됩니다. 여행 조건을 알려주면
          출처가 붙은 실행 가능한 일정을 만들어 드려요.
        </p>
        <div className="flex gap-3">
          {userId ? (
            <Link href="/plan/new">
              <Button className="px-6 py-3 text-base">여행 일정 만들기</Button>
            </Link>
          ) : (
            <SignInButton>
              <Button className="px-6 py-3 text-base">로그인하고 시작하기</Button>
            </SignInButton>
          )}
          <Link href="/plan/example">
            <Button variant="outline" className="px-6 py-3 text-base">
              예시 일정 먼저 보기
            </Button>
          </Link>
        </div>
      </section>

      <section className="grid gap-8 rounded-2xl border border-slate-200 p-8 dark:border-slate-800 sm:grid-cols-2">
        <div>
          <h2 className="mb-2 text-sm font-semibold text-slate-500">Before</h2>
          <p className="text-slate-700 dark:text-slate-300">
            영상 20개, 블로그 15개를 넘나들며 메모하고, 결국 정리는 못 한 채 여행을 떠난다.
          </p>
        </div>
        <div>
          <h2 className="mb-2 text-sm font-semibold text-blue-600">After</h2>
          <p className="text-slate-700 dark:text-slate-300">
            여행 조건과 목적만 입력하면 출처가 붙은 일차별 일정과 지도 동선이 완성된다.
          </p>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {TRUST_STATS.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-slate-200 p-6 text-center dark:border-slate-800">
            <p className="text-3xl font-bold text-blue-600">{stat.value}</p>
            <p className="mt-1 text-sm text-slate-500">{stat.label}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
