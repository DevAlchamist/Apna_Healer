-- AlterEnum
ALTER TYPE "AuditAction" ADD VALUE 'ROLE_THEME_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE 'ROLE_THEME_RESET';

-- CreateTable
CREATE TABLE "role_themes" (
    "id" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "tokens" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isCustomized" BOOLEAN NOT NULL DEFAULT false,
    "updatedById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_themes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "role_themes_role_key" ON "role_themes"("role");

-- AddForeignKey
ALTER TABLE "role_themes" ADD CONSTRAINT "role_themes_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
