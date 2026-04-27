"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronDown, Check } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { UserPublic, Label, UserRole } from "@/types";

const ROLE_BADGE: Record<UserRole, { label: string; className: string }> = {
  ADMIN: { label: "Admin", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300" },
  MANAGER: { label: "Manager", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300" },
  EMPLOYEE: { label: "Employee", className: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" },
};

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ─── Assignee Combobox ────────────────────────────────────────────────────────
// Renders a styled button trigger; on click shows a floating panel with an
// inline search input and a scrollable member list. Click-outside closes it.

interface AssigneeComboboxProps {
  members: UserPublic[];
  value: string | null;
  onChange: (id: string | null) => void;
}

export function AssigneeCombobox({ members, value, onChange }: AssigneeComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const selected = members.find((m) => m.id === value) ?? null;

  const filtered = search
    ? members.filter(
        (m) =>
          m.name.toLowerCase().includes(search.toLowerCase()) ||
          m.email.toLowerCase().includes(search.toLowerCase())
      )
    : members;

  useEffect(() => {
    if (!open) return;
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 h-9 px-3 rounded-md border border-input bg-background text-sm hover:bg-accent transition-colors"
      >
        {selected ? (
          <>
            <Avatar className="h-5 w-5 shrink-0">
              <AvatarFallback className="text-[9px] bg-primary/20 text-primary">
                {initials(selected.name)}
              </AvatarFallback>
            </Avatar>
            <span className="truncate">{selected.name}</span>
            <span
              className={cn(
                "ml-1 px-1.5 py-0 rounded text-[10px] font-medium shrink-0",
                ROLE_BADGE[selected.role].className
              )}
            >
              {ROLE_BADGE[selected.role].label}
            </span>
          </>
        ) : (
          <span className="text-muted-foreground">Unassigned</span>
        )}
        <ChevronDown className="ml-auto h-3.5 w-3.5 text-muted-foreground shrink-0" />
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-1 w-full rounded-md border border-border bg-popover shadow-md">
          <div className="p-1.5 border-b border-border">
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search members…"
              className="w-full h-7 px-2 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div className="max-h-52 overflow-y-auto p-1">
            <button
              type="button"
              onClick={() => {
                onChange(null);
                setOpen(false);
                setSearch("");
              }}
              className={cn(
                "w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-accent text-left",
                !value && "bg-accent"
              )}
            >
              <span className="text-muted-foreground">Unassigned</span>
            </button>
            {filtered.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  onChange(m.id);
                  setOpen(false);
                  setSearch("");
                }}
                className={cn(
                  "w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-accent text-left",
                  value === m.id && "bg-accent"
                )}
              >
                <Avatar className="h-5 w-5 shrink-0">
                  <AvatarFallback className="text-[9px] bg-primary/20 text-primary">
                    {initials(m.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate font-medium">{m.name}</span>
                    <span
                      className={cn(
                        "px-1.5 py-0 rounded text-[10px] font-medium shrink-0",
                        ROLE_BADGE[m.role].className
                      )}
                    >
                      {ROLE_BADGE[m.role].label}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground truncate">{m.email}</span>
                </div>
                {value === m.id && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-3">No members found</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Labels Combobox ──────────────────────────────────────────────────────────
// Multi-select label picker. Selected labels shown as colored pills in the
// trigger. Click-outside closes the panel.

interface LabelsComboboxProps {
  labels: Label[];
  value: string[];
  onChange: (ids: string[]) => void;
}

export function LabelsCombobox({ labels, value, onChange }: LabelsComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const filtered = search
    ? labels.filter((l) => l.name.toLowerCase().includes(search.toLowerCase()))
    : labels;

  const selected = labels.filter((l) => value.includes(l.id));

  useEffect(() => {
    if (!open) return;
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [open]);

  const toggle = (id: string) => {
    onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center flex-wrap gap-1 min-h-9 px-3 py-1.5 rounded-md border border-input bg-background text-sm hover:bg-accent transition-colors"
      >
        {selected.length > 0 ? (
          <>
            {selected.map((l) => (
              <span
                key={l.id}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white"
                style={{ backgroundColor: l.color }}
              >
                {l.name}
              </span>
            ))}
          </>
        ) : (
          <span className="text-muted-foreground">No labels</span>
        )}
        <ChevronDown className="ml-auto h-3.5 w-3.5 text-muted-foreground shrink-0 self-center" />
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-1 w-full rounded-md border border-border bg-popover shadow-md">
          <div className="p-1.5 border-b border-border">
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search labels…"
              className="w-full h-7 px-2 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div className="max-h-52 overflow-y-auto p-1">
            {filtered.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => toggle(l.id)}
                className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-accent text-left"
              >
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: l.color }}
                />
                <span className="flex-1">{l.name}</span>
                {value.includes(l.id) && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-3">No labels found</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
