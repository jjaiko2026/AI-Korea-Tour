/**
 * PRD §36 사용자 행동 이벤트 수집 — UI에서 직접 DB를 쓰지 않고 서버 API를 통해
 * 검증된 이벤트를 기록한다. 개인정보를 metadata에 임의 저장하지 않는다.
 */
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { db, schema } from "@/db";

const ALLOWED_EVENT_TYPES = [
  "landing_view",
  "login",
  "trip_form_start",
  "trip_form_submit",
  "chat_start",
  "trip_generate_start",
  "trip_generate_complete",
  "trip_generate_failed",
  "itinerary_view",
  "itinerary_save",
  "itinerary_delete",
  "source_click",
  "map_interaction",
  "review_submit",
] as const;

const eventSchema = z.object({
  eventType: z.enum(ALLOWED_EVENT_TYPES),
  itineraryId: z.string().optional(),
  destination: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(req: Request) {
  const { userId } = await auth();
  const parsed = eventSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await db.insert(schema.userEvents).values({
    id: randomUUID(),
    userId: userId ?? undefined,
    eventType: parsed.data.eventType,
    itineraryId: parsed.data.itineraryId,
    destination: parsed.data.destination,
    metadata: parsed.data.metadata,
  });

  return NextResponse.json({ ok: true });
}
