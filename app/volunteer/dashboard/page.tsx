"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AssignmentStatus, TaskStatus, Skill } from "@/lib/enums";
import { TaskFilterState, EMPTY_FILTER, filterTasks, parseSkills } from "@/lib/task-filter";
import { TaskFilterBar } from "@/app/components/TaskFilterBar";
import { useAuth } from "@/app/context/AuthContext";
import Link from "next/link";

type Task = {
  id: string;
  title: string;
  description: string;
  location: string;
  postalCode: string | null;
  requiredSkills: string;
  startTime: string;
  endTime: string;
  status: TaskStatus;
  meetingPoint: string | null;
  capacity: number;
};

type Assignment = {
  id: string;
  status: AssignmentStatus;
  createdAt: string;
  task: Task;
};

export default function VolunteerDashboardPage() {
  const router = useRouter();
  const { user, isHydrated } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<TaskFilterState>(EMPTY_FILTER);
  const [mySkills, setMySkills] = useState<Skill[]>([]);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (isHydrated && !user) {
      router.push("/");
    }
  }, [user, isHydrated, router]);

  const fetchAssignments = useCallback(async (volunteerId: string) => {
    try {
      const response = await fetch(`/api/volunteers/${volunteerId}/assignments`);
      const data = await response.json();
      if (response.ok) {
        setAssignments(data.assignments ?? []);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchAvailableTasks = useCallback(async () => {
    try {
      const response = await fetch(`/api/tasks`);
      const data = await response.json();
      if (response.ok) {
        // Filter out FULL and INACTIVE tasks
        const openTasks = data.tasks.filter(
          (t: Task) => t.status === TaskStatus.OPEN || t.status === TaskStatus.PARTIALLY_FILLED
        );
        setAvailableTasks(openTasks);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchAssignments(user.id);

      fetchAvailableTasks();
      fetch("/api/volunteers/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.volunteer?.skills) {
            setMySkills(parseSkills(data.volunteer.skills) as Skill[]);
          }
        })
        .catch(console.error);
    }
  }, [user, fetchAssignments, fetchAvailableTasks]);

  const applyForTask = async (taskId: string) => {
    if (!user) return;
    setActionError(null);
    setActionSuccess(null);
    try {
      const response = await fetch(`/api/tasks/${taskId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ volunteerId: user.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        setActionError(data.error ?? "Failed to apply for task.");
        return;
      }

      setActionSuccess("Successfully applied! Your application is pending review or auto-accepted.");
      fetchAssignments(user.id);
      fetchAvailableTasks();
    } catch (err) {
      console.error(err);
      setActionError("Failed to apply for task.");
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

  const hasVolunteer = Boolean(user);

  if (!isHydrated || !hasVolunteer) return null;

  // Filter out tasks the user has already applied for
  const appliedTaskIds = new Set(assignments.map(a => a.task.id));
  const visibleTasks = availableTasks.filter(t => !appliedTaskIds.has(t.id));
  const filteredTasks = filterTasks(visibleTasks, filter);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 px-4 py-10">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Volunteer Dashboard</h1>
        <p className="text-sm text-zinc-600">
          Find opportunities and manage your missions. Welcome, {user?.name}.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Available Tasks</h2>
            </div>
            
            {actionError && (
              <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200" role="alert">
                {actionError}
              </p>
            )}
            {actionSuccess && (
              <p className="text-sm text-green-700 bg-green-50 p-3 rounded-md border border-green-200" role="status">
                {actionSuccess}
              </p>
            )}

            <TaskFilterBar
              value={filter}
              onChange={setFilter}
              onUseMySkills={() => setFilter({ ...filter, skills: mySkills })}
              mySkillsCount={mySkills.length}
            />

            {filteredTasks.length === 0 ? (
              <p className="text-sm text-zinc-500 italic">
                {visibleTasks.length === 0
                  ? "No available tasks right now."
                  : "No tasks match the current filter."}
              </p>
            ) : (
              <ul className="space-y-4">
                {filteredTasks.map((task) => (
                  <li key={task.id} className="rounded-lg border p-4 shadow-sm bg-white">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold">{task.title}</h3>
                      <Link
                        href={`/volunteer/tasks/${task.id}`}
                        className="bg-zinc-100 text-zinc-700 border text-xs px-3 py-1.5 rounded hover:bg-zinc-200 transition font-medium mr-2"
                      >
                        Details
                      </Link>
                      <button
                        onClick={() => applyForTask(task.id)}
                        className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded hover:bg-blue-700 transition"
                      >
                        Apply
                      </button>
                    </div>
                    <p className="text-xs text-zinc-600 mb-4 line-clamp-2">{task.description}</p>
                    <div className="text-xs text-zinc-500 flex flex-wrap gap-x-4 gap-y-2">
                      <span className="flex items-center gap-1">📍 {task.location}</span>
                      <span className="flex items-center gap-1">👥 {task.capacity} vols needed</span>
                      <span className="flex items-center gap-1">
                        📅 {new Date(task.startTime).toLocaleDateString()}
                        {" "}•{" "}
                        {new Date(task.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="space-y-6 bg-zinc-50 p-6 rounded-xl border sticky top-24">
            <h2 className="text-lg font-semibold border-b pb-2">My Applications & Missions</h2>
            
            <AssignmentsSection
              title="Pending Applications"
              emptyText="You have no pending applications."
              assignments={proposedAssignments}
              statusColor="text-yellow-700 bg-yellow-50 border-yellow-200"
              statusText="Review Pending"
            />

            <AssignmentsSection
              title="Confirmed Missions"
              emptyText="You have no confirmed missions yet."
              assignments={acceptedAssignments}
              statusColor="text-green-700 bg-green-50 border-green-200"
              statusText="Confirmed"
            />

            <AssignmentsSection
              title="Completed Missions"
              emptyText="Completed missions will appear here."
              assignments={completedAssignments}
              statusColor="text-zinc-600 bg-zinc-100 border-zinc-200"
              statusText="Completed"
            />
          </section>
        </div>
    </main>
  );
}

type AssignmentsSectionProps = {
  title: string;
  emptyText: string;
  assignments: Assignment[];
  statusColor: string;
  statusText: string;
};

function AssignmentsSection({
  title,
  emptyText,
  assignments,
  statusColor,
  statusText
}: AssignmentsSectionProps) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold text-zinc-800">{title}</h3>
      {assignments.length === 0 ? (
        <p className="text-xs text-zinc-500 italic">{emptyText}</p>
      ) : (
        <ul className="space-y-3">
          {assignments.map((assignment) => (
            <li
              key={assignment.id}
              className="rounded-lg border bg-white px-4 py-3 text-sm shadow-sm"
            >
              <div className="flex justify-between items-start mb-1">
                <Link href={`/volunteer/tasks/${assignment.task.id}`} className="font-medium hover:underline text-blue-700">
                  {assignment.task.title}
                </Link>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${statusColor} flex items-center gap-1`}>
                  {statusText === 'Review Pending' && <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse"></span>}
                  {statusText === 'Confirmed' && <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>}
                  {statusText}
                </span>
              </div>
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
                <p className="mt-1 text-xs text-zinc-600 font-medium">
                  Meeting point: {assignment.task.meetingPoint}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
