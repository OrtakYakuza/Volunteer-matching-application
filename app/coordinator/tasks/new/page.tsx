"use client";

import { FormEvent, useState } from "react";
import { Priority, Skill, AutomationMode } from "@/lib/enums";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CoordinatorAuthGuard } from "@/app/components/CoordinatorAuthGuard";
import { AutomationModeEvaluator } from "@/app/components/AutomationModeEvaluator";

const ALL_SKILLS: { value: Skill; label: string }[] = [
  { value: Skill.HEAVY_PHYSICAL, label: "Heavy physical work" },
  { value: Skill.MEDIUM_PHYSICAL, label: "Medium physical work" },
  { value: Skill.LIGHT_PHYSICAL, label: "Light physical work" },
  { value: Skill.MEDICAL, label: "Medical" },
  { value: Skill.TRANSLATION, label: "Translation" },
  { value: Skill.CHILDCARE, label: "Childcare" },
  { value: Skill.ADMINISTRATION, label: "Administration / paperwork" },
  { value: Skill.INFORMATION_RETRIEVAL, label: "Information / documentation" },
];

export default function NewTaskPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [capacity, setCapacity] = useState<number | "">("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [priority, setPriority] = useState<Priority>(Priority.MEDIUM);
  const [automationMode, setAutomationMode] = useState<AutomationMode>(AutomationMode.MANUAL);
  const [meetingPoint, setMeetingPoint] = useState("");
  const [screeningRequired, setScreeningRequired] = useState(false);
  const [screeningNote, setScreeningNote] = useState("");
  const [requiredSkills, setRequiredSkills] = useState<Skill[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleSkill = (skill: Skill) => {
    setRequiredSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill],
    );
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          category,
          description,
          location,
          postalCode: postalCode || undefined,
          requiredSkills,
          capacity: typeof capacity === "number" ? capacity : Number(capacity),
          startTime,
          endTime,
          priority,
          automationMode,
          meetingPoint: meetingPoint || undefined,
          screeningRequired,
          screeningNote: screeningNote || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Failed to create task.");
        return;
      }

      router.push("/coordinator/dashboard");
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-8 px-4 py-10">
      <CoordinatorAuthGuard />
      <Link href="/coordinator/dashboard" className="inline-flex items-center justify-center rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 w-fit transition-colors">
        ← Back to Dashboard
      </Link>
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Create task</h1>
        <p className="text-sm text-zinc-600">
          Define a clear mission with capacity and required skills so volunteers
          can be matched efficiently.
        </p>
      </header>

      <form onSubmit={onSubmit} className="space-y-6 rounded-lg border p-6">
        <section className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-1 md:col-span-2">
            <label className="text-sm font-medium" htmlFor="title">
              Title
            </label>
            <input
              id="title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium" htmlFor="category">
              Category
            </label>
            <input
              id="category"
              type="text"
              required
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium" htmlFor="capacity">
              Capacity (max volunteers)
            </label>
            <input
              id="capacity"
              type="number"
              min={1}
              required
              value={capacity}
              onChange={(e) =>
                setCapacity(e.target.value ? Number(e.target.value) : "")
              }
              className="rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex flex-col gap-1 md:col-span-2">
            <label className="text-sm font-medium" htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[96px] rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium" htmlFor="location">
              Location (address / site)
            </label>
            <input
              id="location"
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium" htmlFor="postalCode">
              Postal code
            </label>
            <input
              id="postalCode"
              type="text"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              className="rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium" htmlFor="startTime">
              Start time
            </label>
            <input
              id="startTime"
              type="datetime-local"
              required
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium" htmlFor="endTime">
              End time
            </label>
            <input
              id="endTime"
              type="datetime-local"
              required
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold">Required skills</h2>
          <div className="grid gap-2 md:grid-cols-2">
            {ALL_SKILLS.map((skill) => (
              <button
                key={skill.value}
                type="button"
                onClick={() => toggleSkill(skill.value)}
                className={`flex items-center justify-between rounded-md border px-3 py-2 text-sm ${
                  requiredSkills.includes(skill.value)
                    ? "border-blue-500 bg-blue-50"
                    : "border-zinc-200 bg-white"
                }`}
              >
                <span>{skill.label}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium" htmlFor="priority">
              Priority
            </label>
            <select
              id="priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              className="rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={Priority.LOW}>Low</option>
              <option value={Priority.MEDIUM}>Medium</option>
              <option value={Priority.HIGH}>High</option>
              <option value={Priority.CRITICAL}>Critical</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium" htmlFor="meetingPoint">
              Meeting point (optional)
            </label>
            <input
              id="meetingPoint"
              type="text"
              value={meetingPoint}
              onChange={(e) => setMeetingPoint(e.target.value)}
              className="rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              id="screeningRequired"
              type="checkbox"
              checked={screeningRequired}
              onChange={(e) => setScreeningRequired(e.target.checked)}
              className="h-4 w-4"
            />
            <label className="text-sm font-medium" htmlFor="screeningRequired">
              Screening/background check required
            </label>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium" htmlFor="screeningNote">
              Screening note (optional)
            </label>
            <input
              id="screeningNote"
              type="text"
              value={screeningNote}
              onChange={(e) => setScreeningNote(e.target.value)}
              className="rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </section>

        <section className="flex flex-col gap-2">
          <label className="text-sm font-medium">Automation Mode (Delegation of Control)</label>
          <p className="text-xs text-zinc-500">
            Choose how volunteer applications are processed. Use &ldquo;Guide me&rdquo; to get a
            recommendation based on the task&rsquo;s risk profile.
          </p>
          <AutomationModeEvaluator
            value={automationMode}
            onChange={setAutomationMode}
            taskPriority={priority}
          />
        </section>

        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
        >
          {submitting ? "Creating..." : "Create task"}
        </button>
      </form>
    </main>
  );
}

