-- Member profile fields (editable from dashboard profile).
ALTER TABLE "users" ADD COLUMN "bio" TEXT;
ALTER TABLE "users" ADD COLUMN "phone" TEXT;
ALTER TABLE "users" ADD COLUMN "city" TEXT;
ALTER TABLE "users" ADD COLUMN "timezone" TEXT DEFAULT 'Asia/Kolkata';
ALTER TABLE "users" ADD COLUMN "primaryFocus" TEXT;
ALTER TABLE "users" ADD COLUMN "interestTags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
