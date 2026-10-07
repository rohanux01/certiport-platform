import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sendNotification, type NotificationEventKey } from "@/lib/notifications";
import { can, type Role } from "@/lib/permissions";
import { z } from "zod";

const TestNotificationSchema = z.object({
  eventKey: z.enum([
    "certificate-issued",
    "card-pending",
    "candidate-approved",
    "changes-requested",
    "access-granted",
  ]),
  recipientEmail: z.string().email().optional().nullable(),
  recipientPhone: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as any).role as Role;
    if (!can(role, "manage-templates")) {
      return NextResponse.json(
        { error: "Forbidden: Org Admin permissions required to test notifications." },
        { status: 403 }
      );
    }

    const organizationId = (session.user as any).organizationId as string;
    const actorId = (session.user as any).id as string;
    const actorName = (session.user as any).name || "Administrator";
    const actorEmail = (session.user as any).email || "admin@gttdata.ai";

    const body = await req.json();
    const parsed = TestNotificationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { eventKey, recipientEmail, recipientPhone } = parsed.data;
    const targetEmail = recipientEmail || actorEmail;
    const targetPhone = recipientPhone || "+15550192834";

    const sampleData: Record<NotificationEventKey, Record<string, any>> = {
      "certificate-issued": {
        courseName: "Advanced Cybersecurity Compliance",
        certificateRef: "MER/2026/CYBR/992812",
        publicId: "sample-cert-verify-id",
        issueDate: new Date(),
      },
      "card-pending": {
        candidateName: "Jordan Vance",
        refNumber: "CR-2026-0042",
        cardRequestId: "sample-card-req-id",
        submittedBy: actorName,
      },
      "candidate-approved": {
        candidateName: "Elena Rostova",
        refNumber: "CR-2026-0043",
        cardRequestId: "sample-card-req-id",
      },
      "changes-requested": {
        candidateName: "Marcus Sterling",
        refNumber: "CR-2026-0044",
        cardRequestId: "sample-card-req-id",
        comment: "Photo background must be plain white, not blue.",
      },
      "access-granted": {
        permission: "bulk-upload",
        reason: "Test elevation for notification dispatch verification",
        grantedByName: actorName,
        expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000),
      },
    };

    const dispatchResult = await sendNotification({
      organizationId,
      actorId,
      eventKey,
      recipientEmail: targetEmail,
      recipientPhone: targetPhone,
      recipientName: actorName,
      data: sampleData[eventKey],
    });

    return NextResponse.json({
      success: true,
      result: dispatchResult,
      message: `Test notification for "${eventKey}" processed.`,
    });
  } catch (err: any) {
    console.error("Test notification error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to process test notification" },
      { status: 500 }
    );
  }
}
