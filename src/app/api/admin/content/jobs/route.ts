/**
 * PRD §46 Content API — POST /api/admin/content/jobs. Rule 10: 콘텐츠 생성은
 * 관리자 영역에서만 시작한다.
 */
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { requireAdmin, AdminAuthError } from "@/lib/admin/auth";
import { createContentJob } from "@/lib/content/job-runner";

const requestSchema = z.object({
  tripId: z.string(),
  type: z.enum(["blog", "youtube", "shorts", "bundle"]),
  options: z.object({
    blog: z.boolean().optional(),
    youtube: z.boolean().optional(),
    shorts: z.boolean().optional(),
    shortCount: z.number().int().min(1).max(10).optional(),
  }),
});

export async function POST(req: Request) {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }

  const { userId } = await auth();
  const parsed = requestSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const jobId = await createContentJob({
    tripId: parsed.data.tripId,
    type: parsed.data.type,
    requestedBy: userId!,
    options: parsed.data.options,
  });

  return NextResponse.json({ jobId, status: "queued" }, { status: 202 });
}
