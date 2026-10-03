-- ============================================================
-- G0-D: Payroll / PII 租户范围修复（P0-SEC-05）
-- 背景：64-69 号迁移（绩效/请假/加班/晋升/调岗）与 67 号迁移
-- （薪酬福利）的"管理员管理…"策略只校验 role、不含租户条件——
-- 租户A的管理员可以读改租户B员工的工资/绩效/请假等敏感数据。
--
-- 修复：同名重建，保留 role 门槛，追加 can_access_tenant(tenant_id)。
-- 员工自见类策略（按 employee_id->employees.user_id 判定）不含本问题，不动。
-- 全部 20 张表均已确认存在 tenant_id 列。
-- ============================================================

-- ---------- 67 薪酬福利 ----------
DROP POLICY IF EXISTS "管理员管理薪酬结构" ON salary_structures;
CREATE POLICY "管理员管理薪酬结构" ON salary_structures
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()
              AND role IN ('tenant_admin','store_manager'))
    AND public.can_access_tenant(auth.uid(), tenant_id)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()
              AND role IN ('tenant_admin','store_manager'))
    AND public.can_access_tenant(auth.uid(), tenant_id)
  );

DROP POLICY IF EXISTS "管理员管理工资记录" ON salary_records;
CREATE POLICY "管理员管理工资记录" ON salary_records
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()
              AND role IN ('tenant_admin','store_manager'))
    AND public.can_access_tenant(auth.uid(), tenant_id)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()
              AND role IN ('tenant_admin','store_manager'))
    AND public.can_access_tenant(auth.uid(), tenant_id)
  );

DROP POLICY IF EXISTS "管理员管理福利类型" ON benefit_types;
CREATE POLICY "管理员管理福利类型" ON benefit_types
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()
              AND role IN ('tenant_admin','store_manager'))
    AND public.can_access_tenant(auth.uid(), tenant_id)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()
              AND role IN ('tenant_admin','store_manager'))
    AND public.can_access_tenant(auth.uid(), tenant_id)
  );

DROP POLICY IF EXISTS "管理员管理员工福利" ON employee_benefits;
CREATE POLICY "管理员管理员工福利" ON employee_benefits
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()
              AND role IN ('tenant_admin','store_manager'))
    AND public.can_access_tenant(auth.uid(), tenant_id)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()
              AND role IN ('tenant_admin','store_manager'))
    AND public.can_access_tenant(auth.uid(), tenant_id)
  );

DROP POLICY IF EXISTS "管理员管理福利使用记录" ON benefit_usage_records;
CREATE POLICY "管理员管理福利使用记录" ON benefit_usage_records
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()
              AND role IN ('tenant_admin','store_manager'))
    AND public.can_access_tenant(auth.uid(), tenant_id)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()
              AND role IN ('tenant_admin','store_manager'))
    AND public.can_access_tenant(auth.uid(), tenant_id)
  );

-- ---------- 64 绩效 ----------
DROP POLICY IF EXISTS "管理员管理所有绩效" ON employee_performance;
CREATE POLICY "管理员管理所有绩效" ON employee_performance
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()
              AND role IN ('tenant_admin','store_manager'))
    AND public.can_access_tenant(auth.uid(), tenant_id)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()
              AND role IN ('tenant_admin','store_manager'))
    AND public.can_access_tenant(auth.uid(), tenant_id)
  );

DROP POLICY IF EXISTS "管理员管理所有目标" ON performance_goals;
CREATE POLICY "管理员管理所有目标" ON performance_goals
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()
              AND role IN ('tenant_admin','store_manager'))
    AND public.can_access_tenant(auth.uid(), tenant_id)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()
              AND role IN ('tenant_admin','store_manager'))
    AND public.can_access_tenant(auth.uid(), tenant_id)
  );

DROP POLICY IF EXISTS "管理员管理所有改进计划" ON performance_improvements;
CREATE POLICY "管理员管理所有改进计划" ON performance_improvements
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()
              AND role IN ('tenant_admin','store_manager'))
    AND public.can_access_tenant(auth.uid(), tenant_id)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()
              AND role IN ('tenant_admin','store_manager'))
    AND public.can_access_tenant(auth.uid(), tenant_id)
  );

-- ---------- 65 请假 ----------
DROP POLICY IF EXISTS "管理员管理请假类型" ON leave_types;
CREATE POLICY "管理员管理请假类型" ON leave_types
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()
              AND role IN ('tenant_admin','store_manager'))
    AND public.can_access_tenant(auth.uid(), tenant_id)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()
              AND role IN ('tenant_admin','store_manager'))
    AND public.can_access_tenant(auth.uid(), tenant_id)
  );

DROP POLICY IF EXISTS "管理员管理假期余额" ON leave_balances;
CREATE POLICY "管理员管理假期余额" ON leave_balances
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()
              AND role IN ('tenant_admin','store_manager'))
    AND public.can_access_tenant(auth.uid(), tenant_id)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()
              AND role IN ('tenant_admin','store_manager'))
    AND public.can_access_tenant(auth.uid(), tenant_id)
  );

DROP POLICY IF EXISTS "管理员管理所有请假申请" ON leave_requests;
CREATE POLICY "管理员管理所有请假申请" ON leave_requests
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()
              AND role IN ('tenant_admin','store_manager'))
    AND public.can_access_tenant(auth.uid(), tenant_id)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()
              AND role IN ('tenant_admin','store_manager'))
    AND public.can_access_tenant(auth.uid(), tenant_id)
  );

-- ---------- 66 加班 ----------
DROP POLICY IF EXISTS "管理员管理加班类型" ON overtime_types;
CREATE POLICY "管理员管理加班类型" ON overtime_types
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()
              AND role IN ('tenant_admin','store_manager'))
    AND public.can_access_tenant(auth.uid(), tenant_id)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()
              AND role IN ('tenant_admin','store_manager'))
    AND public.can_access_tenant(auth.uid(), tenant_id)
  );

DROP POLICY IF EXISTS "管理员管理所有加班申请" ON overtime_requests;
CREATE POLICY "管理员管理所有加班申请" ON overtime_requests
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()
              AND role IN ('tenant_admin','store_manager'))
    AND public.can_access_tenant(auth.uid(), tenant_id)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()
              AND role IN ('tenant_admin','store_manager'))
    AND public.can_access_tenant(auth.uid(), tenant_id)
  );

DROP POLICY IF EXISTS "管理员管理加班补偿" ON overtime_compensations;
CREATE POLICY "管理员管理加班补偿" ON overtime_compensations
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()
              AND role IN ('tenant_admin','store_manager'))
    AND public.can_access_tenant(auth.uid(), tenant_id)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()
              AND role IN ('tenant_admin','store_manager'))
    AND public.can_access_tenant(auth.uid(), tenant_id)
  );

-- ---------- 68 晋升 ----------
DROP POLICY IF EXISTS "管理员管理晋升路径" ON promotion_paths;
CREATE POLICY "管理员管理晋升路径" ON promotion_paths
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()
              AND role IN ('tenant_admin','store_manager'))
    AND public.can_access_tenant(auth.uid(), tenant_id)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()
              AND role IN ('tenant_admin','store_manager'))
    AND public.can_access_tenant(auth.uid(), tenant_id)
  );

DROP POLICY IF EXISTS "管理员管理晋升条件" ON promotion_requirements;
CREATE POLICY "管理员管理晋升条件" ON promotion_requirements
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()
              AND role IN ('tenant_admin','store_manager'))
    AND public.can_access_tenant(auth.uid(), tenant_id)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()
              AND role IN ('tenant_admin','store_manager'))
    AND public.can_access_tenant(auth.uid(), tenant_id)
  );

DROP POLICY IF EXISTS "管理员管理晋升申请" ON promotion_applications;
CREATE POLICY "管理员管理晋升申请" ON promotion_applications
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()
              AND role IN ('tenant_admin','store_manager'))
    AND public.can_access_tenant(auth.uid(), tenant_id)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()
              AND role IN ('tenant_admin','store_manager'))
    AND public.can_access_tenant(auth.uid(), tenant_id)
  );

DROP POLICY IF EXISTS "管理员管理晋升评审" ON promotion_reviews;
CREATE POLICY "管理员管理晋升评审" ON promotion_reviews
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()
              AND role IN ('tenant_admin','store_manager'))
    AND public.can_access_tenant(auth.uid(), tenant_id)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()
              AND role IN ('tenant_admin','store_manager'))
    AND public.can_access_tenant(auth.uid(), tenant_id)
  );

DROP POLICY IF EXISTS "管理员管理晋升历史" ON promotion_history;
CREATE POLICY "管理员管理晋升历史" ON promotion_history
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()
              AND role IN ('tenant_admin','store_manager'))
    AND public.can_access_tenant(auth.uid(), tenant_id)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()
              AND role IN ('tenant_admin','store_manager'))
    AND public.can_access_tenant(auth.uid(), tenant_id)
  );

-- ---------- 69 调岗 ----------
DROP POLICY IF EXISTS "管理员管理可调岗位" ON transfer_positions;
CREATE POLICY "管理员管理可调岗位" ON transfer_positions
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()
              AND role IN ('tenant_admin','store_manager'))
    AND public.can_access_tenant(auth.uid(), tenant_id)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()
              AND role IN ('tenant_admin','store_manager'))
    AND public.can_access_tenant(auth.uid(), tenant_id)
  );

DROP POLICY IF EXISTS "管理员管理调岗条件" ON transfer_requirements;
CREATE POLICY "管理员管理调岗条件" ON transfer_requirements
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()
              AND role IN ('tenant_admin','store_manager'))
    AND public.can_access_tenant(auth.uid(), tenant_id)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()
              AND role IN ('tenant_admin','store_manager'))
    AND public.can_access_tenant(auth.uid(), tenant_id)
  );

DROP POLICY IF EXISTS "管理员管理调岗申请" ON transfer_applications;
CREATE POLICY "管理员管理调岗申请" ON transfer_applications
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()
              AND role IN ('tenant_admin','store_manager'))
    AND public.can_access_tenant(auth.uid(), tenant_id)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()
              AND role IN ('tenant_admin','store_manager'))
    AND public.can_access_tenant(auth.uid(), tenant_id)
  );

DROP POLICY IF EXISTS "管理员管理调岗评审" ON transfer_reviews;
CREATE POLICY "管理员管理调岗评审" ON transfer_reviews
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()
              AND role IN ('tenant_admin','store_manager'))
    AND public.can_access_tenant(auth.uid(), tenant_id)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()
              AND role IN ('tenant_admin','store_manager'))
    AND public.can_access_tenant(auth.uid(), tenant_id)
  );

DROP POLICY IF EXISTS "管理员管理调岗历史" ON transfer_history;
CREATE POLICY "管理员管理调岗历史" ON transfer_history
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()
              AND role IN ('tenant_admin','store_manager'))
    AND public.can_access_tenant(auth.uid(), tenant_id)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()
              AND role IN ('tenant_admin','store_manager'))
    AND public.can_access_tenant(auth.uid(), tenant_id)
  );
