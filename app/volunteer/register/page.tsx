"use client";

import { FormEvent, useState } from "react";
import { Skill } from "@/lib/enums";

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

type AvailabilityBlockInput = {
  start: string;
  end: string;
};

export default function VolunteerRegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [location, setLocation] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<Skill[]>([]);
  const [availabilityBlocks, setAvailabilityBlocks] = useState<
    AvailabilityBlockInput[]
  >([{ start: "", end: "" }]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toggleSkill = (skill: Skill) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill],
    );
  };

  const handleAvailabilityChange = (
    index: number,
    field: "start" | "end",
    value: string,
  ) => {
    setAvailabilityBlocks((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addAvailabilityBlock = () => {
    setAvailabilityBlocks((prev) => [...prev, { start: "", end: "" }]);
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      const filteredBlocks = availabilityBlocks.filter(
        (b) => b.start && b.end,
      );

      const response = await fetch("/api/volunteers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          postalCode: postalCode || undefined,
          location: location || undefined,
          skills: selectedSkills,
          availabilityBlocks: filteredBlocks,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Registration failed.");
        return;
      }

      setMessage(data.message);
      setName("");
      setEmail("");
      setPostalCode("");
      setLocation("");
      setSelectedSkills([]);
      setAvailabilityBlocks([{ start: "", end: "" }]);
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-8 px-4 py-10">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">
          Volunteer Registration – Virtual VRC
        </h1>
        <p className="text-sm text-zinc-600">
          Please provide only the essential information so coordinators can
          match you to suitable tasks quickly.
        </p>
      </header>

      <form onSubmit={onSubmit} className="space-y-6 rounded-lg border p-6">
        <section className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium" htmlFor="name">
              Name
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
            <label className="text-sm font-medium" htmlFor="location">
              Location / area (optional)
            </label>
            <input
              id="location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold">Skills and capabilities</h2>
          <p className="text-xs text-zinc-600">
            Select everything you are comfortable doing. Coordinators will use
            this for matching.
          </p>
          <div className="grid gap-2 md:grid-cols-2">
            {ALL_SKILLS.map((skill) => (
              <button
                key={skill.value}
                type="button"
                onClick={() => toggleSkill(skill.value)}
                className={`flex items-center justify-between rounded-md border px-3 py-2 text-sm ${
                  selectedSkills.includes(skill.value)
                    ? "border-blue-500 bg-blue-50"
                    : "border-zinc-200 bg-white"
                }`}
              >
                <span>{skill.label}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold">Availability (optional)</h2>
          <p className="text-xs text-zinc-600">
            Add one or more time windows when you are available to help.
          </p>
          <div className="space-y-3">
            {availabilityBlocks.map((block, index) => (
              <div
                key={index}
                className="grid gap-3 rounded-md border px-3 py-3 md:grid-cols-2"
              >
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium" htmlFor={`start-${index}`}>
                    Start
                  </label>
                  <input
                    id={`start-${index}`}
                    type="datetime-local"
                    value={block.start}
                    onChange={(e) =>
                      handleAvailabilityChange(index, "start", e.target.value)
                    }
                    className="rounded-md border px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium" htmlFor={`end-${index}`}>
                    End
                  </label>
                  <input
                    id={`end-${index}`}
                    type="datetime-local"
                    value={block.end}
                    onChange={(e) =>
                      handleAvailabilityChange(index, "end", e.target.value)
                    }
                    className="rounded-md border px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addAvailabilityBlock}
            className="text-xs font-medium text-blue-600 hover:underline"
          >
            + Add another time window
          </button>
        </section>

        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
        {message && (
          <p className="text-sm text-green-700" role="status">
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
        >
          {submitting ? "Submitting..." : "Submit registration"}
        </button>
      </form>
    </main>
  );
}

