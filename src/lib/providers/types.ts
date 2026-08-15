/**
 * PRD §7.1.1 외부 데이터 Provider 구조 — 모든 외부 데이터 소스는 Provider/Adapter
 * 계층을 통해 호출한다. 애플리케이션 계층은 이 인터페이스에만 의존한다.
 */
import type { Accommodation, Place, Source, TourEvent } from "@/types";

// ── §7.1.1 TourProvider ────────────────────────────────────────────────

export type TourPlaceSearchInput = {
  areaCode?: string;
  sigunguCode?: string;
  contentTypeId?: string;
  page?: number;
  numOfRows?: number;
};

export type NearbySearchInput = {
  latitude: number;
  longitude: number;
  radiusMeters?: number;
  contentTypeId?: string;
};

export type KeywordSearchInput = {
  keyword: string;
  areaCode?: string;
  contentTypeId?: string;
};

export type FestivalSearchInput = {
  areaCode?: string;
  startDate: string; // YYYYMMDD
  endDate?: string;
};

export type StaySearchInput = {
  areaCode?: string;
  sigunguCode?: string;
};

export type PlaceCommon = Place;
export type PlaceIntro = Pick<Place, "operation" | "price">;
export type PlaceInfo = { title: string; value: string };
export type ImageOptions = { numOfRows?: number };
export type PetTourInfo = { acceptable: boolean; notes?: string };

/** §7.1.1 TourProvider 인터페이스 — Provider 내부에서만 TourAPI 필드명을 해석한다. */
export interface TourProvider {
  searchPlaces(input: TourPlaceSearchInput): Promise<Place[]>;
  searchNearby(input: NearbySearchInput): Promise<Place[]>;
  searchKeyword(input: KeywordSearchInput): Promise<Place[]>;
  searchEvents(input: FestivalSearchInput): Promise<TourEvent[]>;
  searchStays(input: StaySearchInput): Promise<Accommodation[]>;
  getPlaceCommon(contentId: string): Promise<PlaceCommon>;
  getPlaceIntro(contentId: string, contentTypeId: string): Promise<PlaceIntro>;
  getPlaceInfo(contentId: string, contentTypeId: string): Promise<PlaceInfo[]>;
  getPlaceImages(contentId: string, options?: ImageOptions): Promise<Place["images"]>;
  getPetTour(contentId: string, contentTypeId: string): Promise<PetTourInfo>;
  getAreaCodes(parentAreaCode?: string): Promise<{ code: string; name: string }[]>;
  getCategoryCodes(input: { cat1?: string; cat2?: string }): Promise<{ code: string; name: string }[]>;
}

// ── YouTube / Naver ───────────────────────────────────────────────────

export interface YouTubeProvider {
  /** search.list — maxResults=50, regionCode=KR, relevanceLanguage=ko, order=relevance (§13) */
  searchVideos(query: string, maxResults?: number): Promise<Source[]>;
  /** videos.list — videoId를 batch로 묶어 호출한다 (§14) */
  getVideoDetails(videoIds: string[]): Promise<
    { videoId: string; snippet: unknown; statistics: unknown; contentDetails: unknown }[]
  >;
}

export interface NaverProvider {
  searchBlog(query: string, display?: number): Promise<Source[]>;
  searchLocal(query: string): Promise<Place[]>;
}

// ── Maps ──────────────────────────────────────────────────────────────

export type GeocodeResult = { latitude: number; longitude: number; formattedAddress: string };

export interface MapProvider {
  geocode(address: string): Promise<GeocodeResult | undefined>;
  getDistanceMatrix(
    origins: { latitude: number; longitude: number }[],
    destinations: { latitude: number; longitude: number }[],
  ): Promise<number[][]>; // meters
}

// ── §40.4 Video / §48 Blog ───────────────────────────────────────────

export type VideoSceneInput = { prompt: string; durationSeconds?: number };
export type VideoRenderInput = { scenes: unknown[]; voiceover?: string; subtitles?: unknown[] };
export type VideoAsset = { url: string; provider: string; durationSeconds?: number };

export interface VideoProvider {
  generateSceneAsset(input: VideoSceneInput): Promise<VideoAsset>;
  renderVideo(input: VideoRenderInput): Promise<VideoAsset>;
}

export type BlogPublishInput = { title: string; html: string; slug: string };
export type PublishResult = { publishedUrl: string; publishedAt: string };

export interface BlogPublisher {
  publish(input: BlogPublishInput): Promise<PublishResult>;
}
