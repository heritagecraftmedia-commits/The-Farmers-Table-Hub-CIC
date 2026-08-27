#!/usr/bin/env bash
# Validates the radio migration chain and its Row Level Security against a
# throwaway local PostgreSQL, so the schema can be proven before it is applied
# to the live Supabase project.
#
#   ./supabase/tests/run-radio-tests.sh
#
# Requires: postgresql-16 client + server binaries.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
export PATH="/usr/lib/postgresql/16/bin:$PATH"
SOCK=${SOCK:-/tmp/pgsock}
PORT=${PORT:-5439}
PGDATA=${PGDATA:-/tmp/pgdata_radio}
PGUSER_LOCAL=$(id postgres >/dev/null 2>&1 && echo postgres || echo "$(whoami)")

if ! pg_isready -h "$SOCK" -p "$PORT" >/dev/null 2>&1; then
  echo "==> starting throwaway postgres"
  rm -rf "$PGDATA"; mkdir -p "$SOCK" "$PGDATA"
  chown -R "$PGUSER_LOCAL" "$SOCK" "$PGDATA" 2>/dev/null || true
  su "$PGUSER_LOCAL" -c "PATH=$PATH initdb -D $PGDATA -U postgres --auth=trust" >/dev/null
  su "$PGUSER_LOCAL" -c "PATH=$PATH pg_ctl -D $PGDATA -o '-p $PORT -k $SOCK -c listen_addresses=' -l $PGDATA/pg.log start" >/dev/null
  sleep 3
fi

PSQL="psql -h $SOCK -p $PORT -U postgres -v ON_ERROR_STOP=1 -q"

echo "==> creating roles + fresh database"
for r in anon authenticated service_role; do
  $PSQL -d postgres -c "do \$\$ begin if not exists (select 1 from pg_roles where rolname='$r') then create role $r nologin; end if; end \$\$;" >/dev/null
done
$PSQL -d postgres -c "drop database if exists radiotest;" -c "create database radiotest;" >/dev/null

echo "==> applying migration chain"
for f in \
  "$REPO_ROOT/supabase/tests/00_supabase_stub.sql" \
  "$REPO_ROOT/supabase-schema.sql" \
  "$REPO_ROOT/supabase/migrations/20260317_radio_events.sql" \
  "$REPO_ROOT/supabase/migrations/20260825_radio_v1.sql" \
  "$REPO_ROOT/supabase/migrations/20260825_radio_v2_alignment.sql" \
  "$REPO_ROOT/supabase/migrations/20260827_radio_v3_station.sql"
do
  if err=$($PSQL -d radiotest -f "$f" 2>&1 | grep -E '^(psql.*ERROR|ERROR|FATAL)'); then
    echo "FAIL $(basename "$f")"; echo "$err"; exit 1
  fi
  echo "  ok $(basename "$f")"
done

echo "==> re-applying V3 (idempotency check)"
if err=$($PSQL -d radiotest -f "$REPO_ROOT/supabase/migrations/20260827_radio_v3_station.sql" 2>&1 | grep -E '^(psql.*ERROR|ERROR|FATAL)'); then
  echo "FAIL not idempotent"; echo "$err"; exit 1
fi
echo "  ok idempotent"

echo "==> row level security tests"
psql -h "$SOCK" -p "$PORT" -U postgres -d radiotest -f "$REPO_ROOT/supabase/tests/01_radio_rls_test.sql" 2>&1 \
  | grep -vE '^(INSERT 0 [0-9]+|GRANT|SET|RESET|Pager)'

echo
echo "==> done. Inspect the output above: every 'expect' line must match."
