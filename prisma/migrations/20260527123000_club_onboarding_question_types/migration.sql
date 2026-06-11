-- Add question answer types + options to club onboarding questions.

DO $$ BEGIN
  CREATE TYPE "ClubOnboardingQuestionType" AS ENUM ('TEXT', 'CHOICE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "club_onboarding_questions"
  ADD COLUMN IF NOT EXISTS "type" "ClubOnboardingQuestionType" NOT NULL DEFAULT 'TEXT',
  ADD COLUMN IF NOT EXISTS "options" JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS "allowMultiple" BOOLEAN NOT NULL DEFAULT false;

