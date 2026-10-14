#!/usr/bin/env bash
# Loads the design schema (unchanged) and the additive hardening migration into a clean database.
# Uses the standard PG* environment variables (PGHOST, PGUSER, PGPASSWORD, PGDATABASE).
set -euo pipefail
export PGOPTIONS="-c client_min_messages=warning"
here="$(cd "$(dirname "$0")/.." && pwd)"
psql -v ON_ERROR_STOP=1 -q -c "DROP SCHEMA IF EXISTS sb CASCADE;"
psql -v ON_ERROR_STOP=1 -q -f "$here/../design-package/02_SQL/schema.sql"
psql -v ON_ERROR_STOP=1 -q -f "$here/sql/002_reference_hardening.sql"
echo "schema + hardening applied: $(psql -Atc "select count(*) from information_schema.tables where table_schema='sb'") tables"
