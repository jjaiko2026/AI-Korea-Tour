/**
 * PRD §46.1 GET /api/tour/areas — Frontend는 TourAPI를 직접 호출하지 않는다.
 */
import { NextResponse } from "next/server";
import { korService2Provider } from "@/lib/providers/tour/kor-service2-provider";

export async function GET(req: Request) {
  const parentAreaCode = new URL(req.url).searchParams.get("parentAreaCode") ?? undefined;
  try {
    const areas = await korService2Provider.getAreaCodes(parentAreaCode);
    return NextResponse.json({ areas });
  } catch (error) {
    console.error("[GET /api/tour/areas] failed", error);
    return NextResponse.json({ error: "지역 코드를 불러오지 못했습니다." }, { status: 502 });
  }
}
