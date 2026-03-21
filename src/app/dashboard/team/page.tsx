"use client";

import { useEffect, useState } from "react";
import { useUserStore } from "@/store/userStore";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";

export default function TeamPage() {
  useAuth();

  const { users, fetchUsers, addUser } = useUserStore();
  const currentUser = useAuthStore((state) => state.user);

  const isAdmin = currentUser?.role === "ADMIN";

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "EMPLOYEE",
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleInvite = async () => {
    const token = localStorage.getItem("token");

    const res = await fetch("/api/users", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (res.ok) {
      addUser(data.user);
      setForm({
        name: "",
        email: "",
        password: "",
        role: "EMPLOYEE",
      });
      toast.success("User invited successfully");
    } else {
      toast.error(data.error);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Team</h1>

      {/* 🔥 Invite Form (Admin Only) */}
      {isAdmin && (
        <div className="border p-4 rounded mb-6 space-y-3">
          <h2 className="font-semibold">Invite User</h2>

          <input
            className="border p-2 w-full"
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          <input
            className="border p-2 w-full"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />

          <input
            className="border p-2 w-full"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />

          <select
            className="border p-2 w-full"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          >
            <option value="EMPLOYEE">Employee</option>
            <option value="MANAGER">Manager</option>
          </select>

          <button
            className="bg-black text-white px-4 py-2"
            onClick={handleInvite}
          >
            Invite
          </button>
        </div>
      )}

      {/* 👥 User List */}
      <div className="space-y-2">
        {users.map((user) => (
          <div key={user.id} className="border p-3 rounded">
            <p className="font-medium">{user.name}</p>
            <p className="text-sm">{user.email}</p>
            <p className="text-xs text-gray-500">Role: {user.role}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
