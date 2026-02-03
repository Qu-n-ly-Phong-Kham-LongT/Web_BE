-- CreateTable
CREATE TABLE "File" (
    "FileID" TEXT NOT NULL DEFAULT uuid_generate_v4(),
    "RelativePath" TEXT NOT NULL,
    "Type" TEXT NOT NULL,
    "MimeType" TEXT NOT NULL,
    "Size" INTEGER NOT NULL,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "File_pkey" PRIMARY KEY ("FileID")
);
