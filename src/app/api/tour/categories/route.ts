/**
 * PRD §46.1 GET /api/tour/categories
 */
import { NextResponse } from "next/server";
import { korService2Provider } from "@/lib/providers/tour/kor-service2-provider";

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  try {
    const categories = await korService2Provider.getCategoryCodes({
      cat1: params.get("cat1") ?? undefined,
      cat2: params.get("cat2") ?? undefined,
    });
    return NextResponse.json({ categories });
  } catch (error) {
    console.error("[GET /api/tour/categories] failed", error);
    return NextResponse.json({ error: "카테고리 코드를 불러오지 못했습니다." }, { status: 502 });
  }
}
