/**
 * PRD §19.1.8 / Rule 8.3 — TourAPI 원본 응답을 애플리케이션 전체에 직접 전달하지 않고
 * Internal Place Model로 정규화한다. KorService2 필드명 해석은 이 파일에만 존재해야 한다.
 */
import type { Place, PlaceImage, TourEvent, Accommodation } from "@/types";

/** KorService2 areaBasedList2 / searchKeyword2 / locationBasedList2 공통 item 필드 (일부) */
export type RawTourItem = {
  contentid: string;
  contenttypeid: string;
  title: string;
  addr1?: string;
  addr2?: string;
  zipcode?: string;
  mapx?: string; // 경도
  mapy?: string; // 위도
  tel?: string;
  firstimage?: string;
  firstimage2?: string;
  cat1?: string;
  cat2?: string;
  cat3?: string;
  modifiedtime?: string;
};

export type RawDetailIntro = Record<string, string | undefined>;
export type RawDetailInfo = { infoname: string; infotext: string }[];

export function normalizeTourItem(raw: RawTourItem): Place {
  const latitude = raw.mapy ? Number(raw.mapy) : undefined;
  const longitude = raw.mapx ? Number(raw.mapx) : undefined;

  const images: PlaceImage[] = [raw.firstimage, raw.firstimage2]
    .filter((url): url is string => Boolean(url))
    .map((imageUrl) => ({ imageUrl, provider: "TOUR_API" as const }));

  return {
    id: `tour_${raw.contentid}`,
    source: "TOUR_API",
    sourceId: raw.contentid,
    contentTypeId: raw.contenttypeid,
    name: raw.title,
    category: { main: raw.cat1, middle: raw.cat2, sub: raw.cat3 },
    address: { road: raw.addr1, jibun: raw.addr2, zipCode: raw.zipcode },
    location:
      latitude !== undefined && longitude !== undefined && !Number.isNaN(latitude) && !Number.isNaN(longitude)
        ? { latitude, longitude }
        : undefined,
    contact: raw.tel ? { phone: raw.tel } : undefined,
    images: images.length > 0 ? images : undefined,
    sources: [{ provider: "TOUR_API", sourceId: raw.contentid, fetchedAt: new Date().toISOString() }],
    sourceUpdatedAt: raw.modifiedtime,
  };
}

/** detailIntro2 응답을 operation/price로 병합한다. contentTypeId별 필드명이 달라 매핑 테이블을 사용한다. */
export function mergeIntro(place: Place, intro: RawDetailIntro): Place {
  return {
    ...place,
    operation: {
      hours: intro.usetime ?? intro.playtime ?? intro.opentimefood,
      closedDays: intro.restdate ?? intro.restdatefood,
      usageSeason: intro.useseason,
    },
    price: {
      adult: intro.usefee ?? intro.admissionfee,
      notes: intro.parking ? `주차: ${intro.parking}` : undefined,
    },
  };
}

export function mergeDescription(place: Place, common: { overview?: string }): Place {
  return { ...place, description: common.overview };
}

export function mergePetTour(place: Place, petTour: { acceptable: boolean }): Place {
  return { ...place, petFriendly: petTour.acceptable };
}

export function normalizeFestival(raw: {
  contentid: string;
  title: string;
  eventstartdate?: string;
  eventenddate?: string;
  addr1?: string;
  mapx?: string;
  mapy?: string;
  overview?: string;
  firstimage?: string;
}): TourEvent {
  return {
    id: `event_${raw.contentid}`,
    source: "TOUR_API",
    sourceId: raw.contentid,
    title: raw.title,
    startDate: raw.eventstartdate,
    endDate: raw.eventenddate,
    address: raw.addr1,
    latitude: raw.mapy ? Number(raw.mapy) : undefined,
    longitude: raw.mapx ? Number(raw.mapx) : undefined,
    description: raw.overview,
    imageUrl: raw.firstimage,
  };
}

export function normalizeStay(raw: RawTourItem): Accommodation {
  return {
    id: `stay_${raw.contentid}`,
    source: "TOUR_API",
    sourceId: raw.contentid,
    name: raw.title,
    address: raw.addr1,
    latitude: raw.mapy ? Number(raw.mapy) : undefined,
    longitude: raw.mapx ? Number(raw.mapx) : undefined,
    images: raw.firstimage ? [{ imageUrl: raw.firstimage, provider: "TOUR_API" }] : undefined,
  };
}
