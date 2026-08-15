"use client";

/**
 * PRD §6.3 여행 일정 요청 폼 — 국내/해외, 여행지, 구성원, 인원, 숙박 일수, 여행 시기,
 * 여행 목적(최대 3개 core), 추가 요청사항. §6.4 챗봇이 실시간으로 이 상태를 갱신한다.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { TRAVEL_PURPOSES } from "@/types/trip";
import type { MemberType, TravelPurposePriority, TripRequest } from "@/types";
import { Button } from "@/components/ui/button";
import { ChatPanel } from "./chat-panel";
import { cn } from "@/lib/utils";

export type TripRequestDraft = TripRequest;

const MEMBER_TYPES: { id: MemberType; label: string }[] = [
  { id: "solo", label: "혼자" },
  { id: "friend", label: "친구" },
  { id: "family", label: "가족" },
  { id: "couple", label: "연인" },
  { id: "colleague", label: "동료" },
];

const DEFAULT_DRAFT: TripRequestDraft = {
  destination: "",
  region: "domestic",
  memberType: "family",
  memberCount: 2,
  nights: 2,
  month: new Date().getMonth() + 1,
  purposes: [],
  notes: "",
};

export function TripRequestForm() {
  const router = useRouter();
  const [draft, setDraft] = useState<TripRequestDraft>(DEFAULT_DRAFT);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();

  function applyChatPatch(patch: Partial<TripRequestDraft>) {
    setDraft((prev) => ({
      ...prev,
      ...patch,
      purposes: patch.purposes ?? prev.purposes,
    }));
  }

  function togglePurpose(id: string) {
    setDraft((prev) => {
      const existing = prev.purposes.find((p) => p.id === id);
      if (existing) {
        return { ...prev, purposes: prev.purposes.filter((p) => p.id !== id) };
      }
      const coreCount = prev.purposes.filter((p) => p.priority === "core").length;
      const priority: TravelPurposePriority = coreCount < 3 ? "core" : "normal";
      return {
        ...prev,
        purposes: [...prev.purposes, { id: id as TripRequest["purposes"][number]["id"], priority }],
      };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.destination.trim()) {
      setError("여행지를 입력해주세요.");
      return;
    }
    setSubmitting(true);
    setError(undefined);
    try {
      const res = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      if (!res.ok) throw new Error(await res.text());
      const { id } = (await res.json()) as { id: string };
      router.push(`/plan/result/${id}`);
    } catch {
      setError("일정 생성 중 문제가 발생했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <fieldset className="flex gap-2">
          {(["domestic", "international"] as const).map((region) => (
            <button
              type="button"
              key={region}
              onClick={() => setDraft((prev) => ({ ...prev, region }))}
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm",
                draft.region === region
                  ? "border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950"
                  : "border-slate-300 dark:border-slate-700",
              )}
            >
              {region === "domestic" ? "국내" : "해외"}
            </button>
          ))}
        </fieldset>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">여행지</span>
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
            value={draft.destination}
            onChange={(e) => setDraft((prev) => ({ ...prev, destination: e.target.value }))}
            placeholder="예: 제주도"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">구성원</span>
          <div className="flex flex-wrap gap-2">
            {MEMBER_TYPES.map((m) => (
              <button
                type="button"
                key={m.id}
                onClick={() => setDraft((prev) => ({ ...prev, memberType: m.id }))}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm",
                  draft.memberType === m.id
                    ? "border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950"
                    : "border-slate-300 dark:border-slate-700",
                )}
              >
                {m.label}
              </button>
            ))}
          </div>
        </label>

        <div className="grid grid-cols-3 gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">인원</span>
            <input
              type="number"
              min={1}
              className="rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
              value={draft.memberCount}
              onChange={(e) => setDraft((prev) => ({ ...prev, memberCount: Number(e.target.value) }))}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">숙박 일수</span>
            <input
              type="number"
              min={0}
              className="rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
              value={draft.nights}
              onChange={(e) => setDraft((prev) => ({ ...prev, nights: Number(e.target.value) }))}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">여행 시기(월)</span>
            <input
              type="number"
              min={1}
              max={12}
              className="rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
              value={draft.month}
              onChange={(e) => setDraft((prev) => ({ ...prev, month: Number(e.target.value) }))}
            />
          </label>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">여행 목적 (핵심 목적은 최대 3개)</span>
          <div className="flex flex-wrap gap-2">
            {TRAVEL_PURPOSES.map((purpose) => {
              const selected = draft.purposes.find((p) => p.id === purpose.id);
              return (
                <button
                  type="button"
                  key={purpose.id}
                  onClick={() => togglePurpose(purpose.id)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-sm",
                    selected
                      ? selected.priority === "core"
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-blue-300 bg-blue-50 text-blue-700 dark:bg-blue-950"
                      : "border-slate-300 dark:border-slate-700",
                  )}
                >
                  {purpose.label}
                </button>
              );
            })}
          </div>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">추가 요청사항</span>
          <textarea
            className="min-h-24 rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
            value={draft.notes}
            onChange={(e) => setDraft((prev) => ({ ...prev, notes: e.target.value }))}
            placeholder="예: 아이가 있어서 이동 시간을 짧게 해주세요"
          />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" disabled={submitting} className="py-3 text-base">
          {submitting ? "일정을 만드는 중..." : "여행 일정 생성"}
        </Button>
      </form>

      <div className="h-[600px]">
        <ChatPanel onDraftUpdate={applyChatPatch} />
      </div>
    </div>
  );
}
