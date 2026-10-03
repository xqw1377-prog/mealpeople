# G0 SECURITY 整改总文档（G0-F / G0-G / G0-A-R / G0-Z / G0-Z-R2）

> 项目：Restaurant Workforce Journey OS（餐饮员工工作旅途操作系统）
> 分支：`g0-security`　|　治理裁定日期：2026-10-03
> 纪律：LEGACY FUNCTION FREEZE 生效中。**R2 是最后一个安全批次（"之后不再写新整改"）；R2 完成 → 跑黑盒 → server secret 轮换 → G0 = PASS → STOP。**
>
> **当前裁定状态（2026-10-03 第四轮/R2 裁定）**：G0 = HOLD；Z1 = REOPEN→已改 allowlist（00120）；Z2 = REOPEN→hash-only 已交付（00120）；Z3 = DESIGN PASS / LIVE VERIFY；Z4 = REOPEN→不可篡改已交付（00120）；Z5 = READY / NOT RUN；Z6 = NOT DONE。JOURNEY V4 CONTRACT = HOLD。

---

## 零-C、G0-Z-R2 FINAL HARDENING（最终四刀，迁移 00120，已交付）

| 刀 | 交付 |
|---|---|
| R2-1 profiles allowlist | 撤 table-level `INSERT/UPDATE`（**裁定指出的叠加语义问题属实：列级 REVOKE 无法从 table-level UPDATE 扣列**），白名单授回 name/avatar_url/phone/email/wechat_nickname/wechat_avatar；`role/tenant_id` 及身份列（wechat_openid/unionid）永不授予客户端；profile 创建唯一路径=handle_new_user（DEFINER），客户端自插策略已删。回归已核：`updateUserStatus` 引用不存在的列（本就坏）、`unbindWechat` 无页面调用（死代码）、管理页面改角色已走 RPC |
| R2-2 invite hash-only | 新列 token_hash/token_hint + UNIQUE 索引；新 RPC `create_invitation`（CSPRNG 128bit、DB 只存 sha256、**明文仅创建时返回一次**、角色固定 employee、限本租户 tenant_admin、有效期≤90 天）；`join_tenant_with_code` 改 hash 查询（明文不再走任何查询路径）；authenticated 直接 INSERT 邀请码全撤（含 32 位码——every valid invite must be server-generated）；管理员对 invitation_codes 仅可 UPDATE(status)（撤销），used_count/token 列不可改；admin_assign_member_role owner 修正为 membership_issuer_owner（00117 遗留的 postgres owner） |
| R2-3 退休存量短码 | `char_length(code)<16` 全部 `status='revoked'` + 明文脱敏（`RETIRED_` 前缀）；限流保留为纵深防御，不作为低熵安全补偿；明文 code 列不再是凭证（测试 R2-3 验证 active 明文码兑换 DENY） |
| R2-4 签名不可篡改 | contract_signatures **无 UPDATE 策略 = 覆盖/upsert 一律 DENY**；DELETE 收紧为仅 DRAFT 合同（FINALIZED 签名 immutable，作废走业务事件）；对象路径加 8 位随机段 + upsert:false（唯一对象，不可反复覆盖固定名） |

**前端配套**：生成邀请码改调 `create_invitation` RPC，成功后**一次性弹窗显示明文**（可复制），列表只显示 `****hint`（复制按钮改为提示"仅生成时显示一次"）；签名文件名随机化。**黑盒增强**：新增 B4（role 同值写 DENY）/B5（身份列直写 DENY）/B6（白名单列 ALLOW 回归）/E4（upsert 覆盖 DENY），并把「HTTP 状态码不构成完整证明，须 after-state SQL 核验」写入执行纪律。

**遗留登记（G0 内不修）**：`unbindWechat` 因身份列保护而失效（本就无页面调用；服务端解绑留待 G1）；`tenant-admin-login` 待退休（LEGACY AUTHORITY PATH 已登记）。

---

## 零-B、G0-Z SECURITY CLOSURE（最终关闭批次，已交付）

| 项 | 交付 | 说明 |
|---|---|---|
| Z1 issuer authority | `00117` | 安全根改为**数据库主体+列级权限**：专用 `membership_issuer_owner`（NOLOGIN）拥有 issuer 函数；`REVOKE UPDATE/INSERT (role, tenant_id) ON profiles FROM authenticated`——protected columns，任何直写（含 `SET role=role` 同值写）直接 42501；GUC 降级为 issuer 内部上下文（纵深防御第二层，非授权根）。新增受控指派 RPC `admin_assign_member_role`（白名单 employee/store_manager/agent/tenant_admin、限本租户、不可自改、写 membership_audit append-only 审计）；前端 `updateUserRole` 已接线该 RPC |
| Z2 invite credential | `00118` | INV-1 服务端 128bit 熵码（`generate_invitation_code` 重写）+ INSERT 策略强制新码 ≥16 位；**INV-2 登记 PARTIAL**（管理员须可读码发给员工，明文为运营必需；已用熵补偿撞码面）；INV-3 兑换失败统一文案"邀请码无效或不可用"（无 oracle）；INV-4 限流表 10min/10 次失败；INV-5 bearer invite 只发 employee（store_manager 等须经 `admin_assign_member_role` 指派）；`invitation_code_uses` 补 tenant_id/role_granted 并 append-only；`used_count` 管理员不可手改；前端 `createInvitationCode` 已改调服务端 RPC |
| Z3 provisioning | `00119` + 函数 | `TENANT_CREATION_POLICY = CONTROLLED_PROVISIONING` 冻结：tenants INSERT 收回 super_admin only（23 号 WITH CHECK(true) 撤销）；edge function 仅接受 super_admin JWT 或平台 `PROVISIONING_TOKEN`（常数时间比较）；公开 self-service 暂停，正式 SaaS onboarding 就绪后再评估。`tenant-admin-login` 终态：Login 只证明 Identity，不发行 Membership/Role（该原则进入 Domain Constitution） |
| Z4 storage 授权 | `00119` + 前端 | 签名 INSERT 校验路径 `{tenant}/{contract}/` 指向调用者有权的**真实合同**（员工本人或同租户管理角色）；DELETE 收紧为 owner 或同租户管理角色；新写入只存 `contract_signatures://{object_path}`（不再保存 public URL，前端已改）；历史 URL 仅兼容解析；signed URL TTL 1h → **10 分钟** |
| Z5 黑盒矩阵 | `g0z_blackbox_matrix.sh` | 真实 anon key + 四类账号 JWT 从 PostgREST/RPC/Storage/Edge 网络入口打 A1-A6/B1-B3/C1/D1-D4/E1-E3/F1-F3 + 正向 G1-G2，输出 markdown 证据包到 `run-logs/`。**SQL 模拟测试不再是最终证据，本矩阵全绿才是** |
| Z6 secret rotation | 本文档 §2 | 补充：轮换后须验证**旧值已失效**（用旧 anon key 调 REST 期望 401；旧 service_role 调 admin API 期望 401）；只删 `.env` 不算修复 |

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

> **轮换对象界定（R2 裁定修正）**：Supabase anon/publishable key 是设计给客户端的公开凭证，**"曾进 Git"不构成泄密，旧 anon key 是否 401 不是 G0 PASS 硬门槛**。硬轮换对象=server-only secrets：service_role/secret key、WeChat AppSecret、PROVISIONING_TOKEN（Z3 引入，现为高权限 credential：不得出现在前端/日志/query string/Git）。

1. [ ] **Supabase：轮换 service_role / secret key**（Dashboard → Settings → API），更新所有 Edge Functions 的 secrets（`supabase secrets set`）。**此项为 G0 PASS 硬门槛。**
2. [ ] **微信：轮换 AppSecret**（mp.weixin.qq.com → 开发管理 → 开发设置 → 重置），更新 Edge Functions 的 `WECHAT_APPSECRET`。**硬门槛。**
3. [ ] **PROVISIONING_TOKEN**：生成新高熵值，`supabase secrets set PROVISIONING_TOKEN=<new>`，同步给平台开通操作人；确认从未进入前端代码/日志/URL。**硬门槛。**
4. [ ] （可选，随项目整体轮换时一并处理）Supabase anon key 轮换 + 更新 `src/.env` 并重新打包。
5. [ ] **确认 `.env` 不再进入分发物**：打包/上传流程排除 `src/.env`；`git check-ignore src/.env` 若未忽略则补 `.gitignore`。
6. [ ] **数据库直连凭证排查**：确认无任何 `postgres` 角色密码出现在代码/文档/聊天记录中；有则改密。
7. [ ] **旧值失效验证（Z6 硬性要求，只删 `.env` 不算修复）**：
   - 旧 service_role：调用任一 admin 接口 → 期望 **401**
   - 旧微信 AppSecret：`jscode2session` 用旧 secret → 期望 errcode 40125/40013
   - 旧 PROVISIONING_TOKEN：带旧 token 调 create-tenant-with-admin → 期望 **403**
   - 证据截图存 `run-logs/rotation-proof.png`

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
9. （G0-A-R）加入企业唯一路径=邀请码兑换；首登 `tenant_id` 保持 NULL 直至兑换。
10. （G0-Z1）管理员改角色一律走 `admin_assign_member_role` RPC（前端 `updateUserRole` 已接线）；不能改自己；super_admin 角色不可经 RPC 授予。
11. （G0-Z2）存量 6 位旧邀请码仍可兑换（低熵风险由限流缓解），新签发一律 32 位高熵码；bearer 邀请只授予 employee，store_manager/agent/tenant_admin 须管理员指派；兑换失败统一文案。
12. （G0-Z3）企业开通冻结为 CONTROLLED_PROVISIONING：普通用户自助建企业（登录页/快速开始/客户端直写路径）全部停用，租户由平台侧（super_admin 管理端或 provisioning token 通道）创建。需为试点门店预建租户与管理员。
13. （G0-Z4）新签名只存 `contract_signatures://{path}`；签名图签名 URL 有效期 10 分钟。

## 五、G0 状态登记（2026-10-03 复审后）

| 批次 | 裁定 | 修复 | 静态验证 | 负向攻击测试 | 状态 |
|---|---|---|---|---|---|
| G0-A-R | REOPEN→已交付 | ✅ 00116 | tsgo/biome ✅（前端接线） | M1-M10 就绪未执行 | **PENDING-LIVE-VERIFY（须首先执行）** |
| G0-A | REOPEN | ✅ 00111+00116 重写触发器；T8 期望已翻转 | tsgo ✅ | 脚本就绪未执行 | **PENDING-LIVE-VERIFY（00116 落库后重跑）** |
| G0-B | CODE-COMPLETE/VERIFY | ✅ 4 函数 | 人工审读 ✅；bind-wechat 已核服务端 code→openid | curl 清单就绪未执行 | **PENDING-LIVE-VERIFY** |
| G0-C | BLOCKED-BY-G0-A | ✅ 00112 | 策略名经生产快照核对 ✅ | 脚本就绪未执行 | **PENDING-LIVE-VERIFY（依赖 G0-A-R 生效）** |
| G0-D | PENDING-LIVE-VERIFY | ✅ 00113+00114 | 同上 ✅ | 脚本就绪未执行 | **PENDING-LIVE-VERIFY** |
| G0-E | REOPEN/POLICY-VERIFY→已交付 | ✅ 00115+00116§5（按合同授权） | tsgo ✅ biome ✅ | 3.3 curl 未执行 | **PENDING-LIVE-VERIFY** |
| G0-F | PENDING-HUMAN-ACTION | 手册就绪（含旧值失效验证） | — | — | **等待人工执行轮换（PASS 硬门槛）** |
| G0-G | PENDING-LIVE-VERIFY | 套件就绪（6 SQL+2 curl） | — | — | **待 3.1-3.3 + 黑盒矩阵全绿后各批次转 PASS** |
| **G0-Z** | **CLOSURE 批次** | ✅ Z1-Z4 代码完成（00117-00119+函数+前端） | tsgo/biome ✅ | g0z SQL（Z1-1…Z3-1）+ 黑盒脚本就绪未执行 | **PENDING-LIVE-VERIFY；Z6 轮换待人工** |

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
