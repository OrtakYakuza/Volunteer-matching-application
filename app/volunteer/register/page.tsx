"use client";

import { FormEvent, useState } from "react";
import { Skill } from "@/lib/enums";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";

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

export default function VolunteerRegisterPage() {
  const { loginAsVolunteer } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<Skill[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toggleSkill = (skill: Skill) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill],
    );
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/volunteers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          phoneNumber,
          birthDate,
          postalCode: postalCode || undefined,
          location: location || undefined,
          description: description || undefined,
          skills: selectedSkills,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Registration failed.");
        return;
      }

      loginAsVolunteer(data.volunteer);
      setMessage("Registration successful! Redirecting to your dashboard...");

      setTimeout(() => {
        router.push("/volunteer/dashboard");
      }, 1000);
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
            <label className="text-sm font-medium" htmlFor="phoneNumber">
              Phone Number
            </label>
            <input
              id="phoneNumber"
              type="tel"
              required
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium" htmlFor="birthDate">
              Birth Date
            </label>
            <input
              id="birthDate"
              type="date"
              required
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
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
          <div className="flex flex-col gap-1 md:col-span-2">
            <label className="text-sm font-medium" htmlFor="description">
              About me (optional)
            </label>
            <p className="text-xs text-zinc-600">
              Briefly describe your background, motivation, or any special constraints you have.
            </p>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="I am a retired nurse wanting to help..."
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
