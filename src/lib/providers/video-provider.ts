/**
 * PRD §40.4 — 영상 생성 실제 모델/서비스는 특정 공급자에 종속되지 않도록 Provider
 * 추상화를 둔다 (Rule 17). 기본 구현은 no-op 스텁이며, 실제 렌더링 서비스 연동 시
 * 이 파일만 교체한다.
 */
import type { VideoAsset, VideoProvider, VideoRenderInput, VideoSceneInput } from "./types";

export const stubVideoProvider: VideoProvider = {
  async generateSceneAsset(input: VideoSceneInput): Promise<VideoAsset> {
    throw new Error(
      `Video generation provider is not configured. Wire a real provider (e.g. Higgsfield, Runway) here. Requested scene: "${input.prompt}"`,
    );
  },

  async renderVideo(_input: VideoRenderInput): Promise<VideoAsset> {
    throw new Error("Video render provider is not configured.");
  },
};
