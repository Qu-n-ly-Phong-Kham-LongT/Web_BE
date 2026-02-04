-- DropIndex
DROP INDEX "ServiceNode_code_key";

CREATE UNIQUE INDEX "ServiceNode_code_active_unique"
ON "ServiceNode" ("code")
WHERE "isActive" = true;