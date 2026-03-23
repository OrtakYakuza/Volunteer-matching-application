import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { AssignmentStatus, Priority, TaskStatus } from "@/lib/enums";
import { CoordinatorOnboarding } from "@/app/components/CoordinatorOnboarding";

export default async function CoordinatorDashboardPage() {
  // In a real app we would pass initial state to a client component, 
  // but since this is async, we'll wrap the content in a client component.
  const tasks = await prisma.task.findMany({
    orderBy: { startTime: "asc" },
    include: {
      assignments: {
        where: {
          status: { in: [AssignmentStatus.PROPOSED, AssignmentStatus.ACCEPTED] },
        },
      },
    },
  });

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 px-4 py-10">
      <header className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold">Coordinator dashboard</h1>
          <p className="text-sm text-zinc-600">
            At-a-glance view of current tasks and volunteer capacity.
          </p>
        </div>
        <Link
          href="/coordinator/tasks/new"
          className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Create task
        </Link>
      </header>

      <CoordinatorOnboarding />

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Active tasks</h2>
        {tasks.length === 0 ? (
          <p className="text-xs text-zinc-600">
            No tasks created yet. Start by creating a new task.
          </p>
        ) : (
          <ul className="space-y-3">
            {tasks.map((task) => {
              const acceptedCount = task.assignments.filter(
                (a) => a.status === "ACCEPTED",
              ).length;
              const proposedCount = task.assignments.filter(
                (a) => a.status === "PROPOSED",
              ).length;
              const total = task.capacity;
              const filled = acceptedCount;
              const percent = Math.min(
                100,
                total > 0 ? Math.round((filled / total) * 100) : 0,
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
                          className={`absolute top-0 left-0 h-full ${
                            isFull ? "bg-green-500" : "bg-blue-200"
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-zinc-800 drop-shadow-sm">
                           {isFull ? "✓ FULL" : `${filled} / ${total}`}
                        </span>
                      </div>
                      {proposedCount > 0 && (
                        <span className="text-[10px] font-medium text-yellow-700 bg-yellow-50 px-2 rounded-full border border-yellow-200">
                          {proposedCount} pending
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <Link
                      href={`/coordinator/tasks/${task.id}`}
                      className="text-xs font-medium text-blue-600 hover:underline"
                    >
                      Open task
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}

