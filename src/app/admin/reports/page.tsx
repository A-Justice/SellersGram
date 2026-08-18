"use client";

import { useEffect, useState } from "react";
import { resolveReport, subscribeReports } from "@/lib/reports-store";
import { timeAgo } from "@/lib/format";
import type { Report } from "@/data/types";

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => subscribeReports(setReports), []);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl tracking-tight">Reports</h1>
      <ul className="space-y-3">
        {reports.map((report) => (
          <li
            key={report.id}
            className="rounded-[24px] bg-paper p-5 shadow-[0_0_0_1px_var(--color-line)]"
          >
            <p className="font-medium">{report.listingTitle}</p>
            <p className="mt-1 text-sm text-muted">{report.reason}</p>
            <div className="mt-3 flex items-center justify-between text-xs text-muted">
              <span>
                {report.status} · {timeAgo(report.createdAt)}
              </span>
              {report.status === "open" && (
                <button
                  type="button"
                  onClick={() => void resolveReport(report.id)}
                  className="text-accent"
                >
                  Resolve
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
      {!reports.length && (
        <p className="text-sm text-muted">No reports yet.</p>
      )}
    </div>
  );
}
