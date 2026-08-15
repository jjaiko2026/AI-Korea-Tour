/**
 * PRD §24 Naver 지역검색/블로그 검색 API.
 */
import { withRateLimit, RATE_LIMITS } from "@/lib/search/rate-limiter";
import type { Place, Source } from "@/types";
import type { NaverProvider } from "./types";

const CLIENT_ID = process.env.NAVER_CLIENT_ID;
const CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET;

function naverHeaders(): HeadersInit {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error("NAVER_CLIENT_ID/NAVER_CLIENT_SECRET is not set (see .env.example)");
  }
  return { "X-Naver-Client-Id": CLIENT_ID, "X-Naver-Client-Secret": CLIENT_SECRET };
}

type BlogSearchResponse = {
  items: { title: string; link: string; description: string; bloggername: string; postdate: string }[];
};

type LocalSearchResponse = {
  items: { title: string; address: string; roadAddress: string; mapx: string; mapy: string; category: string }[];
};

const stripHtml = (value: string) => value.replace(/<[^>]+>/g, "");

export const naverProvider: NaverProvider = {
  async searchBlog(query: string, display = 20): Promise<Source[]> {
    return withRateLimit(RATE_LIMITS.naver, async () => {
      const params = new URLSearchParams({ query, display: String(display), sort: "sim" });
      const res = await fetch(`https://openapi.naver.com/v1/search/blog.json?${params.toString()}`, {
        headers: naverHeaders(),
      });
      if (!res.ok) throw new Error(`Naver blog search failed: ${res.status}`);
      const json = (await res.json()) as BlogSearchResponse;

      return json.items.map((item, index) => ({
        sourceId: `${Buffer.from(item.link).toString("base64url")}_${index}`,
        sourceType: "blog" as const,
        title: stripHtml(item.title),
        channelOrSite: item.bloggername,
        url: item.link,
        description: stripHtml(item.description),
        publishedAt: item.postdate,
      }));
    });
  },

  async searchLocal(query: string): Promise<Place[]> {
    return withRateLimit(RATE_LIMITS.naver, async () => {
      const params = new URLSearchParams({ query, display: "20" });
      const res = await fetch(`https://openapi.naver.com/v1/search/local.json?${params.toString()}`, {
        headers: naverHeaders(),
      });
      if (!res.ok) throw new Error(`Naver local search failed: ${res.status}`);
      const json = (await res.json()) as LocalSearchResponse;

      return json.items.map((item, index) => ({
        id: `naver_${index}_${item.title}`,
        source: "NAVER" as const,
        name: stripHtml(item.title),
        address: { road: item.roadAddress, jibun: item.address },
        location:
          item.mapx && item.mapy
            ? { longitude: Number(item.mapx) / 1e7, latitude: Number(item.mapy) / 1e7 }
            : undefined,
        category: { main: item.category },
      }));
    });
  },
};
