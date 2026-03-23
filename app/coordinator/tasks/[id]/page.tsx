"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AssignmentStatus, Priority, Skill, TaskStatus } from "@/lib/enums";
import { VolunteerProfileCard } from "@/app/components/VolunteerProfileCard";

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
  automationMode: string;
};

type TaskResponse = {
  task: Task & { assignments: Assignment[] };
  acceptedCount: number;
};

type Suggestion = {
  volunteer: Volunteer;
  score: number;
  explanation: string;
  assignmentId: string;
};

export default function TaskDetailPage() {
  const params = useParams<{ id: string }>();
  const taskId = params.id;
  const [taskInfo, setTaskInfo] = useState<TaskResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [visibleSuggestions, setVisibleSuggestions] = useState(5);
  const [visibleAssignments, setVisibleAssignments] = useState(5);
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

  const updateAssignmentStatus = async (assignmentId: string, status: AssignmentStatus) => {
    setActionError(null);
    try {
      const response = await fetch(`/api/assignments/${assignmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (!response.ok) {
        setActionError(data.error ?? "Failed to update assignment.");
        return;
      }
      await loadTask();
      // Remove from suggestions list if they were there
      setSuggestions(prev => prev.filter(s => s.assignmentId !== assignmentId));
    } catch (err) {
      console.error(err);
      setActionError("Failed to update assignment.");
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
    setActionSuccess(null);
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
      const count = data.updatedAssignments?.length || 0;
      setActionSuccess(`Post-Action Summary: Shift processed. ${count} volunteers were automatically assigned from the applicant pool.`);
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
      <header className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">{task.title}</h1>
            <p className="text-sm text-zinc-600 mt-1">
              {task.location}
              {task.postalCode ? ` · ${task.postalCode}` : ""} ·{" "}
              {new Date(task.startTime).toLocaleString()} –{" "}
              {new Date(task.endTime).toLocaleString()}
            </p>
            <p className="text-xs text-zinc-600 mt-1">
              Priority: {task.priority.toLowerCase()} · Status:{" "}
              {task.status.toLowerCase()}
            </p>
            {task.meetingPoint && (
              <p className="text-xs text-zinc-600 mt-1">
                Meeting point: {task.meetingPoint}
              </p>
            )}
          </div>
          
          <div className="flex flex-col items-start md:items-end gap-1 border p-3 rounded-lg bg-zinc-50 min-w-[250px]">
            <span className="text-xs font-semibold uppercase text-zinc-500 tracking-wider">Mode</span>
            <span className="text-sm font-bold text-blue-700">
              {task.automationMode === "MANUAL" && "Manual (High Risk)"}
              {task.automationMode === "SEMI_AUTO" && "Semi-Auto (Medium Risk)"}
              {task.automationMode === "AUTO" && "Automatic (Low Risk)"}
            </span>
            <p className="text-[11px] text-zinc-600 mt-1 max-w-[220px] text-left md:text-right">
              {task.automationMode === "MANUAL" && "Requires full human vetting. Talk to volunteers before accepting."}
              {task.automationMode === "SEMI_AUTO" && "System scores candidates. Human approves the best matches directly in UI."}
              {task.automationMode === "AUTO" && "Supervisory control. Trigger Auto-fill below to instantly accept valid candidates."}
            </p>
          </div>
        </div>
      </header>

      {actionError && (
        <p className="text-sm text-red-600" role="alert">
          {actionError}
        </p>
      )}

      {actionSuccess && (
        <p className="text-sm text-green-700 bg-green-50 p-3 rounded-md border border-green-200" role="status">
          {actionSuccess}
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
              task.assignments.slice(0, visibleAssignments).map((assignment) => (
                <VolunteerProfileCard
                  key={assignment.id}
                  volunteer={assignment.volunteer}
                  status={assignment.status}
                  warningNote={assignment.status === AssignmentStatus.PROPOSED && task.automationMode === "MANUAL" ? "Needs offline vetting" : undefined}
                  actionButtons={
                    <>
                      {assignment.status === AssignmentStatus.PROPOSED && task.automationMode === "MANUAL" && (
                        <>
                          <a
                            href={`mailto:${assignment.volunteer.email}?subject=Regarding your application for: ${task.title}&body=Hello ${assignment.volunteer.name},%0D%0A%0D%0AThank you for applying for the task: ${task.title}.%0D%0A%0D%0AWe would like to briefly discuss this mission with you before confirming your assignment.%0D%0A%0D%0APlease let us know when you are available for a quick chat.%0D%0A%0D%0ABest regards,%0D%0ACoordinator`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center rounded-md border border-blue-300 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 transition"
                          >
                            Contact
                          </a>
                          <button
                            type="button"
                            onClick={() => updateAssignmentStatus(assignment.id, AssignmentStatus.ACCEPTED)}
                            className="inline-flex items-center justify-center rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 transition"
                          >
                            Accept
                          </button>
                          <button
                            type="button"
                            onClick={() => updateAssignmentStatus(assignment.id, AssignmentStatus.DECLINED)}
                            className="inline-flex items-center justify-center rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-800 hover:bg-zinc-100 transition"
                          >
                            Decline
                          </button>
                        </>
                      )}
                      {assignment.status === AssignmentStatus.PROPOSED && task.automationMode === "AUTO" && (
                         <div className="flex items-center gap-2">
                           <span className="text-[10px] text-zinc-500 italic">Waiting for auto-fill...</span>
                           <button
                              type="button"
                              onClick={() => updateAssignmentStatus(assignment.id, AssignmentStatus.DECLINED)}
                              className="text-[10px] text-red-600 hover:underline"
                            >
                              Remove
                            </button>
                         </div>
                      )}
                      {assignment.status === AssignmentStatus.ACCEPTED && (
                        <button
                          type="button"
                          onClick={() => updateAssignmentStatus(assignment.id, AssignmentStatus.DECLINED)}
                          className="text-[10px] text-red-600 hover:underline"
                        >
                          Remove
                        </button>
                      )}
                    </>
                  }
                />
              ))
            )}
          
            {task.assignments.length > visibleAssignments && (
              <button
                type="button"
                onClick={() => setVisibleAssignments(prev => prev + 5)}
                className="w-full mt-2 py-2 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition"
              >
                Show more assignments ({task.assignments.length - visibleAssignments} remaining)
              </button>
            )}
          </ul>
        </div>

        <div className="space-y-4 rounded-lg border p-4 text-sm bg-white">
          <h2 className="text-sm font-semibold">Automation controls</h2>
          
          {task.automationMode === "MANUAL" && (
            <div className="bg-orange-50 border border-orange-200 rounded p-3 text-xs text-orange-800">
              <p className="font-semibold mb-1">Manual Mode</p>
              <p>System scoring is disabled for this high-risk task. Please review the applicant list, contact them using the provided information, and manually accept or decline.</p>
            </div>
          )}

          {task.automationMode === "SEMI_AUTO" && (
            <>
              <p className="text-xs text-zinc-600">
                Let the system score and rank the pending applicants based on skills and proximity.
              </p>
              <button
                type="button"
                onClick={requestSuggestions}
                disabled={suggestionsLoading || capacityLeft <= 0}
                className="mt-2 w-full inline-flex items-center justify-center rounded-md bg-zinc-900 px-3 py-2 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
              >
                {suggestionsLoading ? "Scoring applicants…" : "Score & Rank Applicants"}
              </button>
            </>
          )}

          {task.automationMode === "AUTO" && (
            <>
              <p className="text-xs text-zinc-600">
                Trigger the matching engine to evaluate pending applicants and automatically fill the remaining capacity.
              </p>
              <button
                type="button"
                onClick={autoFill}
                disabled={capacityLeft <= 0}
                className="mt-2 w-full inline-flex items-center justify-center rounded-md bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-60 shadow-sm"
              >
                Run Auto-fill Batch
              </button>
            </>
          )}

          {suggestions.length > 0 && task.automationMode === "SEMI_AUTO" && (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-semibold text-blue-700">
                Top Matches (System Scored)
              </p>
              <ul className="space-y-2">
                {suggestions.slice(0, visibleSuggestions).map((s) => (
                  <VolunteerProfileCard
                    key={s.volunteer.id}
                    volunteer={s.volunteer}
                    explanation={s.explanation}
                    actionButtons={
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => updateAssignmentStatus(s.assignmentId, AssignmentStatus.ACCEPTED)}
                          className="inline-flex items-center justify-center rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 transition"
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          onClick={() => updateAssignmentStatus(s.assignmentId, AssignmentStatus.DECLINED)}
                          className="inline-flex items-center justify-center rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-800 hover:bg-zinc-100 transition"
                        >
                          Decline
                        </button>
                      </div>
                    }
                  />
                ))}
                            {suggestions.length > visibleSuggestions && (
                <button
                  type="button"
                  onClick={() => setVisibleSuggestions(prev => prev + 5)}
                  className="w-full mt-2 py-2 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition"
                >
                  Show more suggestions ({suggestions.length - visibleSuggestions} remaining)
                </button>
              )}
              </ul>
            </div>
          )}
        </div>
      </section>

      {task.automationMode === "MANUAL" && (
        <section className="space-y-3 rounded-lg border p-4 text-sm bg-white">
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
                <VolunteerProfileCard
                  key={v.id}
                  volunteer={v}
                  actionButtons={
                    <button
                      type="button"
                      onClick={() => assignVolunteer(v.id)}
                      className="inline-flex items-center justify-center rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                    >
                      Assign Manually
                    </button>
                  }
                />
              ))}
            </ul>
          )}
        </section>
      )}
    </main>
  );
}

