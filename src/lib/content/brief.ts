/**
 * PRD §38 Travel Content Brief — Blog/YouTube/Shorts가 각자 다시 해석하지 않도록
 * 공통 Brief를 만든다. §39.1 Trip Planner는 일정이 이미 완성돼 있으므로 기본적으로
 * 생략한다.
 */
import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import type { TripContentInput, TravelContentBrief } from "@/types";
import { researchTrip } from "./agents/travel-researcher";
import { factCheck } from "./agents/fact-checker";
import { validateRoute } from "./agents/route-validator";
import { analyzeTravelDesire } from "./agents/travel-desire";

const briefCoreSchema = z.object({
  title: z.string(),
  targetAudience: z.string(),
  travelTheme: z.string(),
  coreStory: z.string(),
  keyPlaces: z.array(z.string()),
  keyExperiences: z.array(z.string()),
  tone: z.string(),
  contentAngles: z.array(z.string()),
});

/** Trip Data → Research → Fact Check → Travel Content Brief (§38 다이어그램) */
export async function buildTravelContentBrief(trip: TripContentInput): Promise<TravelContentBrief> {
  const places = await researchTrip(trip);
  const [facts, desirePoints] = await Promise.all([factCheck(places), analyzeTravelDesire(places)]);
  const routeIssues = validateRoute(trip);

  const { object: core } = await generateObject({
    model: anthropic("claude-sonnet-5"),
    schema: briefCoreSchema,
    prompt: `다음 조사 결과를 바탕으로 여행 콘텐츠 공통 Brief를 만들어줘. 여러
채널(Blog/YouTube/Shorts)이 동일한 사실과 핵심 메시지를 공유해야 한다.
목적지: ${trip.destination.region}
기간: ${trip.duration.nights}박 ${trip.duration.days}일
동행: ${trip.traveler.memberType} ${trip.traveler.memberCount}명
목적: ${trip.purposes.map((p) => `${p.id}(${p.priority})`).join(", ")}
장소 조사: ${JSON.stringify(places)}
여행 욕구 분석: ${JSON.stringify(desirePoints)}`,
  });

  return {
    tripId: trip.tripId,
    title: core.title,
    targetAudience: core.targetAudience,
    travelTheme: core.travelTheme,
    coreStory: core.coreStory,
    keyPlaces: core.keyPlaces,
    keyExperiences: core.keyExperiences,
    itinerarySummary: { itinerary: trip.itinerary, routeIssues },
    verifiedFacts: facts,
    travelDesirePoints: desirePoints,
    tone: core.tone,
    contentAngles: core.contentAngles,
  };
}
