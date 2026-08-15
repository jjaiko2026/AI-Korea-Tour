"use client";

/**
 * PRD §21 일정 저장 / §36 사용자 행동 이벤트 — itinerary_save 이벤트를 서버에 기록한다.
 */
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function SaveItineraryButton({ itineraryId }: { itineraryId: string }) {
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventType: "itinerary_save", itineraryId }),
    });
    setSaved(true);
  }

  return (
    <Button variant={saved ? "outline" : "primary"} onClick={handleSave} disabled={saved}>
      {saved ? "저장됨" : "일정 저장"}
    </Button>
  );
}
