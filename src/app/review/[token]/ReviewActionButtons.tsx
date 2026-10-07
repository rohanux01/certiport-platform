"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ReviewActionButtons({
  token,
  currentStatus,
}: {
  token: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [comment, setComment] = useState("");
  const [showChangesModal, setShowChangesModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isActionable = currentStatus === "PENDING_CANDIDATE";

  async function handleAction(action: "APPROVE" | "REQUEST_CHANGES") {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/review/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          comment: comment.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit review");
      }

      setSuccessMessage(
        action === "APPROVE"
          ? "Thank you! You have successfully approved your card. Our team will proceed with delivery."
          : "Your revision feedback has been submitted to the HR team."
      );
      setShowChangesModal(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm font-medium">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      {!isActionable ? (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-center text-sm text-gray-600">
          {currentStatus === "CANDIDATE_APPROVED" || currentStatus === "DELIVERED" || currentStatus === "FINALIZED"
            ? "✓ You have already approved this card. It is now finalized."
            : currentStatus === "CANDIDATE_CHANGES"
            ? "Your change request is being processed by HR."
            : `Current status: ${currentStatus}`}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleAction("APPROVE")}
              className="flex-1 px-6 py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm rounded-xl shadow-sm transition-colors disabled:opacity-50"
            >
              {loading ? "Processing..." : "✓ Approve & Confirm Information"}
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => setShowChangesModal(true)}
              className="px-6 py-3.5 bg-white hover:bg-gray-50 text-gray-800 font-semibold text-sm rounded-xl border border-gray-300 shadow-sm transition-colors disabled:opacity-50"
            >
              Request Changes / Corrections
            </button>
          </div>

          {showChangesModal && (
            <div className="p-5 bg-amber-50 rounded-xl border border-amber-200 space-y-3">
              <h4 className="text-sm font-bold text-amber-900">Specify Required Changes</h4>
              <p className="text-xs text-amber-700">
                Please describe any corrections needed (e.g. spelling of name, job title, phone number, etc.).
              </p>
              <textarea
                rows={3}
                required
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="e.g. Please update my job title to Senior Product Designer..."
                className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowChangesModal(false)}
                  className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={loading || !comment.trim()}
                  onClick={() => handleAction("REQUEST_CHANGES")}
                  className="px-4 py-1.5 bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold rounded-md disabled:opacity-50"
                >
                  {loading ? "Submitting..." : "Submit Revision Request"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
