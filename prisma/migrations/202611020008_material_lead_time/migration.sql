ALTER TABLE "materials" ADD COLUMN "leadTimeDays" INTEGER;
ALTER TABLE "materials" ADD CONSTRAINT "material_lead_time_nonnegative" CHECK ("leadTimeDays" >= 0);
