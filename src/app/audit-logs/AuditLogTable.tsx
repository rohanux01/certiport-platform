"use client";

import { useState } from "react";

interface AuditLogEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValue: any;
  newValue: any;
  ipAddress: string | null;
  createdAt: string | Date;
  actor: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
}

export default function AuditLogTable({ initialLogs }: { initialLogs: AuditLogEntry[] }) {
  const [search, setSearch] = useState("");
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  const filtered = initialLogs.filter((log) => {
    const term = search.toLowerCase();
    return (
      log.action.toLowerCase().includes(term) ||
      log.entityType.toLowerCase().includes(term) ||
      log.actor?.name.toLowerCase().includes(term) ||
      log.actor?.email.toLowerCase().includes(term) ||
      log.entityId.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter audit trail by action, actor, entity type, or ID..."
          className="flex-1 px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-sm"
        />
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm text-gray-700">
          <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <tr>
              <th className="px-6 py-3.5">Timestamp</th>
              <th className="px-6 py-3.5">Actor</th>
              <th className="px-6 py-3.5">Action</th>
              <th className="px-6 py-3.5">Target Entity</th>
              <th className="px-6 py-3.5 text-right">Provenance & Diff</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-400 text-sm">
                  No matching audit records found.
                </td>
              </tr>
            ) : (
              filtered.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-xs font-mono text-gray-500 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    {log.actor ? (
                      <div>
                        <div className="font-semibold text-gray-900">{log.actor.name}</div>
                        <div className="text-xs text-gray-500">{log.actor.role}</div>
                      </div>
                    ) : (
                      <span className="text-xs font-mono text-gray-400">Anonymous / Public</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-bold bg-slate-100 text-slate-800">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{log.entityType}</div>
                    <div className="text-xs font-mono text-gray-400 truncate max-w-[120px]">
                      {log.entityId}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedLog(log)}
                      className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-md transition-colors"
                    >
                      View Diff →
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* JSON Diff Drawer / Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-gray-200 space-y-4 animate-in fade-in zoom-in duration-150 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Audit Record Provenance
                </h3>
                <span className="font-mono text-xs text-emerald-700 font-bold">{selectedLog.action}</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="text-gray-400 hover:text-gray-600 text-lg"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-gray-400 font-bold uppercase">Actor:</span>{" "}
                <span className="font-semibold text-gray-900">{selectedLog.actor?.name || "System"}</span>
              </div>
              <div>
                <span className="text-gray-400 font-bold uppercase">Target:</span>{" "}
                <span className="font-mono text-gray-900">{selectedLog.entityType} ({selectedLog.entityId})</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 overflow-auto">
              <div className="space-y-1">
                <span className="text-xs font-bold text-red-700 uppercase">Old Value</span>
                <pre className="p-3 bg-red-50/50 border border-red-200 rounded-lg text-xs font-mono text-red-900 overflow-auto max-h-60">
                  {selectedLog.oldValue ? JSON.stringify(selectedLog.oldValue, null, 2) : "null"}
                </pre>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold text-emerald-700 uppercase">New Value</span>
                <pre className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-lg text-xs font-mono text-emerald-900 overflow-auto max-h-60">
                  {selectedLog.newValue ? JSON.stringify(selectedLog.newValue, null, 2) : "null"}
                </pre>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg"
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
