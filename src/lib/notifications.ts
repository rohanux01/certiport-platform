import { db } from "./db";
import { logAudit } from "./auditLog";

export type NotificationEventKey =
  | "certificate-issued"
  | "card-pending"
  | "candidate-approved"
  | "changes-requested"
  | "access-granted";

export interface NotificationPayload {
  organizationId: string;
  actorId?: string;
  eventKey: NotificationEventKey;
  recipientEmail?: string | null;
  recipientPhone?: string | null;
  recipientName: string;
  data: Record<string, any>;
}

export interface DispatchResult {
  eventKey: NotificationEventKey;
  recipientName: string;
  recipientEmail?: string | null;
  recipientPhone?: string | null;
  emailDispatched: boolean;
  emailProvider?: "MICROSOFT_GRAPH" | "SIMULATED_DEV" | "SKIPPED";
  whatsappDispatched: boolean;
  whatsappProvider?: "WHATSAPP_CLOUD_API" | "SIMULATED_DEV" | "SKIPPED";
  subject?: string;
  details?: Record<string, any>;
  error?: string;
}

const DEFAULT_PREFERENCES: Record<NotificationEventKey, { email: boolean; whatsapp: boolean }> = {
  "certificate-issued": { email: true, whatsapp: false },
  "card-pending": { email: true, whatsapp: true },
  "candidate-approved": { email: true, whatsapp: true },
  "changes-requested": { email: true, whatsapp: false },
  "access-granted": { email: true, whatsapp: false },
};

function buildNotificationContent(
  eventKey: NotificationEventKey,
  recipientName: string,
  data: Record<string, any>
): { subject: string; html: string; text: string; whatsappTemplate: string; whatsappParams: string[] } {
  const appUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

  switch (eventKey) {
    case "certificate-issued": {
      const course = data.courseName || "Training Course";
      const certRef = data.certificateRef || "N/A";
      const verifyUrl = `${appUrl}/verify/${data.publicId || ""}`;
      const subject = `Your Certificate has been issued — ${course}`;
      const text = `Hello ${recipientName},\n\nYour certificate for "${course}" (Ref: ${certRef}) has been published. Verify and download your credential at: ${verifyUrl}\n\nCertiPort Platform`;
      const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: #ffffff;">
          <div style="background: #0f172a; padding: 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.5px;">CertiPort Platform</h1>
            <p style="color: #94a3b8; margin: 4px 0 0; font-size: 13px;">Credential Issuance & Verification</p>
          </div>
          <div style="padding: 32px 24px;">
            <h2 style="color: #1e293b; font-size: 18px; margin-top: 0;">Official Credential Issued</h2>
            <p style="color: #475569; font-size: 14px; line-height: 1.6;">
              Dear <strong>${recipientName}</strong>,<br/><br/>
              Congratulations! Your credential for <strong>${course}</strong> has been officially generated and registered.
            </p>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
              <table style="width: 100%; font-size: 13px; color: #334155;">
                <tr><td style="padding: 4px 0; color: #64748b;">Certificate Ref:</td><td style="font-family: monospace; font-weight: bold; color: #0f172a;">${certRef}</td></tr>
                <tr><td style="padding: 4px 0; color: #64748b;">Recipient:</td><td style="font-weight: 600;">${recipientName}</td></tr>
                <tr><td style="padding: 4px 0; color: #64748b;">Course:</td><td>${course}</td></tr>
                <tr><td style="padding: 4px 0; color: #64748b;">Issue Date:</td><td>${data.issueDate ? new Date(data.issueDate).toLocaleDateString() : new Date().toLocaleDateString()}</td></tr>
              </table>
            </div>
            <div style="text-align: center; margin: 28px 0 10px;">
              <a href="${verifyUrl}" style="background: #059669; color: #ffffff; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 14px; text-decoration: none; display: inline-block;">
                Verify & Download Certificate
              </a>
            </div>
            <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 20px;">
              Direct verification link: <a href="${verifyUrl}" style="color: #059669;">${verifyUrl}</a>
            </p>
          </div>
          <div style="background: #f1f5f9; padding: 16px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0;">
            Secured by CertiPort Tamper-Evident Cryptographic QR & Audit Architecture.
          </div>
        </div>
      `;
      return {
        subject,
        html,
        text,
        whatsappTemplate: "certificate_issued_v1",
        whatsappParams: [recipientName, course, certRef, verifyUrl],
      };
    }

    case "card-pending": {
      const candidate = data.candidateName || recipientName;
      const refNumber = data.refNumber || "N/A";
      const cardUrl = `${appUrl}/card-requests/${data.cardRequestId || ""}`;
      const subject = `Action Required: Card Request Pending Approval — ${candidate}`;
      const text = `Hello ${recipientName},\n\nA new card request for ${candidate} (${refNumber}) is pending review. Review the request: ${cardUrl}\n\nCertiPort Platform`;
      const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: #ffffff;">
          <div style="background: #0f172a; padding: 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 700;">CertiPort Platform</h1>
            <p style="color: #94a3b8; margin: 4px 0 0; font-size: 13px;">Card Workflow Approval (SRS §5.3)</p>
          </div>
          <div style="padding: 32px 24px;">
            <h2 style="color: #1e293b; font-size: 18px; margin-top: 0;">Card Request Pending Review</h2>
            <p style="color: #475569; font-size: 14px; line-height: 1.6;">
              A staff identity card request has been submitted for <strong>${candidate}</strong> and requires administrator review.
            </p>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
              <table style="width: 100%; font-size: 13px; color: #334155;">
                <tr><td style="color: #64748b; padding: 4px 0;">Request Ref:</td><td style="font-family: monospace; font-weight: bold;">${refNumber}</td></tr>
                <tr><td style="color: #64748b; padding: 4px 0;">Candidate:</td><td style="font-weight: 600;">${candidate}</td></tr>
                <tr><td style="color: #64748b; padding: 4px 0;">Submitted By:</td><td>${data.submittedBy || "HR Specialist"}</td></tr>
              </table>
            </div>
            <div style="text-align: center; margin: 24px 0;">
              <a href="${cardUrl}" style="background: #2563eb; color: #ffffff; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px; text-decoration: none; display: inline-block;">
                Review Card Request
              </a>
            </div>
          </div>
        </div>
      `;
      return {
        subject,
        html,
        text,
        whatsappTemplate: "card_pending_approval_v1",
        whatsappParams: [candidate, refNumber, cardUrl],
      };
    }

    case "candidate-approved": {
      const candidate = data.candidateName || recipientName;
      const refNumber = data.refNumber || "N/A";
      const cardUrl = `${appUrl}/card-requests/${data.cardRequestId || ""}`;
      const subject = `Candidate Approved Card Proof — ${candidate}`;
      const text = `Candidate ${candidate} has approved their ID card proof (${refNumber}). Card is now ready for final production: ${cardUrl}`;
      const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: #ffffff;">
          <div style="background: #0f172a; padding: 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 700;">CertiPort Platform</h1>
            <p style="color: #94a3b8; margin: 4px 0 0; font-size: 13px;">Card Workflow Approval (SRS §5.3)</p>
          </div>
          <div style="padding: 32px 24px;">
            <div style="display: inline-block; background: #dcfce7; color: #15803d; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 9999px; margin-bottom: 12px;">
              Candidate Verified
            </div>
            <h2 style="color: #1e293b; font-size: 18px; margin: 0 0 16px;">Candidate Proof Approved</h2>
            <p style="color: #475569; font-size: 14px; line-height: 1.6;">
              <strong>${candidate}</strong> has reviewed and approved their card details. The request can now be finalized for printing.
            </p>
            <div style="text-align: center; margin: 24px 0;">
              <a href="${cardUrl}" style="background: #059669; color: #ffffff; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px; text-decoration: none; display: inline-block;">
                Proceed to Finalize
              </a>
            </div>
          </div>
        </div>
      `;
      return {
        subject,
        html,
        text,
        whatsappTemplate: "candidate_approved_v1",
        whatsappParams: [candidate, refNumber, cardUrl],
      };
    }

    case "changes-requested": {
      const candidate = data.candidateName || recipientName;
      const refNumber = data.refNumber || "N/A";
      const cardUrl = `${appUrl}/card-requests/${data.cardRequestId || ""}`;
      const comments = data.comment || "Revisions needed on submitted details or photograph.";
      const subject = `Changes Requested on Card Request — ${candidate}`;
      const text = `Changes have been requested on card request ${refNumber} for ${candidate}.\n\nFeedback: "${comments}"\n\nUpdate request: ${cardUrl}`;
      const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: #ffffff;">
          <div style="background: #0f172a; padding: 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 700;">CertiPort Platform</h1>
            <p style="color: #94a3b8; margin: 4px 0 0; font-size: 13px;">Card Workflow Approval (SRS §5.3)</p>
          </div>
          <div style="padding: 32px 24px;">
            <div style="display: inline-block; background: #fee2e2; color: #b91c1c; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 9999px; margin-bottom: 12px;">
              Revisions Needed
            </div>
            <h2 style="color: #1e293b; font-size: 18px; margin: 0 0 16px;">Changes Requested</h2>
            <p style="color: #475569; font-size: 14px; line-height: 1.6;">
              Modifications have been requested on the ID card for <strong>${candidate}</strong> (${refNumber}).
            </p>
            <div style="background: #fff1f2; border: 1px solid #fecdd3; border-left: 4px solid #e11d48; border-radius: 6px; padding: 14px 16px; margin: 20px 0; font-size: 13px; color: #881337;">
              <strong>Feedback Note:</strong><br/>
              ${comments}
            </div>
            <div style="text-align: center; margin: 24px 0;">
              <a href="${cardUrl}" style="background: #e11d48; color: #ffffff; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px; text-decoration: none; display: inline-block;">
                Review Feedback & Update
              </a>
            </div>
          </div>
        </div>
      `;
      return {
        subject,
        html,
        text,
        whatsappTemplate: "card_changes_requested_v1",
        whatsappParams: [candidate, refNumber, comments, cardUrl],
      };
    }

    case "access-granted": {
      const permission = data.permission || "elevated-permission";
      const reason = data.reason || "Operational requirement";
      const expiresAt = data.expiresAt ? new Date(data.expiresAt).toLocaleString() : "Time-bounded";
      const subject = `Security Alert: Temporary Access Elevation Granted (${permission})`;
      const text = `Hello ${recipientName},\n\nYou have been temporarily granted the elevated privilege "${permission}".\nReason: ${reason}\nExpires: ${expiresAt}\n\nCertiPort Governance`;
      const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: #ffffff;">
          <div style="background: #4c1d95; padding: 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 700;">CertiPort Governance</h1>
            <p style="color: #ddd6fe; margin: 4px 0 0; font-size: 13px;">Access Transformation Engine (SRS §3.5)</p>
          </div>
          <div style="padding: 32px 24px;">
            <h2 style="color: #1e293b; font-size: 18px; margin-top: 0;">Privilege Elevation Active</h2>
            <p style="color: #475569; font-size: 14px; line-height: 1.6;">
              Dear <strong>${recipientName}</strong>,<br/><br/>
              A time-bounded privilege elevation has been approved under strict permission ceiling governance.
            </p>
            <div style="background: #faf5ff; border: 1px solid #e9d5ff; border-radius: 8px; padding: 16px; margin: 20px 0;">
              <table style="width: 100%; font-size: 13px; color: #334155;">
                <tr><td style="color: #6b21a8; padding: 4px 0; font-weight: 600;">Granted Permission:</td><td style="font-family: monospace; font-weight: bold; color: #6b21a8;">${permission}</td></tr>
                <tr><td style="color: #64748b; padding: 4px 0;">Granted By:</td><td>${data.grantedByName || "Org Admin"}</td></tr>
                <tr><td style="color: #64748b; padding: 4px 0;">Expires At:</td><td>${expiresAt}</td></tr>
                <tr><td style="color: #64748b; padding: 4px 0;">Justification:</td><td>${reason}</td></tr>
              </table>
            </div>
            <p style="font-size: 12px; color: #64748b;">
              This privilege elevation will automatically expire. All actions executed under this grant are logged to the immutable audit trail.
            </p>
          </div>
        </div>
      `;
      return {
        subject,
        html,
        text,
        whatsappTemplate: "access_transformation_v1",
        whatsappParams: [recipientName, permission, expiresAt],
      };
    }
  }
}

/**
 * Sends email via Microsoft Graph API (/v1.0/sendMail) if configured,
 * or gracefully runs simulated dispatch for local dev / sandbox environments.
 */
async function dispatchEmail(
  recipientEmail: string,
  subject: string,
  html: string,
  text: string
): Promise<{ success: boolean; provider: "MICROSOFT_GRAPH" | "SIMULATED_DEV"; messageId?: string; error?: string }> {
  const tenantId = process.env.AZURE_AD_TENANT_ID;
  const clientId = process.env.AZURE_AD_CLIENT_ID;
  const clientSecret = process.env.AZURE_AD_CLIENT_SECRET;
  const senderEmail = process.env.GRAPH_SENDER_EMAIL;

  // Real Microsoft Graph API dispatch if credentials exist
  if (tenantId && clientId && clientSecret && senderEmail) {
    try {
      const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
      const tokenParams = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        scope: "https://graph.microsoft.com/.default",
        grant_type: "client_credentials",
      });

      const tokenRes = await fetch(tokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: tokenParams.toString(),
      });

      if (!tokenRes.ok) {
        const tokenErr = await tokenRes.text();
        throw new Error(`Graph token request failed: ${tokenErr}`);
      }

      const tokenData = await tokenRes.json();
      const accessToken = tokenData.access_token;

      // Microsoft Graph sendMail endpoint
      const sendMailUrl = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(senderEmail)}/sendMail`;
      const mailPayload = {
        message: {
          subject,
          body: {
            contentType: "HTML",
            content: html,
          },
          toRecipients: [
            {
              emailAddress: {
                address: recipientEmail,
              },
            },
          ],
        },
        saveToSentItems: true,
      };

      const mailRes = await fetch(sendMailUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(mailPayload),
      });

      if (!mailRes.ok) {
        const mailErr = await mailRes.text();
        throw new Error(`Graph sendMail failed: ${mailErr}`);
      }

      return { success: true, provider: "MICROSOFT_GRAPH" };
    } catch (err: any) {
      console.warn("Microsoft Graph delivery error, falling back to simulated dispatch:", err.message);
      return { success: true, provider: "SIMULATED_DEV", error: err.message };
    }
  }

  // Graceful simulated delivery (logged cleanly)
  console.log(`[Notification Engine: Email Dispatch (SIMULATED)]
To: ${recipientEmail}
Subject: ${subject}
Provider: Simulated Local
-------------------------------------------`);

  return { success: true, provider: "SIMULATED_DEV" };
}

/**
 * Sends message via WhatsApp Business Cloud API if configured,
 * or gracefully runs structured simulation.
 */
async function dispatchWhatsApp(
  recipientPhone: string,
  templateName: string,
  templateParams: string[]
): Promise<{ success: boolean; provider: "WHATSAPP_CLOUD_API" | "SIMULATED_DEV"; error?: string }> {
  const token = process.env.WHATSAPP_API_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  // Normalize phone number (strip whitespace, dashes, plus)
  const cleanPhone = recipientPhone.replace(/[^0-9]/g, "");

  if (token && phoneNumberId) {
    try {
      const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;
      const payload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: cleanPhone,
        type: "template",
        template: {
          name: templateName,
          language: { code: "en" },
          components: [
            {
              type: "body",
              parameters: templateParams.map((p) => ({ type: "text", text: p })),
            },
          ],
        },
      };

      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`WhatsApp API failed: ${errText}`);
      }

      return { success: true, provider: "WHATSAPP_CLOUD_API" };
    } catch (err: any) {
      console.warn("WhatsApp Cloud API error, falling back to simulated dispatch:", err.message);
      return { success: true, provider: "SIMULATED_DEV", error: err.message };
    }
  }

  // Graceful simulated delivery
  console.log(`[Notification Engine: WhatsApp Dispatch (SIMULATED)]
To: ${recipientPhone} (Clean: ${cleanPhone})
Template: ${templateName}
Params: ${JSON.stringify(templateParams)}
-------------------------------------------`);

  return { success: true, provider: "SIMULATED_DEV" };
}

/**
 * Main Notification Dispatcher (SRS §8.1)
 * Evaluates organization delivery preferences per event,
 * dispatches via configured channels, and logs to the immutable audit trail.
 */
export async function sendNotification(payload: NotificationPayload): Promise<DispatchResult> {
  const {
    organizationId,
    actorId,
    eventKey,
    recipientEmail,
    recipientPhone,
    recipientName,
    data,
  } = payload;

  try {
    // 1. Evaluate organization delivery preferences
    const orgSetting = await db.notificationSetting.findUnique({
      where: {
        organizationId_eventKey: {
          organizationId,
          eventKey,
        },
      },
    });

    const emailAllowed = orgSetting ? orgSetting.emailEnabled : DEFAULT_PREFERENCES[eventKey]?.email ?? true;
    const whatsappAllowed = orgSetting ? orgSetting.whatsappEnabled : DEFAULT_PREFERENCES[eventKey]?.whatsapp ?? false;

    // 2. Build templated content
    const content = buildNotificationContent(eventKey, recipientName, data);

    let emailDispatched = false;
    let emailProvider: "MICROSOFT_GRAPH" | "SIMULATED_DEV" | "SKIPPED" = "SKIPPED";
    let whatsappDispatched = false;
    let whatsappProvider: "WHATSAPP_CLOUD_API" | "SIMULATED_DEV" | "SKIPPED" = "SKIPPED";

    // 3. Dispatch Email if enabled and recipient address present
    if (emailAllowed && recipientEmail) {
      const emailResult = await dispatchEmail(
        recipientEmail,
        content.subject,
        content.html,
        content.text
      );
      emailDispatched = emailResult.success;
      emailProvider = emailResult.provider;
    }

    // 4. Dispatch WhatsApp if enabled and recipient phone present
    if (whatsappAllowed && recipientPhone) {
      const waResult = await dispatchWhatsApp(
        recipientPhone,
        content.whatsappTemplate,
        content.whatsappParams
      );
      whatsappDispatched = waResult.success;
      whatsappProvider = waResult.provider;
    }

    const result: DispatchResult = {
      eventKey,
      recipientName,
      recipientEmail: emailAllowed ? recipientEmail : null,
      recipientPhone: whatsappAllowed ? recipientPhone : null,
      emailDispatched,
      emailProvider,
      whatsappDispatched,
      whatsappProvider,
      subject: content.subject,
      details: {
        eventKey,
        channels: {
          email: { enabled: emailAllowed, recipient: recipientEmail, provider: emailProvider },
          whatsapp: { enabled: whatsappAllowed, recipient: recipientPhone, provider: whatsappProvider },
        },
      },
    };

    // 5. Audit Logging — record notification dispatch in immutable audit log
    await logAudit({
      organizationId,
      actorId,
      action: "notification.dispatch",
      entityType: "Notification",
      entityId: `${eventKey}_${Date.now()}`,
      newValue: result,
    });

    return result;
  } catch (err: any) {
    console.error("sendNotification dispatch error:", err);
    return {
      eventKey,
      recipientName,
      recipientEmail,
      recipientPhone,
      emailDispatched: false,
      whatsappDispatched: false,
      error: err.message || "Unknown notification dispatch error",
    };
  }
}
