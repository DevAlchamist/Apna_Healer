-- Drop legacy per-day availability table; weekly schedules are the source of truth.
DROP TABLE IF EXISTS "availabilities";
