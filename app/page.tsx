import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-center gap-10 px-4 py-10">
      <section className="space-y-3 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">
          Volunteer Matching Prototype
        </h1>
        <p className="mx-auto max-w-xl text-sm text-zinc-600">
          Switch between the volunteer and coordinator perspectives to explore
          registration, matching, and capacity-aware assignment flows. No login
          is required.
        </p>
      </section>

      <section className="grid w-full max-w-3xl gap-6 md:grid-cols-2">
        <div className="flex flex-col justify-between rounded-xl border bg-white px-5 py-5 shadow-sm">
          <div className="space-y-2">
            <h2 className="text-base font-semibold">Volunteer view</h2>
            <p className="text-sm text-zinc-600">
              Register as a spontaneous volunteer and respond to mission
              proposals sent by coordinators.
            </p>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/volunteer/register"
              className="inline-flex flex-1 items-center justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Register as volunteer
            </Link>
            <Link
              href="/volunteer/dashboard"
              className="inline-flex flex-1 items-center justify-center rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-100"
            >
              My missions
            </Link>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-xl border bg-white px-5 py-5 shadow-sm">
          <div className="space-y-2">
            <h2 className="text-base font-semibold">Coordinator view</h2>
            <p className="text-sm text-zinc-600">
              Create tasks, monitor capacity at a glance, and use manual,
              semi-automatic, or automatic matching modes.
            </p>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/coordinator/dashboard"
              className="inline-flex flex-1 items-center justify-center rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Open dashboard
            </Link>
            <Link
              href="/coordinator/tasks/new"
              className="inline-flex flex-1 items-center justify-center rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-100"
            >
              Create task
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
