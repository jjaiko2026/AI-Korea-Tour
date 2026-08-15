/**
 * PRD §19 AI 일정 생성 순서 (1~17):
 * TripRequest 확정 → 목적/우선순위 분석 → dayRegions/일정 뼈대(Claude Sonnet 5) →
 * SearchPlan → 검색어 정규화 → Cache → 부족한 검색만 Job Queue → Dedup → Worker +
 * Rate Limiter → 후보 통합/중복 제거 → 랭킹 → 장소-출처 매칭 → 좌표 지오코딩 →
 * 좌표 검증 → 2-opt 동선 최적화 → Neon 저장 → 결과 제공.
 */
import { randomUUID } from "node:crypto";
import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import type { Itinerary, ItineraryDay, TripRequest } from "@/types";
import { buildSearchPlan } from "./search-plan";
import { getSources } from "@/lib/search/orchestrator";
import { youtubeProvider } from "@/lib/providers/youtube-provider";
import { naverProvider } from "@/lib/providers/naver-provider";
import { filterImpreciseCoordinates, twoOptOptimize } from "./route-optimizer";
import { db, schema } from "@/db";

const dayRegionSchema = z.object({
  days: z.array(
    z.object({
      day: z.number(),
      dayRegion: z.string(),
      themes: z.array(z.string()),
    }),
  ),
  tripTips: z.object({
    budgetNote: z.string(),
    packingNote: z.string(),
    transportNote: z.string(),
  }),
});

/** §19 step 3 — 목적/우선순위를 반영해 일차별 지역(dayRegions)과 테마 뼈대만 생성한다. 장소는 아직 확정하지 않는다. */
async function generateDaySkeleton(request: TripRequest) {
  const { object } = await generateObject({
    model: anthropic("claude-sonnet-5"),
    schema: dayRegionSchema,
    prompt: `다음 여행 조건에 맞는 일차별 지역(dayRegion)과 테마를 제안해줘. 장소 이름은 아직 정하지 마.
목적지: ${request.destination}
동행: ${request.memberType} ${request.memberCount}명
기간: ${request.nights}박 ${request.nights + 1}일 (${request.month}월)
여행 목적: ${request.purposes.map((p) => `${p.id}(${p.priority})`).join(", ")}
요청사항: ${request.notes ?? "없음"}`,
  });
  return object;
}

export async function generateItinerary(request: TripRequest, userId: string): Promise<Itinerary> {
  // step 3: dayRegions/일정 뼈대
  const skeleton = await generateDaySkeleton(request);

  // step 4-9: SearchPlan → 정규화 → Cache → Dedup/Queue → Rate Limiter → 후보 수집
  const plan = buildSearchPlan(request);
  const [youtubeSources, blogSources] = await Promise.all([
    getSources(plan, "youtube", (q) => youtubeProvider.searchVideos(q, 50)),
    getSources(plan, "blog", (q) => naverProvider.searchBlog(q, 20)),
  ]);

  // step 10-11: 이미 getSources 내부(orchestrator)에서 중복 제거 + 랭킹 완료
  const sources = [...youtubeSources, ...blogSources].slice(0, 6);

  // step 12-14: 장소-출처 매칭 + 지오코딩 + 좌표 검증
  // 후보 장소는 TourAPI/Naver 지역검색 결과를 사용해야 하며, 여기서는 뼈대의 테마를
  // 기반으로 한 최소 아이템만 구성한다. 실제 장소 후보 결합은 §19.1.3 TourAPI 흐름을 사용한다.
  const days: ItineraryDay[] = skeleton.days.map((day) => ({
    day: day.day,
    dayRegion: day.dayRegion,
    items: day.themes.map((theme, index) => ({
      type: "activity",
      name: `${day.dayRegion} ${theme}`,
      stayMinutes: 90,
      role: index === 0 ? "anchor" : "supporting",
      sourceIds: sources.slice(0, 2).map((s) => s.sourceId),
    })),
  }));

  // step 15: 2-opt는 좌표가 확정된 이후(장소 매칭 완료 후) 하루 단위로 적용한다.
  for (const day of days) {
    const points = filterImpreciseCoordinates(
      day.items
        .filter((item) => item.latitude !== undefined && item.longitude !== undefined)
        .map((item) => ({ id: item.name, latitude: item.latitude!, longitude: item.longitude! })),
    );
    if (points.length >= 4) {
      const optimized = twoOptOptimize(points);
      const order = new Map(optimized.map((p, index) => [p.id, index]));
      day.items.sort((a, b) => (order.get(a.name) ?? 0) - (order.get(b.name) ?? 0));
    }
  }

  const itinerary: Itinerary = {
    id: randomUUID(),
    userId,
    destination: request.destination,
    destinationName: request.destination,
    region: request.region,
    memberType: request.memberType,
    memberCount: request.memberCount,
    nights: request.nights,
    month: request.month,
    purposes: request.purposes,
    notes: request.notes,
    days,
    tripTips: skeleton.tripTips,
    sources,
    createdAt: new Date().toISOString(),
  };

  // step 16: Neon 저장
  await db.insert(schema.itineraries).values({
    id: itinerary.id,
    userId: itinerary.userId,
    destination: itinerary.destination,
    destinationName: itinerary.destinationName,
    region: itinerary.region,
    memberType: itinerary.memberType,
    memberCount: itinerary.memberCount,
    nights: itinerary.nights,
    month: itinerary.month,
    purposes: itinerary.purposes,
    notes: itinerary.notes,
    days: itinerary.days,
    tripTips: itinerary.tripTips,
  });

  return itinerary;
}
