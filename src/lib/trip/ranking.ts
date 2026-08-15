/**
 * PRD §15 자체 후보 랭킹 / §16 광고성·복제 콘텐츠 감점.
 *
 * destinationMatch * 0.30 + purposeMatch * 0.25 + tripStyleMatch * 0.15
 * + placeMatch * 0.15 + freshness * 0.05 + engagement * 0.05 + sourceDiversity * 0.05
 *
 * 실제 destinationMatch/purposeMatch/tripStyleMatch/placeMatch는 검색 컨텍스트에서
 * 계산되며, 이 모듈은 Source에 이미 채워진 relevanceScore/qualityScore를 기반으로
 * freshness/engagement/diversity·감점을 적용해 최종 정렬한다. 목적별 상세 매칭 점수는
 * 검색 단계(§7.2)에서 relevanceScore에 반영해 전달한다.
 */
import type { Source } from "@/types";

const WEIGHTS = {
  relevance: 0.7, // destinationMatch + purposeMatch + tripStyleMatch + placeMatch 합산분
  freshness: 0.05,
  engagement: 0.05,
  sourceDiversity: 0.05,
  quality: 0.15,
};

const AD_PATTERN = /(협찬|광고|제공받|무료제공|할인코드|쿠폰\s?코드)/;

function freshnessScore(publishedAt?: string): number {
  if (!publishedAt) return 0.5;
  const ageDays = (Date.now() - new Date(publishedAt).getTime()) / (1000 * 60 * 60 * 24);
  if (ageDays < 0) return 0.5;
  return Math.max(0, 1 - ageDays / 730); // 2년 지나면 0에 수렴
}

function adPenalty(source: Source): number {
  const text = `${source.title} ${source.description ?? ""}`;
  return AD_PATTERN.test(text) ? 0.3 : 0;
}

/** §16 채널 다양성 — 동일 채널 콘텐츠가 많을수록 후순위 항목에 감점을 준다. */
function withDiversityPenalty(sources: Source[]): Map<string, number> {
  const seenCount = new Map<string, number>();
  const penalty = new Map<string, number>();
  for (const source of sources) {
    const count = seenCount.get(source.channelOrSite) ?? 0;
    penalty.set(source.sourceId, Math.min(0.3, count * 0.1));
    seenCount.set(source.channelOrSite, count + 1);
  }
  return penalty;
}

export function rankSources(sources: Source[]): Source[] {
  const deduped = dedupeBySourceId(sources);
  const diversityPenalty = withDiversityPenalty(deduped);

  return deduped
    .map((source) => {
      const relevance = source.relevanceScore ?? 0.5;
      const quality = source.qualityScore ?? 0.5;
      const score =
        relevance * WEIGHTS.relevance +
        freshnessScore(source.publishedAt) * WEIGHTS.freshness +
        quality * WEIGHTS.quality +
        Math.max(0, WEIGHTS.sourceDiversity - (diversityPenalty.get(source.sourceId) ?? 0)) -
        adPenalty(source);

      return { source, score };
    })
    .sort((a, b) => b.score - a.score)
    .map(({ source }) => source);
}

function dedupeBySourceId(sources: Source[]): Source[] {
  const seen = new Set<string>();
  const result: Source[] = [];
  for (const source of sources) {
    if (seen.has(source.sourceId)) continue;
    seen.add(source.sourceId);
    result.push(source);
  }
  return result;
}
