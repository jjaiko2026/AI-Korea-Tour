/**
 * PRD §39.2 Travel Researcher — 장소별로 기본 사실/특징/체험 요소/추천 방문 시간/
 * 예상 체류 시간/주차/입장료/예약 여부/주변 시설/최신 여행 정보/주의사항을 구조화한다.
 * 외부 자료는 최종 콘텐츠 원문이 아니라 조사·검증을 위한 evidence로만 취급한다.
 */
import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import type { TripContentInput } from "@/types";

const placeResearchSchema = z.object({
  places: z.array(
    z.object({
      name: z.string(),
      basicFacts: z.string(),
      highlights: z.array(z.string()),
      experiences: z.array(z.string()),
      recommendedVisitTime: z.string(),
      estimatedStayMinutes: z.number(),
      parking: z.string().optional(),
      admissionFee: z.string().optional(),
      reservationRequired: z.boolean(),
      nearbyFacilities: z.array(z.string()),
      cautions: z.array(z.string()),
    }),
  ),
});

export type PlaceResearch = z.infer<typeof placeResearchSchema>["places"][number];

export async function researchTrip(trip: TripContentInput): Promise<PlaceResearch[]> {
  const placeNames = trip.itinerary.flatMap((day) => day.items.map((item) => item.name));

  const { object } = await generateObject({
    model: anthropic("claude-sonnet-5"),
    schema: placeResearchSchema,
    prompt: `다음 여행 일정에 포함된 장소들을 조사해서 구조화해줘. 확실하지 않은 사실은
지어내지 말고 일반적으로 알려진 정보 수준으로만 채우고, 확인이 필요한 항목은
cautions에 "실제 방문 전 확인 필요"라고 표시해.
목적지: ${trip.destination.region}
장소 목록: ${placeNames.join(", ")}`,
  });

  return object.places;
}
