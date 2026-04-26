"use client";

import { useEffect, useRef, useCallback } from "react";

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
  const esRef = useRef<EventSource | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryDelayRef = useRef(5_000);

  const connect = useCallback(() => {
    if (!enabled) return;
    if (esRef.current) esRef.current.close();

    const es = new EventSource("/api/tasks/stream");
    esRef.current = es;

    es.addEventListener("tasks", (e) => {
      try {
        const tasks: StreamTask[] = JSON.parse((e as MessageEvent).data);
        onUpdate(tasks);
        retryDelayRef.current = 5_000; // reset on success
      } catch {
        // ignore parse errors
      }
    });

    es.onerror = () => {
      es.close();
      esRef.current = null;
      // Exponential backoff, cap at 60s
      retryDelayRef.current = Math.min(retryDelayRef.current * 2, 60_000);
      retryTimerRef.current = setTimeout(connect, retryDelayRef.current);
    };
  }, [enabled, onUpdate]);

  useEffect(() => {
    connect();
    return () => {
      esRef.current?.close();
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    };
  }, [connect]);
}
