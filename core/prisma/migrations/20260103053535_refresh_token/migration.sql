-- CreateTable
CREATE TABLE "RefreshTokens" (
    "ID" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "Token" VARCHAR(500) NOT NULL,
    "UserID" UUID NOT NULL,
    "ExpiresAt" TIMESTAMP(3) NOT NULL,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "IsRevoked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "RefreshTokens_pkey" PRIMARY KEY ("ID")
);

-- CreateIndex
CREATE UNIQUE INDEX "RefreshTokens_Token_key" ON "RefreshTokens"("Token");

-- CreateIndex
CREATE INDEX "RefreshTokens_UserID_idx" ON "RefreshTokens"("UserID");

-- AddForeignKey
ALTER TABLE "RefreshTokens" ADD CONSTRAINT "RefreshTokens_UserID_fkey" FOREIGN KEY ("UserID") REFERENCES "Users"("UserID") ON DELETE CASCADE ON UPDATE CASCADE;
