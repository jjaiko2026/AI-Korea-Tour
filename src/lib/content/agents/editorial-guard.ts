/**
 * PRD §39.7 Editorial / Copyright Guard, §51-52 콘텐츠 품질/저작권 원칙 —
 * 외부 문장 복사, 대본 전사, 특정 블로그 모방, 단순 출처 병합, 사실 오류, 과장/광고성
 * 표현 등을 검사한다. 확정 판정이 아니라 검토 신호로 사용한다(§16과 동일한 원칙).
 */
import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";

const guardSchema = z.object({
  passed: z.boolean(),
  issues: z.array(
    z.object({
      type: z.enum([
        "copied_text",
        "transcribed_script",
        "mimicked_style",
        "source_merge_only",
        "factual_error",
        "overclaim",
        "ad_like",
        "outdated_info",
      ]),
      description: z.string(),
    }),
  ),
});

export type EditorialGuardResult = z.infer<typeof guardSchema>;

export async function runEditorialGuard(content: string): Promise<EditorialGuardResult> {
  const { object } = await generateObject({
    model: anthropic("claude-sonnet-5"),
    schema: guardSchema,
    prompt: `다음 콘텐츠를 검수해줘. 외부 문장 복사 여부, 영상 대본 전사 여부, 특정
블로그 문장/구조 모방 여부, 단순 출처 병합 여부, 사실 오류, 과장/광고성 표현을
점검하고 issues로 나열해라. 심각한 문제가 없으면 passed=true.
콘텐츠: ${content}`,
  });
  return object;
}
