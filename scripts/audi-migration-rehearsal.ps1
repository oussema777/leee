# Disposable local SQL rehearsal. Never loads application/production URLs.
$ErrorActionPreference = 'Stop'
$pgBin = 'C:/Program Files/PostgreSQL/18/bin'
$repoRoot = Split-Path -Parent $PSScriptRoot
$testDatabase = 'audi_rehearsal_' + [guid]::NewGuid().ToString('N')
if ($testDatabase -notmatch '^audi_rehearsal_[a-f0-9]{32}$') { throw 'Invalid disposable database name' }
$connectionArgs = @('-h', '127.0.0.1', '-p', '55441', '-U', 'postgres', '-w')
$created = $false
try {
  & "$pgBin/createdb.exe" @connectionArgs $testDatabase
  if ($LASTEXITCODE -ne 0) { throw 'Could not create local rehearsal database' }
  $created = $true
  # FK parent stubs test migration order. Full-model integration tests run separately.
  'CREATE TABLE "BookOrder" ("id" TEXT PRIMARY KEY); CREATE TABLE "EbookOrder" ("id" TEXT PRIMARY KEY);' | & "$pgBin/psql.exe" @connectionArgs -d $testDatabase -X -v ON_ERROR_STOP=1 -f -
  if ($LASTEXITCODE -ne 0) { throw 'Could not create parent stubs' }
  foreach ($file in @('20261024_cybersource_live_settlement.sql', '20261024_cybersource_background_jobs.sql', '20261024_cybersource_live_sessions.sql', '20261024_cybersource_submitted_session.sql', '20261024_cybersource_operations.sql')) {
    & "$pgBin/psql.exe" @connectionArgs -d $testDatabase -X -v ON_ERROR_STOP=1 -f (Join-Path $repoRoot "prisma/changes/$file")
    if ($LASTEXITCODE -ne 0) { throw "Migration failed: $file" }
  }
  @'
DO $$ BEGIN
  IF (SELECT count(*) FROM pg_class WHERE relname IN ('CybersourceLiveAttempt','CardPaymentOutbox','CardPaymentOpsNote','CardPaymentJobStatus') AND relrowsecurity) <> 4 THEN RAISE EXCEPTION 'RLS missing'; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='CybersourceLiveAttempt' AND column_name='customerCheckAfter') THEN RAISE EXCEPTION 'Operations field missing'; END IF;
END $$;
INSERT INTO "BookOrder" VALUES ('local-only');
INSERT INTO "CybersourceLiveAttempt" (id,"bookOrderId","orderReference","merchantId","amountCents","sessionState") VALUES ('local-only','local-only','local-only','local-only',900,'SUBMITTED');
'@ | & "$pgBin/psql.exe" @connectionArgs -d $testDatabase -X -v ON_ERROR_STOP=1 -f -
  if ($LASTEXITCODE -ne 0) { throw 'Migration validation failed' }
  Write-Output 'PASS: five Audi migrations in dependency order, RLS, operations field and SUBMITTED session constraint.'
} finally {
  if ($created) {
    & "$pgBin/dropdb.exe" @connectionArgs $testDatabase
    if ($LASTEXITCODE -ne 0) { throw 'Could not remove local rehearsal database' }
  }
}
