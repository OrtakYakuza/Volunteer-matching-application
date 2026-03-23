"use client";

import { FormEvent, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CoordinatorRegisterPage() {
  const { loginAsCoordinator } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/coordinators", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Registration failed.");
        return;
      }

      loginAsCoordinator(data.coordinator);
      setMessage("Registration successful! Redirecting to dashboard...");
      
      setTimeout(() => {
        router.push("/coordinator/dashboard");
      }, 1500);

    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col gap-8 px-4 py-10">
      <Link href="/" className="inline-flex items-center justify-center rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 w-fit transition-colors">
        ← Back to Login
      </Link>
      
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Coordinator Registration</h1>
        <p className="text-sm text-zinc-600">
          Create an account to manage tasks, monitor capacity, and process volunteer applications.
        </p>
      </header>

      <form onSubmit={onSubmit} className="space-y-6">
        <section className="space-y-4 rounded-lg border p-6 bg-white shadow-sm">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium" htmlFor="name">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900"
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
              className="rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900"
            />
          </div>
        </section>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200" role="alert">
            {error}
          </p>
        )}
        
        {message && (
          <p className="text-sm text-green-700 bg-green-50 p-3 rounded-md border border-green-200" role="status">
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting || !name || !email}
          className="w-full inline-flex items-center justify-center rounded-md bg-zinc-900 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-60"
        >
          {submitting ? "Creating account..." : "Register as Coordinator"}
        </button>
      </form>
    </main>
  );
}
