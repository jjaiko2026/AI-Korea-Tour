/**
 * PRD §41 Content AI — YouTube Shorts Agent. Long-form을 자르는 게 아니라 하나의
 * 여행 데이터에서 짧고 독립적인 콘텐츠 주제를 추출한다. §41.3 shortCount = 1..10.
 */
import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import type { ShortContent, TravelContentBrief } from "@/types";

const shortsSchema = z.object({
  shorts: z.array(
    z.object({
      title: z.string(),
      hook: z.string(),
      duration: z.number(),
      script: z.string(),
      voiceover: z.string(),
      cta: z.string(),
      description: z.string(),
      hashtags: z.array(z.string()),
    }),
  ),
});

export async function generateShorts(brief: TravelContentBrief, shortCount: number): Promise<ShortContent[]> {
  const count = Math.min(10, Math.max(1, shortCount));

  const { object } = await generateObject({
    model: anthropic("claude-sonnet-5"),
    schema: shortsSchema,
    prompt: `다음 Travel Content Brief에서 서로 다른 주제의 짧은 Shorts 콘텐츠를
정확히 ${count}개 뽑아줘. 각 Short는 독립적으로 이해 가능해야 하고 강한 Hook과
명확한 메시지 하나만 가져야 한다.
Brief: ${JSON.stringify(brief)}`,
  });

  return object.shorts.map((short) => ({ ...short, captions: [], scenePlan: [], visualPrompts: [] }));
}
