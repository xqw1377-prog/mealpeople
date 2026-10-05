#!/usr/bin/env bash
# ============================================================
# G0-Z5: 真实 JWT 黑盒安全矩阵（G0 PASS 的最终证据）
#
# 用法:
#   export SUPABASE_URL="https://<ref>.supabase.co"
#   export ANON_KEY="<当前 anon key>"
#   export JWT_EMP_A="<租户A普通员工的 access_token>"
#   export JWT_EMP_B="<租户B普通员工的 access_token>"
#   export JWT_ADMIN_A="<租户A tenant_admin 的 access_token>"
#   export JWT_ADMIN_B="<租户B tenant_admin 的 access_token>"
#   export TENANT_A="<租户A uuid>"   export TENANT_B="<租户B uuid>"
#   export EMP_A_ID="<租户A员工 profiles.id>"
#   export EMP_B_ID="<租户B某员工 profiles.id>"
#   export CONTRACT_B_ID="<租户B某合同 employment_contracts.id>"
#   export INVITE_A_VALID="<租户A有效 employee 邀请码>"   # 兑换用无租户账号
#   export JWT_UNAFFILIATED="<无租户用户 access_token>"
#   ./g0z_blackbox_matrix.sh | tee ../run-logs/g0z-blackbox-$(date +%Y%m%d-%H%M%S).md
#
# 纪律: 本脚本从真实网络入口（PostgREST/RPC/Storage/Edge）发起，
#       是 G0 PASS 的最终证据；SQL 模拟测试只是前置。
# 证据要求: HTTP 状态码不构成完整证明。B1-B5/E2/E4/D1-D3 每条攻击后
#       须执行文末 after-state SQL，确认数据库状态未变（写成功但
#       后处理 5xx 的情形会被状态码误判为 DENY）。
# 前置: 00111-00122 已落库、5 个 Edge Function 已部署（bind-wechat / wechat-login /
#       create-tenant-with-admin / tenant-admin-login / wechat-quick-login）。
# ============================================================
set -u
PASS=0; FAIL=0
hdr_auth() { echo "apikey: $ANON_KEY"; echo "Authorization: Bearer $1"; echo "Content-Type: application/json"; }

# check <编号> <期望说明> <期望判定: DENY|ALLOW|2xx|4xx> <状态码> [正文]
check() {
  local id="$1" desc="$2" want="$3" code="$4" body="${5:-}"
  local ok=no
  case "$want" in
    DENY)  [[ "$code" -ge 400 || "$body" == *denied* || "$body" == *error* || "$body" == *'"success":false'* ]] && ok=yes;;
    2xx)   [[ "$code" -ge 200 && "$code" -lt 300 ]] && ok=yes;;
    4xx)   [[ "$code" -ge 400 && "$code" -lt 500 ]] && ok=yes;;
    EMPTY) [[ "$code" -lt 300 && ( "$body" == "[]" || "$body" == *'"count":0'* ) ]] && ok=yes;;
  esac
  if [[ "$ok" == yes ]]; then PASS=$((PASS+1)); printf '| %s | %s | %s | %s | PASS |\n' "$id" "$desc" "$want" "$code"
  else FAIL=$((FAIL+1)); printf '| %s | %s | %s | %s | **FAIL** |\n' "$id" "$desc" "$want" "$code"; fi
}

echo "# G0-Z5 黑盒攻击矩阵 $(date -u +%FT%TZ)"
echo
echo "| # | 用例 | 期望 | HTTP | 结果 |"
echo "|---|---|---|---|---|"

req() { # req <jwt|anon> <method> <path> [json]
  local who="$1" m="$2" p="$3" d="${4:-}"
  local tok="$ANON_KEY"
  [[ "$who" != anon ]] && tok="$1"
  if [[ -n "$d" ]]; then
    curl -s --retry 4 --retry-delay 1 --retry-connrefused -o /tmp/g0z_body -w '%{http_code}' -X "$m" "$SUPABASE_URL$p" \
      -H "apikey: $ANON_KEY" -H "Authorization: Bearer $tok" -H "Content-Type: application/json" -d "$d"
  else
    curl -s --retry 4 --retry-delay 1 --retry-connrefused -o /tmp/g0z_body -w '%{http_code}' -X "$m" "$SUPABASE_URL$p" \
      -H "apikey: $ANON_KEY" -H "Authorization: Bearer $tok"
  fi
  true
}

# ---------- PostgREST: 跨租户读 ----------
c=$(req "$JWT_EMP_A" GET "/rest/v1/employees?tenant_id=eq.$TENANT_B&select=id");                    check A1 "员工A 读租户B员工" EMPTY "$c" "$(cat /tmp/g0z_body|head -c 200)"
c=$(req "$JWT_EMP_A" GET "/rest/v1/salary_records?tenant_id=eq.$TENANT_B&select=id");               check A2 "员工A 读租户B工资" EMPTY "$c" "$(cat /tmp/g0z_body|head -c 200)"
c=$(req "$JWT_EMP_A" GET "/rest/v1/candidates?tenant_id=eq.$TENANT_B&select=id");                   check A3 "员工A 读租户B候选人PII" EMPTY "$c" "$(cat /tmp/g0z_body|head -c 200)"
c=$(req "$JWT_ADMIN_A" GET "/rest/v1/employees?tenant_id=eq.$TENANT_B&select=id");                  check A4 "管理员A 读租户B员工" EMPTY "$c" "$(cat /tmp/g0z_body|head -c 200)"
c=$(req "$JWT_ADMIN_A" GET "/rest/v1/salary_records?tenant_id=eq.$TENANT_B&select=id");             check A5 "管理员A 读租户B工资" EMPTY "$c" "$(cat /tmp/g0z_body|head -c 200)"
c=$(req anon GET "/rest/v1/candidates?select=id");                                                  check A6 "匿名 读候选人" EMPTY "$c" "$(cat /tmp/g0z_body|head -c 200)"

# ---------- PostgREST: protected columns 直写 ----------
c=$(req "$JWT_EMP_A" PATCH "/rest/v1/profiles?id=eq.$EMP_A_ID" '{"role":"super_admin"}');           check B1 "员工A 自改 role=super_admin" DENY "$c" "$(cat /tmp/g0z_body|head -c 200)"
c=$(req "$JWT_EMP_A" PATCH "/rest/v1/profiles?id=eq.$EMP_A_ID" "{\"tenant_id\":\"$TENANT_B\"}");    check B2 "员工A 自改 tenant_id→B" DENY "$c" "$(cat /tmp/g0z_body|head -c 200)"
c=$(req "$JWT_ADMIN_A" PATCH "/rest/v1/profiles?id=eq.$EMP_B_ID" '{"role":"store_manager"}');      check B3 "管理员A 直改B成员role(绕RPC)" DENY "$c" "$(cat /tmp/g0z_body|head -c 200)"
# G0-R2: 同值写也必须 DENY（allowlist 模型的直接验证）
c=$(req "$JWT_EMP_A" PATCH "/rest/v1/profiles?id=eq.$EMP_A_ID" '{"role":"employee"}');              check B4 "员工A role=employee 同值写" DENY "$c" "$(cat /tmp/g0z_body|head -c 200)"
c=$(req "$JWT_EMP_A" PATCH "/rest/v1/profiles?id=eq.$EMP_A_ID" '{"wechat_openid":null}');           check B5 "员工A 直写身份列 wechat_openid" DENY "$c" "$(cat /tmp/g0z_body|head -c 200)"
# 白名单列回归（必须 ALLOW）
c=$(req "$JWT_EMP_A" PATCH "/rest/v1/profiles?id=eq.$EMP_A_ID" '{"name":"blackbox-ok"}');           check B6 "员工A 改 name(白名单列)" 2xx "$c"

# ---------- 租户创建（CONTROLLED_PROVISIONING） ----------
c=$(req "$JWT_EMP_A" POST "/rest/v1/tenants" '{"name":"blackbox-攻击租户","status":"active"}');     check C1 "员工A 自建租户" DENY "$c" "$(cat /tmp/g0z_body|head -c 200)"

# ---------- RPC: 邀请兑换 ----------
c=$(req "$JWT_UNAFFILIATED" POST "/rest/v1/rpc/join_tenant_with_code" "{\"p_code\":\"FORGED0000000000000000000000\",\"p_user_id\":null,\"p_user_name\":\"u\"}")
check D1 "伪造邀请码兑换" DENY "$c" "$(cat /tmp/g0z_body|head -c 200)"
c=$(req "$JWT_EMP_A" POST "/rest/v1/rpc/join_tenant_with_code" "{\"p_code\":\"$INVITE_A_VALID\",\"p_user_id\":\"$EMP_B_ID\",\"p_user_name\":\"spoof\"}")
check D2 "替他人 user_id 兑换" DENY "$c" "$(cat /tmp/g0z_body|head -c 200)"
c=$(req "$JWT_EMP_A" POST "/rest/v1/rpc/join_tenant_with_code" "{\"p_code\":\"$INVITE_A_VALID\",\"p_user_id\":null,\"p_user_name\":\"u\"}")
check D3 "已有租户者兑换(防跳槽)" DENY "$c" "$(cat /tmp/g0z_body|head -c 200)"
c=$(req "$JWT_UNAFFILIATED" POST "/rest/v1/rpc/admin_assign_member_role" "{\"p_target_user\":\"$EMP_B_ID\",\"p_new_role\":\"store_manager\"}")
check D4 "无管理权限调指派RPC" DENY "$c" "$(cat /tmp/g0z_body|head -c 200)"

# ---------- Storage: 合同签名 ----------
c=$(curl -s --retry 4 --retry-delay 1 --retry-connrefused -o /dev/null -w '%{http_code}' "$SUPABASE_URL/storage/v1/object/public/contract_signatures/x.png")
check E1 "匿名 public URL 直读签名" 4xx "$c"
c=$(curl -s --retry 4 --retry-delay 1 --retry-connrefused -o /dev/null -w '%{http_code}' -X POST "$SUPABASE_URL/storage/v1/object/contract_signatures/$TENANT_B/$CONTRACT_B_ID/fake.png" \
  -H "apikey: $ANON_KEY" -H "Authorization: Bearer $JWT_EMP_A" -H "Content-Type: image/png" --data-binary 'x')
check E2 "员工A 向租户B合同路径上传签名" DENY "$c"
c=$(curl -s --retry 4 --retry-delay 1 --retry-connrefused -o /dev/null -w '%{http_code}' "$SUPABASE_URL/storage/v1/object/authenticated/contract_signatures/$TENANT_B/$CONTRACT_B_ID/sig.png" \
  -H "apikey: $ANON_KEY" -H "Authorization: Bearer $JWT_EMP_A")
check E3 "员工A 读租户B合同签名对象" DENY "$c"
# G0-R2: 覆盖/upsert 已签名对象 = DENY（签名不可篡改）
c=$(curl -s --retry 4 --retry-delay 1 --retry-connrefused -o /dev/null -w '%{http_code}' -X POST "$SUPABASE_URL/storage/v1/object/contract_signatures/$TENANT_B/$CONTRACT_B_ID/sig.png" \
  -H "apikey: $ANON_KEY" -H "Authorization: Bearer $JWT_EMP_A" -H "Content-Type: image/png" -H "x-upsert: true" --data-binary 'x')
check E4 "upsert 覆盖已存在签名" DENY "$c"

# ---------- Edge Functions ----------
c=$(curl -s --retry 4 --retry-delay 1 --retry-connrefused -o /tmp/g0z_body -w '%{http_code}' -X POST "$SUPABASE_URL/functions/v1/create-tenant-with-admin" \
  -H "apikey: $ANON_KEY" -H "Content-Type: application/json" -d '{"phone":"13800000000"}')
check F1 "无JWT建租户" 4xx "$c" "$(cat /tmp/g0z_body|head -c 200)"
c=$(curl -s --retry 4 --retry-delay 1 --retry-connrefused -o /tmp/g0z_body -w '%{http_code}' -X POST "$SUPABASE_URL/functions/v1/create-tenant-with-admin" \
  -H "apikey: $ANON_KEY" -H "Authorization: Bearer $JWT_EMP_A" -H "Content-Type: application/json" -d '{"phone":"13800000001"}')
check F2 "普通JWT建租户(须403受控开通)" DENY "$c" "$(cat /tmp/g0z_body|head -c 200)"
c=$(curl -s --retry 4 --retry-delay 1 --retry-connrefused -o /tmp/g0z_body -w '%{http_code}' -X POST "$SUPABASE_URL/functions/v1/bind-wechat" \
  -H "apikey: $ANON_KEY" -H "Content-Type: application/json" -d "{\"code\":\"x\",\"userId\":\"$EMP_B_ID\"}")
check F3 "匿名bind-wechat" 4xx "$c" "$(cat /tmp/g0z_body|head -c 200)"

# ---------- 正向回归（须 ALLOW，证明业务没被打断） ----------
c=$(req "$JWT_EMP_A" GET "/rest/v1/profiles?select=id&limit=1");                                    check G1 "员工A 正常读profiles" 2xx "$c"
c=$(req "$JWT_ADMIN_A" GET "/rest/v1/employees?tenant_id=eq.$TENANT_A&select=id&limit=1");           check G2 "管理员A 读本租户员工" 2xx "$c"

echo
echo "**PASS=$PASS FAIL=$FAIL**"
[[ "$FAIL" -eq 0 ]] && echo "RESULT: BLACKBOX-MATRIX-PASS" || echo "RESULT: BLACKBOX-MATRIX-FAILED"
echo
echo "## 攻击后置核验（人工执行，贴入下方）"
echo '```sql'
echo "SELECT id, role, tenant_id FROM profiles WHERE id IN ('$EMP_A_ID','$EMP_B_ID');"
echo '```'
[[ "$FAIL" -ne 0 ]] && exit 1
exit 0
