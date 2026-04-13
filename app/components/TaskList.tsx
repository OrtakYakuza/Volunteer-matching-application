"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Priority, TaskStatus } from "@/lib/enums";

type Assignment = {
  id: string;
  status: string;
};

type Task = {
  id: string;
  title: string;
  location: string;
  startTime: string;
  capacity: number;
  status: string;
  priority: string;
  automationMode: string;
  assignments: Assignment[];
};

export function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch("/api/tasks");
      const data = await res.json() as { tasks: Task[] };
      setTasks(data.tasks ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount and every time the window regains focus (e.g. navigating back).
  useEffect(() => {
    fetchTasks();
    window.addEventListener("focus", fetchTasks);
    return () => window.removeEventListener("focus", fetchTasks);
  }, [fetchTasks]);

  if (loading) {
    return <p className="text-xs text-zinc-500">Loading tasks...</p>;
  }

  if (tasks.length === 0) {
    return (
      <p className="text-xs text-zinc-600">
        No tasks created yet. Start by creating a new task.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {tasks.map((task) => {
        const acceptedCount = task.assignments.filter(
          (a) => a.status === "ACCEPTED",
        ).length;
        const proposedCount = task.assignments.filter(
          (a) => a.status === "PROPOSED",
        ).length;
        const total = task.capacity;
        const percent = Math.min(
          100,
          total > 0 ? Math.round((acceptedCount / total) * 100) : 0,
        );

        const isFull = task.status === TaskStatus.FULL;
        const isCritical = task.priority === Priority.CRITICAL;

        return (
          <li
            key={task.id}
            className={`rounded-lg border px-4 py-3 text-sm transition-colors ${
              isFull
                ? "bg-zinc-100 border-zinc-200"
                : isCritical
                  ? "bg-red-50 border-red-200 shadow-sm"
                  : "bg-white"
            }`}
          >
            <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-zinc-900">{task.title}</p>
                  {isCritical && !isFull && (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
                      CRITICAL
                    </span>
                  )}
                  <span className="rounded-full border border-zinc-300 bg-zinc-50 px-2 py-0.5 text-[10px] font-medium text-zinc-600">
                    {task.automationMode}
                  </span>
                </div>
                <p className="text-xs text-zinc-600 mt-1 flex items-center gap-2">
                  <span>📍 {task.location}</span>
                  <span>•</span>
                  <span>📅 {new Date(task.startTime).toLocaleDateString()}</span>
                </p>
              </div>
              <div className="mt-2 flex flex-col items-start gap-1 text-xs md:mt-0 md:items-end">
                <div className="relative h-4 w-40 overflow-hidden rounded-full bg-zinc-200 border border-zinc-300">
                  <div
                    className={`absolute top-0 left-0 h-full transition-all duration-300 ${
                      isFull ? "bg-green-500" : "bg-blue-400"
                    }`}
                    style={{ width: `${percent}%` }}
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-zinc-800 drop-shadow-sm">
                    {isFull ? "✓ FULL" : `${acceptedCount} / ${total}`}
                  </span>
                </div>
                {proposedCount > 0 && (
                  <span className="text-[10px] font-medium text-yellow-700 bg-yellow-50 px-2 rounded-full border border-yellow-200">
                    {proposedCount} pending
                  </span>
                )}
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Link
                href={`/coordinator/tasks/${task.id}`}
                className="text-xs font-medium text-blue-600 hover:underline flex items-center gap-1"
              >
                Manage task →
              </Link>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
