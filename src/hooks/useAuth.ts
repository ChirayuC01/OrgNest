"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

export function useAuth() {
    const router = useRouter();
    const setAuth = useAuthStore((s) => s.setAuth);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/auth/me", { credentials: "include" })
            .then(async (res) => {
                if (!res.ok) {
                    router.push("/login");
                    return;
                }
                const json = await res.json();
                if (json.success && json.data?.user) {
                    setAuth({ ...json.data.user, permissions: json.data.permissions });
                }
            })
            .catch(() => router.push("/login"))
            .finally(() => setLoading(false));
    }, []);

    return { loading };
}
