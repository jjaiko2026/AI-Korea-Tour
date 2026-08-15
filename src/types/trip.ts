/**
 * PRD §23 앱 내부 타입 / §6.3 여행 목적 10개
 */
export type TravelPurposeId =
  | "food"
  | "healing"
  | "nature"
  | "attraction"
  | "cafe"
  | "activity"
  | "culture"
  | "shopping"
  | "festival"
  | "nightlife";

export type TravelPurposePriority = "core" | "important" | "normal";

export const TRAVEL_PURPOSE_PRIORITY_WEIGHT: Record<TravelPurposePriority, number> = {
  core: 1.0,
  important: 0.7,
  normal: 0.4,
};

export const TRAVEL_PURPOSES: {
  id: TravelPurposeId;
  label: string;
  searchIntent: string[];
}[] = [
  { id: "food", label: "🍜 맛집·미식", searchIntent: ["맛집", "현지음식", "먹거리"] },
  { id: "healing", label: "🏖️ 휴양·힐링", searchIntent: ["휴양", "힐링", "리조트", "온천"] },
  { id: "nature", label: "🏞️ 자연·풍경", searchIntent: ["자연", "바다", "산", "해변", "전망"] },
  { id: "attraction", label: "📸 관광·명소", searchIntent: ["관광지", "명소", "랜드마크"] },
  { id: "cafe", label: "☕ 카페·감성", searchIntent: ["카페", "오션뷰", "감성카페"] },
  { id: "activity", label: "🎢 액티비티·체험", searchIntent: ["레저", "스포츠", "체험"] },
  { id: "culture", label: "🏛️ 문화·역사", searchIntent: ["역사", "문화", "유적", "박물관"] },
  { id: "shopping", label: "🛍️ 쇼핑", searchIntent: ["쇼핑몰", "시장", "기념품"] },
  { id: "festival", label: "🎉 축제·공연·이벤트", searchIntent: ["축제", "공연", "행사"] },
  { id: "nightlife", label: "🌙 야경·나이트라이프", searchIntent: ["야경", "야시장", "밤거리"] },
];

/** 목적 그룹화 (§7.3) */
export const PURPOSE_GROUPS: Record<string, TravelPurposeId[]> = {
  음식: ["food"],
  휴양: ["healing"],
  관광: ["nature", "attraction"],
  감성: ["cafe"],
  체험: ["activity"],
  문화: ["culture"],
  소비: ["shopping"],
  이벤트: ["festival"],
  야간: ["nightlife"],
};

export type TravelPurpose = {
  id: TravelPurposeId;
  priority: TravelPurposePriority;
};

export type MemberType = "solo" | "friend" | "family" | "couple" | "colleague";

export type TripRequest = {
  destination: string;
  region: "domestic" | "international";
  memberType: MemberType;
  memberCount: number;
  nights: number;
  month: number;
  purposes: TravelPurpose[];
  notes?: string;
};

export type SourceType = "youtube" | "blog";

export type Source = {
  sourceId: string;
  sourceType: SourceType;
  title: string;
  channelOrSite: string;
  url: string;
  thumbnailUrl?: string;
  description?: string;
  publishedAt?: string;
  relevanceScore?: number;
  qualityScore?: number;
};

/** §7.2 SearchPlan */
export type SearchPlan = {
  primaryQueries: string[];
  fallbackQueries: string[];
  purposeGroups: string[];
  cacheKeys: string[];
};

/** §8 검색어 정규화 */
export type SearchKey = {
  source: "tour_api" | "youtube" | "blog";
  destination: string;
  memberType?: string;
  nights?: number;
  month?: number;
  purposeGroups: string[];
  regionCode?: string;
  language?: string;
};

export type ItineraryItem = {
  type: string;
  name: string;
  startTime?: string;
  endTime?: string;
  stayMinutes?: number;
  role?: string;
  latitude?: number;
  longitude?: number;
  sourceIds?: string[];
};

export type ItineraryDay = {
  day: number;
  dayRegion?: string;
  items: ItineraryItem[];
};

export type Itinerary = {
  id: string;
  userId: string;
  destination: string;
  destinationName: string;
  region: "domestic" | "international";
  memberType: MemberType;
  memberCount: number;
  nights: number;
  month: number;
  purposes: TravelPurpose[];
  notes?: string;
  days: ItineraryDay[];
  estimatedTotalCost?: number;
  currency?: string;
  tripTips?: unknown;
  sources?: Source[];
  createdAt: string;
};
