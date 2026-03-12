import { prisma } from "@/lib/prisma";

export default async function EventsPage() {
  const events = await prisma.eventLog.findMany({
    orderBy: { timestamp: "desc" },
    take: 100,
  });

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-4 py-10">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Event log (prototype)</h1>
        <p className="text-sm text-zinc-600">
          Raw history of recent actions for audit and thesis screenshots.
        </p>
      </header>

      <section className="rounded-lg border">
        <table className="w-full text-left text-xs">
          <thead className="border-b bg-zinc-50">
            <tr>
              <th className="px-3 py-2">Time</th>
              <th className="px-3 py-2">Actor</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Details</th>
            </tr>
          </thead>
          <tbody>
            {events.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-3 text-zinc-600">
                  No events recorded yet.
                </td>
              </tr>
            ) : (
              events.map((event) => (
                <tr key={event.id} className="border-b last:border-0">
                  <td className="px-3 py-2">
                    {new Date(event.timestamp).toLocaleString()}
                  </td>
                  <td className="px-3 py-2">{event.actorType}</td>
                  <td className="px-3 py-2">{event.eventType}</td>
                  <td className="px-3 py-2">
                    <code className="whitespace-pre-wrap text-[10px] text-zinc-700">
                      {event.payload
                        ? JSON.stringify(event.payload, null, 2)
                        : "-"}
                    </code>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </main>
  );
}

