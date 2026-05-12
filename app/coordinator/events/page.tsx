"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { CoordinatorAuthGuard } from "@/app/components/CoordinatorAuthGuard";

type EventEntry = {
  id: string;
  timestamp: string;
  actorType: string;
  actorId: string | null;
  eventType: string;
  payload: string | null;
};

const EVENT_LABELS: Record<string, { label: string; color: string }> = {
  TASK_CREATED:        { label: "Task created",         color: "bg-blue-50 text-blue-700 border-blue-200" },
  TASK_SERIES_CREATED: { label: "Series created",       color: "bg-violet-50 text-violet-700 border-violet-200" },
  VOLUNTEER_ACCEPTED:  { label: "Volunteer accepted",   color: "bg-green-50 text-green-700 border-green-200" },
  VOLUNTEER_DECLINED:  { label: "Volunteer declined",   color: "bg-red-50 text-red-700 border-red-200" },
  VOLUNTEER_CANCELLED: { label: "Cancelled",            color: "bg-zinc-100 text-zinc-600 border-zinc-300" },
  VOLUNTEER_COMPLETED: { label: "Completed",            color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

function EventBadge({ type }: { type: string }) {
  const meta = EVENT_LABELS[type] ?? { label: type, color: "bg-zinc-100 text-zinc-600 border-zinc-300" };
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${meta.color}`}>
      {meta.label}
    </span>
  );
}

function PayloadSummary({ raw }: { raw: string | null }) {
  if (!raw) return <span className="text-zinc-400">—</span>;
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    const parts: string[] = [];
    if (parsed.taskTitle) parts.push(parsed.taskTitle);
    if (parsed.recurrenceRule) parts.push(`↻ ${parsed.recurrenceRule}`);
    if (parsed.instanceCount) parts.push(`${parsed.instanceCount} instances`);
    if (parsed.volunteerId) parts.push(`vol: …${parsed.volunteerId.slice(-6)}`);
    return <span className="text-zinc-600">{parts.join(" · ") || raw}</span>;
  } catch {
    return <span className="text-zinc-400 font-mono text-[10px]">{raw}</span>;
  }
}

export default function EventsPage() {
  const [events, setEvents] = useState<EventEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch("/api/events");
      const data = await res.json() as { events: EventEntry[] };
      setEvents(data.events ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-4 py-10">
      <CoordinatorAuthGuard />
      <Link
        href="/coordinator/dashboard"
        className="inline-flex items-center justify-center rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 w-fit transition-colors"
      >
        ← Back to Dashboard
      </Link>

      <header className="space-y-1">
        <h1 className="text-xl font-semibold">Event log</h1>
        <p className="text-sm text-zinc-500">
          Audit trail of coordinator actions — last 100 events, newest first.
        </p>
      </header>

      <section className="rounded-lg border overflow-hidden">
        {loading ? (
          <p className="px-4 py-6 text-xs text-zinc-500">Loading...</p>
        ) : events.length === 0 ? (
          <p className="px-4 py-6 text-xs text-zinc-500">
            No events recorded yet. Create a task or accept a volunteer to start the log.
          </p>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="border-b bg-zinc-50">
              <tr>
                <th className="px-4 py-2 font-medium text-zinc-500">Time</th>
                <th className="px-4 py-2 font-medium text-zinc-500">Event</th>
                <th className="px-4 py-2 font-medium text-zinc-500">Details</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id} className="border-b last:border-0 hover:bg-zinc-50 transition-colors">
                  <td className="px-4 py-2.5 whitespace-nowrap text-zinc-400">
                    {new Date(event.timestamp).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-2.5">
                    <EventBadge type={event.eventType} />
                  </td>
                  <td className="px-4 py-2.5">
                    <PayloadSummary raw={event.payload} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
