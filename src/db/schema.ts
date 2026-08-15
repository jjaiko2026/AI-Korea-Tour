/**
 * PRD §22 데이터 모델 / §45 콘텐츠 데이터 모델
 *
 * 테이블은 PRD 문서 섹션 번호를 주석으로 남겨 스펙과 1:1로 추적할 수 있게 한다.
 */
import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  real,
} from "drizzle-orm/pg-core";

const id = (name = "id") => text(name).primaryKey();
const createdAt = () => timestamp("created_at", { withTimezone: true }).defaultNow().notNull();

// ── §22 사용자 여행 플랫폼 ──────────────────────────────────────────────

export const itineraries = pgTable("itineraries", {
  id: id(),
  userId: text("user_id").notNull(),
  destination: text("destination").notNull(),
  destinationName: text("destination_name").notNull(),
  region: text("region").notNull(), // domestic | international
  memberType: text("member_type").notNull(),
  memberCount: integer("member_count").notNull(),
  nights: integer("nights").notNull(),
  month: integer("month").notNull(),
  purposes: jsonb("purposes").notNull(), // TravelPurpose[]
  notes: text("notes"),
  days: jsonb("days").notNull(), // ItineraryDay[]
  estimatedTotalCost: integer("estimated_total_cost"),
  currency: text("currency"),
  tripTips: jsonb("trip_tips"),
  createdAt: createdAt(),
});

export const sourceCache = pgTable("source_cache", {
  cacheKey: id("cache_key"),
  sourceType: text("source_type").notNull(), // youtube | blog
  normalizedQuery: text("normalized_query").notNull(),
  searchContext: jsonb("search_context"),
  sources: jsonb("sources").notNull(),
  fetchedAt: timestamp("fetched_at", { withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

export const videoDetailCache = pgTable("video_detail_cache", {
  videoId: id("video_id"),
  snippet: jsonb("snippet"),
  statistics: jsonb("statistics"),
  contentDetails: jsonb("content_details"),
  fetchedAt: timestamp("fetched_at", { withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

export const searchJobs = pgTable("search_jobs", {
  id: id(),
  sourceType: text("source_type").notNull(), // youtube | blog
  cacheKey: text("cache_key").notNull(),
  query: text("query").notNull(),
  status: text("status").notNull(), // pending|running|completed|failed
  priority: text("priority").notNull(), // user|prefetch|refresh
  attempts: integer("attempts").notNull().default(0),
  createdAt: createdAt(),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  error: text("error"),
});

export const searchLocks = pgTable("search_locks", {
  cacheKey: id("cache_key"),
  jobId: text("job_id").notNull(),
  status: text("status").notNull(), // pending|running|completed|failed
  lockedAt: timestamp("locked_at", { withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

// ── §7.2 / §19.1 Internal Place Model ──────────────────────────────────

export const places = pgTable("places", {
  id: id(),
  source: text("source").notNull(), // TOUR_API|GOOGLE_MAPS|NAVER|OTHER
  sourceId: text("source_id"),
  contentTypeId: text("content_type_id"),
  name: text("name").notNull(),
  category: jsonb("category"),
  address: jsonb("address"),
  location: jsonb("location"),
  contact: jsonb("contact"),
  operation: jsonb("operation"),
  price: jsonb("price"),
  description: text("description"),
  petFriendly: boolean("pet_friendly").default(false),
  sourceUpdatedAt: timestamp("source_updated_at", { withTimezone: true }),
  createdAt: createdAt(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const placeSources = pgTable("place_sources", {
  id: id(),
  placeId: text("place_id").notNull(),
  provider: text("provider").notNull(),
  sourceId: text("source_id").notNull(),
  sourceUrl: text("source_url"),
  fetchedAt: timestamp("fetched_at", { withTimezone: true }).defaultNow().notNull(),
  metadata: jsonb("metadata"),
});

export const placeImages = pgTable("place_images", {
  id: id(),
  placeId: text("place_id").notNull(),
  provider: text("provider").notNull(),
  imageUrl: text("image_url").notNull(),
  originUrl: text("origin_url"),
  copyright: text("copyright"),
  usageCondition: text("usage_condition"),
  fetchedAt: timestamp("fetched_at", { withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
});

// ── §19.1.9 TourAPI 전용 캐시 ────────────────────────────────────────────

export const tourSearchCache = pgTable("tour_search_cache", {
  cacheKey: id("cache_key"),
  normalizedQuery: text("normalized_query").notNull(),
  areaCode: text("area_code"),
  sigunguCode: text("sigungu_code"),
  contentTypeId: text("content_type_id"),
  page: integer("page"),
  numOfRows: integer("num_of_rows"),
  results: jsonb("results").notNull(),
  fetchedAt: timestamp("fetched_at", { withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

export const tourPlaceCache = pgTable("tour_place_cache", {
  contentId: id("content_id"),
  contentTypeId: text("content_type_id"),
  rawCommon: jsonb("raw_common"),
  rawIntro: jsonb("raw_intro"),
  rawInfo: jsonb("raw_info"),
  rawImages: jsonb("raw_images"),
  rawPetTour: jsonb("raw_pet_tour"),
  fetchedAt: timestamp("fetched_at", { withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  sourceVersion: text("source_version"),
});

export const tourSearchJobs = pgTable("tour_search_jobs", {
  id: id(),
  cacheKey: text("cache_key").notNull(),
  query: text("query").notNull(),
  status: text("status").notNull(),
  priority: text("priority").notNull(),
  attempts: integer("attempts").notNull().default(0),
  createdAt: createdAt(),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  error: text("error"),
});

// ── 콘텐츠 품질/기타 캐시 ───────────────────────────────────────────────

export const contentModeration = pgTable("content_moderation", {
  sourceId: id("source_id"),
  status: text("status").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const tripTipsCache = pgTable("trip_tips_cache", {
  key: id("key"),
  tips: jsonb("tips").notNull(),
  fetchedAt: timestamp("fetched_at", { withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

// ── §36 사용자 행동 이벤트 ───────────────────────────────────────────────

export const userEvents = pgTable("user_events", {
  id: id(),
  userId: text("user_id"),
  sessionId: text("session_id"),
  eventType: text("event_type").notNull(),
  itineraryId: text("itinerary_id"),
  destination: text("destination"),
  metadata: jsonb("metadata"),
  createdAt: createdAt(),
});

// ── §45 Content AI ──────────────────────────────────────────────────────

export const contentJobs = pgTable("content_jobs", {
  id: id(),
  tripId: text("trip_id").notNull(),
  type: text("type").notNull(), // blog|youtube|shorts|bundle
  status: text("status").notNull(),
  requestedBy: text("requested_by").notNull(),
  priority: text("priority").notNull(), // manual|scheduled|recommended
  options: jsonb("options"), // { blog, youtube, shorts, shortCount } — §42.2 bundle 선택
  progress: real("progress"),
  error: text("error"),
  createdAt: createdAt(),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const travelContentBriefs = pgTable("travel_content_briefs", {
  id: id(),
  tripId: text("trip_id").notNull(),
  version: integer("version").notNull().default(1),
  brief: jsonb("brief").notNull(),
  createdAt: createdAt(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const blogContents = pgTable("blog_contents", {
  id: id(),
  tripId: text("trip_id").notNull(),
  jobId: text("job_id").notNull(),
  title: text("title").notNull(),
  slug: text("slug").notNull(),
  markdown: text("markdown"),
  html: text("html"),
  seo: jsonb("seo"),
  status: text("status").notNull(),
  createdAt: createdAt(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const youtubeContents = pgTable("youtube_contents", {
  id: id(),
  tripId: text("trip_id").notNull(),
  jobId: text("job_id").notNull(),
  title: text("title").notNull(),
  script: jsonb("script"),
  scenePlan: jsonb("scene_plan"),
  description: text("description"),
  tags: jsonb("tags"),
  thumbnailData: jsonb("thumbnail_data"),
  videoAssetUrl: text("video_asset_url"),
  youtubeVideoId: text("youtube_video_id"),
  status: text("status").notNull(),
  createdAt: createdAt(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const shortsContents = pgTable("shorts_contents", {
  id: id(),
  tripId: text("trip_id").notNull(),
  jobId: text("job_id").notNull(),
  title: text("title").notNull(),
  script: jsonb("script"),
  scenePlan: jsonb("scene_plan"),
  captionData: jsonb("caption_data"),
  videoAssetUrl: text("video_asset_url"),
  youtubeVideoId: text("youtube_video_id"),
  status: text("status").notNull(),
  createdAt: createdAt(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const contentAssets = pgTable("content_assets", {
  id: id(),
  contentId: text("content_id").notNull(),
  assetType: text("asset_type").notNull(),
  provider: text("provider").notNull(),
  url: text("url").notNull(),
  metadata: jsonb("metadata"),
  createdAt: createdAt(),
});
