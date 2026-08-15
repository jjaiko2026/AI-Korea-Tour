/**
 * PRD §39.6 Blog Writer — 제목/여행 전체 매력/일정 한눈에 보기/DAY별/장소별 여행
 * 포인트/여행 준비 정보/추천 대상/체크사항/FAQ/마무리를 포함할 수 있다.
 */
import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import type { TravelContentBrief } from "@/types";

const blogSchema = z.object({
  title: z.string(),
  slug: z.string(),
  markdown: z.string(),
  seoDescription: z.string(),
  seoKeywords: z.array(z.string()),
});

export async function writeBlog(brief: TravelContentBrief): Promise<z.infer<typeof blogSchema>> {
  const { object } = await generateObject({
    model: anthropic("claude-sonnet-5"),
    schema: blogSchema,
    prompt: `다음 Travel Content Brief로 여행 블로그 글을 Markdown으로 작성해줘.
구성: 제목, 여행 전체 매력, 일정 한눈에 보기, DAY별 상세, 장소별 여행 포인트,
여행 준비 정보, 추천 대상, 체크사항, FAQ, 마무리.
외부 문장을 그대로 복사하지 말고 검증된 사실만 단정적으로 서술해라. 확인되지
않은 사실(verified=false)은 "확인 필요"로 남겨라.
Brief: ${JSON.stringify(brief)}`,
  });
  return object;
}
