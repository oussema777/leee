# Local disposable SQL rehearsal only. Never reads application connection URLs.
$ErrorActionPreference = 'Stop'
$pgBin = 'C:/Program Files/PostgreSQL/18/bin'
$repoRoot = Split-Path -Parent $PSScriptRoot
$testDatabase = 'aramex_rehearsal_' + [guid]::NewGuid().ToString('N')
if ($testDatabase -notmatch '^aramex_rehearsal_[a-f0-9]{32}$') { throw 'Invalid disposable database name' }
$connectionArgs = @('-h', '127.0.0.1', '-p', '55441', '-U', 'postgres', '-w')
function Invoke-TestSql([string[]] $SqlArgs) {
  & "$pgBin/psql.exe" @connectionArgs -d $testDatabase -X -v ON_ERROR_STOP=1 @SqlArgs
  if ($LASTEXITCODE -ne 0) { throw 'Migration rehearsal SQL failed' }
}
$created = $false
try {
  & "$pgBin/createdb.exe" @connectionArgs $testDatabase
  if ($LASTEXITCODE -ne 0) { throw 'Could not create local rehearsal database' }
  $created = $true
  # Only the parent key is needed to exercise the SQL migrations. This is not
  # a substitute for full-schema application integration tests.
  'CREATE TABLE "BookOrder" ("id" TEXT PRIMARY KEY);' | & "$pgBin/psql.exe" @connectionArgs -d $testDatabase -X -v ON_ERROR_STOP=1 -f -
  if ($LASTEXITCODE -ne 0) { throw 'Could not create rehearsal parent table' }
  foreach ($file in @('20261020_aramex_shipping_drafts.sql', '20261020_aramex_submission_records.sql',
    '20261022_aramex_reconciliation.sql', '20261022_aramex_tracking.sql', 'aramex-verify-storage.sql')) {
    Write-Output "Checking $file"
    Invoke-TestSql @('-f', (Join-Path $repoRoot "prisma/changes/$file"))
  }
  # These are apply-once scripts. Reapplying must fail without damaging the
  # already installed schema; a separate connection verifies it afterwards.
  $ErrorActionPreference = 'Continue'
  & "$pgBin/psql.exe" @connectionArgs -d $testDatabase -X -v ON_ERROR_STOP=1 -f (Join-Path $repoRoot 'prisma/changes/20261022_aramex_tracking.sql') 2>$null
  $ErrorActionPreference = 'Stop'
  if ($LASTEXITCODE -eq 0) { throw 'Expected duplicate migration to fail' }
  Invoke-TestSql @('-f', (Join-Path $repoRoot 'prisma/changes/aramex-verify-storage.sql'))
  Write-Output 'PASS: fresh SQL installation and schema preservation after refused reapplication.'
} finally {
  if ($created) {
    & "$pgBin/dropdb.exe" @connectionArgs $testDatabase
    if ($LASTEXITCODE -ne 0) { throw "Could not remove disposable local database $testDatabase" }
  }
}
