/**
 * TripTubeAI 연동 — 이 AI-Korea-Tour 저장소는 별도로 존재하는 TripTubeAI
 * 웹앱(https://triptube-ai.vercel.app, 별도 GitHub 저장소)의 API로부터 데이터를
 * 받아오는 소비자(consumer)로 동작할 예정이다. 실제 엔드포인트/응답 스펙은 아직
 * 확정되지 않아, 다른 Provider(TourProvider 등)와 동일한 패턴으로 인터페이스만
 * 먼저 준비해둔다 — 나중에 TripTubeAI 쪽 API 명세가 정해지면 이 파일에만 구체
 * 메서드(fetchItineraries 등)를 추가하고, 호출부(getSources 등)는 그대로 둔다.
 *
 * Rule 8.6/8.8과 동일한 원칙: 설정이 없으면 데이터를 지어내지 않고 명시적으로
 * 실패한다.
 */

export type TripTubeAIRequestInit = {
  method?: "GET" | "POST";
  query?: Record<string, string | number | undefined>;
  body?: unknown;
};

/**
 * 범용 클라이언트 인터페이스. 구체적인 리소스(일정/장소/사용자 등)가 확정되면
 * `fetchItineraries(): Promise<Itinerary[]>`처럼 타입이 있는 메서드를 추가한다.
 * 그 전까지는 이 저수준 `request`만으로 스파이크/프로토타이핑이 가능하다.
 */
export interface TripTubeAIClient {
  request<T>(path: string, init?: TripTubeAIRequestInit): Promise<T>;
}

const BASE_URL = process.env.TRIPTUBEAI_API_BASE_URL;
const API_KEY = process.env.TRIPTUBEAI_API_KEY;

export const httpTripTubeAIClient: TripTubeAIClient = {
  async request<T>(path: string, init: TripTubeAIRequestInit = {}): Promise<T> {
    if (!BASE_URL) {
      throw new Error(
        "TRIPTUBEAI_API_BASE_URL is not set. TripTubeAI 연동 스펙이 확정되면 .env에 설정하세요 (see .env.example).",
      );
    }

    const url = new URL(path, BASE_URL);
    for (const [key, value] of Object.entries(init.query ?? {})) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }

    const res = await fetch(url, {
      method: init.method ?? "GET",
      headers: {
        "Content-Type": "application/json",
        ...(API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {}),
      },
      body: init.body ? JSON.stringify(init.body) : undefined,
    });

    if (!res.ok) {
      throw new Error(`TripTubeAI API ${path} failed: ${res.status}`);
    }

    return (await res.json()) as T;
  },
};
