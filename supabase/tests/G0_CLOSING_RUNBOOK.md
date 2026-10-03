# G0 CLOSING RUN 手册（工程整改 CLOSED 后的唯一执行程序）

> Closing source checkpoint：`17c58f836c90414b37e7f4a16713104bcb43107e`（链：134d521 → 7a30a25 → 61031b9 → 17c58f8）
> 状态：SECURITY IMPLEMENTATION = **CLOSED**；STATIC PRECLOSURE = **PASS（待 R3 diff 确认）**；LIVE SECURITY PROOF = **OPEN**；NEW SECURITY CODE = **NO**
> 纪律：只做部署、验证、轮换、取证。验证暴露真实失败时，**只修失败项**，不预防性扩 scope。
> pgcrypto = LIVE OBSERVATION：部署时实测 `digest()/gen_random_bytes()` 在 `search_path=public` 下可解析；真失败再走 B-line，不预防性改代码。

## G0 PASS 判定（冻结，六条件缺一即 HOLD）

```
Migration deployed（真实状态，非命令返回成功）
AND SQL/invariant tests green
AND real-JWT black-box green
AND after-state green
AND server secrets rotated
AND old secrets invalid
```

全部满足 → `G0 SECURITY = PASS` → `SECURITY REMEDIATION PROGRAM = CLOSED` → 下一交付物唯一：`JOURNEY_V4_DOMAIN_CONTRACT_V0.1`。

## 执行顺序

### ① 部署与部署证据

1. 逐条应用迁移并记录输出（顺序执行，任一失败即停）：
   ```bash
   for m in 00111 00112 00113 00114 00115 00116 00117 00118 00119 00120 00121 00122; do
     psql "$SUPABASE_DB_URL" -f supabase/migrations/${m}_*.sql 2>&1 | tee ../run-logs/migrate-${m}.log
   done
   ```
2. 部署 5 个 Edge Functions（bind-wechat / wechat-login / create-tenant-with-admin / tenant-admin-login / wechat-quick-login），记录部署版本号。
3. 执行 **`g0_close_01_deployment_evidence.sql`**（迁移后真实状态 + H1-H7 断言：table-level grant 已撤、owner 专用主体、search_path 固定、PUBLIC 无 EXECUTE、无 USING(true) 残留、5 表 RLS 启用）。断言失败 = 部署不成立，停下排查。

### ② 确定性安全测试（全部保存原始输出）

每套记录五行元数据：**commit / database target / run timestamp / test identity / result**。

```bash
psql "$DB" -f supabase/tests/g0z_security_closure_invariants.sql | tee ../run-logs/g0z-$(date +%F-%H%M).log
psql "$DB" -f supabase/tests/g0ar_membership_invariants.sql   | tee ../run-logs/g0ar-$(date +%F-%H%M).log
psql "$DB" -f supabase/tests/g0a_profiles_invariants.sql      | tee ../run-logs/g0a-$(date +%F-%H%M).log
psql "$DB" -f supabase/tests/g0c_tenant_rls_invariants.sql    | tee ../run-logs/g0c-$(date +%F-%H%M).log
psql "$DB" -f supabase/tests/g0d_payroll_pii_invariants.sql   | tee ../run-logs/g0d-$(date +%F-%H%M).log
```

G0-B 按 `g0b_edge_functions_attacks.md` 逐条 curl，输出同样归档。

### ③ 黑盒矩阵（最终 Gate）

准备 6 类真实身份（脚本头有清单），执行：
```bash
cd supabase/tests && ./g0z_blackbox_matrix.sh | tee ../run-logs/g0z-blackbox-$(date +%F-%H%M).md
```
重点盯：员工→role/tenant_id DENY；跨租户 data/payroll/signature DENY；direct invite INSERT / legacy short / forged / expired / reused DENY；**valid invite ALLOW、普通资料字段修改 ALLOW**（ALLOW 与 DENY 同等重要——合法业务被打死不叫 PASS）。

### ④ After-state

每类高价值攻击后执行 **`g0_close_02_after_state.sql`**（替换 `<EMP_A_ID>/<EMP_B_ID>`）。期望：profiles 关键字段未变；membership_audit 无未授权事件；used_count 与 uses 一致；无「无兑换记录却有租户」的 profile；E4 用例对被攻击对象做下载 sha256 对比，字节一致。

### ⑤ Secret Rotation（硬门，无代码可替代）

对象与旧值失效验证见 `docs/G0_SECURITY_REMEDIATION.md` §2（service_role / WeChat AppSecret / PROVISIONING_TOKEN；三项旧值失效证据存 `run-logs/rotation-proof.png`）。

### ⑥ 判定与归档

证据清单模板（复制到 `run-logs/EVIDENCE.md` 填写）：

| # | 证据 | 文件 | 结论 |
|---|---|---|---|
| 1 | 迁移 00111-00122 顺序成功 + 部署后状态断言 H1-H7 | migrate-*.log + g0-close-01-*.txt | / |
| 2 | 六套确定性测试原始输出（含元数据五要素） | g0z/g0ar/g0a/g0c/g0d/g0b-*.log | / |
| 3 | 黑盒矩阵（DENY×N + ALLOW×2） | g0z-blackbox-*.md | / |
| 4 | After-state（DB 状态 + 对象字节） | g0-close-02-*.txt + sha256 记录 | / |
| 5 | Server secrets 轮换 + 旧值失效 | rotation-proof.png | / |
| 6 | DEFINER 函数终态核对（owner/search_path/grants） | g0-close-01 E1/E2 段 | / |

六项全绿 → 签 `G0 SECURITY = PASS`，程序关闭。
