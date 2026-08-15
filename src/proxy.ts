/**
 * PRD §34.2 관리자 인증은 일반 사용자 인증과 분리된 권한 검사를 적용한다.
 * §53: 관리자 API는 반드시 서버에서 권한을 검증한다 — 이 proxy(구 middleware)는
 * 1차 라우팅 가드이며, 최종 검증은 각 admin 페이지/route handler의 requireAdmin()에서 수행한다.
 */
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/plan/example",
  "/api/chat",
  "/api/webhooks(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/(api|trpc)(.*)"],
};
