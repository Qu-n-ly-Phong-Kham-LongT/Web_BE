-- CreateTable
CREATE TABLE "AuditLog" (
    "logId" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "username" VARCHAR(100),
    "role" TEXT,
    "action" VARCHAR(50) NOT NULL,
    "entityName" VARCHAR(50) NOT NULL,
    "entityId" VARCHAR(100),
    "requestMethod" VARCHAR(10) NOT NULL,
    "requestUrl" TEXT NOT NULL,
    "remoteAddress" VARCHAR(50),
    "requestBody" JSONB DEFAULT '{}',
    "responseBody" JSONB DEFAULT '{}',
    "statusCode" INTEGER,
    "errorMessage" TEXT,
    "durationMs" INTEGER,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("logId")
);

-- CreateIndex
CREATE INDEX "AuditLog_username_idx" ON "AuditLog"("username");

-- CreateIndex
CREATE INDEX "AuditLog_entityName_entityId_idx" ON "AuditLog"("entityName", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");
