CREATE SEQUENCE IF NOT EXISTS patient_number_sequence;
SELECT setval('patient_number_sequence', GREATEST(COALESCE((SELECT MAX(split_part("patientNumber", '-', 4)::bigint) FROM patients WHERE "patientNumber" ~ '^EBT-PAT-[0-9]{4}-[0-9]+$'),0),1),true);
