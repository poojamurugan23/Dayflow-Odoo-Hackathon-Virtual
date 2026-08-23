"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import type { LeaveRequestRow } from "@/lib/leave";
import { Input } from "@/components/ui/input";
import { RequestTable } from "@/components/time-off/request-table";

/**
 * The admin approval queue with the wireframe's searchbar (image 8).
 *
 * Filtering is client-side over the already-fetched rows, the same pattern as
 * the employee grid. Deliberate: the queue is one organisation's requests — tens
 * of rows, not thousands — so a round trip per keystroke would make it slower
 * and add a loading state to a list that is already on screen. If a queue ever
 * grows past a few hundred rows this becomes a server-side query with a
 * debounce, and the component boundary is already in the right place for that.
 *
 * Only the rendering is client-side. RLS decided which rows arrived here, and
 * the decide controls still call a server action that re-checks the actor.
 */
export function AdminQueue({
  requests,
  currentUserId,
  conflicts,
}: {
  requests: LeaveRequestRow[];
  currentUserId: string;
  conflicts: Map<string, { count: number; names: string[] }>;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return requests;
    return requests.filter(
      (request) =>
        request.requesterName.toLowerCase().includes(q) ||
        request.requesterLoginId.toLowerCase().includes(q) ||
        request.leaveType.toLowerCase().includes(q) ||
        request.status.toLowerCase().includes(q),
    );
  }, [requests, query]);

  const pending = filtered.filter((r) => r.status === "pending").length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1 sm:max-w-sm">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, login ID, type or status"
            aria-label="Search time-off requests"
            className="pl-9"
          />
        </div>

        <p className="ml-auto text-xs text-muted-foreground" aria-live="polite">
          {filtered.length} of {requests.length}
          {pending > 0 && ` · ${pending} pending`}
        </p>
      </div>

      <RequestTable
        requests={filtered}
        showRequester
        canDecide
        currentUserId={currentUserId}
        conflicts={conflicts}
        emptyMessage={
          query
            ? `No requests match “${query}” — try a name or a login ID.`
            : "No requests yet — they appear here as your team submits them."
        }
      />
    </div>
  );
}
