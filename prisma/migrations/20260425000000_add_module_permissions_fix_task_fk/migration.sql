-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE');

-- CreateEnum
CREATE TYPE "AppModule" AS ENUM ('TASKS', 'USERS', 'AUDIT', 'ANALYTICS', 'SETTINGS');

-- CreateEnum
CREATE TYPE "PermissionAction" AS ENUM ('READ', 'WRITE', 'DELETE', 'MANAGE');

-- Step 1: Add updatedAt to User with a default so existing rows get a value
ALTER TABLE "User" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Step 2: Add new columns to Task (nullable first, then backfill, then NOT NULL where needed)
ALTER TABLE "Task" ADD COLUMN "description" TEXT;
ALTER TABLE "Task" ADD COLUMN "priority" INTEGER NOT NULL DEFAULT 2;
ALTER TABLE "Task" ADD COLUMN "dueDate" TIMESTAMP(3);
ALTER TABLE "Task" ADD COLUMN "assignedToId" TEXT;
ALTER TABLE "Task" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Step 3: Migrate Task.status from TEXT to TaskStatus enum
-- Backfill existing values to a valid enum member before conversion
UPDATE "Task" SET "status" = 'TODO' WHERE "status" NOT IN ('TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE');
ALTER TABLE "Task" ALTER COLUMN "status" TYPE "TaskStatus" USING "status"::"TaskStatus";
ALTER TABLE "Task" ALTER COLUMN "status" SET DEFAULT 'TODO';

-- Step 4: Copy existing assignedTo string to assignedToId where it matches a valid user id
UPDATE "Task" t
SET "assignedToId" = t."assignedTo"
WHERE t."assignedTo" IS NOT NULL
  AND EXISTS (SELECT 1 FROM "User" u WHERE u.id = t."assignedTo");

-- Step 5: Add FK constraint on Task.assignedToId
ALTER TABLE "Task" ADD CONSTRAINT "Task_assignedToId_fkey"
  FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Step 6: Drop the old string assignedTo column
ALTER TABLE "Task" DROP COLUMN "assignedTo";

-- Step 7: CreateTable UserPermission
CREATE TABLE "UserPermission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "module" "AppModule" NOT NULL,
    "action" "PermissionAction" NOT NULL,
    "granted" BOOLEAN NOT NULL,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserPermission_pkey" PRIMARY KEY ("id")
);

-- Step 8: CreateIndex
CREATE UNIQUE INDEX "UserPermission_userId_module_action_key" ON "UserPermission"("userId", "module", "action");
CREATE INDEX "UserPermission_userId_idx" ON "UserPermission"("userId");
CREATE INDEX "UserPermission_tenantId_idx" ON "UserPermission"("tenantId");

-- AddForeignKey
ALTER TABLE "UserPermission" ADD CONSTRAINT "UserPermission_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 9: Add indexes on existing tables
CREATE INDEX "User_tenantId_idx" ON "User"("tenantId");
CREATE INDEX "User_email_idx" ON "User"("email");
CREATE INDEX "Task_tenantId_idx" ON "Task"("tenantId");
CREATE INDEX "Task_assignedToId_idx" ON "Task"("assignedToId");
CREATE INDEX "Task_status_idx" ON "Task"("status");
CREATE INDEX "Task_tenantId_status_idx" ON "Task"("tenantId", "status");
CREATE INDEX "Task_tenantId_createdAt_idx" ON "Task"("tenantId", "createdAt");
CREATE INDEX "AuditLog_tenantId_idx" ON "AuditLog"("tenantId");
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
CREATE INDEX "AuditLog_tenantId_createdAt_idx" ON "AuditLog"("tenantId", "createdAt");
