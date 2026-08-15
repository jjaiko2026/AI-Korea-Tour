"use client";

/**
 * PRD §43 — ☑ Blog ☑ YouTube Long-form ☑ YouTube Shorts + Shorts 개수 + [콘텐츠 생성 시작]
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function ContentJobForm({ tripId }: { tripId: string }) {
  const router = useRouter();
  const [blog, setBlog] = useState(true);
  const [youtube, setYoutube] = useState(true);
  const [shorts, setShorts] = useState(true);
  const [shortCount, setShortCount] = useState(5);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await fetch("/api/admin/content/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripId,
          type: "bundle",
          options: { blog, youtube, shorts, shortCount },
        }),
      });
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={blog} onChange={(e) => setBlog(e.target.checked)} />
        Blog
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={youtube} onChange={(e) => setYoutube(e.target.checked)} />
        YouTube Long-form
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={shorts} onChange={(e) => setShorts(e.target.checked)} />
        YouTube Shorts
      </label>
      {shorts && (
        <label className="flex items-center gap-2 text-sm">
          Shorts 개수:
          <input
            type="number"
            min={1}
            max={10}
            value={shortCount}
            onChange={(e) => setShortCount(Number(e.target.value))}
            className="w-16 rounded border border-slate-300 px-2 py-1 dark:border-slate-700 dark:bg-slate-900"
          />
        </label>
      )}
      <Button onClick={handleSubmit} disabled={submitting || (!blog && !youtube && !shorts)} className="mt-2 w-fit">
        {submitting ? "요청 중..." : "콘텐츠 생성 시작"}
      </Button>
    </div>
  );
}
