"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { AssignmentStatus, Priority, TaskStatus } from "@/lib/enums";
import Link from "next/link";

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
  requiredSkills: string; // JSON string
};

type Assignment = {
  id: string;
  status: AssignmentStatus;
  volunteerId: string;
};

type TaskResponse = {
  task: Task & { assignments: Assignment[] };
  acceptedCount: number;
};

export default function VolunteerTaskDetailPage() {
  const params = useParams<{ id: string }>();
  const taskId = params.id;
  const router = useRouter();
  const { user, isHydrated } = useAuth();
  
  const [taskInfo, setTaskInfo] = useState<TaskResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (isHydrated && !user) {
      router.push("/");
    }
  }, [user, isHydrated, router]);

  useEffect(() => {
    if (taskId && user) {
      loadTask();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId, user]);

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

  const applyForTask = async () => {
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
      await loadTask();
    } catch (err) {
      console.error(err);
      setActionError("Failed to apply for task.");
    }
  };

  if (!isHydrated || !user) return null;

  if (loading || !taskInfo) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center px-4 py-10">
        {error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : (
          <p className="text-sm text-zinc-600">Loading task details…</p>
        )}
      </main>
    );
  }

  const { task, acceptedCount } = taskInfo;
  
  // Check if the current user has applied
  const myAssignment = task.assignments.find(a => a.volunteerId === user.id);
  const hasApplied = Boolean(myAssignment);
  const isFull = task.status === TaskStatus.FULL || acceptedCount >= task.capacity;

  let requiredSkillsList: string[] = [];
  try {
    requiredSkillsList = JSON.parse(task.requiredSkills);
  } catch (e) {
    console.error("Failed to parse skills", e);
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-8 px-4 py-10">
      <Link href="/volunteer/dashboard" className="inline-flex items-center justify-center rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 w-fit transition-colors">
        ← Back to Dashboard
      </Link>

      <div className="border rounded-xl p-6 bg-white shadow-sm space-y-6">
        <header className="space-y-4 border-b pb-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">{task.title}</h1>
              <p className="text-sm text-zinc-500 font-medium mt-1">{task.category}</p>
            </div>
            {myAssignment && (
               <span className={`px-3 py-1 text-xs font-bold rounded-full border ${
                 myAssignment.status === AssignmentStatus.ACCEPTED ? "bg-green-100 text-green-800 border-green-200" :
                 myAssignment.status === AssignmentStatus.PROPOSED ? "bg-yellow-100 text-yellow-800 border-yellow-200" :
                 myAssignment.status === AssignmentStatus.DECLINED ? "bg-red-100 text-red-800 border-red-200" :
                 "bg-zinc-100 text-zinc-800 border-zinc-200"
               }`}>
                 Status: {myAssignment.status}
               </span>
            )}
          </div>
        </header>

        <section className="space-y-4">
          <div>
            <h2 className="text-xs font-semibold uppercase text-zinc-500 tracking-wider mb-2">Description</h2>
            <p className="text-sm text-zinc-800 leading-relaxed">{task.description}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
            <div>
               <h2 className="text-xs font-semibold uppercase text-zinc-500 tracking-wider mb-2">Time & Location</h2>
               <ul className="space-y-2 text-sm text-zinc-800">
                 <li className="flex items-center gap-2"><span>📅</span> {new Date(task.startTime).toLocaleDateString()}</li>
                 <li className="flex items-center gap-2"><span>⏰</span> {new Date(task.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(task.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</li>
                 <li className="flex items-center gap-2"><span>📍</span> {task.location} {task.postalCode ? `(${task.postalCode})` : ""}</li>
                 {task.meetingPoint && <li className="flex items-center gap-2"><span>🎯</span> {task.meetingPoint}</li>}
               </ul>
            </div>
            
            <div>
               <h2 className="text-xs font-semibold uppercase text-zinc-500 tracking-wider mb-2">Requirements</h2>
               <ul className="space-y-2 text-sm text-zinc-800">
                 <li className="flex items-center gap-2"><span>👥</span> {acceptedCount} / {task.capacity} volunteers confirmed</li>
                 <li className="flex items-center gap-2"><span>⚠️</span> {task.priority} Priority</li>
               </ul>
               {requiredSkillsList.length > 0 && (
                 <div className="mt-3">
                   <span className="text-xs font-medium text-zinc-600 block mb-1">Required Skills:</span>
                   <div className="flex flex-wrap gap-1">
                     {requiredSkillsList.map(skill => (
                       <span key={skill} className="px-2 py-0.5 bg-zinc-100 border text-[10px] rounded text-zinc-700">
                         {skill}
                       </span>
                     ))}
                   </div>
                 </div>
               )}
            </div>
          </div>
        </section>

        {!hasApplied && (
          <div className="pt-6 border-t">
            {actionError && (
              <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200 mb-4" role="alert">
                {actionError}
              </p>
            )}
            {actionSuccess && (
              <p className="text-sm text-green-700 bg-green-50 p-3 rounded-md border border-green-200 mb-4" role="status">
                {actionSuccess}
              </p>
            )}
            
            {isFull ? (
              <div className="p-4 bg-zinc-50 border rounded-lg text-center">
                <p className="text-sm font-medium text-zinc-600">This task has reached its required capacity.</p>
              </div>
            ) : (
              <button
                onClick={applyForTask}
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-md bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 transition"
              >
                Apply for this Mission
              </button>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
