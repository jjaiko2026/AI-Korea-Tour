/**
 * PRD §46.1 GET /api/tour/events — §19.1.7 행사 검색 (searchFestival2), TTL 6시간.
 */
import { NextResponse } from "next/server";
import { korService2Provider } from "@/lib/providers/tour/kor-service2-provider";

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const startDate = params.get("startDate");
  const areaCode = params.get("areaCode") ?? undefined;
  const endDate = params.get("endDate") ?? undefined;

  if (!startDate) {
    return NextResponse.json({ error: "startDate(YYYYMMDD)가 필요합니다." }, { status: 400 });
  }

  try {
    const events = await korService2Provider.searchEvents({ areaCode, startDate, endDate });
    return NextResponse.json({ events });
  } catch (error) {
    console.error("[GET /api/tour/events] failed", error);
    return NextResponse.json({ events: [], degraded: true });
  }
}
