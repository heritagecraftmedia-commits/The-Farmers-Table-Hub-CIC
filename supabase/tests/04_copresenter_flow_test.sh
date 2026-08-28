#!/usr/bin/env bash
# Co-presenter assignment: permissions and data flow. Setup as 02_api_flow_test.sh.
API=${API:-http://127.0.0.1:5555}
A=$(cat /tmp/jwt_anon); L=$(cat /tmp/jwt_listener); F=$(cat /tmp/jwt_founder)
pass=0; fail=0
chk(){ if [ "$2" = "$3" ]; then printf "  ok   %-60s %s\n" "$1" "$3"; pass=$((pass+1));
       else printf "  FAIL %-60s got=%s want=%s\n" "$1" "$3" "$2"; fail=$((fail+1)); fi; }
blocked(){ if [ "$2" = "401" ] || [ "$2" = "403" ]; then printf "  ok   %-60s blocked (%s)\n" "$1" "$2"; pass=$((pass+1));
           else printf "  FAIL %-60s got=%s want=401/403\n" "$1" "$2"; fail=$((fail+1)); fi; }
code(){ curl -s -o /dev/null -w "%{http_code}" "$@"; }
body(){ curl -s "$@"; }
count(){ body "$@" | python3 -c 'import sys,json;print(len(json.load(sys.stdin)))'; }

psql -h /tmp/pgsock -p 5439 -U postgres -d radiotest -q <<'CLEAN'
delete from radio_programme_presenters where programme_id in (select id from radio_shows where slug='cp-test-show');
delete from radio_shows where slug='cp-test-show';
delete from radio_presenters where slug in ('cp-primary','cp-co-one','cp-co-two');
CLEAN

PRIMARY=$(body -X POST $API/radio_presenters -H "Authorization: Bearer $F" -H 'Content-Type: application/json' -H 'Prefer: return=representation' \
  -d '{"name":"CP Primary","slug":"cp-primary","status":"published","is_active":true}' | python3 -c 'import sys,json;print(json.load(sys.stdin)[0]["id"])')
CO1=$(body -X POST $API/radio_presenters -H "Authorization: Bearer $F" -H 'Content-Type: application/json' -H 'Prefer: return=representation' \
  -d '{"name":"CP Co One","slug":"cp-co-one","status":"published","is_active":true}' | python3 -c 'import sys,json;print(json.load(sys.stdin)[0]["id"])')
CO2=$(body -X POST $API/radio_presenters -H "Authorization: Bearer $F" -H 'Content-Type: application/json' -H 'Prefer: return=representation' \
  -d '{"name":"CP Co Two","slug":"cp-co-two","status":"published","is_active":true}' | python3 -c 'import sys,json;print(json.load(sys.stdin)[0]["id"])')
PID=$(body -X POST $API/radio_shows -H "Authorization: Bearer $F" -H 'Content-Type: application/json' -H 'Prefer: return=representation' \
  -d "{\"title\":\"CP Test Show\",\"slug\":\"cp-test-show\",\"content_status\":\"published\",\"presenter_id\":\"$PRIMARY\"}" | python3 -c 'import sys,json;print(json.load(sys.stdin)[0]["id"])')

echo "=== 1. PERMISSIONS ==="
for pair in "anon:$A" "listener:$L"; do
  who=${pair%%:*}; tok=${pair#*:}
  blocked "$who cannot assign a co-presenter" \
    "$(code -X POST $API/radio_programme_presenters -H "Authorization: Bearer $tok" -H 'Content-Type: application/json' \
       -d "{\"programme_id\":\"$PID\",\"presenter_id\":\"$CO1\"}")"
done

echo
echo "=== 2. ASSIGNMENT PERSISTS ==="
body -X POST $API/radio_programme_presenters -H "Authorization: Bearer $F" -H 'Content-Type: application/json' \
  -d "{\"programme_id\":\"$PID\",\"presenter_id\":\"$CO1\",\"presenter_role\":\"co-presenter\",\"sort_order\":0}" >/dev/null
body -X POST $API/radio_programme_presenters -H "Authorization: Bearer $F" -H 'Content-Type: application/json' \
  -d "{\"programme_id\":\"$PID\",\"presenter_id\":\"$CO2\",\"presenter_role\":\"co-presenter\",\"sort_order\":1}" >/dev/null
chk "two co-presenters stored" 2 "$(count "$API/radio_programme_presenters?select=presenter_id&programme_id=eq.$PID" -H "Authorization: Bearer $F")"

echo
echo "=== 3. PUBLIC READ VIA THE APP'S EMBED ==="
EMB=$(body -G "$API/radio_shows" --data-urlencode "select=id,presenter:radio_presenters!radio_shows_presenter_id_fkey(name),radio_programme_presenters(presenter_role,radio_presenters(name))" --data-urlencode "slug=eq.cp-test-show" -H "Authorization: Bearer $A")
chk "public sees the primary presenter" "CP Primary" "$(echo "$EMB" | python3 -c 'import sys,json;print(json.load(sys.stdin)[0]["presenter"]["name"])')"
chk "public sees both co-presenters" 2 "$(echo "$EMB" | python3 -c 'import sys,json;print(len(json.load(sys.stdin)[0]["radio_programme_presenters"]))')"

echo
echo "=== 4. CO-PRESENTER-ONLY PERSON IS LINKED TO THE PROGRAMME ==="
chk "CP Co One is a co-presenter without being primary" 1 \
  "$(count "$API/radio_programme_presenters?select=programme_id&presenter_id=eq.$CO1" -H "Authorization: Bearer $A")"
chk "CP Co One is NOT the primary presenter of any programme" 0 \
  "$(count "$API/radio_shows?select=id&presenter_id=eq.$CO1" -H "Authorization: Bearer $A")"

echo
echo "=== 5. CO-PRESENTERS HIDDEN WHEN THE PROGRAMME IS UNPUBLISHED ==="
body -X PATCH "$API/radio_shows?id=eq.$PID" -H "Authorization: Bearer $F" -H 'Content-Type: application/json' -d '{"content_status":"draft"}' >/dev/null
chk "co-presenter links hidden with the programme" 0 "$(count "$API/radio_programme_presenters?select=presenter_id&programme_id=eq.$PID" -H "Authorization: Bearer $A")"
body -X PATCH "$API/radio_shows?id=eq.$PID" -H "Authorization: Bearer $F" -H 'Content-Type: application/json' -d '{"content_status":"published"}' >/dev/null

echo
echo "=== 6. REPLACE-THE-LIST SEMANTICS + NO DUPLICATE WITH PRIMARY ==="
body -X DELETE "$API/radio_programme_presenters?programme_id=eq.$PID" -H "Authorization: Bearer $F" >/dev/null
body -X POST $API/radio_programme_presenters -H "Authorization: Bearer $F" -H 'Content-Type: application/json' \
  -d "{\"programme_id\":\"$PID\",\"presenter_id\":\"$CO2\",\"presenter_role\":\"co-presenter\",\"sort_order\":0}" >/dev/null
chk "list replaced, leaving one co-presenter" 1 "$(count "$API/radio_programme_presenters?select=presenter_id&programme_id=eq.$PID" -H "Authorization: Bearer $F")"
chk "the primary presenter is not duplicated into the join table" 0 \
  "$(count "$API/radio_programme_presenters?select=presenter_id&programme_id=eq.$PID&presenter_id=eq.$PRIMARY" -H "Authorization: Bearer $F")"

echo
echo "=== 7. CASCADE ==="
body -X DELETE "$API/radio_shows?id=eq.$PID" -H "Authorization: Bearer $F" >/dev/null
chk "deleting the programme removes its co-presenter links" 0 \
  "$(count "$API/radio_programme_presenters?select=presenter_id&programme_id=eq.$PID" -H "Authorization: Bearer $F")"

echo
echo "-------------------------------------------------------------"
echo "passed: $pass   failed: $fail"
[ "$fail" -eq 0 ] || exit 1
