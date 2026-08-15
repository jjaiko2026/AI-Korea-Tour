/**
 * PRD §19.1 TourAPI 연동 — KorService2 Provider 구현.
 * Rule 8.2: 인증키는 서버 환경변수로만 관리하고 브라우저에 노출하지 않는다 (이 파일은
 * "use server" 경계 안, 즉 API Route/Server Action 안에서만 import 되어야 한다).
 * Rule 8.5: 모든 호출은 Cache → Rate Limiter를 통과한다.
 */
import { withRateLimit, RATE_LIMITS } from "@/lib/search/rate-limiter";
import {
  normalizeTourItem,
  normalizeFestival,
  normalizeStay,
  mergeIntro,
  mergeDescription,
  mergePetTour,
  type RawTourItem,
} from "./normalize";
import type {
  TourProvider,
  TourPlaceSearchInput,
  NearbySearchInput,
  KeywordSearchInput,
  FestivalSearchInput,
  StaySearchInput,
  PlaceCommon,
  PlaceIntro,
  PlaceInfo,
  ImageOptions,
  PetTourInfo,
} from "../types";

const BASE_URL = process.env.TOUR_API_BASE_URL ?? "https://apis.data.go.kr/B551011/KorService2";
const SERVICE_KEY = process.env.TOUR_API_SERVICE_KEY;

type KorServiceResponse<T> = {
  response: { body: { items: { item: T | T[] | "" }; totalCount: number } };
};

async function callTourApi<T>(endpoint: string, params: Record<string, string | number | undefined>): Promise<T[]> {
  if (!SERVICE_KEY) {
    throw new Error("TOUR_API_SERVICE_KEY is not set (see .env.example)");
  }

  const query = new URLSearchParams({
    serviceKey: SERVICE_KEY,
    MobileOS: "ETC",
    MobileApp: "TripTubeAI",
    _type: "json",
    numOfRows: "50",
  });
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) query.set(key, String(value));
  }

  return withRateLimit(RATE_LIMITS.tourApi, async () => {
    const res = await fetch(`${BASE_URL}${endpoint}?${query.toString()}`, {
      next: { revalidate: 0 },
    });
    if (!res.ok) {
      throw new Error(`TourAPI ${endpoint} failed: ${res.status}`);
    }
    const json = (await res.json()) as KorServiceResponse<T>;
    const items = json.response?.body?.items?.item;
    if (!items) return [];
    return Array.isArray(items) ? items : [items];
  });
}

export const korService2Provider: TourProvider = {
  async searchPlaces(input: TourPlaceSearchInput) {
    const items = await callTourApi<RawTourItem>("/areaBasedList2", {
      areaCode: input.areaCode,
      sigunguCode: input.sigunguCode,
      contentTypeId: input.contentTypeId,
      pageNo: input.page,
      numOfRows: input.numOfRows,
    });
    return items.map(normalizeTourItem);
  },

  async searchNearby(input: NearbySearchInput) {
    const items = await callTourApi<RawTourItem>("/locationBasedList2", {
      mapX: input.longitude,
      mapY: input.latitude,
      radius: input.radiusMeters ?? 2000,
      contentTypeId: input.contentTypeId,
    });
    return items.map(normalizeTourItem);
  },

  async searchKeyword(input: KeywordSearchInput) {
    const items = await callTourApi<RawTourItem>("/searchKeyword2", {
      keyword: input.keyword,
      areaCode: input.areaCode,
      contentTypeId: input.contentTypeId,
    });
    return items.map(normalizeTourItem);
  },

  async searchEvents(input: FestivalSearchInput) {
    const items = await callTourApi<Parameters<typeof normalizeFestival>[0]>("/searchFestival2", {
      areaCode: input.areaCode,
      eventStartDate: input.startDate,
      eventEndDate: input.endDate,
    });
    return items.map(normalizeFestival);
  },

  async searchStays(input: StaySearchInput) {
    const items = await callTourApi<RawTourItem>("/searchStay2", {
      areaCode: input.areaCode,
      sigunguCode: input.sigunguCode,
    });
    return items.map(normalizeStay);
  },

  async getPlaceCommon(contentId: string): Promise<PlaceCommon> {
    const [raw] = await callTourApi<RawTourItem & { overview?: string }>("/detailCommon2", {
      contentId,
      defaultYN: "Y",
      overviewYN: "Y",
    });
    if (!raw) throw new Error(`Place not found: ${contentId}`);
    return mergeDescription(normalizeTourItem(raw), raw);
  },

  async getPlaceIntro(contentId: string, contentTypeId: string): Promise<PlaceIntro> {
    const [raw] = await callTourApi<Record<string, string>>("/detailIntro2", { contentId, contentTypeId });
    const merged = mergeIntro({ id: `tour_${contentId}`, source: "TOUR_API", name: "" }, raw ?? {});
    return { operation: merged.operation, price: merged.price };
  },

  async getPlaceInfo(contentId: string, contentTypeId: string): Promise<PlaceInfo[]> {
    const items = await callTourApi<{ infoname: string; infotext: string }>("/detailInfo2", {
      contentId,
      contentTypeId,
    });
    return items.map((item) => ({ title: item.infoname, value: item.infotext }));
  },

  async getPlaceImages(contentId: string, options?: ImageOptions) {
    const items = await callTourApi<{ originimgurl: string; smallimageurl?: string; imgname?: string }>(
      "/detailImage2",
      { contentId, numOfRows: options?.numOfRows },
    );
    return items.map((item) => ({
      imageUrl: item.originimgurl,
      originUrl: item.originimgurl,
      provider: "TOUR_API" as const,
      copyright: item.imgname,
    }));
  },

  async getPetTour(contentId: string, contentTypeId: string): Promise<PetTourInfo> {
    const [raw] = await callTourApi<{ acmpyTypeCd?: string; etcAcmpyInfo?: string }>("/detailPetTour2", {
      contentId,
      contentTypeId,
    });
    return { acceptable: Boolean(raw), notes: raw?.etcAcmpyInfo };
  },

  async getAreaCodes(parentAreaCode?: string) {
    const items = await callTourApi<{ code: string; name: string }>("/areaCode2", { areaCode: parentAreaCode });
    return items;
  },

  async getCategoryCodes(input: { cat1?: string; cat2?: string }) {
    const items = await callTourApi<{ code: string; name: string }>("/categoryCode2", {
      cat1: input.cat1,
      cat2: input.cat2,
    });
    return items;
  },
};
