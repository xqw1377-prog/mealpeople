# G0 SECURITY 整改总文档（G0-F / G0-G）

> 项目：Restaurant Workforce Journey OS（餐饮员工工作旅途操作系统）
> 分支：`g0-security`　|　治理裁定日期：2026-10-03
> 纪律：LEGACY FUNCTION FREEZE 生效中——G0 只修安全，不新增业务功能、不建 Journey 表、不做 AI、不做 UI。

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

### 3.1 RLS 类（G0-A / C / D）

```bash
psql "$SUPABASE_DB_URL" -f supabase/tests/g0a_profiles_invariants.sql   # T1-T10
psql "$SUPABASE_DB_URL" -f supabase/tests/g0c_tenant_rls_invariants.sql # C1-C6
psql "$SUPABASE_DB_URL" -f supabase/tests/g0d_payroll_pii_invariants.sql# D1-D6
```

无 psql 时，在 Supabase Dashboard → SQL Editor 整段粘贴执行。脚本机制：事务内打固定 UUID 夹具 → `set_config('role','authenticated')` + 伪造 JWT claims 模拟攻击者 → 断言越权被 DENY / 正常路径回归 → `ROLLBACK` 不留痕。任何一项 FAIL 会让脚本以错误结束。**脚本执行输出截图/文本存档到本目录 `run-logs/`。**

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

## 五、G0 状态登记（2026-10-03）

| 批次 | 修复 | 静态验证 | 负向攻击测试 | 回归 | 状态 |
|---|---|---|---|---|---|
| G0-A | ✅ 00111 | tsgo ✅ | 脚本就绪未执行 | T6-T8/T10 在脚本内 | **PENDING-LIVE-VERIFY** |
| G0-B | ✅ 4 函数 | 人工审读 ✅ | curl 清单就绪未执行 | P1-P4 在清单内 | **PENDING-LIVE-VERIFY** |
| G0-C | ✅ 00112 | 策略名经生产快照核对 ✅ | 脚本就绪未执行 | C5 在脚本内 | **PENDING-LIVE-VERIFY** |
| G0-D | ✅ 00113+00114 | 同上 ✅ | 脚本就绪未执行 | D4-D6 在脚本内 | **PENDING-LIVE-VERIFY** |
| G0-E | ✅ 00115+前端 | tsgo ✅ biome ✅ | 3.3 curl 未执行 | 显示链路已接线 | **PENDING-LIVE-VERIFY** |
| G0-F | 手册就绪 | — | — | — | **等待人工执行轮换** |
| G0-G | 套件就绪 | — | — | — | **待 3.1-3.3 全绿后各批次转 PASS** |

**G0 全部 PASS 前不进入 `JOURNEY_V4_DOMAIN_CONTRACT_V0.1` 之外任何新工作。**
