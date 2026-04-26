export type TaskStatus = "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE";
export type UserRole = "ADMIN" | "MANAGER" | "EMPLOYEE";
export type AppModule = "TASKS" | "USERS" | "AUDIT" | "ANALYTICS" | "SETTINGS";
export type PermissionAction = "READ" | "WRITE" | "DELETE" | "MANAGE";
export type NotificationType =
  | "TASK_ASSIGNED"
  | "TASK_STATUS_CHANGED"
  | "TASK_COMMENT_ADDED"
  | "TASK_DUE_SOON";

export interface UserPublic {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  tenantId: string;
  isBanned: boolean;
  bannedAt: string | null;
  createdAt: string;
}

export interface TaskAssignee {
  id: string;
  name: string;
  email: string;
}

export interface TaskHistoryChange {
  field: string;
  oldValue: string | null;
  newValue: string | null;
}

export interface TaskHistory {
  id: string;
  taskId: string;
  userId: string;
  changes: TaskHistoryChange[];
  createdAt: string;
  user: { name: string; email: string };
}

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  user: { id: string; name: string; email: string };
}

export interface Label {
  id: string;
  name: string;
  color: string;
  tenantId: string;
}

export interface Subtask {
  id: string;
  taskId: string;
  title: string;
  completed: boolean;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: number;
  dueDate: string | null;
  assignedToId: string | null;
  assignedById: string | null;
  createdById: string;
  assignedTo: TaskAssignee | null;
  assignedBy: TaskAssignee | null;
  createdBy: TaskAssignee;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
  labels: { label: Label }[];
  subtasks: Subtask[];
  // Populated when fetching a single task
  history?: TaskHistory[];
  comments?: TaskComment[];
}

export interface AuditLogUser {
  name: string;
  email: string;
}

export interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  user: AuditLogUser | null;
}

export interface Permission {
  module: AppModule;
  action: PermissionAction;
  granted: boolean;
}

export interface AnalyticsData {
  tasksByStatus: { status: TaskStatus; count: number }[];
  tasksByMember: { name: string; count: number }[];
  tasksCreatedPerDay: { date: string; count: number }[];
  completionRate: number;
  totalTasks: number;
  openTasks: number;
  doneTasks: number;
}

export interface Notification {
  id: string;
  userId: string;
  tenantId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  taskId: string | null;
  createdAt: string;
}
