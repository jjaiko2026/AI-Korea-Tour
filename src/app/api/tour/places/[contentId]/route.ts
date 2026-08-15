/**
 * PRD §46.1 GET /api/tour/places/:contentId — §19.1.8 상세정보 결합
 * (detailCommon2 → detailIntro2 → detailInfo2, 반려동물 정보는 조건부).
 */
import { NextResponse } from "next/server";
import { korService2Provider } from "@/lib/providers/tour/kor-service2-provider";

export async function GET(req: Request, { params }: { params: Promise<{ contentId: string }> }) {
  const { contentId } = await params;
  const contentTypeId = new URL(req.url).searchParams.get("contentTypeId");

  try {
    const common = await korService2Provider.getPlaceCommon(contentId);
    const [intro, info, petTour] = contentTypeId
      ? await Promise.all([
          korService2Provider.getPlaceIntro(contentId, contentTypeId),
          korService2Provider.getPlaceInfo(contentId, contentTypeId),
          korService2Provider.getPetTour(contentId, contentTypeId).catch(() => undefined),
        ])
      : [undefined, undefined, undefined];

    return NextResponse.json({
      place: { ...common, operation: intro?.operation ?? common.operation, price: intro?.price ?? common.price },
      info,
      petTour,
    });
  } catch (error) {
    console.error(`[GET /api/tour/places/${contentId}] failed`, error);
    return NextResponse.json({ error: "장소 상세정보를 불러오지 못했습니다." }, { status: 502 });
  }
}
