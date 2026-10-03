/*
# 修复员工等级表RLS策略

## 问题
当前策略不允许系统自动为员工创建等级信息

## 修复
1. 添加INSERT策略，允许系统为员工创建等级
2. 添加UPDATE策略，允许员工更新自己的等级
3. 保持SELECT策略不变

## 安全性
- 员工只能查看和更新自己的等级
- 管理员可以管理所有等级
- 系统可以为任何员工创建初始等级
*/

-- 删除旧策略
DROP POLICY IF EXISTS "员工查看自己的等级" ON employee_levels;
DROP POLICY IF EXISTS "管理员管理所有等级" ON employee_levels;
DROP POLICY IF EXISTS "系统创建员工等级" ON employee_levels;
DROP POLICY IF EXISTS "员工更新自己的等级" ON employee_levels;

-- 查看策略：员工可以查看自己的等级
CREATE POLICY "员工查看自己的等级"
  ON employee_levels
  FOR SELECT
  USING (
    employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
  );

-- 插入策略：允许为任何员工创建等级（系统自动创建）
CREATE POLICY "系统创建员工等级"
  ON employee_levels
  FOR INSERT
  WITH CHECK (true);

-- 更新策略：员工可以更新自己的等级
CREATE POLICY "员工更新自己的等级"
  ON employee_levels
  FOR UPDATE
  USING (
    employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
  );

-- 管理员全权限策略
CREATE POLICY "管理员管理所有等级"
  ON employee_levels
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('tenant_admin'::user_role, 'store_manager'::user_role)
    )
  );

-- 同样修复认证表策略
DROP POLICY IF EXISTS "员工查看自己的认证" ON employee_certifications;
DROP POLICY IF EXISTS "管理员管理所有认证" ON employee_certifications;
DROP POLICY IF EXISTS "系统创建员工认证" ON employee_certifications;

-- 查看策略
CREATE POLICY "员工查看自己的认证"
  ON employee_certifications
  FOR SELECT
  USING (
    employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
  );

-- 插入策略：允许为任何员工创建认证
CREATE POLICY "系统创建员工认证"
  ON employee_certifications
  FOR INSERT
  WITH CHECK (true);

-- 管理员全权限策略
CREATE POLICY "管理员管理所有认证"
  ON employee_certifications
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('tenant_admin'::user_role, 'store_manager'::user_role)
    )
  );
