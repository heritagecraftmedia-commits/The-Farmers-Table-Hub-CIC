#!/usr/bin/env bash
# Advertising and sponsorship: permissions and data flow through a real
# PostgREST. Every write here bypasses the UI, so it tests the database as the
# security boundary rather than the interface.
#
# Setup is identical to 02_api_flow_test.sh — see that file's header.
API=${API:-http://127.0.0.1:5555}
A=$(cat /tmp/jwt_anon); L=$(cat /tmp/jwt_listener); F=$(cat /tmp/jwt_founder); S=$(cat /tmp/jwt_stranger)
pass=0; fail=0
chk(){ if [ "$2" = "$3" ]; then printf "  ok   %-60s %s\n" "$1" "$3"; pass=$((pass+1));
       else printf "  FAIL %-60s got=%s want=%s\n" "$1" "$3" "$2"; fail=$((fail+1)); fi; }
blocked(){ if [ "$2" = "401" ] || [ "$2" = "403" ]; then printf "  ok   %-60s blocked (%s)\n" "$1" "$2"; pass=$((pass+1));
           else printf "  FAIL %-60s got=%s want=401/403\n" "$1" "$2"; fail=$((fail+1)); fi; }
code(){ curl -s -o /dev/null -w "%{http_code}" "$@"; }
body(){ curl -s "$@"; }
count(){ body "$@" | python3 -c 'import sys,json;print(len(json.load(sys.stdin)))'; }

psql -h /tmp/pgsock -p 5439 -U postgres -d radiotest -q <<'CLEAN'
delete from radio_sponsorships where notes = 'advertising-flow-test';
delete from radio_sponsors where business_name like 'Flow Test%';
CLEAN

echo "=== 1. WRITE PERMISSIONS (UI bypassed) ==="
for pair in "anon:$A" "listener:$L" "stranger:$S"; do
  who=${pair%%:*}; tok=${pair#*:}
  blocked "$who cannot create an advertiser" \
    "$(code -X POST $API/radio_sponsors -H "Authorization: Bearer $tok" -H 'Content-Type: application/json' \
       -d '{"business_name":"Pirate Ads","package":"30s"}')"
  blocked "$who cannot create a sponsorship" \
    "$(code -X POST $API/radio_sponsorships -H "Authorization: Bearer $tok" -H 'Content-Type: application/json' \
       -d '{"sponsor_id":"00000000-0000-0000-0000-000000000000","sponsorship_type":"programme"}')"
  chk "$who cannot publish an existing advertiser" 0 \
    "$(body -X PATCH "$API/radio_sponsors?business_name=like.Flow*" -H "Authorization: Bearer $tok" \
       -H 'Content-Type: application/json' -H 'Prefer: return=representation' \
       -d '{"content_status":"published"}' | python3 -c 'import sys,json;print(len(json.load(sys.stdin)))')"
done

echo
echo "=== 2. DRAFT IS NOT PUBLIC ==="
AID=$(body -X POST $API/radio_sponsors -H "Authorization: Bearer $F" -H 'Content-Type: application/json' -H 'Prefer: return=representation' \
  -d '{"business_name":"Flow Test Bakery","package":"30s","ad_script":"A real script","status":"active","content_status":"draft"}' \
  | python3 -c 'import sys,json;print(json.load(sys.stdin)[0]["id"])')
chk "founder created an advertiser" "yes" "$([ -n "$AID" ] && echo yes || echo no)"
chk "DRAFT advertiser is NOT publicly visible" 0 "$(count "$API/radio_sponsors?select=id&id=eq.$AID" -H "Authorization: Bearer $A")"

echo
echo "=== 3. PUBLISHED IS PUBLIC ==="
body -X PATCH "$API/radio_sponsors?id=eq.$AID" -H "Authorization: Bearer $F" -H 'Content-Type: application/json' -d '{"content_status":"published"}' >/dev/null
chk "PUBLISHED + active advertiser IS publicly visible" 1 "$(count "$API/radio_sponsors?select=id&id=eq.$AID" -H "Authorization: Bearer $A")"

echo
echo "=== 4. UNPUBLISHING AND PAUSING BOTH HIDE IT ==="
body -X PATCH "$API/radio_sponsors?id=eq.$AID" -H "Authorization: Bearer $F" -H 'Content-Type: application/json' -d '{"content_status":"draft"}' >/dev/null
chk "unpublished advertiser is hidden again" 0 "$(count "$API/radio_sponsors?select=id&id=eq.$AID" -H "Authorization: Bearer $A")"
body -X PATCH "$API/radio_sponsors?id=eq.$AID" -H "Authorization: Bearer $F" -H 'Content-Type: application/json' -d '{"content_status":"published","status":"paused"}' >/dev/null
chk "PAUSED advertiser is hidden even when published" 0 "$(count "$API/radio_sponsors?select=id&id=eq.$AID" -H "Authorization: Bearer $A")"

echo
echo "=== 5. DATE WINDOW IS ENFORCED ==="
body -X PATCH "$API/radio_sponsors?id=eq.$AID" -H "Authorization: Bearer $F" -H 'Content-Type: application/json' \
  -d '{"status":"active","start_date":"2020-01-01","end_date":"2020-12-31"}' >/dev/null
chk "an EXPIRED campaign window is not publicly visible" 0 "$(count "$API/radio_sponsors?select=id&id=eq.$AID" -H "Authorization: Bearer $A")"
body -X PATCH "$API/radio_sponsors?id=eq.$AID" -H "Authorization: Bearer $F" -H 'Content-Type: application/json' \
  -d '{"start_date":"2020-01-01","end_date":"2099-12-31"}' >/dev/null
chk "an in-window campaign IS publicly visible" 1 "$(count "$API/radio_sponsors?select=id&id=eq.$AID" -H "Authorization: Bearer $A")"

echo
echo "=== 6. SPONSORSHIP PLACEMENTS ==="
SID=$(body -X POST $API/radio_sponsorships -H "Authorization: Bearer $F" -H 'Content-Type: application/json' -H 'Prefer: return=representation' \
  -d "{\"sponsor_id\":\"$AID\",\"sponsorship_type\":\"programme\",\"status\":\"draft\",\"notes\":\"advertising-flow-test\"}" \
  | python3 -c 'import sys,json;print(json.load(sys.stdin)[0]["id"])')
chk "founder created a sponsorship placement" "yes" "$([ -n "$SID" ] && echo yes || echo no)"
chk "DRAFT sponsorship is NOT publicly visible" 0 "$(count "$API/radio_sponsorships?select=id&id=eq.$SID" -H "Authorization: Bearer $A")"
body -X PATCH "$API/radio_sponsorships?id=eq.$SID" -H "Authorization: Bearer $F" -H 'Content-Type: application/json' -d '{"status":"published"}' >/dev/null
chk "PUBLISHED sponsorship IS publicly visible" 1 "$(count "$API/radio_sponsorships?select=id&id=eq.$SID" -H "Authorization: Bearer $A")"
body -X PATCH "$API/radio_sponsorships?id=eq.$SID" -H "Authorization: Bearer $F" -H 'Content-Type: application/json' \
  -d '{"start_date":"2020-01-01","end_date":"2020-02-01"}' >/dev/null
chk "an out-of-window sponsorship is hidden" 0 "$(count "$API/radio_sponsorships?select=id&id=eq.$SID" -H "Authorization: Bearer $A")"

echo
echo "=== 7. CASCADE ==="
body -X DELETE "$API/radio_sponsors?id=eq.$AID" -H "Authorization: Bearer $F" >/dev/null
chk "deleting the advertiser removes its sponsorships" 0 \
  "$(count "$API/radio_sponsorships?select=id&id=eq.$SID" -H "Authorization: Bearer $F")"

echo
echo "-------------------------------------------------------------"
echo "passed: $pass   failed: $fail"
[ "$fail" -eq 0 ] || exit 1
