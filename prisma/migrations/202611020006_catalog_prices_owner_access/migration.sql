UPDATE "service_catalog_items" SET "basePricePiasters" = "basePricePiasters" * 10;

INSERT INTO "role_grants" ("id", "userId", "role", "branchId", "grantedAt")
SELECT 'owner-' || md5(owner."id" || role_name), owner."userId", role_name::"Role", owner."branchId", NOW()
FROM "role_grants" owner
CROSS JOIN (VALUES ('CRM'), ('INVENTORY')) AS roles(role_name)
WHERE owner."role" = 'OWNER_ADMIN'
AND NOT EXISTS (SELECT 1 FROM "role_grants" existing WHERE existing."userId" = owner."userId"
 AND existing."role" = role_name::"Role" AND existing."branchId" IS NOT DISTINCT FROM owner."branchId");
