/**
 * PRD §13-14 YouTube API 정책 — search.list(maxResults=50, regionCode=KR,
 * relevanceLanguage=ko, order=relevance), videos.list는 videoId를 batch로 묶어 호출.
 * Rule 6: UI 컴포넌트에서 YouTube API를 직접 호출하지 않는다 — 이 모듈은 서버 전용.
 */
import { withRateLimit, RATE_LIMITS } from "@/lib/search/rate-limiter";
import type { Source } from "@/types";
import type { YouTubeProvider } from "./types";

const API_KEY = process.env.YOUTUBE_API_KEY;
const BASE_URL = "https://www.googleapis.com/youtube/v3";

type SearchListResponse = {
  items: {
    id: { videoId: string };
    snippet: {
      title: string;
      channelTitle: string;
      description?: string;
      publishedAt?: string;
      thumbnails?: { medium?: { url: string } };
    };
  }[];
};

type VideosListResponse = {
  items: { id: string; snippet: unknown; statistics: unknown; contentDetails: unknown }[];
};

export const youtubeProvider: YouTubeProvider = {
  async searchVideos(query: string, maxResults = 50): Promise<Source[]> {
    if (!API_KEY) throw new Error("YOUTUBE_API_KEY is not set (see .env.example)");

    return withRateLimit(RATE_LIMITS.youtube, async () => {
      const params = new URLSearchParams({
        key: API_KEY,
        q: query,
        part: "snippet",
        type: "video",
        maxResults: String(maxResults),
        regionCode: "KR",
        relevanceLanguage: "ko",
        order: "relevance",
      });
      const res = await fetch(`${BASE_URL}/search?${params.toString()}`);
      if (!res.ok) throw new Error(`YouTube search.list failed: ${res.status}`);
      const json = (await res.json()) as SearchListResponse;

      return json.items.map((item) => ({
        sourceId: item.id.videoId,
        sourceType: "youtube" as const,
        title: item.snippet.title,
        channelOrSite: item.snippet.channelTitle,
        url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        thumbnailUrl: item.snippet.thumbnails?.medium?.url,
        description: item.snippet.description,
        publishedAt: item.snippet.publishedAt,
      }));
    });
  },

  async getVideoDetails(videoIds: string[]) {
    if (!API_KEY) throw new Error("YOUTUBE_API_KEY is not set (see .env.example)");
    if (videoIds.length === 0) return [];

    return withRateLimit(RATE_LIMITS.youtube, async () => {
      const params = new URLSearchParams({
        key: API_KEY,
        id: videoIds.join(","),
        part: "snippet,statistics,contentDetails",
      });
      const res = await fetch(`${BASE_URL}/videos?${params.toString()}`);
      if (!res.ok) throw new Error(`YouTube videos.list failed: ${res.status}`);
      const json = (await res.json()) as VideosListResponse;

      return json.items.map((item) => ({
        videoId: item.id,
        snippet: item.snippet,
        statistics: item.statistics,
        contentDetails: item.contentDetails,
      }));
    });
  },
};
