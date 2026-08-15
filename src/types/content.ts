/**
 * PRD §37 Trip Data Contract — TripTubeAI DB 구조에 Content AI가 직접 의존하지 않도록 하는 경계.
 */
import type { MemberType, TravelPurposeId, TravelPurposePriority, Source } from "./trip";

export type TripContentInput = {
  tripId: string;
  destination: {
    country?: string;
    region: string;
    city?: string;
  };
  duration: {
    days: number;
    nights: number;
  };
  traveler: {
    memberType: MemberType;
    memberCount: number;
  };
  travelPeriod?: {
    month?: number;
    startDate?: string;
    endDate?: string;
  };
  purposes: {
    id: TravelPurposeId;
    priority: TravelPurposePriority;
  }[];
  transportation?: string;
  accommodation?: {
    name?: string;
    region?: string;
  };
  itinerary: {
    day: number;
    dayRegion?: string;
    items: {
      type: string;
      name: string;
      startTime?: string;
      endTime?: string;
      stayMinutes?: number;
      role?: string;
      latitude?: number;
      longitude?: number;
      sourceIds?: string[];
    }[];
  }[];
  tripTips?: unknown;
  sources?: Source[];
};

/** §38 Travel Content Brief — Blog/YouTube/Shorts가 공유하는 단일 사실 기준 */
export type TravelContentBrief = {
  tripId: string;
  title: string;
  targetAudience: string;
  travelTheme: string;
  coreStory: string;
  keyPlaces: string[];
  keyExperiences: string[];
  itinerarySummary: unknown;
  verifiedFacts: unknown[];
  travelDesirePoints: unknown[];
  tone: string;
  contentAngles: string[];
};

/** §42 Content Job */
export type ContentJobType = "blog" | "youtube" | "shorts" | "bundle";

export type ContentJobStatus =
  | "queued"
  | "researching"
  | "fact_checking"
  | "brief_ready"
  | "generating"
  | "review_required"
  | "approved"
  | "published"
  | "failed"
  | "retry";

export type ContentJob = {
  id: string;
  tripId: string;
  type: ContentJobType;
  status: ContentJobStatus;
  requestedBy: string;
  priority: "manual" | "scheduled" | "recommended";
  progress?: number;
  error?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
};

/** §44 검수 상태 */
export type ContentReviewStatus =
  | "draft"
  | "generating"
  | "review_required"
  | "changes_requested"
  | "approved"
  | "published"
  | "failed";

/** §40.2 YouTube Long-form 출력 */
export type YouTubeContent = {
  title: string;
  alternativeTitles: string[];
  thumbnailText: string;
  concept: string;
  hook: string;
  targetAudience: string;
  duration: number;
  chapters: { title: string; startSeconds: number }[];
  scenes: unknown[];
  narration: string;
  subtitles: unknown[];
  bRollPlan: unknown[];
  imagePrompts: string[];
  videoPrompts: string[];
  cta: string;
  description: string;
  tags: string[];
  hashtags: string[];
};

/** §41.2 Shorts 출력 */
export type ShortContent = {
  title: string;
  hook: string;
  duration: number;
  script: string;
  captions: unknown[];
  scenePlan: unknown[];
  visualPrompts: string[];
  voiceover: string;
  cta: string;
  description: string;
  hashtags: string[];
};
