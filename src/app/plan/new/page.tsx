/**
 * PRD §5 사용자 흐름 — 로그인 사용자만 접근하는 실제 일정 생성 폼.
 */
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { TripRequestForm } from "@/components/trip/trip-request-form";

export default async function PlanNewPage() {
  const { userId } = await auth();
  if (!userId) redirect("/plan/example");

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="mb-8 text-2xl font-bold">여행 조건을 알려주세요</h1>
      <TripRequestForm />
    </main>
  );
}
