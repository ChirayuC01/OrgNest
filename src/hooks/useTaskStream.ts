"use client";

import { useEffect, useRef } from "react";

interface StreamTask {
  id: string;
  title: string;
  status: string;
  priority: number;
  dueDate: string | null;
  updatedAt: string;
  assignedTo: { name: string; email: string } | null;
}

interface UseTaskStreamOptions {
  onUpdate: (tasks: StreamTask[]) => void;
  enabled?: boolean;
}

export function useTaskStream({ onUpdate, enabled = true }: UseTaskStreamOptions) {
  // Keep a stable ref to onUpdate so effect doesn't re-run when the callback identity changes
  const onUpdateRef = useRef(onUpdate);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    if (!enabled) return;

    let es: EventSource | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let retryDelay = 5_000;

    const connect = () => {
      es = new EventSource("/api/tasks/stream");

      es.addEventListener("tasks", (e) => {
        try {
          const tasks: StreamTask[] = JSON.parse((e as MessageEvent).data);
          onUpdateRef.current(tasks);
          retryDelay = 5_000; // reset on success
        } catch {
          // ignore parse errors
        }
      });

      es.onerror = () => {
        es?.close();
        es = null;
        // Exponential backoff, cap at 60s
        retryDelay = Math.min(retryDelay * 2, 60_000);
        retryTimer = setTimeout(connect, retryDelay);
      };
    };

    connect();

    return () => {
      es?.close();
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [enabled]);
}
