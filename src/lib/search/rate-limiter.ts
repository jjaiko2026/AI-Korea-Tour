/**
 * PRD §12 API Rate Limiter — 모든 외부 API 호출은 중앙 Rate Limiter를 통과한다. (Rule 5)
 * 프로세스 내 sliding-window 카운터. 다중 인스턴스 배포 시에는 Postgres/Redis 기반
 * 카운터로 교체하되 인터페이스는 동일하게 유지한다.
 */
type WindowState = { count: number; windowStartedAt: number };

const windows = new Map<string, WindowState>();
const inflight = new Map<string, number>();

export type RateLimitConfig = {
  key: string;
  maxPerWindow: number;
  windowMs: number;
  maxConcurrent: number;
};

export class RateLimitExceededError extends Error {
  constructor(key: string) {
    super(`Rate limit exceeded for "${key}"`);
    this.name = "RateLimitExceededError";
  }
}

export async function withRateLimit<T>(config: RateLimitConfig, fn: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const state = windows.get(config.key) ?? { count: 0, windowStartedAt: now };

  if (now - state.windowStartedAt > config.windowMs) {
    state.count = 0;
    state.windowStartedAt = now;
  }

  const currentInflight = inflight.get(config.key) ?? 0;

  if (state.count >= config.maxPerWindow || currentInflight >= config.maxConcurrent) {
    throw new RateLimitExceededError(config.key);
  }

  state.count += 1;
  windows.set(config.key, state);
  inflight.set(config.key, currentInflight + 1);

  try {
    return await fn();
  } finally {
    inflight.set(config.key, Math.max(0, (inflight.get(config.key) ?? 1) - 1));
  }
}

/** §12 / §58 환경변수 기반 기본 설정값. 실제 quota는 Google Cloud/공공데이터포털 설정에 맞춰 조정한다. */
export const RATE_LIMITS = {
  youtube: {
    key: "youtube",
    maxPerWindow: Number(process.env.YOUTUBE_DAILY_SEARCH_LIMIT ?? 200),
    windowMs: 24 * 60 * 60 * 1000,
    maxConcurrent: Number(process.env.YOUTUBE_MAX_CONCURRENT_JOBS ?? 3),
  },
  tourApi: {
    key: "tour_api",
    maxPerWindow: Number(process.env.TOUR_API_DAILY_LIMIT ?? 1000),
    windowMs: 24 * 60 * 60 * 1000,
    maxConcurrent: Number(process.env.TOUR_API_MAX_CONCURRENT_JOBS ?? 5),
  },
  naver: {
    key: "naver",
    maxPerWindow: Number(process.env.NAVER_DAILY_SEARCH_LIMIT ?? 500),
    windowMs: 24 * 60 * 60 * 1000,
    maxConcurrent: Number(process.env.NAVER_MAX_CONCURRENT_JOBS ?? 3),
  },
} as const satisfies Record<string, RateLimitConfig>;
