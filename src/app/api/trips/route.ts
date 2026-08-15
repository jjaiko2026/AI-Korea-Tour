/**
 * PRD §5 사용자 흐름 — TripRequest 확정 후 AI 일정 생성(§19)을 트리거한다.
 * 실제 일정 생성은 로그인 사용자만 가능하다 (§6.2).
 */
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { generateItinerary } from "@/lib/trip/generate-itinerary";

const tripRequestSchema = z.object({
  destination: z.string().min(1),
  region: z.enum(["domestic", "international"]),
  memberType: z.enum(["solo", "friend", "family", "couple", "colleague"]),
  memberCount: z.number().int().positive(),
  nights: z.number().int().min(0),
  month: z.number().int().min(1).max(12),
  purposes: z.array(
    z.object({
      id: z.enum([
        "food",
        "healing",
        "nature",
        "attraction",
        "cafe",
        "activity",
        "culture",
        "shopping",
        "festival",
        "nightlife",
      ]),
      priority: z.enum(["core", "important", "normal"]),
    }),
  ),
  notes: z.string().optional(),
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const parsed = tripRequestSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const itinerary = await generateItinerary(parsed.data, userId);
    return NextResponse.json({ id: itinerary.id });
  } catch (error) {
    console.error("[POST /api/trips] failed", error);
    return NextResponse.json({ error: "일정 생성에 실패했습니다." }, { status: 502 });
  }
}
