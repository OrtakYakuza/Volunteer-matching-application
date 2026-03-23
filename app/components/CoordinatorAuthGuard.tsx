"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";

export function CoordinatorAuthGuard() {
  const router = useRouter();
  const { role, isHydrated } = useAuth();

  useEffect(() => {
    if (isHydrated && role !== "COORDINATOR") {
      router.push("/");
    }
  }, [role, isHydrated, router]);

  return null;
}
