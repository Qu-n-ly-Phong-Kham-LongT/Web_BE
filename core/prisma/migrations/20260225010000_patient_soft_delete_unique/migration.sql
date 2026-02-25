ALTER TABLE "Patient"
  ALTER COLUMN "isDeleted" SET DEFAULT false,
  ALTER COLUMN "isDeleted" SET NOT NULL;

-- Drop old unique indexes
DROP INDEX IF EXISTS "Patient_patientCode_key";
DROP INDEX IF EXISTS "Patient_phone_key";
DROP INDEX IF EXISTS "Patient_identityCard_key";
DROP INDEX IF EXISTS "Patient_insuranceNumber_key";

-- Recreate unique indexes only for active patients
CREATE UNIQUE INDEX IF NOT EXISTS "Patient_patientCode_active_key"
  ON "Patient" ("patientCode")
  WHERE "isDeleted" = false AND "patientCode" IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "Patient_phone_active_key"
  ON "Patient" ("phone")
  WHERE "isDeleted" = false AND "phone" IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "Patient_identityCard_active_key"
  ON "Patient" ("identityCard")
  WHERE "isDeleted" = false AND "identityCard" IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "Patient_insuranceNumber_active_key"
  ON "Patient" ("insuranceNumber")
  WHERE "isDeleted" = false AND "insuranceNumber" IS NOT NULL;
