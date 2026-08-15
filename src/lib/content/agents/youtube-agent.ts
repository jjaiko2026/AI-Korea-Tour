/**
 * PRD §40 Content AI — YouTube Long-form Agent. Blog를 그대로 읽지 않고 공통
 * Travel Content Brief에서 영상 콘텐츠를 새로 구성한다. §40.3 구성:
 * Hook → 여행 전체 소개 → DAY 1..N → 예산/실용 정보 → 추천 대상 → CTA.
 */
import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import type { TravelContentBrief, YouTubeContent } from "@/types";

const youtubeSchema = z.object({
  title: z.string(),
  alternativeTitles: z.array(z.string()),
  thumbnailText: z.string(),
  concept: z.string(),
  hook: z.string(),
  targetAudience: z.string(),
  duration: z.number(),
  chapters: z.array(z.object({ title: z.string(), startSeconds: z.number() })),
  narration: z.string(),
  description: z.string(),
  tags: z.array(z.string()),
  hashtags: z.array(z.string()),
  cta: z.string(),
});

export async function generateYouTubeScript(brief: TravelContentBrief): Promise<YouTubeContent> {
  const { object } = await generateObject({
    model: anthropic("claude-sonnet-5"),
    schema: youtubeSchema,
    prompt: `다음 Travel Content Brief로 YouTube Long-form 영상 기획/대본을 만들어줘.
구성: Hook → 여행 전체 소개 → 일차별 진행 → 예산/실용 정보 → 추천 대상 → CTA.
Brief: ${JSON.stringify(brief)}`,
  });

  return {
    ...object,
    scenes: [],
    subtitles: [],
    bRollPlan: [],
    imagePrompts: [],
    videoPrompts: [],
  };
}
