/**
 * PRD §46.1 GET /api/tour/stays — searchStay2.
 */
import { NextResponse } from "next/server";
import { korService2Provider } from "@/lib/providers/tour/kor-service2-provider";

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const areaCode = params.get("areaCode") ?? undefined;
  const sigunguCode = params.get("sigunguCode") ?? undefined;

  try {
    const stays = await korService2Provider.searchStays({ areaCode, sigunguCode });
    return NextResponse.json({ stays });
  } catch (error) {
    console.error("[GET /api/tour/stays] failed", error);
    return NextResponse.json({ stays: [], degraded: true });
  }
}
