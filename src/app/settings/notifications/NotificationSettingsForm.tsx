"use client";

import { useState } from "react";

interface SettingItem {
  id: string;
  eventKey: string;
  emailEnabled: boolean;
  whatsappEnabled: boolean;
}

interface TestResult {
  eventKey: string;
  recipientName: string;
  recipientEmail?: string | null;
  recipientPhone?: string | null;
  emailDispatched: boolean;
  emailProvider?: string;
  whatsappDispatched: boolean;
  whatsappProvider?: string;
  subject?: string;
  details?: Record<string, any>;
  error?: string;
}

export default function NotificationSettingsForm({
  initialSettings,
  userRole,
}: {
  initialSettings: SettingItem[];
  userRole: string;
}) {
  const [settings, setSettings] = useState<SettingItem[]>(initialSettings);
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [testingKey, setTestingKey] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [testModalResult, setTestModalResult] = useState<TestResult | null>(null);

  const eventDescriptions: Record<string, { label: string; desc: string }> = {
    "certificate-issued": {
      label: "Certificate Issuance",
      desc: "Triggered immediately when a recipient certificate PDF is generated and published.",
    },
    "card-pending": {
      label: "Card Request Submitted",
      desc: "Sent to Org Admins when an HR specialist submits a card draft for review.",
    },
    "candidate-approved": {
      label: "Candidate Sign-off",
      desc: "Notifies team when a candidate approves their card details via token link.",
    },
    "changes-requested": {
      label: "Changes / Revisions Requested",
      desc: "Sent when an admin or candidate requests corrections on a card draft.",
    },
    "access-granted": {
      label: "Access Transformation Elevated",
      desc: "Security alert sent when temporary permission elevation is granted.",
    },
  };

  const canEdit = ["SUPER_ADMIN", "ORG_ADMIN"].includes(userRole);

  async function handleToggle(eventKey: string, channel: "email" | "whatsapp", currentValue: boolean) {
    if (!canEdit) return;

    setLoadingKey(eventKey);
    setMessage(null);

    const targetSetting = settings.find((s) => s.eventKey === eventKey);
    const newEmail = channel === "email" ? !currentValue : targetSetting?.emailEnabled ?? true;
    const newWhatsapp = channel === "whatsapp" ? !currentValue : targetSetting?.whatsappEnabled ?? false;

    try {
      const res = await fetch("/api/settings/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventKey,
          emailEnabled: newEmail,
          whatsappEnabled: newWhatsapp,
        }),
      });

      if (!res.ok) throw new Error("Failed to update setting");

      setSettings((prev) =>
        prev.map((s) =>
          s.eventKey === eventKey
            ? { ...s, emailEnabled: newEmail, whatsappEnabled: newWhatsapp }
            : s
        )
      );

      setMessage("Preferences saved.");
      setTimeout(() => setMessage(null), 3000);
    } catch {
      setMessage("Error updating preference.");
    } finally {
      setLoadingKey(null);
    }
  }

  async function handleTestTrigger(eventKey: string) {
    setTestingKey(eventKey);
    try {
      const res = await fetch("/api/settings/notifications/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventKey }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to trigger test notification");

      setTestModalResult(data.result);
    } catch (err: any) {
      alert(`Test notification failed: ${err.message}`);
    } finally {
      setTestingKey(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Channels Status Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0 text-blue-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900">Microsoft Graph Email (SRS §8.1)</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Active / Ready
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              Dispatches via Microsoft Graph API with simulated sandbox fallback. HTML templates match platform design.
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0 text-emerald-600">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0012.04 2zm5.78 14.07c-.24.67-1.39 1.28-1.92 1.35-.5.07-1.14.1-3.32-.8-2.79-1.16-4.58-4.01-4.72-4.2-.14-.19-1.13-1.5-1.13-2.86 0-1.36.71-2.03.96-2.31.25-.28.55-.35.73-.35.19 0 .37 0 .53.01.17.01.4.06.62.54.24.53.81 1.99.88 2.14.07.15.12.33.02.53-.1.2-.15.32-.3.49-.15.17-.32.38-.45.51-.15.15-.31.31-.13.62.17.31.78 1.28 1.67 2.07 1.15 1.02 2.11 1.34 2.42 1.49.31.15.48.13.66-.08.18-.21.78-.91.99-1.22.21-.31.42-.26.7-.15.28.11 1.78.84 2.08.99.3.15.5.23.57.36.07.12.07.72-.17 1.39z" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900">WhatsApp Business Cloud API</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Template Engine
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              Structured Meta Graph API payloads with localized parameters and audit log tracking.
            </p>
          </div>
        </div>
      </div>

      {/* Multichannel Delivery Matrix Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden space-y-4">
        <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between sm:items-center gap-2 bg-gray-50">
          <div>
            <h2 className="text-base font-bold text-gray-900">Multichannel Delivery Matrix</h2>
            <p className="text-xs text-gray-500">SRS §8.1 Event-driven automated dispatch rules</p>
          </div>
          {message && <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">{message}</span>}
        </div>

        <div className="divide-y divide-gray-100">
          {settings.map((item) => {
            const meta = eventDescriptions[item.eventKey] || {
              label: item.eventKey,
              desc: "Trigger notification event",
            };
            const isLoading = loadingKey === item.eventKey;
            const isTesting = testingKey === item.eventKey;

            return (
              <div
                key={item.eventKey}
                className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-gray-50/50 transition-colors"
              >
                <div className="max-w-lg">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-gray-900">{meta.label}</h3>
                    <span className="font-mono text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                      {item.eventKey}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{meta.desc}</p>
                </div>

                <div className="flex flex-wrap items-center gap-5 sm:gap-6 self-start md:self-auto">
                  {/* Email Toggle */}
                  <label className="flex items-center space-x-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={item.emailEnabled}
                      disabled={!canEdit || isLoading}
                      onChange={() => handleToggle(item.eventKey, "email", item.emailEnabled)}
                      className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 cursor-pointer disabled:opacity-50"
                    />
                    <span className="text-xs font-semibold text-gray-700">Email</span>
                  </label>

                  {/* WhatsApp Toggle */}
                  <label className="flex items-center space-x-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={item.whatsappEnabled}
                      disabled={!canEdit || isLoading}
                      onChange={() => handleToggle(item.eventKey, "whatsapp", item.whatsappEnabled)}
                      className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 cursor-pointer disabled:opacity-50"
                    />
                    <span className="text-xs font-semibold text-gray-700">WhatsApp</span>
                  </label>

                  {/* Send Test Trigger Button */}
                  {canEdit && (
                    <button
                      type="button"
                      disabled={isTesting}
                      onClick={() => handleTestTrigger(item.eventKey)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors shadow-2xs disabled:opacity-50"
                      title="Send test notification with audit log"
                    >
                      {isTesting ? (
                        <>
                          <svg className="animate-spin w-3 h-3 text-slate-600" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                          </svg>
                          <span>Sending...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Test Dispatch</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Test Result Modal */}
      {testModalResult && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 space-y-4 animate-in fade-in zoom-in duration-100">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <h3 className="font-bold text-gray-900 text-base">Notification Dispatch Verified</h3>
              </div>
              <button
                type="button"
                onClick={() => setTestModalResult(null)}
                className="text-gray-400 hover:text-gray-600 text-lg w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1.5 font-mono">
                <div><strong>Event:</strong> {testModalResult.eventKey}</div>
                <div><strong>Subject:</strong> {testModalResult.subject}</div>
                <div><strong>Recipient:</strong> {testModalResult.recipientName}</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="border border-gray-200 rounded-lg p-3 bg-white">
                  <div className="font-semibold text-gray-700 flex items-center justify-between mb-1">
                    <span>Email Channel</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${testModalResult.emailDispatched ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-500'}`}>
                      {testModalResult.emailDispatched ? "Delivered" : "Skipped"}
                    </span>
                  </div>
                  <div className="text-gray-500 text-[11px]">Provider: {testModalResult.emailProvider}</div>
                  {testModalResult.recipientEmail && <div className="text-gray-400 text-[10px] truncate">{testModalResult.recipientEmail}</div>}
                </div>

                <div className="border border-gray-200 rounded-lg p-3 bg-white">
                  <div className="font-semibold text-gray-700 flex items-center justify-between mb-1">
                    <span>WhatsApp Channel</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${testModalResult.whatsappDispatched ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-500'}`}>
                      {testModalResult.whatsappDispatched ? "Delivered" : "Skipped"}
                    </span>
                  </div>
                  <div className="text-gray-500 text-[11px]">Provider: {testModalResult.whatsappProvider}</div>
                  {testModalResult.recipientPhone && <div className="text-gray-400 text-[10px] truncate">{testModalResult.recipientPhone}</div>}
                </div>
              </div>

              <div className="p-2.5 bg-purple-50 text-purple-900 rounded-lg border border-purple-100 flex items-center gap-2">
                <svg className="w-4 h-4 text-purple-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Audit trail logged with action: <code className="font-bold">notification.dispatch</code></span>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => setTestModalResult(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
