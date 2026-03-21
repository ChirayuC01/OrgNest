"use client";

import { useEffect } from "react";
import { useTaskStore } from "@/store/taskStore";

export default function Dashboard() {
  const { tasks, fetchTasks, loading, hasMore } = useTaskStore();

  useEffect(() => {
    fetchTasks();
  }, []);

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold mb-4">Tasks</h1>

      <div className="space-y-2">
        {tasks.map((task) => (
          <div key={task.id} className="border p-3 rounded bg-white">
            <p className="font-medium">{task.title}</p>
            <p className="text-sm text-gray-500">{task.status}</p>
          </div>
        ))}
      </div>

      {hasMore && (
        <button
          onClick={fetchTasks}
          className="mt-4 bg-black text-white px-4 py-2"
        >
          {loading ? "Loading..." : "Load More"}
        </button>
      )}
    </div>
  );
}
