/**
 * PRD §6.4 챗봇 — Gemini 3.6 Flash + Vercel AI Gateway. 자연어 조건 파악 후
 * `updateTripDraft`로 폼을 실시간 반영한다. 목적은 목적 ID + 우선순위로 변환하고,
 * 동명이 지역은 모델이 되물어 확인하게 한다(시스템 프롬프트로 지시).
 */
import { streamText, tool, convertToModelMessages, type UIMessage } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";

export const maxDuration = 30;

const SYSTEM_PROMPT = `너는 TripTubeAI의 여행 조건 수집 챗봇이다.
사용자의 자연어 문장에서 여행지, 동행 유형(solo/friend/family/couple/colleague),
인원, 숙박 일수, 여행 시기(월), 여행 목적을 추출해라.
여행 목적은 다음 10개 중에서만 고른다: food, healing, nature, attraction, cafe,
activity, culture, shopping, festival, nightlife. 우선순위는 core/important/normal 중
core는 최대 3개까지만 지정한다.
정보를 확인할 때마다 updateTripDraft 도구를 호출해 폼에 반영해라.
목적지 이름이 동명이지역일 수 있으면(예: "전주"가 여러 곳 존재) 확정하지 말고 사용자에게
되물어라.`;

const updateTripDraftSchema = z.object({
  destination: z.string().optional(),
  region: z.enum(["domestic", "international"]).optional(),
  memberType: z.enum(["solo", "friend", "family", "couple", "colleague"]).optional(),
  memberCount: z.number().int().positive().optional(),
  nights: z.number().int().min(0).optional(),
  month: z.number().int().min(1).max(12).optional(),
  purposes: z
    .array(
      z.object({
        id: z.enum([
          "food",
          "healing",
          "nature",
          "attraction",
          "cafe",
          "activity",
          "culture",
          "shopping",
          "festival",
          "nightlife",
        ]),
        priority: z.enum(["core", "important", "normal"]),
      }),
    )
    .max(10)
    .optional(),
  notes: z.string().optional(),
});

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: google("gemini-3.6-flash"),
    system: SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages),
    tools: {
      updateTripDraft: tool({
        description: "파악된 여행 조건으로 폼 초안을 갱신한다.",
        inputSchema: updateTripDraftSchema,
        execute: async (draft) => draft,
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
