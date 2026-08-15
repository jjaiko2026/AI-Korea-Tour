# TripTube AI

> 유튜브·블로그에 흩어진 여행 정보를 AI가 대신 검색·정리해서, 대화 또는 폼 입력
> 한 번으로 완성된 여행 일정을 만들어주는 웹앱.
>
> 이 저장소는 `TripTubeAI_PRD_v2.6.md`의 아키텍처를 그대로 반영한 스캐폴드입니다.
> 핵심 검색/캐시/큐/랭킹/2-opt 로직은 실제로 동작하며, 외부 API(YouTube·Naver·
> TourAPI·Clerk·LLM)는 Provider 인터페이스로 추상화되어 있어 `.env`에 실제 키를
> 채우면 그대로 연동됩니다. Content AI(Blog/YouTube/Shorts) 파이프라인은 PRD의
> 멀티 에이전트 구조를 그대로 구현했지만, 실제 서비스 트래픽 기준의 튜닝/워커
> 분리는 되어 있지 않습니다(아래 "스캐폴드 범위" 참고).

## 빠른 시작

```bash
npm install
cp .env.example .env.local   # 값 채우기
npm run db:generate          # Drizzle 마이그레이션 생성
npm run db:migrate           # Neon Postgres에 스키마 적용
npm run dev
```

## PRD 섹션 ↔ 코드 매핑

| PRD 섹션 | 내용 | 코드 위치 |
|---|---|---|
| §5, §6 | 사용자 흐름 / 랜딩·인증·폼·챗봇 | `src/app/page.tsx`, `src/app/plan/*`, `src/components/trip/*` |
| §7-12 | SearchPlan / 검색어 정규화 / Cache / Dedup / Queue / Rate Limiter | `src/lib/search/*` |
| §13-14 | YouTube API 정책 | `src/lib/providers/youtube-provider.ts` |
| §15-16 | 랭킹 / 광고성·복제 감점 | `src/lib/trip/ranking.ts` |
| §19 | AI 일정 생성 순서(1~17단계) | `src/lib/trip/generate-itinerary.ts` |
| §19.1, §63 | TourAPI(KorService2) 연동 | `src/lib/providers/tour/*`, `src/app/api/tour/*` |
| §20 | 지도/2-opt 동선 최적화 | `src/lib/trip/route-optimizer.ts` |
| §21 | 결과 화면 | `src/app/plan/result/[id]/page.tsx` |
| §22, §45 | 데이터 모델 전체 | `src/db/schema.ts` |
| §23, §37-38 | 앱 내부 타입 / Trip Data Contract / Content Brief | `src/types/*` |
| §34-35, §53-54 | Admin 인증·권한·대시보드·분석 | `src/proxy.ts`, `src/lib/admin/auth.ts`, `src/app/admin/*` |
| §36 | 사용자 행동 이벤트 | `src/app/api/events/route.ts` |
| §39-45 | Content AI(Blog/YouTube/Shorts) 파이프라인 / Content Job | `src/lib/content/*`, `src/app/api/admin/content/*` |
| §46, §46.1 | 내부/TourAPI API 경계 | `src/app/api/trips/*`, `src/app/api/tour/*`, `src/app/api/admin/content/*` |
| §48, §40.4 | Blog Publisher / Video Provider 추상화 | `src/lib/providers/blog-publisher.ts`, `src/lib/providers/video-provider.ts` |

## 아키텍처 원칙 (PRD §7.1, §29, §60)

- **사용자 수 ≠ 외부 API 호출 수**: 모든 검색은 `SearchPlan → Cache → Dedup Lock →
  Queue → Rate Limiter → Provider` 순서를 거칩니다 (`src/lib/search/orchestrator.ts`).
- **Provider 계층 경계**: TourAPI/YouTube/Naver 필드명은 각 Provider 파일 안에서만
  해석되고, 애플리케이션 코드는 `src/types`의 Internal Model만 사용합니다.
- **사용자 데이터 ≠ 콘텐츠 자동 발행**: `/admin/content/*`에서만 Content Job을
  생성할 수 있고(Rule 9, 10), 발행은 관리자 승인 이후 별도 단계입니다.

## TripTubeAI 연동 (별도 저장소/웹앱)

이 저장소(AI-Korea-Tour)는 이미 별도로 존재하는 TripTubeAI 웹앱/저장소와 나중에
합쳐질 예정입니다. TripTubeAI 쪽 API에서 데이터를 받아와 이 저장소 위에서 확장하는
구조로, 실제 데이터 종류(일정/장소/사용자 등)와 엔드포인트 스펙은 아직 미정입니다.

- 연동 인터페이스: `src/lib/integrations/triptubeai/client.ts` (다른 Provider와
  동일한 패턴 — 설정이 없으면 명시적으로 실패하고 데이터를 지어내지 않음)
- 설정: `.env.example`의 `TRIPTUBEAI_API_BASE_URL` / `TRIPTUBEAI_API_KEY`
- TripTubeAI의 실제 API 명세가 정해지면 `client.ts`에 구체 메서드
  (`fetchItineraries()` 등)를 추가하면 됩니다.

## 스캐폴드 범위 — 실제 서비스로 가기 전 채워야 할 것

- **외부 API 키**: `.env.example`의 모든 키가 비어 있으면 각 Provider는 명시적
  에러를 던집니다(가짜 데이터로 채우지 않음, Rule 8.6/8.8과 동일한 원칙).
- **Job Worker 분리**: `search_jobs`/`tour_search_jobs`/`content_jobs`는 테이블과
  claim 로직(`src/lib/search/queue.ts`)까지 구현되어 있지만, 실제 프로덕션에서는
  이를 폴링하는 별도 워커 프로세스(cron/queue consumer)로 분리해야 합니다. 현재
  `createContentJob`은 요청 컨텍스트 안에서 바로 실행합니다.
- **영상 렌더링 / Blog Publisher**: `stubVideoProvider`, `stubBlogPublisher`는
  실제 서비스 연동 전까지 명시적으로 실패합니다(Rule 17 Provider 추상화 유지).
- **Admin 역할 관리**: `src/lib/admin/auth.ts`는 Clerk `publicMetadata.role`을
  가정합니다 — Clerk Dashboard 또는 관리자 초대 플로우에서 role을 설정해야 합니다.
- **Rate Limiter**: 현재 프로세스 내 메모리 기반입니다. 다중 인스턴스 배포 시
  Redis/Postgres 기반 카운터로 교체하되 `withRateLimit` 인터페이스는 유지하세요.

## 스크립트

| 명령 | 설명 |
|---|---|
| `npm run dev` | Turbopack 개발 서버 |
| `npm run build` / `npm run start` | 프로덕션 빌드/실행 |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:generate` / `db:migrate` / `db:studio` | Drizzle 마이그레이션/스튜디오 |
