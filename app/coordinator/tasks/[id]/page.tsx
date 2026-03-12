"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AssignmentStatus, Priority, Skill, TaskStatus } from "@/lib/enums";

type Volunteer = {
  id: string;
  name: string;
  email: string;
  postalCode: string | null;
  skills: Skill[];
};

type Assignment = {
  id: string;
  status: AssignmentStatus;
  volunteer: Volunteer;
};

type Task = {
  id: string;
  title: string;
  category: string;
  description: string;
  location: string;
  postalCode: string | null;
  capacity: number;
  startTime: string;
  endTime: string;
  priority: Priority;
  status: TaskStatus;
  meetingPoint: string | null;
};

type TaskResponse = {
  task: Task & { assignments: Assignment[] };
  acceptedCount: number;
};

type Suggestion = {
  volunteer: Volunteer;
  score: number;
  explanation: string;
};

export default function TaskDetailPage() {
  const params = useParams<{ id: string }>();
  const taskId = params.id;
  const [taskInfo, setTaskInfo] = useState<TaskResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [volunteerSearch, setVolunteerSearch] = useState("");
  const [manualMatches, setManualMatches] = useState<Volunteer[]>([]);
  const [manualLoading, setManualLoading] = useState(false);

  useEffect(() => {
    if (taskId) {
      loadTask();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  const loadTask = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/tasks/${taskId}`);
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Failed to load task.");
        return;
      }
      setTaskInfo(data as TaskResponse);
    } catch (err) {
      console.error(err);
      setError("Failed to load task.");
    } finally {
      setLoading(false);
    }
  };

  const searchVolunteers = async () => {
    if (!volunteerSearch) return;
    setManualLoading(true);
    setActionError(null);
    try {
      const response = await fetch(
        `/api/volunteers/search?query=${encodeURIComponent(volunteerSearch)}`,
      );
      const data = await response.json();
      if (!response.ok) {
        setActionError(data.error ?? "Failed to search volunteers.");
        return;
      }
      setManualMatches(data.volunteers ?? []);
    } catch (err) {
      console.error(err);
      setActionError("Failed to search volunteers.");
    } finally {
      setManualLoading(false);
    }
  };

  const assignVolunteer = async (volunteerId: string) => {
    setActionError(null);
    try {
      const response = await fetch(`/api/tasks/${taskId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ volunteerId }),
      });
      const data = await response.json();
      if (!response.ok) {
        setActionError(data.error ?? "Failed to assign volunteer.");
        return;
      }
      await loadTask();
    } catch (err) {
      console.error(err);
      setActionError("Failed to assign volunteer.");
    }
  };

  const requestSuggestions = async () => {
    setSuggestionsLoading(true);
    setSuggestions([]);
    setActionError(null);
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "suggest" }),
      });
      const data = await response.json();
      if (!response.ok) {
        setActionError(data.error ?? "Failed to get suggestions.");
        return;
      }
      setSuggestions(data.suggestions ?? []);
    } catch (err) {
      console.error(err);
      setActionError("Failed to get suggestions.");
    } finally {
      setSuggestionsLoading(false);
    }
  };

  const autoFill = async () => {
    setActionError(null);
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "autoFill" }),
      });
      const data = await response.json();
      if (!response.ok) {
        setActionError(data.error ?? "Failed to auto-fill task.");
        return;
      }
      await loadTask();
    } catch (err) {
      console.error(err);
      setActionError("Failed to auto-fill task.");
    }
  };

  if (loading || !taskInfo) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center px-4 py-10">
        {error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : (
          <p className="text-sm text-zinc-600">Loading task…</p>
        )}
      </main>
    );
  }

  const { task, acceptedCount } = taskInfo;
  const capacityLeft = Math.max(0, task.capacity - acceptedCount);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 px-4 py-10">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">{task.title}</h1>
        <p className="text-sm text-zinc-600">
          {task.location}
          {task.postalCode ? ` · ${task.postalCode}` : ""} ·{" "}
          {new Date(task.startTime).toLocaleString()} –{" "}
          {new Date(task.endTime).toLocaleString()}
        </p>
        <p className="text-xs text-zinc-600">
          Priority: {task.priority.toLowerCase()} · Status:{" "}
          {task.status.toLowerCase()}
        </p>
        {task.meetingPoint && (
          <p className="text-xs text-zinc-600">
            Meeting point: {task.meetingPoint}
          </p>
        )}
      </header>

      {actionError && (
        <p className="text-sm text-red-600" role="alert">
          {actionError}
        </p>
      )}

      <section className="grid gap-6 md:grid-cols-[2fr,1.4fr]">
        <div className="space-y-4">
          <h2 className="text-sm font-semibold">
            Assignments ({acceptedCount}/{task.capacity} confirmed)
          </h2>
          <ul className="space-y-2 text-sm">
            {task.assignments.length === 0 ? (
              <p className="text-xs text-zinc-600">
                No volunteers have been proposed or confirmed yet.
              </p>
            ) : (
              task.assignments.map((assignment) => (
                <li
                  key={assignment.id}
                  className="flex items-center justify-between rounded-md border px-3 py-2"
                >
                  <div>
                    <p className="font-medium">{assignment.volunteer.name}</p>
                    <p className="text-xs text-zinc-600">
                      {assignment.volunteer.email}
                      {assignment.volunteer.postalCode
                        ? ` · ${assignment.volunteer.postalCode}`
                        : ""}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-600">
                      Status: {assignment.status.toLowerCase()}
                    </p>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="space-y-4 rounded-lg border p-4 text-sm">
          <h2 className="text-sm font-semibold">Automation modes</h2>
          <p className="text-xs text-zinc-600">
            Use these tools to reduce manual searching while preserving human
            control.
          </p>
          <button
            type="button"
            onClick={requestSuggestions}
            disabled={suggestionsLoading || capacityLeft <= 0}
            className="mt-2 inline-flex items-center justify-center rounded-md bg-zinc-900 px-3 py-2 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
          >
            {suggestionsLoading ? "Getting suggestions…" : "Get suggestions"}
          </button>
          <button
            type="button"
            onClick={autoFill}
            disabled={capacityLeft <= 0}
            className="mt-2 inline-flex items-center justify-center rounded-md bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            Auto-fill up to capacity
          </button>
          <p className="mt-1 text-[11px] text-zinc-500">
            Remaining confirmed capacity: {capacityLeft}
          </p>

          {suggestions.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-semibold">
                Suggested volunteers (semi-automatic)
              </p>
              <ul className="space-y-2">
                {suggestions.map((s) => (
                  <li
                    key={s.volunteer.id}
                    className="rounded-md border px-3 py-2 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-medium">{s.volunteer.name}</p>
                        <p className="text-[11px] text-zinc-600">
                          {s.volunteer.email}
                          {s.volunteer.postalCode
                            ? ` · ${s.volunteer.postalCode}`
                            : ""}
                        </p>
                        <p className="mt-1 text-[11px] text-zinc-600">
                          {s.explanation}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => assignVolunteer(s.volunteer.id)}
                        className="ml-2 inline-flex items-center justify-center rounded-md bg-green-600 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-green-700"
                      >
                        Approve
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      <section className="space-y-3 rounded-lg border p-4 text-sm">
        <h2 className="text-sm font-semibold">Manual search & assign</h2>
        <p className="text-xs text-zinc-600">
          Search volunteers by name, email, or postal code and assign them
          manually. All skill and availability constraints are still enforced.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            placeholder="Name, email, or postal code"
            value={volunteerSearch}
            onChange={(e) => setVolunteerSearch(e.target.value)}
            className="flex-1 rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={searchVolunteers}
            disabled={manualLoading || !volunteerSearch}
            className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
          >
            {manualLoading ? "Searching…" : "Search volunteers"}
          </button>
        </div>
        {manualMatches.length > 0 && (
          <ul className="mt-3 space-y-2">
            {manualMatches.map((v) => (
              <li
                key={v.id}
                className="flex items-center justify-between rounded-md border px-3 py-2 text-xs"
              >
                <div>
                  <p className="font-medium">{v.name}</p>
                  <p className="text-[11px] text-zinc-600">
                    {v.email}
                    {v.postalCode ? ` · ${v.postalCode}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => assignVolunteer(v.id)}
                  className="inline-flex items-center justify-center rounded-md bg-blue-600 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-blue-700"
                >
                  Assign
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

