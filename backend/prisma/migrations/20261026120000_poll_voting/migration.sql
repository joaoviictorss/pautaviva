-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CITIZEN', 'MANAGER', 'MODERATOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "PollStatus" AS ENUM ('SCHEDULED', 'OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "VoteOption" AS ENUM ('FOR', 'AGAINST', 'ABSTAIN');

-- AlterTable: converte os valores antigos em vez de recriar a coluna (preserva perfis existentes)
ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role" TYPE "Role" USING (
  CASE "role"
    WHEN 'gestor' THEN 'MANAGER'
    WHEN 'moderador' THEN 'MODERATOR'
    WHEN 'administrador' THEN 'ADMIN'
    ELSE 'CITIZEN'
  END
)::"Role";
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'CITIZEN';

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "polls" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "status" "PollStatus" NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "polls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "participations" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pollId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "participations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "votes" (
    "id" TEXT NOT NULL,
    "option" "VoteOption" NOT NULL,
    "pollId" TEXT NOT NULL,

    CONSTRAINT "votes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE INDEX "polls_status_endsAt_idx" ON "polls"("status", "endsAt");

-- CreateIndex
CREATE INDEX "polls_categoryId_idx" ON "polls"("categoryId");

-- CreateIndex
CREATE INDEX "participations_userId_idx" ON "participations"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "participations_pollId_userId_key" ON "participations"("pollId", "userId");

-- CreateIndex
CREATE INDEX "votes_pollId_idx" ON "votes"("pollId");

-- AddForeignKey
ALTER TABLE "polls" ADD CONSTRAINT "polls_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "polls" ADD CONSTRAINT "polls_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participations" ADD CONSTRAINT "participations_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "polls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participations" ADD CONSTRAINT "participations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "polls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

