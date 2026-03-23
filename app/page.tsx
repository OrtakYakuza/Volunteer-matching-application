"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import Link from "next/link";

export default function Home() {
  const { loginAsCoordinator, loginAsVolunteer, isHydrated } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleCoordinatorLogin = () => {
    loginAsCoordinator();
    router.push("/coordinator/dashboard");
  };

  const handleVolunteerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/volunteers/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Could not find a volunteer for this email.");
        return;
      }

      loginAsVolunteer(data.volunteer);
      setSuccess("Login successful! Redirecting...");
      
      setTimeout(() => {
        router.push("/volunteer/dashboard");
      }, 1500);
    } catch (err) {
      console.error(err);
      setError("Failed to look up volunteer. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isHydrated) return null;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-center gap-10 px-4 py-10">
      <section className="space-y-3 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">
          CrisisMatch Prototype
        </h1>
        <p className="mx-auto max-w-xl text-sm text-zinc-600">
          A human-in-the-loop volunteer matching system. Log in to access your dashboard.
        </p>
      </section>

      <section className="grid w-full max-w-3xl gap-8 md:grid-cols-2">
        <div className="flex flex-col rounded-xl border bg-white px-6 py-6 shadow-sm h-full">
          <div className="space-y-2 mb-6 flex-grow">
            <h2 className="text-lg font-semibold">Volunteer Login</h2>
            <p className="text-sm text-zinc-600">
              Browse available tasks and apply for missions based on your availability.
            </p>
          </div>
          
          <form onSubmit={handleVolunteerLogin} className="space-y-4">
            <div className="flex flex-col gap-2">
              <input
                type="email"
                placeholder="you@example.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={loading || !email}
                className="w-full inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
              >
                {loading ? "Logging in..." : "Log in"}
              </button>
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
            {success && <p className="text-xs text-green-700">{success}</p>}
            <div className="text-center pt-2 text-xs text-zinc-500">
              Don&apos;t have an account?{" "}
              <Link href="/volunteer/register" className="text-blue-600 hover:underline">
                Register here
              </Link>
            </div>
          </form>
        </div>

        <div className="flex flex-col rounded-xl border bg-white px-6 py-6 shadow-sm h-full">
          <div className="space-y-2 mb-6 flex-grow">
            <h2 className="text-lg font-semibold">Coordinator Login</h2>
            <p className="text-sm text-zinc-600">
              Create tasks, monitor capacity at a glance, and use manual, semi-automatic, or automatic matching modes.
            </p>
          </div>
          
          <div className="mt-auto">
            <button
              onClick={handleCoordinatorLogin}
              className="w-full inline-flex items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 transition-colors"
            >
              Log in as Coordinator
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
