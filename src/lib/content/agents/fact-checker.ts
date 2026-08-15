/**
 * PRD §39.3 Fact Checker — 영업시간/휴무일/입장료/주차/예약 여부/위치/이동시간/운영
 * 여부/계절별 운영/최근 변경사항을 검증한다. Rule 8.6: AI가 검증 가능한 사실을
 * 임의 생성하지 않는다 — 확인되지 않은 항목은 verified:false로 남긴다.
 */
import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import type { PlaceResearch } from "./travel-researcher";

const factCheckSchema = z.object({
  facts: z.array(
    z.object({
      placeName: z.string(),
      claim: z.string(),
      verified: z.boolean(),
      note: z.string().optional(),
    }),
  ),
});

export type VerifiedFact = z.infer<typeof factCheckSchema>["facts"][number];

export async function factCheck(places: PlaceResearch[]): Promise<VerifiedFact[]> {
  const { object } = await generateObject({
    model: anthropic("claude-sonnet-5"),
    schema: factCheckSchema,
    prompt: `다음 장소별 조사 내용에서 운영시간/휴무일/입장료/주차/예약 여부 등
검증 가능한 사실 클레임을 뽑아내고, 확실히 검증되지 않은 항목은 verified=false로
표시해줘(추측하지 마).
${JSON.stringify(places, null, 2)}`,
  });

  return object.facts;
}
