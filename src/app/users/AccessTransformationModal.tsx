"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { canGrant, type Role, type Permission } from "@/lib/permissions";

interface UserOption {
  id: string;
  name: string;
  email: string;
  role: string;
}

const PERMISSION_OPTIONS: { value: Permission; label: string; desc: string }[] = [
  {
    value: "issue-certificate",
    label: "Issue Certificate",
    desc: "Issue and generate individual certificates",
  },
  {
    value: "bulk-upload",
    label: "Bulk Certificate Upload",
    desc: "Upload CSV batches and issue in bulk",
  },
  {
    value: "manage-templates",
    label: "Manage Templates",
    desc: "Create, customize, and upload template artwork",
  },
  {
    value: "create-card",
    label: "Create Card Requests",
    desc: "Submit staff ID and membership card requests",
  },
  {
    value: "approve-card",
    label: "Approve Card Requests",
    desc: "Admin review, request revisions, and approve cards",
  },
  {
    value: "view-audit-log",
    label: "View Audit Logs",
    desc: "Access immutable security and compliance logs",
  },
  {
    value: "manage-user-roles",
    label: "Manage User Roles",
    desc: "Invite team members and adjust permissions",
  },
];

const DURATION_PRESETS = [
  { label: "1 hour", hours: 1 },
  { label: "4 hours", hours: 4 },
  { label: "8 hours (Shift)", hours: 8 },
  { label: "24 hours (1 Day)", hours: 24 },
  { label: "7 days", hours: 168 },
];

export default function AccessTransformationModal({
  users,
  actorRole,
}: {
  users: UserOption[];
  actorRole: string;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [recipientId, setRecipientId] = useState(users[0]?.id || "");
  const [permission, setPermission] = useState<Permission>("bulk-upload");
  const [reason, setReason] = useState("");
  const [durationHours, setDurationHours] = useState(24);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Compute calculated expiration date preview
  const calculatedExpiry = useMemo(() => {
    const d = new Date();
    d.setTime(d.getTime() + durationHours * 60 * 60 * 1000);
    return d.toLocaleString(undefined, {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [durationHours]);

  async function handleGrant(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/temporary-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientId,
          permission,
          reason,
          durationHours: Number(durationHours),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to grant temporary permission");
      }

      setIsOpen(false);
      setReason("");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white text-sm font-semibold rounded-lg shadow-sm transition-all flex items-center gap-2"
      >
        <svg
          className="w-4 h-4 text-purple-200"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
        Access Transformation (Grant)
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 space-y-5 animate-in fade-in zoom-in duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-600 animate-pulse" />
                  <h3 className="text-lg font-bold text-gray-900">
                    Access Transformation (SRS §3.5)
                  </h3>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Issue time-bounded privilege elevations strictly within your permission ceiling
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-700 text-xs font-medium rounded-lg border border-red-200">
                {error}
              </div>
            )}

            <form onSubmit={handleGrant} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Recipient User *
                </label>
                <select
                  value={recipientId}
                  onChange={(e) => setRecipientId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  required
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email}) — Current Role: {u.role}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Elevated Permission to Grant *
                </label>
                <select
                  value={permission}
                  onChange={(e) => setPermission(e.target.value as Permission)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  required
                >
                  {PERMISSION_OPTIONS.map((p) => {
                    const isAllowed = canGrant(actorRole as Role, p.value);
                    return (
                      <option key={p.value} value={p.value} disabled={!isAllowed}>
                        {p.label} {!isAllowed ? "— ⛔ Ceiling Exceeded" : `(${p.value})`}
                      </option>
                    );
                  })}
                </select>
                <p className="text-[11px] text-gray-500 mt-1 flex items-center gap-1">
                  <span className="font-semibold text-purple-700">Ceiling Governance:</span>
                  You can only elevate permissions that your role ({actorRole}) explicitly holds.
                </p>
              </div>

              {/* Duration Presets & Input */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Elevation Duration *
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {DURATION_PRESETS.map((preset) => (
                    <button
                      key={preset.hours}
                      type="button"
                      onClick={() => setDurationHours(preset.hours)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                        durationHours === preset.hours
                          ? "bg-purple-700 text-white shadow-2xs"
                          : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="block text-[11px] text-gray-500 mb-0.5">Custom Hours</span>
                    <input
                      type="number"
                      min={1}
                      max={720}
                      value={durationHours}
                      onChange={(e) => setDurationHours(Math.max(1, Number(e.target.value)))}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <span className="block text-[11px] text-gray-500 mb-0.5">Auto-Expires At</span>
                    <div className="px-2.5 py-1.5 bg-purple-50/70 border border-purple-100 rounded-lg text-xs text-purple-900 font-medium truncate" title={calculatedExpiry}>
                      ⏳ {calculatedExpiry}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Governance Reason / Justification *
                </label>
                <textarea
                  rows={2}
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Temporary coverage for certificate batch issuing during Q3 graduations."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-sm transition-all"
                >
                  {loading ? "Granting..." : "Confirm Temporary Grant"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
