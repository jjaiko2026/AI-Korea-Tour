/**
 * PRD §53 관리자 권한 및 보안 — 권한 예: USER/ADMIN/EDITOR/SUPER_ADMIN.
 * 초기에는 최소한 USER와 ADMIN을 지원한다. 관리자 API는 반드시 서버에서 권한을
 * 검증한다. 역할은 Clerk publicMetadata.role에 저장한다고 가정한다.
 */
import { auth } from "@clerk/nextjs/server";

export type Role = "user" | "admin" | "editor" | "super_admin";

export async function getCurrentRole(): Promise<Role> {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.publicMetadata as { role?: Role } | undefined)?.role;
  return role ?? "user";
}

export async function isAdmin(): Promise<boolean> {
  const role = await getCurrentRole();
  return role === "admin" || role === "super_admin";
}

/** 관리자 API route handler에서 호출한다. 권한이 없으면 throw하여 502/403으로 이어진다. */
export async function requireAdmin(): Promise<void> {
  const { userId } = await auth();
  if (!userId) {
    throw new AdminAuthError("unauthenticated", 401);
  }
  if (!(await isAdmin())) {
    throw new AdminAuthError("forbidden", 403);
  }
}

export class AdminAuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "AdminAuthError";
    this.status = status;
  }
}
