import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function CoordinatorDashboardPage() {
  const tasks = await prisma.task.findMany({
    orderBy: { startTime: "asc" },
    include: {
      assignments: {
        where: {
          status: { in: ["PROPOSED", "ACCEPTED"] },
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

              const isFull = task.status === "FULL";

              return (
                <li
                  key={task.id}
                  className={`rounded-lg border px-4 py-3 text-sm ${
                    isFull ? "bg-zinc-100" : "bg-white"
                  }`}
                >
                  <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-medium">{task.title}</p>
                      <p className="text-xs text-zinc-600">
                        {task.location}
                        {task.postalCode ? ` · ${task.postalCode}` : ""}
                      </p>
                      <p className="mt-1 text-xs text-zinc-600">
                        {new Date(task.startTime).toLocaleString()} –{" "}
                        {new Date(task.endTime).toLocaleString()}
                      </p>
                    </div>
                    <div className="mt-2 flex flex-col items-start gap-1 text-xs md:mt-0 md:items-end">
                      <span>
                        {filled}/{total} confirmed
                        {proposedCount > 0
                          ? ` (+${proposedCount} proposed)`
                          : ""}
                      </span>
                      <div className="h-2 w-40 overflow-hidden rounded-full bg-zinc-200">
                        <div
                          className={`h-full ${
                            isFull ? "bg-green-600" : "bg-blue-600"
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <span className="text-[11px] text-zinc-500">
                        Status: {task.status.toLowerCase()}
                      </span>
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

