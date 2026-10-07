-- ============================================================
-- P2-S1-A · 同店已发布班次可见性（换班真实候选的数据前提）
-- 依据: 合同"进入 schedules 即为已发布给员工的工作事实" + S1-A cutover #3
--       （员工只能查自己 published 的策略下，同店候选不可达 → mock 无法根除）
-- 语义: 本人 active 员工记录所属门店内，全部 published 班次对员工可读
--       （legacy/cancelled 仍不可见；跨店/跨租户仍不可见）
-- ============================================================

CREATE OR REPLACE FUNCTION private.sched_my_store_ids(uid uuid)
RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
  SELECT DISTINCT e.store_id FROM public.employees e
   WHERE e.user_id = uid AND e.status = 'active' AND e.store_id IS NOT NULL
$$;

GRANT scheduling_authority_owner TO postgres;
GRANT CREATE ON SCHEMA private TO scheduling_authority_owner;

ALTER FUNCTION private.sched_my_store_ids(uuid) OWNER TO scheduling_authority_owner;

REVOKE CREATE ON SCHEMA private FROM scheduling_authority_owner;
REVOKE ALL ON FUNCTION private.sched_my_store_ids(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.sched_my_store_ids(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION private.sched_my_store_ids(uuid) TO authenticated;

CREATE POLICY schedules_select_store_published ON public.schedules
  FOR SELECT TO authenticated
  USING (
    status = 'published'
    AND store_id IN (SELECT private.sched_my_store_ids(auth.uid()))
  );
