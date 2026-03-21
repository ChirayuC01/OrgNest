"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTaskStore } from "@/store/taskStore";

export default function Dashboard() {
  useAuth();

  const { tasks, fetchTasks, loading, hasMore } = useTaskStore();

  useEffect(() => {
    fetchTasks();
  }, []);

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>

      {/* Task List */}
      <div className="space-y-2">
        {tasks.map((task) => (
          <div key={task.id} className="border p-3 rounded">
            <p className="font-medium">{task.title}</p>
            <p className="text-sm text-gray-500">Status: {task.status}</p>
          </div>
        ))}
      </div>

      {/* Load More */}
      {hasMore && (
        <button
          onClick={fetchTasks}
          disabled={loading}
          className="mt-4 w-full bg-black text-white p-2"
        >
          {loading ? "Loading..." : "Load More"}
        </button>
      )}

      {!hasMore && (
        <p className="text-center mt-4 text-gray-500">No more tasks</p>
      )}
    </div>
  );
}
