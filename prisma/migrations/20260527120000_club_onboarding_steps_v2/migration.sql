-- Club onboarding: steps with title/description and multiple questions per step.

CREATE TABLE "club_onboarding_questions" (
    "id" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "question" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "club_onboarding_questions_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "club_onboarding_steps" ADD COLUMN "title" TEXT;
ALTER TABLE "club_onboarding_steps" ADD COLUMN "description" TEXT;

UPDATE "club_onboarding_steps"
SET "title" = 'Step ' || ("sortOrder" + 1)::text
WHERE "title" IS NULL;

INSERT INTO "club_onboarding_questions" ("id", "stepId", "sortOrder", "question", "required")
SELECT
    md5("id" || '-' || "sortOrder"::text || '-q')::text,
    "id",
    "sortOrder",
    "question",
    "required"
FROM "club_onboarding_steps";

ALTER TABLE "club_onboarding_steps" ALTER COLUMN "title" SET NOT NULL;
ALTER TABLE "club_onboarding_steps" DROP COLUMN "question";
ALTER TABLE "club_onboarding_steps" DROP COLUMN "required";

CREATE INDEX "club_onboarding_questions_stepId_sortOrder_idx"
ON "club_onboarding_questions"("stepId", "sortOrder");

ALTER TABLE "club_onboarding_questions"
ADD CONSTRAINT "club_onboarding_questions_stepId_fkey"
FOREIGN KEY ("stepId") REFERENCES "club_onboarding_steps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "club_join_requests" ADD COLUMN "onboardingAnswers" JSONB;
