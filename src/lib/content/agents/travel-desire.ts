/**
 * PRD §39.5 Travel Desire Agent — 왜 가야 하는가, 누구에게 좋은가, 언제 좋은가,
 * 무엇을 하면/보면 좋은가, 사진 포인트, 일정에서의 역할, 경험과 감정, 다른
 * 장소와의 차이를 분석한다.
 */
import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import type { PlaceResearch } from "./travel-researcher";

const desireSchema = z.object({
  points: z.array(
    z.object({
      placeName: z.string(),
      whyVisit: z.string(),
      bestFor: z.string(),
      bestTime: z.string(),
      thingsToDo: z.array(z.string()),
      photoSpots: z.array(z.string()),
      roleInItinerary: z.string(),
      emotionalPayoff: z.string(),
      differentiation: z.string(),
    }),
  ),
});

export type TravelDesirePoint = z.infer<typeof desireSchema>["points"][number];

export async function analyzeTravelDesire(places: PlaceResearch[]): Promise<TravelDesirePoint[]> {
  const { object } = await generateObject({
    model: anthropic("claude-sonnet-5"),
    schema: desireSchema,
    prompt: `다음 장소들에 대해 여행 욕구 관점(왜 가야 하는지, 누구에게 좋은지, 언제
좋은지, 무엇을 하면/보면 좋은지, 사진 포인트, 다른 장소와의 차별점)을 분석해줘.
${JSON.stringify(places, null, 2)}`,
  });

  return object.points;
}
