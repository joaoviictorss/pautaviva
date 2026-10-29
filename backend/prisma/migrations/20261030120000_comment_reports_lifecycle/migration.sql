CREATE TYPE "CommentReportReason" AS ENUM ('OFFENSIVE_CONTENT', 'SPAM', 'HATE_SPEECH', 'OTHER');

CREATE TYPE "CommentReportStatus" AS ENUM ('PENDING', 'DISMISSED', 'ACTIONED');

ALTER TYPE "CommentStatus" ADD VALUE 'REMOVED';

CREATE TABLE "comment_reports" (
    "id" TEXT NOT NULL,
    "reason" "CommentReportReason" NOT NULL,
    "status" "CommentReportStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "commentId" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reviewedById" TEXT,

    CONSTRAINT "comment_reports_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "comment_reports_commentId_reporterId_key" ON "comment_reports"("commentId", "reporterId");
CREATE INDEX "comment_reports_status_createdAt_idx" ON "comment_reports"("status", "createdAt");
CREATE INDEX "comment_reports_commentId_status_idx" ON "comment_reports"("commentId", "status");

ALTER TABLE "comment_reports" ADD CONSTRAINT "comment_reports_commentId_fkey"
FOREIGN KEY ("commentId") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "comment_reports" ADD CONSTRAINT "comment_reports_reporterId_fkey"
FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "comment_reports" ADD CONSTRAINT "comment_reports_reviewedById_fkey"
FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "audit_logs" ALTER COLUMN "actorId" DROP NOT NULL;
ALTER TABLE "audit_logs" DROP CONSTRAINT "audit_logs_actorId_fkey";
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorId_fkey"
FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
