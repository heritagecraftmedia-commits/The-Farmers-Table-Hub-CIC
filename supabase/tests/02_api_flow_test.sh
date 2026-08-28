#!/usr/bin/env bash
# End-to-end API test: permissions and data flow through a REAL PostgREST,
# exercising exactly what supabase-js talks to rather than mocking it.
#
# This is the test that proves the security boundary is the DATABASE and not
# the UI: every write below bypasses the React app entirely.
#
# SETUP (one off):
#   1. Build the schema:      ./supabase/tests/run-radio-tests.sh
#   2. Fetch PostgREST:       https://github.com/PostgREST/postgrest/releases
#   3. Run it against the test database with:
#        db-uri     = "postgres://postgres@/radiotest?host=/tmp/pgsock&port=5439"
#        db-anon-role = "anon"
#        jwt-secret = "super-secret-local-test-jwt-key-at-least-32-chars-long"
#        server-port = 5555
#   4. Create JWTs for each persona in /tmp/jwt_{anon,listener,founder,stranger}
#      (HS256, claims: {"role":"anon"} or {"role":"authenticated","sub":"<uuid>"})
#   5. Grant the API roles:
#        grant usage on schema public to anon, authenticated;
#        grant select, insert, update, delete on all tables in schema public
#          to anon, authenticated;
#        grant execute on all functions in schema public to anon, authenticated;
#
# Then: ./supabase/tests/02_api_flow_test.sh
API=http://127.0.0.1:5555
A=$(cat /tmp/jwt_anon); L=$(cat /tmp/jwt_listener); F=$(cat /tmp/jwt_founder); S=$(cat /tmp/jwt_stranger)
pass=0; fail=0
chk() { # chk <desc> <expected> <actual>
  if [ "$2" = "$3" ]; then printf "  ok   %-62s %s\n" "$1" "$3"; pass=$((pass+1));
  else printf "  FAIL %-62s got=%s want=%s\n" "$1" "$3" "$2"; fail=$((fail+1)); fi
}
# PostgREST answers 401 for anon and 403 for a signed-in user who lacks the
# role. Both mean "refused by RLS"; the distinction is not a security property.
chk_blocked() {
  if [ "$2" = "401" ] || [ "$2" = "403" ]; then printf "  ok   %-62s blocked (%s)\n" "$1" "$2"; pass=$((pass+1));
  else printf "  FAIL %-62s got=%s want=401/403\n" "$1" "$2"; fail=$((fail+1)); fi
}
code() { curl -s -o /dev/null -w "%{http_code}" "$@"; }
body() { curl -s "$@"; }

# Start from a known state so the run is repeatable.
psql -h /tmp/pgsock -p 5439 -U postgres -d radiotest -q <<'CLEAN'
delete from radio_schedule where programme_id in (select id from radio_shows where slug = 'verification-test');
delete from radio_programme_presenters where programme_id in (select id from radio_shows where slug = 'verification-test');
delete from radio_shows where slug = 'verification-test';
delete from radio_presenters where slug like 'verification-presenter%' or slug like 'fake-%';
delete from radio_submissions where submitter_email in ('t@example.com','s@example.com');
delete from radio_media where title = 'Unchecked Verification Track';
CLEAN

echo "=== 1. WRITE PERMISSIONS (server-side, UI bypassed entirely) ==="
for pair in "anon:$A" "listener:$L" "stranger:$S"; do
  who=${pair%%:*}; tok=${pair#*:}
  chk_blocked "$who cannot create a programme" \
    "$(code -X POST $API/radio_shows -H "Authorization: Bearer $tok" -H 'Content-Type: application/json' -d '{"title":"Pirate Show"}')"
  chk_blocked "$who cannot create a presenter" \
    "$(code -X POST $API/radio_presenters -H "Authorization: Bearer $tok" -H 'Content-Type: application/json' -d '{"name":"Fake","slug":"fake-'$who'"}')"
  chk_blocked "$who cannot create a schedule rule" \
    "$(code -X POST $API/radio_schedule -H "Authorization: Bearer $tok" -H 'Content-Type: application/json' -d '{"start_time":"09:00","end_time":"10:00","repeat_pattern":"daily"}')"
  chk "$who cannot edit stream settings" 0 \
    "$(body -X PATCH "$API/radio_station_settings?provider=eq.live365" -H "Authorization: Bearer $tok" -H 'Content-Type: application/json' -H 'Prefer: return=representation' -d '{"stream_url":"http://attacker.example"}' | python3 -c 'import sys,json;print(len(json.load(sys.stdin)))')"
  chk "$who cannot read the submission queue" 0 \
    "$(body "$API/radio_submissions?select=id" -H "Authorization: Bearer $tok" | python3 -c 'import sys,json;print(len(json.load(sys.stdin)))')"
done

echo
echo "=== 2. DATA FLOW: admin creates -> database -> public page ==="
PID=$(body -X POST $API/radio_shows -H "Authorization: Bearer $F" -H 'Content-Type: application/json' -H 'Prefer: return=representation' \
  -d '{"title":"Verification Test Programme","slug":"verification-test","content_status":"draft","category":"Community"}' \
  | python3 -c 'import sys,json;print(json.load(sys.stdin)[0]["id"])')
chk "founder created a programme" "yes" "$([ -n "$PID" ] && echo yes || echo no)"
chk "DRAFT programme is NOT publicly visible" 0 \
  "$(body "$API/radio_shows?select=id&slug=eq.verification-test&content_status=eq.published" -H "Authorization: Bearer $A" | python3 -c 'import sys,json;print(len(json.load(sys.stdin)))')"
body -X PATCH "$API/radio_shows?id=eq.$PID" -H "Authorization: Bearer $F" -H 'Content-Type: application/json' -d '{"content_status":"published"}' >/dev/null
chk "PUBLISHED programme IS publicly visible" 1 \
  "$(body "$API/radio_shows?select=id&slug=eq.verification-test" -H "Authorization: Bearer $A" | python3 -c 'import sys,json;print(len(json.load(sys.stdin)))')"

RID=$(body -X POST $API/radio_presenters -H "Authorization: Bearer $F" -H 'Content-Type: application/json' -H 'Prefer: return=representation' \
  -d '{"name":"Verification Presenter","slug":"verification-presenter","status":"draft","is_active":true}' \
  | python3 -c 'import sys,json;print(json.load(sys.stdin)[0]["id"])')
chk "DRAFT presenter is NOT publicly visible" 0 \
  "$(body "$API/radio_presenters?select=id&slug=eq.verification-presenter" -H "Authorization: Bearer $A" | python3 -c 'import sys,json;print(len(json.load(sys.stdin)))')"
body -X PATCH "$API/radio_presenters?id=eq.$RID" -H "Authorization: Bearer $F" -H 'Content-Type: application/json' -d '{"status":"published"}' >/dev/null
chk "PUBLISHED presenter IS publicly visible" 1 \
  "$(body "$API/radio_presenters?select=id&slug=eq.verification-presenter" -H "Authorization: Bearer $A" | python3 -c 'import sys,json;print(len(json.load(sys.stdin)))')"

# co-presenter link (the path just fixed)
body -X POST $API/radio_programme_presenters -H "Authorization: Bearer $F" -H 'Content-Type: application/json' \
  -d "{\"programme_id\":\"$PID\",\"presenter_id\":\"$RID\",\"presenter_role\":\"co-presenter\"}" >/dev/null
chk "co-presenter embed resolves for the public" 1 \
  "$(body -G "$API/radio_shows" --data-urlencode "select=id,radio_programme_presenters(presenter_role,radio_presenters(name))" --data-urlencode "slug=eq.verification-test" -H "Authorization: Bearer $A" | python3 -c 'import sys,json;d=json.load(sys.stdin);print(len(d[0]["radio_programme_presenters"]))')"

body -X POST $API/radio_schedule -H "Authorization: Bearer $F" -H 'Content-Type: application/json' \
  -d "{\"programme_id\":\"$PID\",\"repeat_pattern\":\"daily\",\"start_time\":\"09:00\",\"end_time\":\"10:00\",\"is_active\":true}" >/dev/null
chk "schedule rule for a published programme is public" 1 \
  "$(body "$API/radio_schedule?select=id&programme_id=eq.$PID" -H "Authorization: Bearer $A" | python3 -c 'import sys,json;print(len(json.load(sys.stdin)))')"
body -X PATCH "$API/radio_shows?id=eq.$PID" -H "Authorization: Bearer $F" -H 'Content-Type: application/json' -d '{"content_status":"draft"}' >/dev/null
chk "unpublishing the programme hides its schedule too" 0 \
  "$(body "$API/radio_schedule?select=id&programme_id=eq.$PID" -H "Authorization: Bearer $A" | python3 -c 'import sys,json;print(len(json.load(sys.stdin)))')"
body -X PATCH "$API/radio_shows?id=eq.$PID" -H "Authorization: Bearer $F" -H 'Content-Type: application/json' -d '{"content_status":"published"}' >/dev/null

echo
echo "=== 3. DATA FLOW: submission -> moderation -> decision ==="
chk "anonymous visitor CAN submit" 201 \
  "$(code -X POST $API/radio_submissions -H "Authorization: Bearer $A" -H 'Content-Type: application/json' \
     -d '{"submission_type":"music","submitter_name":"Test Person","submitter_email":"t@example.com","title":"A Submitted Track"}')"
chk_blocked "submission cannot arrive pre-approved" \
  "$(code -X POST $API/radio_submissions -H "Authorization: Bearer $A" -H 'Content-Type: application/json' \
     -d '{"submission_type":"music","submitter_name":"Sneaky","submitter_email":"s@example.com","title":"Self approved","status":"approved"}')"
chk "submitter cannot read back their own submission" 0 \
  "$(body "$API/radio_submissions?select=id" -H "Authorization: Bearer $A" | python3 -c 'import sys,json;print(len(json.load(sys.stdin)))')"
chk "founder sees it in the moderation queue" "yes" \
  "$(body "$API/radio_submissions?select=id&status=eq.pending" -H "Authorization: Bearer $F" | python3 -c 'import sys,json;print("yes" if len(json.load(sys.stdin))>0 else "no")')"
SUB=$(body "$API/radio_submissions?select=id&status=eq.pending&limit=1" -H "Authorization: Bearer $F" | python3 -c 'import sys,json;print(json.load(sys.stdin)[0]["id"])')
body -X PATCH "$API/radio_submissions?id=eq.$SUB" -H "Authorization: Bearer $F" -H 'Content-Type: application/json' -d '{"status":"approved"}' >/dev/null
chk "approved submission STILL not publicly readable" 0 \
  "$(body "$API/radio_submissions?select=id" -H "Authorization: Bearer $A" | python3 -c 'import sys,json;print(len(json.load(sys.stdin)))')"

echo
echo "=== 4. LICENSING GATE ==="
body -X POST $API/radio_media -H "Authorization: Bearer $F" -H 'Content-Type: application/json' \
  -d '{"title":"Unchecked Verification Track","media_type":"music","audio_url":"u","is_active":true,"content_status":"published","licence_status":"unknown"}' >/dev/null
chk "published-but-unchecked music is NOT public" 0 \
  "$(body "$API/radio_media?select=id&title=eq.Unchecked%20Verification%20Track" -H "Authorization: Bearer $A" | python3 -c 'import sys,json;print(len(json.load(sys.stdin)))')"

echo
echo "-------------------------------------------------------------"
echo "passed: $pass   failed: $fail"
[ "$fail" -eq 0 ] || exit 1
