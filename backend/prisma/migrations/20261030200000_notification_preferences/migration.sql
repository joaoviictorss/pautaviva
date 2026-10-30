ALTER TABLE "users"
    ADD COLUMN "notifyPollOpened" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "notifyPollClosing" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "notifyPollResult" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "notifyComments" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "polls"
    ADD COLUMN "openNoticeSentAt" TIMESTAMP(3),
    ADD COLUMN "closingNoticeSentAt" TIMESTAMP(3);

-- Pautas que já abriram ou já estão na reta final não geram aviso retroativo.
UPDATE "polls" SET "openNoticeSentAt" = CURRENT_TIMESTAMP WHERE "startsAt" <= CURRENT_TIMESTAMP;
UPDATE "polls" SET "closingNoticeSentAt" = CURRENT_TIMESTAMP WHERE "endsAt" <= CURRENT_TIMESTAMP + INTERVAL '24 hours';
