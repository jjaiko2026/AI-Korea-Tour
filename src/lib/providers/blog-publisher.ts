/**
 * PRD §48 Blog 발행 — 외부 CMS 연동은 Provider 추상화를 사용한다.
 */
import type { BlogPublishInput, BlogPublisher, PublishResult } from "./types";

export const stubBlogPublisher: BlogPublisher = {
  async publish(input: BlogPublishInput): Promise<PublishResult> {
    throw new Error(
      `Blog publisher is not configured. Wire a real CMS (e.g. WordPress, Contentful) here. Slug: "${input.slug}"`,
    );
  },
};
