-- Backfill regularPrice for memberships created before the discount feature
-- shipped. discount.md §17: existing prices must not change, so a
-- pre-existing membership is treated as "no discount" — regularPrice equals
-- its already-stored finalPrice, discountPercent stays at its default 0,
-- discountTypeId stays NULL.
UPDATE "Membership"
SET "regularPrice" = "finalPrice"
WHERE "regularPrice" IS NULL;

-- Every membership now has a value; make the column required going forward.
ALTER TABLE "Membership" ALTER COLUMN "regularPrice" SET NOT NULL;
