/**
 * PRD §6.1 — 비로그인 사용자를 위한 캐시 샘플 일정. 실시간 생성 없이 고정된 예시를 보여준다.
 */
import Link from "next/link";
import { SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

const SAMPLE_DAYS = [
  {
    day: 1,
    dayRegion: "제주 서부",
    items: ["협재해수욕장 산책", "한림공원 관람", "흑돼지 맛집에서 저녁"],
  },
  {
    day: 2,
    dayRegion: "제주 동부",
    items: ["성산일출봉 일출", "우도 자전거 투어", "해녀의 집에서 점심"],
  },
];

export default function PlanExamplePage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <p className="mb-2 text-sm font-medium text-blue-600">예시 일정 (캐시 샘플)</p>
      <h1 className="mb-8 text-2xl font-bold">제주도 3박4일 · 가족 여행</h1>

      <div className="flex flex-col gap-6">
        {SAMPLE_DAYS.map((day) => (
          <div key={day.day} className="rounded-xl border border-slate-200 p-5 dark:border-slate-800">
            <h2 className="mb-3 font-semibold">
              DAY {day.day} · {day.dayRegion}
            </h2>
            <ul className="list-inside list-disc space-y-1 text-slate-700 dark:text-slate-300">
              {day.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-xl bg-blue-50 p-6 text-center dark:bg-blue-950">
        <p className="mb-4 text-slate-700 dark:text-slate-200">
          로그인하면 나만의 여행 조건으로 실제 일정을 만들 수 있어요.
        </p>
        <SignInButton>
          <Button>로그인하고 내 일정 만들기</Button>
        </SignInButton>
      </div>

      <Link href="/" className="mt-6 block text-center text-sm text-slate-500 hover:underline">
        홈으로
      </Link>
    </main>
  );
}
