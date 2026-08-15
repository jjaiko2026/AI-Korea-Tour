/**
 * PRD §37 Trip Data Contract — Content AI는 TripTubeAI DB 구조에 직접 의존하지 않는다.
 * TripTubeAI DB → Trip Data Contract → Content AI 의 API 경계를 이 함수가 담당한다.
 */
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import type { Itinerary, Source, TripContentInput } from "@/types";

export async function loadTripContentInput(tripId: string): Promise<TripContentInput> {
  const [row] = await db.select().from(schema.itineraries).where(eq(schema.itineraries.id, tripId)).limit(1);
  if (!row) throw new Error(`Trip not found: ${tripId}`);

  const days = row.days as Itinerary["days"];
  const purposes = row.purposes as Itinerary["purposes"];

  return {
    tripId: row.id,
    destination: {
      region: row.destinationName,
      country: row.region === "international" ? undefined : "대한민국",
    },
    duration: { days: row.nights + 1, nights: row.nights },
    traveler: { memberType: row.memberType as TripContentInput["traveler"]["memberType"], memberCount: row.memberCount },
    travelPeriod: { month: row.month },
    purposes,
    itinerary: days.map((day) => ({
      day: day.day,
      dayRegion: day.dayRegion,
      items: day.items,
    })),
    tripTips: row.tripTips,
    sources: undefined as Source[] | undefined,
  };
}
