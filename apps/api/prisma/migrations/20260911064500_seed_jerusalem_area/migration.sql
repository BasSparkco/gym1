-- Staff were already typing "Jerusalem" into the address field for most
-- members (the gym itself is in Jerusalem), so give every existing tenant a
-- ready-made "Jerusalem" area to pick from instead of starting with an empty
-- list. Existing members' areaId is left NULL — there's no reliable way to
-- tell from free-text address history which of them actually meant this
-- area, so staff assign it going forward instead of it being guessed.
INSERT INTO "Area" ("id", "tenantId", "name")
SELECT 'area-' || gen_random_uuid(), "id", 'Jerusalem'
FROM "Tenant"
ON CONFLICT ("tenantId", "name") DO NOTHING;
