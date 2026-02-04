-- DropIndex
DROP INDEX "ServiceItem_itemCode_key";

CREATE UNIQUE INDEX "ServiceItem_itemCode_active_unique"
ON "ServiceItem" ("itemCode")
WHERE "isActive" = true;