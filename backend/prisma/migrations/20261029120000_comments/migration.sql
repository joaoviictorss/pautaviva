CREATE TYPE "CommentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "CommentClassification" AS ENUM ('ADEQUATE', 'SUSPECT', 'INAPPROPRIATE');

CREATE TABLE "comments" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "status" "CommentStatus" NOT NULL DEFAULT 'PENDING',
    "classification" "CommentClassification",
    "moderationReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "pollId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "moderatedById" TEXT,
    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "comments_pollId_status_createdAt_idx" ON "comments"("pollId", "status", "createdAt");
CREATE INDEX "comments_status_createdAt_idx" ON "comments"("status", "createdAt");

ALTER TABLE "comments" ADD CONSTRAINT "comments_pollId_fkey"
  FOREIGN KEY ("pollId") REFERENCES "polls"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "comments" ADD CONSTRAINT "comments_authorId_fkey"
  FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "comments" ADD CONSTRAINT "comments_moderatedById_fkey"
  FOREIGN KEY ("moderatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
