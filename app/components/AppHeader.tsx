"use client";

import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";

export function AppHeader() {
  const { role, user, logout, isHydrated } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  if (!isHydrated) return null; // Wait for localStorage

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-bold text-lg tracking-tight text-blue-600">
            CrisisMatch
          </Link>
          
          {role === "VOLUNTEER" && (
             <nav className="hidden md:flex gap-4 text-sm font-medium">
              <Link href="/volunteer/dashboard" className="text-zinc-600 hover:text-zinc-900 transition-colors">
                My Dashboard
              </Link>
            </nav>
          )}

          {role === "COORDINATOR" && (
             <nav className="hidden md:flex gap-4 text-sm font-medium">
              <Link href="/coordinator/dashboard" className="text-zinc-600 hover:text-zinc-900 transition-colors">
                Dashboard
              </Link>
              <Link href="/coordinator/tasks/new" className="text-zinc-600 hover:text-zinc-900 transition-colors">
                Create Task
              </Link>
            </nav>
          )}
        </div>

        <div className="flex items-center gap-4">
          {role ? (
            <>
              <div className="text-xs text-zinc-600 font-medium">
                {role === "COORDINATOR" ? (
                  "Logged in as Coordinator"
                ) : (
                  `Volunteer: ${user?.name}`
                )}
              </div>
              <button
                onClick={handleLogout}
                className="text-xs font-medium text-red-600 hover:underline"
              >
                Log out
              </button>
            </>
          ) : (
             <Link href="/" className="text-xs font-medium text-blue-600 hover:underline">
               Log in
             </Link>
          )}
        </div>
      </div>
      
      {/* Mobile nav */}
      <div className="flex md:hidden items-center justify-center gap-4 border-t py-2 px-4 text-sm font-medium bg-zinc-50 overflow-x-auto">
        {role === "VOLUNTEER" && (
          <Link href="/volunteer/dashboard" className="text-zinc-600 hover:text-zinc-900">
            My Dashboard
          </Link>
        )}
        {role === "COORDINATOR" && (
          <>
            <Link href="/coordinator/dashboard" className="text-zinc-600 hover:text-zinc-900">
              Dashboard
            </Link>
            <Link href="/coordinator/tasks/new" className="text-zinc-600 hover:text-zinc-900">
              Create Task
            </Link>
          </>   
        )}
      </div>
    </header>
  );
}
