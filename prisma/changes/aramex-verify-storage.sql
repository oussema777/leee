-- Read-only post-migration check. Run with psql -X -v ON_ERROR_STOP=1.
BEGIN READ ONLY;
SET LOCAL statement_timeout = '30s';
DO $$
DECLARE item RECORD;
BEGIN
  FOR item IN SELECT * FROM (VALUES
    ('BookShipment', 'orderId'), ('BookShipment', 'trackingNumber'),
    ('BookShipment', 'labelUrl'), ('BookShipment', 'bookedAt'),
    ('BookShipmentAttempt', 'submissionKey'), ('BookShipmentAttempt', 'shipmentId'),
    ('BookShipmentReconciliation', 'attemptId'), ('BookShipmentReconciliation', 'outcome'),
    ('BookShipmentReconciliation', 'actor'), ('BookShipmentReconciliation', 'evidenceReference'),
    ('AramexTrackingEvent', 'environment'), ('AramexTrackingEvent', 'digest'),
    ('AramexTrackingEvent', 'trackingNumber'), ('AramexTrackingEvent', 'shipmentId'),
    ('AramexTrackingEvent', 'occurredAt'), ('AramexTrackingEvent', 'receivedAt')
  ) AS expected(table_name, column_name) LOOP
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns c
      WHERE c.table_schema = 'public' AND c.table_name = item.table_name AND c.column_name = item.column_name) THEN
      RAISE EXCEPTION 'Missing Aramex storage column %.%', item.table_name, item.column_name;
    END IF;
  END LOOP;
  FOR item IN SELECT * FROM (VALUES ('BookShipment'), ('BookShipmentAttempt'),
    ('BookShipmentReconciliation'), ('AramexTrackingEvent')) AS expected(name) LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relname = item.name AND c.relrowsecurity) THEN
      RAISE EXCEPTION 'RLS is missing for %', item.name;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = item.name) THEN
      RAISE EXCEPTION 'Unexpected RLS policy for %: review access before rollout', item.name;
    END IF;
  END LOOP;
  FOR item IN SELECT * FROM (VALUES
    ('BookShipment_orderId_key', true), ('BookShipment_provider_environment_trackingNumber_key', true),
    ('BookShipmentAttempt_submissionKey_key', true), ('BookShipmentReconciliation_attemptId_key', true),
    ('AramexTrackingEvent_environment_digest_key', true),
    ('AramexTrackingEvent_environment_trackingNumber_occurredAt_idx', false),
    ('AramexTrackingEvent_shipmentId_occurredAt_idx', false)
  ) AS expected(name, is_unique) LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_index i JOIN pg_class c ON c.oid = i.indexrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = item.name
      AND i.indisvalid AND i.indisready AND i.indisunique = item.is_unique) THEN
      RAISE EXCEPTION 'Missing or invalid index %', item.name;
    END IF;
  END LOOP;
  FOR item IN SELECT * FROM (VALUES ('BookShipment_orderId_fkey'), ('BookShipmentAttempt_shipmentId_fkey'),
    ('BookShipmentReconciliation_attemptId_fkey'), ('AramexTrackingEvent_shipmentId_fkey')) AS expected(name) LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_namespace n ON n.oid = c.connamespace
      WHERE n.nspname = 'public' AND c.conname = item.name AND c.contype = 'f' AND c.convalidated
      AND c.confdeltype = 'r' AND c.confupdtype = 'c') THEN
      RAISE EXCEPTION 'Missing or unexpected foreign key %', item.name;
    END IF;
  END LOOP;
END $$;
SELECT 'Aramex storage checks passed; this does not verify runtime-role access or carrier connectivity.' AS result;
COMMIT;
