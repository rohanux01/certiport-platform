"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface GrantRevokeButtonProps {
  grantId: string;
  recipientName: string;
  permission: string;
}

export default function GrantRevokeButton({
  grantId,
  recipientName,
  permission,
}: GrantRevokeButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRevoke() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/temporary-access/${grantId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to revoke grant");
      }

      setShowConfirm(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to revoke");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md transition-colors shadow-2xs"
        title={`Revoke ${permission} from ${recipientName}`}
      >
        <svg
          className="w-3.5 h-3.5 text-rose-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
          />
        </svg>
        Revoke
      </button>

      {showConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 shadow-2xl border border-gray-200 space-y-4 animate-in fade-in zoom-in duration-100">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <svg
                  className="w-5 h-5 text-rose-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">
                  Revoke Privilege Elevation
                </h4>
                <p className="text-xs text-gray-500">Immediate access termination</p>
              </div>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Are you sure you want to revoke the temporary privilege{" "}
              <strong className="font-mono text-purple-700 bg-purple-50 px-1 py-0.5 rounded">
                {permission}
              </strong>{" "}
              from <strong>{recipientName}</strong> immediately? This action is logged to the immutable audit trail.
            </p>

            {error && (
              <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded border border-red-200">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                disabled={loading}
                onClick={() => setShowConfirm(false)}
                className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleRevoke}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-3 h-3 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Revoking...
                  </>
                ) : (
                  "Confirm Revocation"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
