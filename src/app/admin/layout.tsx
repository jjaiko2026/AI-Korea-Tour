/**
 * PRD §34.2 관리자 전용 경로 — /admin/dashboard, /admin/users, /admin/itineraries,
 * /admin/analytics, /admin/content/*, /admin/settings.
 */
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { isAdmin } from "@/lib/admin/auth";

const NAV = [
  { href: "/admin/dashboard", label: "대시보드" },
  { href: "/admin/users", label: "사용자" },
  { href: "/admin/itineraries", label: "여행 일정" },
  { href: "/admin/analytics", label: "분석" },
  { href: "/admin/content/jobs", label: "콘텐츠 Job" },
  { href: "/admin/content/blog", label: "Blog" },
  { href: "/admin/content/youtube", label: "YouTube" },
  { href: "/admin/content/shorts", label: "Shorts" },
  { href: "/admin/settings", label: "설정" },
] as const;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect("/");
  if (!(await isAdmin())) redirect("/");

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 shrink-0 border-r border-slate-200 p-4 dark:border-slate-800">
        <p className="mb-6 px-2 text-sm font-semibold text-slate-500">TripTube AI Admin</p>
        <nav className="flex flex-col gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
