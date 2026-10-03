# G0-B Edge Functions 负向攻击测试清单（P0-SEC-02）

- 改造对象：`bind-wechat`、`wechat-login`、`create-tenant-with-admin`、`tenant-admin-login`
- 原则：一切身份（userId / phone）以 JWT 为准；请求体身份字段仅可用于**比对**，不可用于**授权**
- 运行方式：部署函数后逐条执行 `curl`，断言状态码与错误文案。**全部通过前 G0-B 不得标记 PASS。**

准备（替换尖括号内容）：

```bash
SUPABASE_URL=<项目URL>
ANON_KEY=<anon key>
JWT_A=<员工A的合法 access_token>        # 手机号 138A
JWT_B=<员工B的合法 access_token>        # 手机号 138B（B 属于另一租户）
JWT_ADMIN=<租户管理员管理员手机号对应的合法 access_token>  # 手机号与 tenants.admin_phone 一致
OPENID_A=<A 已绑定的 openid>
OPENID_B=<B 已绑定的 openid>
ADMIN_PHONE=<tenants.admin_phone 中记录的管理员手机号>
```

## 负向用例（必须 DENY）

| # | 攻击 | 命令 | 期望 |
|---|---|---|---|
| N1 | 匿名调用 bind-wechat | `curl -s -o /dev/null -w "%{http_code}" -X POST $SUPABASE_URL/functions/v1/bind-wechat -H "apikey: $ANON_KEY" -H 'Content-Type: application/json' -d '{"code":"x","userId":"00000000-0000-0000-0000-000000000000"}'` | 4xx，`未提供授权信息` |
| N2 | 为他人绑定微信（拿 A 的 JWT 填 B 的 userId） | 同上 + `-H "Authorization: Bearer $JWT_A"`，body `{"code":"<B的code>","userId":"<B的userId>"}` | 4xx，`不允许为其他用户绑定微信` |
| N3 | 用他人 openid 克隆身份（wechat-login + A 的 JWT + OPENID_B） | `-X POST .../wechat-login -H "Authorization: Bearer $JWT_A" -d '{"wechatOpenid":"'$OPENID_B'"}'` | **409**，`该微信已绑定其他账号`，且事后确认 A 的 role/tenant_id/phone **未被修改** |
| N4 | 匿名创建租户 | `-X POST .../create-tenant-with-admin -d '{"phone":"13800000000"}'`（无 Authorization） | **401**，`未提供授权信息` |
| N5 | 冒用他人手机号开租户（JWT_A + 他人手机号） | 同上 + `-H "Authorization: Bearer $JWT_A"`，body `{"phone":"<ADMIN_PHONE>"}` | **403**，`手机号与登录账号不一致` |
| N6 | 冒用管理员手机号获取管理员身份（JWT_A 的账号 phone ≠ ADMIN_PHONE，body 填 ADMIN_PHONE） | `-X POST .../tenant-admin-login -H "Authorization: Bearer $JWT_A" -d '{"phone":"'$ADMIN_PHONE'"}'` | 4xx，`登录账号与该手机号不一致`；事后确认该用户 profile.role 仍为原值 |
| N7 | 未绑定手机号的 JWT 调 tenant-admin-login | 同上（用无 phone 的账号 JWT） | 4xx，`当前账号未绑定手机号` |

## 正向回归（必须仍可用）

| # | 场景 | 期望 |
|---|---|---|
| P1 | bind-wechat：JWT_A + 自己的 userId + 自己的 code | 200 |
| P2 | wechat-login：JWT_A + OPENID_A | 200，返回 A 本人资料 |
| P3 | create-tenant-with-admin：JWT_A + A 自己的手机号（且 A 无租户） | 200，A 成为新租户 tenant_admin（自开租户为产品既有行为，现要求 JWT + 手机号一致） |
| P4 | tenant-admin-login：JWT_ADMIN + ADMIN_PHONE | 200，该用户升级为对应租户 tenant_admin |

## 攻击后核验（每条负向用例之后执行）

```sql
-- 确认攻击未改变任何 profile 的 role / tenant_id / phone / wechat_openid
SELECT id, role, tenant_id, phone, wechat_openid FROM profiles
WHERE id IN ('<A的userId>', '<B的userId>');
```

## 已知行为变更（发布说明需包含）

1. `wechat-login`：openid 被他人绑定时由「复制对方身份」改为 **409 拒绝**——旧版即为账号接管漏洞。
2. `create-tenant-with-admin`：不再接受请求体 `userId`（该参数已忽略）；无 JWT 一律 401。
3. `tenant-admin-login`：请求体手机号必须与 JWT 手机号一致，否则拒绝。
4. `bind-wechat`：只能为当前登录用户绑定。
5. 四个函数均已移除明文打印手机号/OpenID 的日志（凭证明文进日志属 P3 风险，顺手治理）。
