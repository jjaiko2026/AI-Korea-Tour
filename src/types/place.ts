/**
 * PRD §7.2 — TourAPI 원본을 직접 노출하지 않고 정규화하는 Internal Place Model.
 */
export type PlaceProvider = "TOUR_API" | "GOOGLE_MAPS" | "NAVER" | "OTHER";

export type PlaceSource = {
  provider: PlaceProvider;
  sourceId: string;
  sourceUrl?: string;
  fetchedAt?: string;
};

export type PlaceImage = {
  imageUrl: string;
  originUrl?: string;
  copyright?: string;
  usageCondition?: string;
  provider: "TOUR_API" | "OTHER";
};

export type Place = {
  id: string;
  source: PlaceProvider;
  sourceId?: string;
  contentTypeId?: string;
  name: string;
  category?: {
    main?: string;
    middle?: string;
    sub?: string;
  };
  address?: {
    road?: string;
    jibun?: string;
    zipCode?: string;
  };
  location?: {
    latitude: number;
    longitude: number;
  };
  contact?: {
    phone?: string;
  };
  operation?: {
    hours?: string;
    closedDays?: string;
    usageSeason?: string;
  };
  price?: {
    adult?: string;
    child?: string;
    notes?: string;
  };
  description?: string;
  images?: PlaceImage[];
  petFriendly?: boolean;
  sources?: PlaceSource[];
  sourceUpdatedAt?: string;
};

export type TourEvent = {
  id: string;
  source: "TOUR_API" | "OTHER";
  sourceId?: string;
  title: string;
  startDate?: string;
  endDate?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  description?: string;
  imageUrl?: string;
};

export type Accommodation = {
  id: string;
  source: "TOUR_API" | "OTHER";
  sourceId?: string;
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  description?: string;
  images?: PlaceImage[];
};
