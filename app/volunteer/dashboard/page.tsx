"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AssignmentStatus, TaskStatus } from "@/lib/enums";

type Volunteer = {
  id: string;
  name: string;
  email: string;
};

type Task = {
  id: string;
  title: string;
  description: string;
  location: string;
  postalCode: string | null;
  startTime: string;
  endTime: string;
  status: TaskStatus;
  meetingPoint: string | null;
};

type Assignment = {
  id: string;
  status: AssignmentStatus;
  createdAt: string;
  task: Task;
};

export default function VolunteerDashboardPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [, setVolunteer] = useState<Volunteer | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const volunteerIdFromQuery = searchParams.get("volunteerId");

  useEffect(() => {
    if (volunteerIdFromQuery) {
      fetchAssignments(volunteerIdFromQuery);
      // We do not fetch volunteer details here to keep this simple.
    }
  }, [volunteerIdFromQuery]);

  const lookupByEmail = async () => {
    setLoading(true);
    setError(null);
    setActionError(null);
    try {
      const response = await fetch("/api/volunteers/lookup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Could not find a volunteer for this email.");
        return;
      }

      const v: Volunteer = data.volunteer;
      setVolunteer(v);
      router.push(`/volunteer/dashboard?volunteerId=${encodeURIComponent(v.id)}`);
    } catch (err) {
      console.error(err);
      setError("Failed to look up volunteer. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignments = async (volunteerId: string) => {
    setLoading(true);
    setError(null);
    setActionError(null);
    try {
      const response = await fetch(`/api/volunteers/${volunteerId}/assignments`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Failed to load assignments.");
        return;
      }

      setAssignments(data.assignments ?? []);
    } catch (err) {
      console.error(err);
      setError("Failed to load assignments.");
    } finally {
      setLoading(false);
    }
  };

  const updateAssignmentStatus = async (
    assignmentId: string,
    status: AssignmentStatus,
  ) => {
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

      setAssignments((prev) =>
        prev.map((a) => (a.id === assignmentId ? { ...a, status } : a)),
      );
    } catch (err) {
      console.error(err);
      setActionError("Failed to update assignment.");
    }
  };

  const proposedAssignments = assignments.filter(
    (a) => a.status === AssignmentStatus.PROPOSED,
  );
  const acceptedAssignments = assignments.filter(
    (a) => a.status === AssignmentStatus.ACCEPTED,
  );
  const completedAssignments = assignments.filter(
    (a) => a.status === AssignmentStatus.COMPLETED,
  );

  const hasVolunteer = Boolean(volunteerIdFromQuery);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-8 px-4 py-10">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Your missions</h1>
        <p className="text-sm text-zinc-600">
          This page only shows assignments that have been coordinated for you.
        </p>
      </header>

      {!hasVolunteer && (
        <section className="space-y-4 rounded-lg border p-6">
          <h2 className="text-sm font-semibold">
            Identify yourself by email (no password)
          </h2>
          <p className="text-xs text-zinc-600">
            Enter the email you used when registering as a volunteer. We will
            show any mission proposals or confirmed assignments linked to it.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="email"
              placeholder="you@example.org"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={lookupByEmail}
              disabled={loading || !email}
              className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? "Looking up..." : "Show my missions"}
            </button>
          </div>
          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
        </section>
      )}

      {hasVolunteer && (
        <section className="space-y-6">
          {actionError && (
            <p className="text-sm text-red-600" role="alert">
              {actionError}
            </p>
          )}

          <AssignmentsSection
            title="Mission proposals awaiting your decision"
            emptyText="You have no open mission proposals at the moment."
            assignments={proposedAssignments}
            showActions
            onAction={updateAssignmentStatus}
          />

          <AssignmentsSection
            title="Upcoming confirmed missions"
            emptyText="You have no confirmed missions yet."
            assignments={acceptedAssignments}
          />

          <AssignmentsSection
            title="Completed missions"
            emptyText="Completed missions will appear here for reference."
            assignments={completedAssignments}
          />
        </section>
      )}
    </main>
  );
}

type AssignmentsSectionProps = {
  title: string;
  emptyText: string;
  assignments: Assignment[];
  showActions?: boolean;
  onAction?: (id: string, status: AssignmentStatus) => void;
};

function AssignmentsSection({
  title,
  emptyText,
  assignments,
  showActions,
  onAction,
}: AssignmentsSectionProps) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold">{title}</h2>
      {assignments.length === 0 ? (
        <p className="text-xs text-zinc-600">{emptyText}</p>
      ) : (
        <ul className="space-y-3">
          {assignments.map((assignment) => (
            <li
              key={assignment.id}
              className="rounded-lg border px-4 py-3 text-sm"
            >
              <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-medium">{assignment.task.title}</p>
                  <p className="text-xs text-zinc-600">
                    {assignment.task.location}
                    {assignment.task.postalCode
                      ? ` · ${assignment.task.postalCode}`
                      : ""}
                  </p>
                  <p className="mt-1 text-xs text-zinc-600">
                    {new Date(assignment.task.startTime).toLocaleString()} –{" "}
                    {new Date(assignment.task.endTime).toLocaleString()}
                  </p>
                  {assignment.task.meetingPoint && (
                    <p className="mt-1 text-xs text-zinc-600">
                      Meeting point: {assignment.task.meetingPoint}
                    </p>
                  )}
                </div>
                {showActions && onAction && (
                  <div className="mt-3 flex gap-2 md:mt-0 md:flex-col">
                    <button
                      type="button"
                      onClick={() =>
                        onAction(assignment.id, AssignmentStatus.ACCEPTED)
                      }
                      className="inline-flex items-center justify-center rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
                    >
                      Accept mission
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onAction(assignment.id, AssignmentStatus.DECLINED)
                      }
                      className="inline-flex items-center justify-center rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-800 hover:bg-zinc-100"
                    >
                      Decline
                    </button>
                  </div>
                )}
              </div>
              <p className="mt-2 text-xs text-zinc-700">
                {assignment.task.description}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

