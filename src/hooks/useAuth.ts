"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function useAuth() {
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" }).then((res) => {
      if (!res.ok) router.push("/login");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
