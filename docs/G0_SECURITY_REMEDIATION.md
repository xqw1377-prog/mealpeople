# G0 SECURITY 整改总文档（G0-F / G0-G / G0-A-R）

> 项目：Restaurant Workforce Journey OS（餐饮员工工作旅途操作系统）
> 分支：`g0-security`　|　治理裁定日期：2026-10-03
> 纪律：LEGACY FUNCTION FREEZE 生效中——G0 只修安全，不新增业务功能、不建 Journey 表、不做 AI、不做 UI。
>
> **当前裁定状态（2026-10-03 复审）**：G0 = **HOLD**；G0-A = REOPEN（已由 G0-A-R 交付修复）；G0-B = CODE-COMPLETE/VERIFY；G0-C = BLOCKED-BY-G0-A（G0-A-R 落库后重跑）；G0-D = PENDING-LIVE-VERIFY；G0-E = REOPEN/POLICY-VERIFY（已由 00116 第 5 节收紧）；G0-F = PENDING-HUMAN-ACTION；G0-G = PENDING-LIVE-VERIFY。**Secret 轮换为 G0 PASS 硬门槛。**

---

## 零、G0-A-R MEMBERSHIP AUTHORITY（P0 重开项，已交付）

**击穿路径**：G0-A 旧触发器允许"本人 NULL→tenant 且 role 保持 employee"。攻击者注册后自选目标租户即成合法 employee，`can_access_tenant()` 与 G0-C 全部隔离随之失效——身份提权堵住了，但成员资格还能自签发。

**冻结不变量**：`CLIENT MAY NEVER ASSIGN TENANT MEMBERSHIP`（I1 不可自改 tenant_id，含 NULL→tenant；I2 不可自改 role；I3 加入必须经服务端 issuer；I4 issuer 必须验证合法邀请；I5 membership 是权限事实，不是 profile 自助资料）。

**交付（迁移 `00116_g0ar_membership_authority.sql`）**：
1. DROP「首次登录设置租户」策略；守卫触发器重写——tenant_id 变更仅 super_admin 或 issuer 路径（事务级 GUC `app.membership_issuer`，仅 issuer 函数可设）。
2. **重写既有 RPC `join_tenant_with_code`**（前端零改动）：身份取 JWT（`p_user_id` 仅兼容参数且须与 JWT 一致——旧版可替任意 user_id 兑换）；防邀请跳槽（已有租户者拒绝）；角色白名单 employee/store_manager/agent；FOR UPDATE 行锁防并发超用；满额自动停用。
3. 邀请码 RLS 收紧：仅本租户 tenant_admin / super_admin 可读写；普通成员不可读（客户端预读=枚举 oracle，已废止）。
4. **G0-E-R**：签名 SELECT 策略由"任意认证用户"收紧为合同相关方（路径 `{tenant_id}/{contract_id}/…` → 经 employment_contracts 反查：合同员工本人或同租户管理角色）。
5. `wechat-login` 删除客户端声明 unionid 的写入（不变量：CLIENT NEVER ASSERTS WECHAT IDENTITY；bind-wechat 已核为服务端 code→openid 换取）。
6. `tenant-admin-login` 登记为 LEGACY AUTHORITY PATH — TO BE RETIRED；`create-tenant-with-admin` 登记 TENANT_CREATION_POLICY = SELF-SERVICE（**待产品最终确认**；若非 self-service，仅 JWT 不足以授权建租户，须加 platform capability/审批/订阅之一）。
7. 前端接线：`validateInvitationCode` 改本地格式校验（预读废止，join-tenant 页面预览改"提交时确认"）。

**攻击测试**：`supabase/tests/g0ar_membership_invariants.sql`（M1 NULL→任意tenant DENY / M2 A→B DENY / M3 自改role DENY / M4 伪造码 / M5 过期码 / M6 用尽码 / M7a 替他人兑换 DENY / M7 合法兑换+记账 ALLOW / M8 Admin A 为 B 签发 DENY / M9 本租户签发 ALLOW / M10 防跳槽 DENY）。**G0-A/C/D 依赖测试须在 00116 落库后全部重跑**（g0a 的 T8 期望已同步翻转为 DENY）。

---

## 一、批次与提交索引

| 批次 | 内容 | 提交 | 交付物 |
|---|---|---|---|
| G0-A | Identity / profiles 提权封死（P0-SEC-01） | `b900820` | `supabase/migrations/00111_g0a_harden_profiles_identity.sql` + `supabase/tests/g0a_profiles_invariants.sql` |
| G0-B | 4 个边缘函数身份边界重做（P0-SEC-02） | `7678504` | 4 个 `supabase/functions/*/index.ts` + `supabase/tests/g0b_edge_functions_attacks.md` |
| G0-C | 10 张 USING(true) 全开表租户化（P0-SEC-04） | `c81b28a` | `00112_g0c_tenant_scope_core_rls.sql` + `supabase/tests/g0c_tenant_rls_invariants.sql` |
| G0-D | 薪酬/绩效租户范围 + 5 张无 RLS 表（P0-SEC-05/03） | `77ac495` | `00113_…sql` + `00114_…sql` + `supabase/tests/g0d_payroll_pii_invariants.sql` |
| G0-E | 合同签名 Storage 私有化（P0-SEC-07） | `e62e689` | `00115_…sql` + `src/utils/signature-view.ts` + 2 个显示端组件 |
| G0-F | Secret / 配置（本文档第二节轮换手册） | 本提交 | 本文档 |
| G0-G | 安全不变量测试套件（各批次 tests/，本文档第三节运行说明） | 本提交 | 4 个 SQL 测试 + 1 个 curl 清单 |

## 二、G0-F：Secret / 配置轮换手册（需人工在控制台执行）

按顺序执行，每步完成后在下方勾选：

1. [ ] **Supabase：轮换 anon key**（Dashboard → Settings → API → Reset anon key），随后更新 `src/.env` 的 `TARO_APP_SUPABASE_ANON_KEY` 并重新打包。旧 key 随代码包分发过，必须作废。
2. [ ] **Supabase：轮换 service_role key**（同页），更新所有 Edge Functions 的 secrets（`supabase secrets set`）。
3. [ ] **微信：轮换 AppSecret**（mp.weixin.qq.com → 开发管理 → 开发设置 → 重置），更新 Edge Functions 的 `WECHAT_APPSECRET`。仓库内 `.env` 该值为占位符，未泄露。
4. [ ] **确认 `.env` 不再进入分发物**：打包/上传流程排除 `src/.env`（Miaoda 平台打包配置）；`git check-ignore src/.env` 若未忽略则补 `.gitignore`。
5. [ ] **数据库直连凭证排查**：确认无任何 `postgres` 角色密码出现在代码/文档/聊天记录中；有则改密。

## 三、G0-G：安全不变量测试运行说明

**判定纪律：不以"代码看起来正确"作为 PASS 证据。所有 G0 批次在下列测试于真实库执行并通过前，状态一律为 PENDING-LIVE-VERIFY。**

### 3.1 RLS 类（G0-A-R / A / C / D）

```bash
psql "$SUPABASE_DB_URL" -f supabase/tests/g0ar_membership_invariants.sql # M1-M10（00116 落库后首先执行）
psql "$SUPABASE_DB_URL" -f supabase/tests/g0a_profiles_invariants.sql   # T1-T10（T8 已按 G0-A-R 翻转为 DENY）
psql "$SUPABASE_DB_URL" -f supabase/tests/g0c_tenant_rls_invariants.sql # C1-C6
psql "$SUPABASE_DB_URL" -f supabase/tests/g0d_payroll_pii_invariants.sql# D1-D6
```

无 psql 时，在 Supabase Dashboard → SQL Editor 整段粘贴执行。脚本机制：事务内打固定 UUID 夹具 → `set_config('role','authenticated')` + 伪造 JWT claims 模拟攻击者 → 断言越权被 DENY / 正常路径回归 → `ROLLBACK` 不留痕。任何一项 FAIL 会让脚本以错误结束。**脚本执行输出截图/文本存档到本目录 `run-logs/`。**

**防"假绿"纪律（2026-10-03 复审新增）**：RLS 证明必须来自模拟身份（anon / 员工A / 员工B / 管理员A / 管理员B）+ 注入 `request.jwt.claims` 的用例；**任何以 postgres / service_role 直接执行的成功或失败都不构成 RLS 证明**。脚本通过 `set_config('role', ...)` 显式切换身份，执行时禁止删改这些行。

### 3.2 边缘函数类（G0-B）

按 `supabase/tests/g0b_edge_functions_attacks.md` 逐条 curl（N1-N7 负向 + P1-P4 正向回归），每条负向用例后执行文中的 SQL 核验 profile 未被改动。

### 3.3 Storage 类（G0-E）

```bash
# 匿名直连必须 403/404（修复前 200）
curl -s -o /dev/null -w "%{http_code}\n" "$SUPABASE_URL/storage/v1/object/public/contract_signatures/<任一已存在签名文件>"
# 登录态签名 URL 必须 200（用前端 useSignatureViewUrl 的产物或 createSignedUrl 生成）
curl -s -o /dev/null -w "%{http_code}\n" "<signedUrl>"
```

### 3.4 不变量清单（宪法条款，永久不得回退）

普通员工不能把自己变管理员 ｜ A企业管理员不能读B企业工资/候选人PII ｜ A企业员工不能读写B企业排班/班次 ｜ 客户端伪造 tenant_id / role / openid / 手机号一律无效 ｜ 匿名不可读候选人/面试/工资/签名图片 ｜ 未登录对业务表全拒。

## 四、行为变更清单（发布说明必含）

1. 任何用户不能再自助变更 `role` / `tenant_id`（super_admin 除外；tenant_admin 可在白名单 employee/store_manager/agent/tenant_admin 内管理本租户他人）。
2. `wechat-login`：openid 被他人绑定时 409 拒绝（原为复制对方身份=账号接管）。
3. `create-tenant-with-admin`：要求 JWT，`userId` 取自 JWT；手机号需与 JWT 一致。
4. `tenant-admin-login`：请求体手机号必须与 JWT 手机号一致。
5. `bind-wechat`：只能为当前登录用户绑定。
6. 10 张排班/配置表与 24 个薪酬绩效策略、5 张招聘/离职表：跨租户访问、匿名访问一律 DENY（租户内成员行为不变）。
7. 合同签名图片：匿名直链失效；系统内显示改走 1 小时签名 URL。
8. 已知遗留（G0 不处理）：`contract-pdf-generator.ts` 引用不存在的 bucket `app-7daop8q0sxdt_contract_signatures`；同租户内店经理/员工不分权（P1）；`efficiency_standards` 的 guest 测试策略仅存在于部分迁移。

## 五、G0 状态登记（2026-10-03 复审后）

| 批次 | 裁定 | 修复 | 静态验证 | 负向攻击测试 | 状态 |
|---|---|---|---|---|---|
| G0-A-R | REOPEN→已交付 | ✅ 00116 | tsgo/biome ✅（前端接线） | M1-M10 就绪未执行 | **PENDING-LIVE-VERIFY（须首先执行）** |
| G0-A | REOPEN | ✅ 00111+00116 重写触发器；T8 期望已翻转 | tsgo ✅ | 脚本就绪未执行 | **PENDING-LIVE-VERIFY（00116 落库后重跑）** |
| G0-B | CODE-COMPLETE/VERIFY | ✅ 4 函数 | 人工审读 ✅；bind-wechat 已核服务端 code→openid | curl 清单就绪未执行 | **PENDING-LIVE-VERIFY** |
| G0-C | BLOCKED-BY-G0-A | ✅ 00112 | 策略名经生产快照核对 ✅ | 脚本就绪未执行 | **PENDING-LIVE-VERIFY（依赖 G0-A-R 生效）** |
| G0-D | PENDING-LIVE-VERIFY | ✅ 00113+00114 | 同上 ✅ | 脚本就绪未执行 | **PENDING-LIVE-VERIFY** |
| G0-E | REOPEN/POLICY-VERIFY→已交付 | ✅ 00115+00116§5（按合同授权） | tsgo ✅ biome ✅ | 3.3 curl 未执行 | **PENDING-LIVE-VERIFY** |
| G0-F | PENDING-HUMAN-ACTION | 手册就绪 | — | — | **等待人工执行轮换（PASS 硬门槛）** |
| G0-G | PENDING-LIVE-VERIFY | 套件就绪（5 SQL+1 curl） | — | — | **待 3.1-3.3 全绿后各批次转 PASS** |

### 攻击矩阵（3.1/3.2 执行时按此核对期望值）

| Actor | Action | Target | Expected |
|---|---|---|---|
| Employee A | 改自己 role | A | DENY |
| Employee A | 改 tenant_id 到 B（含 NULL→B 首次自助） | B | **DENY** |
| Employee A | 伪造/过期/用尽邀请码兑换 | — | DENY |
| Employee A | 替他人 p_user_id 兑换邀请码 | A | DENY |
| Employee A | 合法邀请码兑换加入正确租户 | A | ALLOW |
| Admin A | 读工资/候选人/排班 | B | DENY |
| Admin A | 为租户 B 签发邀请码 | B | DENY |
| Admin A | 改本租户员工 role（白名单内） | A | ALLOW |
| Anonymous | 读候选人/签名图片/业务表 | A/B | DENY |
| 任意认证用户 | 查看非本人合同签名 | B | DENY |

**G0 全部 PASS 前不进入 `JOURNEY_V4_DOMAIN_CONTRACT_V0.1` 之外任何新工作。Secret 轮换未完成前 G0 不得 PASS。**
