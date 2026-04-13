import Link from "next/link";
import { CoordinatorOnboarding } from "@/app/components/CoordinatorOnboarding";
import { CoordinatorAuthGuard } from "@/app/components/CoordinatorAuthGuard";
import { TaskList } from "@/app/components/TaskList";

export default function CoordinatorDashboardPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 px-4 py-10">
      <CoordinatorAuthGuard />
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
        <TaskList />
      </section>
    </main>
  );
}
