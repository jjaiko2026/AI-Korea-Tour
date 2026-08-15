/**
 * PRD §46 Content API — GET /api/admin/content/jobs/:jobId
 */
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireAdmin, AdminAuthError } from "@/lib/admin/auth";
import { db, schema } from "@/db";

export async function GET(_req: Request, { params }: { params: Promise<{ jobId: string }> }) {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }

  const { jobId } = await params;
  const [job] = await db.select().from(schema.contentJobs).where(eq(schema.contentJobs.id, jobId)).limit(1);
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

  return NextResponse.json({ job });
}
