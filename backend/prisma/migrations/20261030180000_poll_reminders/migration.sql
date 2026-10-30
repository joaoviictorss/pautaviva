CREATE TABLE "poll_reminders" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notifiedAt" TIMESTAMP(3),
    "pollId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "poll_reminders_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "poll_reminders_pollId_userId_key" ON "poll_reminders"("pollId", "userId");

CREATE INDEX "poll_reminders_notifiedAt_idx" ON "poll_reminders"("notifiedAt");

CREATE INDEX "poll_reminders_userId_idx" ON "poll_reminders"("userId");

ALTER TABLE "poll_reminders" ADD CONSTRAINT "poll_reminders_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "polls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "poll_reminders" ADD CONSTRAINT "poll_reminders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
