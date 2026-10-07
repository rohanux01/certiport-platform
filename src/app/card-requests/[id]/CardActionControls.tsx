"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { availableEvents, nextCardStatus, type CardEvent, type CardRequestStatus } from "@/lib/cardWorkflow";

interface CardActionControlsProps {
  cardRequestId: string;
  currentStatus: CardRequestStatus;
  userRole: string;
  candidateToken: string;
}

export default function CardActionControls({
  cardRequestId,
  currentStatus,
  userRole,
  candidateToken,
}: CardActionControlsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmEvent, setConfirmEvent] = useState<CardEvent | null>(null);
  const [modalComment, setModalComment] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const possibleEvents = availableEvents(currentStatus);
  const adminOnlyEvents = ["ADMIN_APPROVE", "ADMIN_REQUEST_CHANGES", "FINALIZE"];
  const isAdmin = ["SUPER_ADMIN", "ORG_ADMIN"].includes(userRole);

  // Filter events based on permissions
  const actionableEvents = possibleEvents.filter((event) => {
    if (adminOnlyEvents.includes(event)) {
      return isAdmin;
    }
    return true; // HR/creator can submit/resubmit
  });

  const eventLabels: Record<CardEvent, { label: string; color: string; desc: string; icon: string }> = {
    SUBMIT: {
      label: "Submit for Admin Approval",
      color: "bg-emerald-700 hover:bg-emerald-800 text-white",
      desc: "Sends draft to Org Admin for review",
      icon: "📤",
    },
    ADMIN_APPROVE: {
      label: "Approve & Send to Candidate",
      color: "bg-emerald-700 hover:bg-emerald-800 text-white",
      desc: "Advances card to candidate review phase",
      icon: "✓",
    },
    ADMIN_REQUEST_CHANGES: {
      label: "Request Changes from HR",
      color: "bg-amber-600 hover:bg-amber-700 text-white",
      desc: "Sends card back to HR with notes",
      icon: "✎",
    },
    RESUBMIT: {
      label: "Resubmit to Admin",
      color: "bg-emerald-700 hover:bg-emerald-800 text-white",
      desc: "Resubmit revised draft to Admin",
      icon: "↺",
    },
    CANDIDATE_APPROVE: {
      label: "Candidate Approve (Simulate)",
      color: "bg-blue-600 hover:bg-blue-700 text-white",
      desc: "Simulate candidate signing off",
      icon: "👤",
    },
    CANDIDATE_REQUEST_CHANGES: {
      label: "Candidate Request Changes (Simulate)",
      color: "bg-amber-600 hover:bg-amber-700 text-white",
      desc: "Simulate candidate revision request",
      icon: "⚠",
    },
    RESEND_TO_CANDIDATE: {
      label: "Resend to Candidate",
      color: "bg-emerald-700 hover:bg-emerald-800 text-white",
      desc: "Re-opens candidate review",
      icon: "📨",
    },
    FINALIZE: {
      label: "Finalize & Deliver Card",
      color: "bg-purple-700 hover:bg-purple-800 text-white",
      desc: "Issues card asset and marks delivered",
      icon: "🖨",
    },
  };

  async function handleExecuteTransition() {
    if (!confirmEvent) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/card-requests/${cardRequestId}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: confirmEvent,
          comment: modalComment.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to process transition");
      }

      const evtName = eventLabels[confirmEvent]?.label || confirmEvent;
      setConfirmEvent(null);
      setModalComment("");
      setToastMessage(`✓ ${evtName} completed successfully.`);
      setTimeout(() => setToastMessage(null), 4000);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleCopyReviewLink() {
    const url = `${window.location.origin}/review/${candidateToken}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setToastMessage("✓ Review link copied to clipboard!");
    setTimeout(() => {
      setCopied(false);
      setToastMessage(null);
    }, 3000);
  }

  // Calculate next target status for preview in confirmation modal
  let targetNextStatus: CardRequestStatus | null = null;
  if (confirmEvent) {
    try {
      targetNextStatus = nextCardStatus(currentStatus, confirmEvent);
    } catch {
      targetNextStatus = null;
    }
  }

  return (
    <>
      {/* Toast Notification Popup */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className="flex items-center gap-2.5 px-4 py-3 bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-2xl border border-slate-700">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
        <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">
          Governance & Workflow Actions
        </h3>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
            {error}
          </div>
        )}

        {/* Candidate Portal Link */}
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Public Candidate Review Link
            </span>
            <span className="text-xs text-slate-500">No login required (Token-authenticated)</span>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={typeof window !== "undefined" ? `${window.location.origin}/review/${candidateToken}` : `/review/${candidateToken}`}
              className="flex-1 px-3 py-1.5 bg-white border border-gray-300 rounded text-xs font-mono text-gray-700 select-all"
            />
            <button
              type="button"
              onClick={handleCopyReviewLink}
              className="px-3 py-1.5 bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 text-xs font-semibold rounded transition-colors shadow-sm flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>{copied ? "Copied!" : "Copy Link"}</span>
            </button>
          </div>
        </div>

        {/* Action Buttons Triggering Confirmation Modal */}
        <div className="space-y-3">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Available Transitions</div>
          {actionableEvents.length === 0 ? (
            <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-500 text-center">
              {currentStatus === "DELIVERED"
                ? "This card request is completed and delivered."
                : currentStatus === "PENDING_CANDIDATE"
                ? "Awaiting candidate review via their review link above."
                : "No actions currently available for your role."}
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              {actionableEvents.map((evt) => {
                const meta = eventLabels[evt] || {
                  label: evt,
                  color: "bg-gray-800 text-white",
                  desc: "",
                  icon: "⚡",
                };
                return (
                  <button
                    key={evt}
                    type="button"
                    onClick={() => {
                      setConfirmEvent(evt);
                      setModalComment("");
                      setError(null);
                    }}
                    className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm flex items-center gap-2 hover:brightness-105 active:scale-98 ${meta.color}`}
                    title={meta.desc}
                  >
                    <span>{meta.icon}</span>
                    <span>{meta.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal Popup */}
      {confirmEvent && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="flex justify-between items-start border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-base">
                  {eventLabels[confirmEvent]?.icon || "⚡"}
                </span>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">
                    {eventLabels[confirmEvent]?.label || confirmEvent}
                  </h3>
                  <p className="text-xs text-gray-500">
                    SRS §5.4 Card Workflow Transition
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConfirmEvent(null)}
                className="text-gray-400 hover:text-gray-600 text-lg w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            {/* Transition summary card */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between text-gray-500 font-semibold">
                <span>Current Status:</span>
                <span className="font-mono text-gray-800 bg-white px-2 py-0.5 rounded border border-gray-200">
                  {currentStatus}
                </span>
              </div>
              <div className="flex items-center justify-between text-gray-500 font-semibold">
                <span>Next Status:</span>
                <span className="font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
                  {targetNextStatus || "N/A"}
                </span>
              </div>
              <p className="text-gray-600 text-[11px] pt-1 border-t border-slate-200">
                {eventLabels[confirmEvent]?.desc}
              </p>
            </div>

            {/* Comment / Audit Note */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Audit Note / Reason {confirmEvent.includes("CHANGES") ? "(Required)" : "(Optional)"}
              </label>
              <textarea
                rows={3}
                value={modalComment}
                onChange={(e) => setModalComment(e.target.value)}
                placeholder={
                  confirmEvent.includes("CHANGES")
                    ? "Specify the changes or corrections required..."
                    : "e.g. Design reviewed and approved for candidate verification..."
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {error && (
              <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
                {error}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                disabled={loading}
                onClick={() => setConfirmEvent(null)}
                className="px-4 py-2 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loading || (confirmEvent.includes("CHANGES") && !modalComment.trim())}
                onClick={handleExecuteTransition}
                className="px-5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 rounded-lg shadow-sm transition-all flex items-center gap-1.5"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-3.5 h-3.5 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <span>Updating...</span>
                  </>
                ) : (
                  <span>Confirm Transition</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
