/**
 * PRD §46.1 GET /api/tour/places/:contentId/images — Rule 8.7: 이미지 이용조건/공공누리
 * 조건을 메타데이터로 유지한다 (normalize.ts에서 copyright/usageCondition 필드로 보존).
 */
import { NextResponse } from "next/server";
import { korService2Provider } from "@/lib/providers/tour/kor-service2-provider";

export async function GET(_req: Request, { params }: { params: Promise<{ contentId: string }> }) {
  const { contentId } = await params;
  try {
    const images = await korService2Provider.getPlaceImages(contentId);
    return NextResponse.json({ images });
  } catch (error) {
    console.error(`[GET /api/tour/places/${contentId}/images] failed`, error);
    return NextResponse.json({ images: [], degraded: true });
  }
}
