"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import Link from "next/link";

export default function Home() {
  const { loginAsCoordinator, loginAsVolunteer, isHydrated, role, user, logout } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [coordEmail, setCoordEmail] = useState("");
  const [coordLoading, setCoordLoading] = useState(false);
  const [coordError, setCoordError] = useState<string | null>(null);
  const [coordSuccess, setCoordSuccess] = useState<string | null>(null);

  const handleCoordinatorLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coordEmail) return;

    setCoordLoading(true);
    setCoordError(null);
    try {
      const response = await fetch("/api/coordinators/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: coordEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        setCoordError(data.error ?? "Could not find a coordinator for this email.");
        return;
      }

      loginAsCoordinator(data.coordinator);
      setCoordSuccess("Login successful! Redirecting...");
      
      setTimeout(() => {
        router.push("/coordinator/dashboard");
      }, 1500);
    } catch (err) {
      console.error(err);
      setCoordError("Failed to look up coordinator. Please try again.");
    } finally {
      setCoordLoading(false);
    }
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

  if (role === "VOLUNTEER" && user) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col items-center justify-center gap-6 px-4 py-10 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">
          Welcome back, {user.name}
        </h1>
        <p className="text-sm text-zinc-600">
          You are currently logged in as a Volunteer.
        </p>
        <div className="flex flex-col gap-3 w-full mt-4">
          <button
            onClick={() => router.push("/volunteer/dashboard")}
            className="w-full inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            Go to My Dashboard
          </button>
          <button
            onClick={() => {
              // useAuth logout isn't returning a promise, but we can just logout and force re-render
              // Actually we need `logout` from useAuth
              logout();
            }}
            className="w-full inline-flex items-center justify-center rounded-md border border-zinc-300 bg-white px-4 py-3 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-50"
          >
            Log out & Switch Role
          </button>
        </div>
      </main>
    );
  }

  if (role === "COORDINATOR") {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col items-center justify-center gap-6 px-4 py-10 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">
          Coordinator Session Active
        </h1>
        <p className="text-sm text-zinc-600">
          You are currently logged in as a Coordinator.
        </p>
        <div className="flex flex-col gap-3 w-full mt-4">
          <button
            onClick={() => router.push("/coordinator/dashboard")}
            className="w-full inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            Go to Coordinator Dashboard
          </button>
          <button
            onClick={() => {
              logout();
            }}
            className="w-full inline-flex items-center justify-center rounded-md border border-zinc-300 bg-white px-4 py-3 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-50"
          >
            Log out & Switch Role
          </button>
        </div>
      </main>
    );
  }

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
          
          <form onSubmit={handleCoordinatorLogin} className="space-y-4 mt-auto">
            <div className="flex flex-col gap-2">
              <input
                type="email"
                placeholder="admin@crisis.org"
                value={coordEmail}
                onChange={(e) => setCoordEmail(e.target.value)}
                required
                className="rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900"
              />
              <button
                type="submit"
                disabled={coordLoading || !coordEmail}
                className="w-full inline-flex items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-60"
              >
                {coordLoading ? "Logging in..." : "Log in as Coordinator"}
              </button>
            </div>
            {coordError && <p className="text-xs text-red-600">{coordError}</p>}
            {coordSuccess && <p className="text-xs text-green-700">{coordSuccess}</p>}
            <div className="text-center pt-2 text-xs text-zinc-500">
              Don&apos;t have an account?{" "}
              <Link href="/coordinator/register" className="text-zinc-900 font-medium hover:underline">
                Register here
              </Link>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
