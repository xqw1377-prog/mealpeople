-- ============================================================
-- SECTION: SCHEMA
-- ============================================================

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA IF NOT EXISTS "public";


--
-- Name: SCHEMA "public"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA "public" IS 'standard public schema';


--
-- Name: pg_graphql; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";


--
-- Name: EXTENSION "pg_graphql"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "pg_graphql" IS 'pg_graphql: GraphQL support';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";


--
-- Name: EXTENSION "pgcrypto"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "pgcrypto" IS 'cryptographic functions';


--
-- Name: supabase_vault; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";


--
-- Name: EXTENSION "supabase_vault"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "supabase_vault" IS 'Supabase Vault Extension';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: alert_severity; Type: TYPE; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'alert_severity'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE TYPE "public"."alert_severity" AS ENUM (
    'info',
    'warning',
    'error',
    'critical'
);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: alert_type; Type: TYPE; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'alert_type'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE TYPE "public"."alert_type" AS ENUM (
    'attendance',
    'performance',
    'leave',
    'overtime',
    'salary',
    'promotion',
    'transfer',
    'onboarding',
    'offboarding',
    'system'
);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: course_status; Type: TYPE; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'course_status'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE TYPE "public"."course_status" AS ENUM (
    'draft',
    'published',
    'archived'
);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: department_type; Type: TYPE; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'department_type'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE TYPE "public"."department_type" AS ENUM (
    'front_hall',
    'kitchen'
);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: employment_type; Type: TYPE; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'employment_type'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE TYPE "public"."employment_type" AS ENUM (
    'full_time',
    'part_time'
);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: exam_status; Type: TYPE; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'exam_status'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE TYPE "public"."exam_status" AS ENUM (
    'pending',
    'passed',
    'failed'
);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: leave_status; Type: TYPE; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'leave_status'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE TYPE "public"."leave_status" AS ENUM (
    'pending',
    'approved',
    'rejected',
    'cancelled'
);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: leave_type; Type: TYPE; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'leave_type'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE TYPE "public"."leave_type" AS ENUM (
    'annual_leave',
    'sick_leave',
    'personal_leave',
    'other'
);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: notification_type; Type: TYPE; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'notification_type'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE TYPE "public"."notification_type" AS ENUM (
    'task',
    'training',
    'schedule',
    'system'
);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: shift_status; Type: TYPE; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'shift_status'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE TYPE "public"."shift_status" AS ENUM (
    'scheduled',
    'confirmed',
    'completed',
    'cancelled'
);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: shift_type; Type: TYPE; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'shift_type'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE TYPE "public"."shift_type" AS ENUM (
    'morning',
    'afternoon',
    'evening',
    'night',
    'rest'
);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: swap_request_status; Type: TYPE; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'swap_request_status'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE TYPE "public"."swap_request_status" AS ENUM (
    'pending',
    'approved',
    'rejected',
    'cancelled'
);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: training_category; Type: TYPE; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'training_category'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE TYPE "public"."training_category" AS ENUM (
    'job_skill',
    'company_culture',
    'safety',
    'policy',
    'other'
);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: training_status; Type: TYPE; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'training_status'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE TYPE "public"."training_status" AS ENUM (
    'enrolled',
    'in_progress',
    'completed',
    'cancelled'
);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: user_role; Type: TYPE; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'user_role'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE TYPE "public"."user_role" AS ENUM (
    'super_admin',
    'tenant_admin',
    'store_manager',
    'employee',
    'guest',
    'agent'
);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: TYPE "user_role"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TYPE "public"."user_role" IS '用户角色：super_admin(超级管理员), tenant_admin(租户管理员), store_manager(店经理), employee(员工), guest(体验用户)';


--
-- Name: widget_type; Type: TYPE; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'widget_type'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE TYPE "public"."widget_type" AS ENUM (
    'stats',
    'chart',
    'list',
    'calendar'
);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: work_rating_type; Type: TYPE; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'work_rating_type'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE TYPE "public"."work_rating_type" AS ENUM (
    'self',
    'peer',
    'supervisor'
);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: work_record_status; Type: TYPE; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'work_record_status'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE TYPE "public"."work_record_status" AS ENUM (
    'pending',
    'in_progress',
    'completed',
    'cancelled'
);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: work_schedule_status; Type: TYPE; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'work_schedule_status'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE TYPE "public"."work_schedule_status" AS ENUM (
    'draft',
    'published',
    'completed',
    'cancelled'
);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: work_schedule_type; Type: TYPE; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'work_schedule_type'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE TYPE "public"."work_schedule_type" AS ENUM (
    'daily',
    'weekly',
    'temporary'
);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: work_shift_type; Type: TYPE; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'work_shift_type'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE TYPE "public"."work_shift_type" AS ENUM (
    'morning',
    'afternoon',
    'evening',
    'full'
);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: audit_trigger_func(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION "public"."audit_trigger_func"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_user_id uuid;
    v_user_role text;
    v_tenant_id uuid;
    v_operation_type text;
    v_old_data jsonb;
    v_new_data jsonb;
BEGIN
    -- 获取当前用户信息
    v_user_id := auth.uid();
    
    SELECT role, tenant_id INTO v_user_role, v_tenant_id
    FROM profiles WHERE id = v_user_id;
    
    -- 确定操作类型
    IF TG_OP = 'INSERT' THEN
        v_operation_type := 'INSERT';
        v_old_data := NULL;
        v_new_data := to_jsonb(NEW);
    ELSIF TG_OP = 'UPDATE' THEN
        v_operation_type := 'UPDATE';
        v_old_data := to_jsonb(OLD);
        v_new_data := to_jsonb(NEW);
    ELSIF TG_OP = 'DELETE' THEN
        v_operation_type := 'DELETE';
        v_old_data := to_jsonb(OLD);
        v_new_data := NULL;
    END IF;
    
    -- 插入审计日志
    INSERT INTO audit_logs (
        app_version,
        operation_type,
        table_name,
        record_id,
        old_data,
        new_data,
        user_id,
        user_role,
        tenant_id
    ) VALUES (
        current_setting('app.version', true),
        v_operation_type,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        v_old_data,
        v_new_data,
        v_user_id,
        v_user_role,
        v_tenant_id
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$;


--
-- Name: calculate_total_revenue(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION "public"."calculate_total_revenue"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.total_revenue := NEW.customer_count * NEW.avg_price_per_customer;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;


--
-- Name: calculate_work_log_total_score(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION "public"."calculate_work_log_total_score"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.quality_score IS NOT NULL AND NEW.efficiency_score IS NOT NULL AND NEW.attitude_score IS NOT NULL THEN
    NEW.total_score = NEW.quality_score + NEW.efficiency_score + NEW.attitude_score;
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: can_access_tenant("uuid", "uuid"); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION "public"."can_access_tenant"("uid" "uuid", "tid" "uuid") RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
    SELECT 
        is_super_admin(uid) OR 
        get_user_tenant_id(uid) = tid;
$$;


--
-- Name: create_default_work_log_categories(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION "public"."create_default_work_log_categories"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  INSERT INTO work_log_categories (tenant_id, name, icon, color, sort_order, is_active)
  VALUES 
    (NEW.id, '客户接待', 'i-mdi-account-group', 'blue', 1, true),
    (NEW.id, '清洁卫生', 'i-mdi-broom', 'green', 2, true),
    (NEW.id, '设备维护', 'i-mdi-tools', 'orange', 3, true),
    (NEW.id, '库存管理', 'i-mdi-package-variant', 'purple', 4, true),
    (NEW.id, '安全检查', 'i-mdi-shield-check', 'red', 5, true),
    (NEW.id, '培训学习', 'i-mdi-school', 'cyan', 6, true),
    (NEW.id, '会议记录', 'i-mdi-calendar-text', 'pink', 7, true),
    (NEW.id, '其他工作', 'i-mdi-file-document', 'gray', 8, true);
  RETURN NEW;
END;
$$;


--
-- Name: create_offboarding_history_on_approval(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION "public"."create_offboarding_history_on_approval"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  emp_record RECORD;
  tenure_months_calc INTEGER;
BEGIN
  -- 当离职申请被批准时，自动创建离职历史记录
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    -- 获取员工信息
    SELECT e.name, e.position, e.department, e.store_id, e.hire_date
    INTO emp_record
    FROM employees e
    WHERE e.id = NEW.employee_id;
    
    -- 计算任职月数
    IF emp_record.hire_date IS NOT NULL THEN
      tenure_months_calc := EXTRACT(YEAR FROM AGE(COALESCE(NEW.actual_leave_date, NEW.expected_leave_date), emp_record.hire_date)) * 12 +
                           EXTRACT(MONTH FROM AGE(COALESCE(NEW.actual_leave_date, NEW.expected_leave_date), emp_record.hire_date));
    ELSE
      tenure_months_calc := 0;
    END IF;
    
    INSERT INTO offboarding_history (
      tenant_id,
      employee_id,
      application_id,
      employee_name,
      position,
      department,
      store_id,
      join_date,
      leave_date,
      tenure_months,
      resignation_type,
      resignation_reason,
      notes
    ) VALUES (
      NEW.tenant_id,
      NEW.employee_id,
      NEW.id,
      COALESCE(emp_record.name, '未知'),
      COALESCE(emp_record.position, '未知'),
      COALESCE(emp_record.department, '未知'),
      emp_record.store_id,
      COALESCE(emp_record.hire_date, CURRENT_DATE),
      COALESCE(NEW.actual_leave_date, NEW.expected_leave_date),
      tenure_months_calc,
      NEW.resignation_type,
      NEW.resignation_reason,
      '通过离职申请自动生成'
    );
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- Name: create_onboarding_history_on_approval(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION "public"."create_onboarding_history_on_approval"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- 当入职申请被批准时，自动创建入职历史记录
  IF NEW.status = 'approved' AND OLD.status != 'approved' AND NEW.employee_id IS NOT NULL THEN
    INSERT INTO onboarding_history (
      tenant_id,
      employee_id,
      application_id,
      candidate_name,
      position,
      department,
      store_id,
      start_date,
      onboarding_date,
      status
    ) VALUES (
      NEW.tenant_id,
      NEW.employee_id,
      NEW.id,
      NEW.candidate_name,
      NEW.position,
      NEW.department,
      NEW.store_id,
      NEW.expected_start_date,
      CURRENT_DATE,
      'in_progress'
    );
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- Name: create_overtime_compensation(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION "public"."create_overtime_compensation"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_overtime_type overtime_types%ROWTYPE;
BEGIN
  -- 当加班申请被批准时，自动创建补偿记录
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    -- 获取加班类型信息
    SELECT * INTO v_overtime_type
    FROM overtime_types
    WHERE id = NEW.overtime_type_id;
    
    -- 如果允许补偿，创建补偿记录
    IF v_overtime_type.can_compensate THEN
      INSERT INTO overtime_compensations (
        tenant_id,
        overtime_request_id,
        employee_id,
        compensation_type,
        hours,
        status
      ) VALUES (
        NEW.tenant_id,
        NEW.id,
        NEW.employee_id,
        'time_off',
        NEW.hours * v_overtime_type.rate,
        'available'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- Name: create_promotion_history_on_approval(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION "public"."create_promotion_history_on_approval"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- 当晋升申请被批准时，自动创建晋升历史记录
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    INSERT INTO promotion_history (
      tenant_id,
      employee_id,
      application_id,
      from_position,
      to_position,
      from_level,
      to_level,
      promotion_date,
      promotion_type,
      notes
    ) VALUES (
      NEW.tenant_id,
      NEW.employee_id,
      NEW.id,
      NEW.current_position,
      NEW.target_position,
      NEW.current_level,
      NEW.target_level,
      COALESCE(NEW.effective_date, CURRENT_DATE),
      'regular',
      '通过晋升申请自动生成'
    );
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- Name: create_transfer_history_on_approval(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION "public"."create_transfer_history_on_approval"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- 当调岗申请被批准时，自动创建调岗历史记录
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    INSERT INTO transfer_history (
      tenant_id,
      employee_id,
      application_id,
      from_position,
      to_position,
      from_department,
      to_department,
      from_store_id,
      to_store_id,
      transfer_date,
      transfer_type,
      notes
    ) VALUES (
      NEW.tenant_id,
      NEW.employee_id,
      NEW.id,
      NEW.current_position,
      NEW.target_position,
      NEW.current_department,
      NEW.target_department,
      NEW.current_store_id,
      NEW.target_store_id,
      COALESCE(NEW.effective_date, CURRENT_DATE),
      'regular',
      '通过调岗申请自动生成'
    );
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- Name: generate_invitation_code(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION "public"."generate_invitation_code"() RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  code_value text;
  exists_count int;
  attempt int := 0;
  max_attempts int := 10;
BEGIN
  LOOP
    -- 生成8位随机邀请码（大写字母和数字）
    code_value := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
    
    -- 检查是否已存在（使用正确的字段名 code）
    SELECT COUNT(*) INTO exists_count
    FROM invitation_codes
    WHERE code = code_value;
    
    -- 如果不存在，返回该邀请码
    IF exists_count = 0 THEN
      RETURN code_value;
    END IF;
    
    -- 增加尝试次数
    attempt := attempt + 1;
    
    -- 如果尝试次数超过最大值，抛出异常
    IF attempt >= max_attempts THEN
      RAISE EXCEPTION '无法生成唯一邀请码，请稍后重试';
    END IF;
  END LOOP;
END;
$$;


--
-- Name: FUNCTION "generate_invitation_code"(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION "public"."generate_invitation_code"() IS '生成唯一的8位邀请码';


--
-- Name: get_demo_tenant_id(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION "public"."get_demo_tenant_id"() RETURNS "uuid"
    LANGUAGE "sql" STABLE
    AS $$
  SELECT id FROM tenants WHERE is_demo = true AND status = 'active' LIMIT 1;
$$;


--
-- Name: get_employee_active_positions("uuid"); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION "public"."get_employee_active_positions"("emp_id" "uuid") RETURNS TABLE("position_id" "uuid", "position_name" "text", "position_level" integer, "is_primary" boolean)
    LANGUAGE "sql" STABLE
    AS $$
  SELECT 
    p.id,
    p.position_name,
    p.position_level,
    ep.is_primary
  FROM employee_positions ep
  JOIN positions p ON ep.position_id = p.id
  WHERE ep.employee_id = emp_id
    AND ep.effective_date <= CURRENT_DATE
    AND (ep.expiry_date IS NULL OR ep.expiry_date >= CURRENT_DATE)
    AND p.is_active = true
  ORDER BY ep.is_primary DESC, p.position_level ASC;
$$;


--
-- Name: get_position_current_count("uuid"); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION "public"."get_position_current_count"("org_id" "uuid") RETURNS integer
    LANGUAGE "sql" STABLE
    AS $$
  SELECT COUNT(*)::INTEGER
  FROM store_position_assignments
  WHERE organization_id = org_id
    AND effective_date <= CURRENT_DATE
    AND (expiry_date IS NULL OR expiry_date >= CURRENT_DATE);
$$;


--
-- Name: get_user_role("uuid"); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION "public"."get_user_role"("uid" "uuid") RETURNS "public"."user_role"
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
    SELECT role FROM profiles WHERE id = uid;
$$;


--
-- Name: get_user_tenant_id("uuid"); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION "public"."get_user_tenant_id"("uid" "uuid") RETURNS "uuid"
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
    SELECT tenant_id FROM profiles WHERE id = uid;
$$;


--
-- Name: get_user_tenant_ids("uuid"); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION "public"."get_user_tenant_ids"("user_id" "uuid") RETURNS TABLE("tenant_id" "uuid")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    -- 从profiles表获取
    SELECT p.tenant_id FROM profiles p WHERE p.id = user_id AND p.tenant_id IS NOT NULL
    UNION
    -- 从tenant_members表获取
    SELECT tm.tenant_id FROM tenant_members tm WHERE tm.user_id = user_id;
END;
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    user_count int;
    user_role user_role;
BEGIN
    -- 判断 profiles 表里有多少用户
    SELECT COUNT(*) INTO user_count FROM profiles;
    
    -- 确定用户角色：首位用户为 super_admin，其他为 employee
    IF user_count = 0 THEN
        user_role := 'super_admin'::user_role;
    ELSE
        user_role := 'employee'::user_role;
    END IF;
    
    -- 插入或更新 profiles
    -- 使用 ON CONFLICT 避免重复插入
    INSERT INTO profiles (id, phone, email, role)
    VALUES (
        NEW.id,
        NEW.phone,
        NEW.email,
        user_role
    )
    ON CONFLICT (id) DO UPDATE SET
        phone = COALESCE(EXCLUDED.phone, profiles.phone),
        email = COALESCE(EXCLUDED.email, profiles.email),
        updated_at = now();
    
    RETURN NEW;
END;
$$;


--
-- Name: FUNCTION "handle_new_user"(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION "public"."handle_new_user"() IS '处理新用户注册，自动创建 profile 记录，电话号码自动去掉 +86 前缀';


--
-- Name: is_admin("uuid"); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION "public"."is_admin"("uid" "uuid") RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
    SELECT EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = uid AND p.role IN ('super_admin'::user_role, 'tenant_admin'::user_role, 'store_manager'::user_role)
    );
$$;


--
-- Name: is_guest_user("uuid"); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION "public"."is_guest_user"("uid" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = uid 
    AND role = 'guest'::user_role
  );
$$;


--
-- Name: is_position_understaffed("uuid"); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION "public"."is_position_understaffed"("org_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
  SELECT 
    COALESCE(get_position_current_count(org_id), 0) < so.required_count
  FROM store_organization so
  WHERE so.id = org_id;
$$;


--
-- Name: is_super_admin("uuid"); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION "public"."is_super_admin"("uid" "uuid") RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
    SELECT EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = uid AND p.role = 'super_admin'::user_role
    );
$$;


--
-- Name: is_tenant_admin_or_manager("uuid", "uuid"); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION "public"."is_tenant_admin_or_manager"("user_id" "uuid", "check_tenant_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- 检查profiles表中的角色
    IF EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = user_id 
        AND tenant_id = check_tenant_id
        AND role IN ('tenant_admin', 'store_manager')
    ) THEN
        RETURN TRUE;
    END IF;
    
    -- 检查tenant_members表中的角色
    IF EXISTS (
        SELECT 1 FROM tenant_members 
        WHERE user_id = user_id 
        AND tenant_id = check_tenant_id
        AND role IN ('tenant_admin', 'store_manager')
    ) THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$;


--
-- Name: is_user_admin("uuid"); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION "public"."is_user_admin"("user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_id AND role = 'admin'::user_role
  );
END;
$$;


--
-- Name: join_tenant_with_code("text", "uuid", "text"); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION "public"."join_tenant_with_code"("p_code" "text", "p_user_id" "uuid", "p_user_name" "text") RETURNS TABLE("success" boolean, "message" "text", "tenant_id" "uuid", "store_id" "uuid", "role" "public"."user_role")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_invitation invitation_codes%ROWTYPE;
  v_existing_profile profiles%ROWTYPE;
BEGIN
  -- 验证邀请码
  SELECT * INTO v_invitation
  FROM invitation_codes
  WHERE code = p_code
  AND status = 'active'
  AND expires_at > now()
  AND used_count < max_uses;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, '邀请码无效或已过期'::text, NULL::uuid, NULL::uuid, NULL::user_role;
    RETURN;
  END IF;

  -- 检查用户是否已经属于该租户
  SELECT * INTO v_existing_profile
  FROM profiles
  WHERE id = p_user_id;

  IF FOUND AND v_existing_profile.tenant_id = v_invitation.tenant_id THEN
    RETURN QUERY SELECT false, '您已经是该租户的成员'::text, NULL::uuid, NULL::uuid, NULL::user_role;
    RETURN;
  END IF;

  -- 更新用户的租户和角色
  UPDATE profiles
  SET 
    tenant_id = v_invitation.tenant_id,
    role = v_invitation.role,
    name = COALESCE(name, p_user_name),
    updated_at = now()
  WHERE id = p_user_id;

  -- 增加邀请码使用次数
  UPDATE invitation_codes
  SET used_count = used_count + 1
  WHERE id = v_invitation.id;

  -- 记录使用记录
  INSERT INTO invitation_code_uses (invitation_code_id, user_id)
  VALUES (v_invitation.id, p_user_id);

  -- 如果指定了店铺，创建员工记录
  IF v_invitation.store_id IS NOT NULL THEN
    INSERT INTO employees (
      tenant_id,
      store_id,
      user_id,
      name,
      employee_type,
      status
    ) VALUES (
      v_invitation.tenant_id,
      v_invitation.store_id,
      p_user_id,
      p_user_name,
      'full_time',
      'active'
    )
    ON CONFLICT (tenant_id, user_id) DO UPDATE
    SET store_id = v_invitation.store_id;
  END IF;

  RETURN QUERY SELECT 
    true,
    '成功加入租户'::text,
    v_invitation.tenant_id,
    v_invitation.store_id,
    v_invitation.role;
END;
$$;


--
-- Name: FUNCTION "join_tenant_with_code"("p_code" "text", "p_user_id" "uuid", "p_user_name" "text"); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION "public"."join_tenant_with_code"("p_code" "text", "p_user_id" "uuid", "p_user_name" "text") IS '使用邀请码加入租户';


--
-- Name: restore_from_snapshot("uuid"); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION "public"."restore_from_snapshot"("p_snapshot_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $_$
DECLARE
    v_snapshot RECORD;
    v_result jsonb;
BEGIN
    -- 获取快照信息
    SELECT * INTO v_snapshot
    FROM data_snapshots
    WHERE id = p_snapshot_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', '快照不存在'
        );
    END IF;
    
    -- 这里需要根据具体表结构实现恢复逻辑
    -- 示例：清空表并恢复数据
    -- EXECUTE format('TRUNCATE TABLE %I CASCADE', v_snapshot.table_name);
    -- EXECUTE format('INSERT INTO %I SELECT * FROM jsonb_populate_recordset(null::%I, $1)', 
    --                v_snapshot.table_name, v_snapshot.table_name)
    -- USING v_snapshot.snapshot_data;
    
    -- 更新恢复信息
    UPDATE data_snapshots
    SET restored_at = now(),
        restored_by = auth.uid()
    WHERE id = p_snapshot_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'table_name', v_snapshot.table_name,
        'record_count', v_snapshot.record_count
    );
END;
$_$;


--
-- Name: set_task_completed_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION "public"."set_task_completed_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- 如果状态从非 completed 变为 completed，设置完成时间
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    NEW.completed_at = NOW();
  END IF;
  
  -- 如果状态从 completed 变为其他状态，清除完成时间
  IF NEW.status != 'completed' AND OLD.status = 'completed' THEN
    NEW.completed_at = NULL;
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- Name: update_agent_assignments_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION "public"."update_agent_assignments_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


--
-- Name: update_benefit_types_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION "public"."update_benefit_types_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_benefit_usage_records_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION "public"."update_benefit_usage_records_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_brands_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION "public"."update_brands_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_certifications_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION "public"."update_certifications_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_dashboard_widgets_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION "public"."update_dashboard_widgets_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


--
-- Name: update_departments_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION "public"."update_departments_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


--
-- Name: update_employee_benefits_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION "public"."update_employee_benefits_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_employee_levels_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION "public"."update_employee_levels_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_employee_shifts_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION "public"."update_employee_shifts_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_goals_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION "public"."update_goals_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_improvements_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION "public"."update_improvements_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_leave_balance_on_approval(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION "public"."update_leave_balance_on_approval"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- 当请假申请被批准时，更新假期余额
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    UPDATE leave_balances
    SET 
      used_days = used_days + NEW.days,
      remaining_days = total_days - (used_days + NEW.days)
    WHERE employee_id = NEW.employee_id
      AND leave_type_id = NEW.leave_type_id
      AND year = EXTRACT(YEAR FROM NEW.start_date);
  END IF;
  
  -- 当请假申请被拒绝或取消时，如果之前是批准状态，需要恢复余额
  IF (NEW.status = 'rejected' OR NEW.status = 'cancelled') AND OLD.status = 'approved' THEN
    UPDATE leave_balances
    SET 
      used_days = used_days - NEW.days,
      remaining_days = total_days - (used_days - NEW.days)
    WHERE employee_id = NEW.employee_id
      AND leave_type_id = NEW.leave_type_id
      AND year = EXTRACT(YEAR FROM NEW.start_date);
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- Name: update_leave_balances_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION "public"."update_leave_balances_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_leave_requests_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION "public"."update_leave_requests_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_leave_types_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION "public"."update_leave_types_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_offboarding_applications_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION "public"."update_offboarding_applications_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_offboarding_handovers_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION "public"."update_offboarding_handovers_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_offboarding_history_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION "public"."update_offboarding_history_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_offboarding_interviews_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION "public"."update_offboarding_interviews_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_offboarding_tasks_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION "public"."update_offboarding_tasks_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_onboarding_applications_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION "public"."update_onboarding_applications_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_onboarding_documents_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION "public"."update_onboarding_documents_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_onboarding_history_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION "public"."update_onboarding_history_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_onboarding_processes_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION "public"."update_onboarding_processes_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_onboarding_tasks_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION "public"."update_onboarding_tasks_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_overtime_compensations_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION "public"."update_overtime_compensations_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_overtime_requests_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION "public"."update_overtime_requests_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_overtime_types_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION "public"."update_overtime_types_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_performance_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION "public"."update_performance_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_promotion_applications_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION "public"."update_promotion_applications_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_promotion_history_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION "public"."update_promotion_history_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_promotion_paths_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION "public"."update_promotion_paths_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_promotion_requirements_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION "public"."update_promotion_requirements_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_promotion_reviews_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION "public"."update_promotion_reviews_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_salary_records_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION "public"."update_salary_records_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_salary_structures_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION "public"."update_salary_structures_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_shift_swap_requests_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION "public"."update_shift_swap_requests_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_tenant_applications_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION "public"."update_tenant_applications_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_tenant_employee_count(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION "public"."update_tenant_employee_count"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE tenants SET employee_count = employee_count + 1 WHERE id = NEW.tenant_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE tenants SET employee_count = employee_count - 1 WHERE id = OLD.tenant_id;
    END IF;
    RETURN NULL;
END;
$$;


--
-- Name: update_tenant_store_count(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION "public"."update_tenant_store_count"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE tenants SET store_count = store_count + 1 WHERE id = NEW.tenant_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE tenants SET store_count = store_count - 1 WHERE id = OLD.tenant_id;
    END IF;
    RETURN NULL;
END;
$$;


--
-- Name: update_transfer_applications_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION "public"."update_transfer_applications_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_transfer_history_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION "public"."update_transfer_history_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_transfer_positions_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION "public"."update_transfer_positions_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_transfer_requirements_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION "public"."update_transfer_requirements_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_transfer_reviews_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION "public"."update_transfer_reviews_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


--
-- Name: update_work_log_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION "public"."update_work_log_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_work_schedule_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION "public"."update_work_schedule_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


--
-- Name: validate_invitation_code("text"); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION "public"."validate_invitation_code"("p_code" "text") RETURNS TABLE("is_valid" boolean, "tenant_id" "uuid", "tenant_name" "text", "store_id" "uuid", "store_name" "text", "role" "public"."user_role", "message" "text")
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_invitation invitation_codes%ROWTYPE;
  v_tenant tenants%ROWTYPE;
  v_store stores%ROWTYPE;
BEGIN
  -- 查找邀请码
  SELECT * INTO v_invitation
  FROM invitation_codes
  WHERE code = p_code;

  -- 邀请码不存在
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::uuid, NULL::text, NULL::uuid, NULL::text, NULL::user_role, '邀请码不存在'::text;
    RETURN;
  END IF;

  -- 邀请码已停用
  IF v_invitation.status != 'active' THEN
    RETURN QUERY SELECT false, NULL::uuid, NULL::text, NULL::uuid, NULL::text, NULL::user_role, '邀请码已停用'::text;
    RETURN;
  END IF;

  -- 邀请码已过期
  IF v_invitation.expires_at < now() THEN
    RETURN QUERY SELECT false, NULL::uuid, NULL::text, NULL::uuid, NULL::text, NULL::user_role, '邀请码已过期'::text;
    RETURN;
  END IF;

  -- 邀请码已达到使用次数上限
  IF v_invitation.used_count >= v_invitation.max_uses THEN
    RETURN QUERY SELECT false, NULL::uuid, NULL::text, NULL::uuid, NULL::text, NULL::user_role, '邀请码已达到使用次数上限'::text;
    RETURN;
  END IF;

  -- 获取租户信息
  SELECT * INTO v_tenant
  FROM tenants
  WHERE id = v_invitation.tenant_id;

  -- 获取店铺信息（如果有）
  IF v_invitation.store_id IS NOT NULL THEN
    SELECT * INTO v_store
    FROM stores
    WHERE id = v_invitation.store_id;
  END IF;

  -- 邀请码有效
  RETURN QUERY SELECT 
    true,
    v_invitation.tenant_id,
    v_tenant.name,
    v_invitation.store_id,
    COALESCE(v_store.name, '未指定店铺'::text),
    v_invitation.role,
    '邀请码有效'::text;
END;
$$;


--
-- Name: FUNCTION "validate_invitation_code"("p_code" "text"); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION "public"."validate_invitation_code"("p_code" "text") IS '验证邀请码是否有效';


SET default_tablespace = '';

SET default_table_access_method = "heap";

--
-- Name: agent_assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."agent_assignments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "agent_id" "uuid" NOT NULL,
    "store_id" "uuid" NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "assigned_at" timestamp with time zone DEFAULT "now"(),
    "assigned_by" "uuid" NOT NULL,
    "status" "text" DEFAULT 'active'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "agent_assignments_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'inactive'::"text"])))
);


--
-- Name: approval_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."approval_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "request_type" "text" NOT NULL,
    "request_id" "uuid" NOT NULL,
    "approver_id" "uuid" NOT NULL,
    "action" "text" NOT NULL,
    "comment" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "approval_logs_action_check" CHECK (("action" = ANY (ARRAY['approved'::"text", 'rejected'::"text"])))
);


--
-- Name: TABLE "approval_logs"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE "public"."approval_logs" IS '审批记录表';


--
-- Name: COLUMN "approval_logs"."request_type"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."approval_logs"."request_type" IS '申请类型: leave_request(休假申请), schedule_change(排班变更)等';


--
-- Name: COLUMN "approval_logs"."action"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."approval_logs"."action" IS '审批动作: approved(批准), rejected(拒绝)';


--
-- Name: area_attendance_overview; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."area_attendance_overview" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "store_id" "uuid" NOT NULL,
    "overview_date" "date" NOT NULL,
    "overview_data" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "total_areas" integer DEFAULT 0,
    "open_areas" integer DEFAULT 0,
    "total_positions" integer DEFAULT 0,
    "total_staff_required" integer DEFAULT 0,
    "total_staff_assigned" integer DEFAULT 0,
    "total_staff_on_duty" integer DEFAULT 0,
    "total_staff_on_rest" integer DEFAULT 0,
    "is_complete" boolean DEFAULT false,
    "generated_at" timestamp with time zone DEFAULT "now"()
);


--
-- Name: area_daily_status; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."area_daily_status" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "store_id" "uuid" NOT NULL,
    "area_id" "uuid" NOT NULL,
    "status_date" "date" NOT NULL,
    "is_open" boolean DEFAULT true,
    "open_time" time without time zone,
    "close_time" time without time zone,
    "close_reason" "text",
    "predicted_customer_count" integer,
    "predicted_revenue" numeric(10,2),
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


--
-- Name: area_positions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."area_positions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "store_id" "uuid" NOT NULL,
    "area_id" "uuid" NOT NULL,
    "position_name" "text" NOT NULL,
    "position_level" "text",
    "quota_count" integer DEFAULT 1 NOT NULL,
    "min_count" integer DEFAULT 1 NOT NULL,
    "max_count" integer,
    "required_skills" "text"[] DEFAULT '{}'::"text"[],
    "work_hours_per_day" numeric(4,2),
    "salary_min" numeric(10,2),
    "salary_max" numeric(10,2),
    "is_active" boolean DEFAULT true,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


--
-- Name: area_staff_assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."area_staff_assignments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "store_id" "uuid" NOT NULL,
    "area_id" "uuid" NOT NULL,
    "area_position_id" "uuid" NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "assignment_type" "text" DEFAULT 'permanent'::"text",
    "start_date" "date" NOT NULL,
    "end_date" "date",
    "work_schedule" "jsonb" DEFAULT '{}'::"jsonb",
    "priority" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."audit_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "app_version" "text" NOT NULL,
    "migration_version" "text",
    "operation_type" "text" NOT NULL,
    "table_name" "text" NOT NULL,
    "record_id" "uuid",
    "old_data" "jsonb",
    "new_data" "jsonb",
    "changes" "jsonb",
    "user_id" "uuid",
    "user_role" "text",
    "tenant_id" "uuid",
    "operation_context" "jsonb",
    "error_info" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


--
-- Name: backup_position_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."backup_position_config" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "store_id" "uuid" NOT NULL,
    "primary_position_id" "uuid" NOT NULL,
    "backup_position_id" "uuid" NOT NULL,
    "backup_type" "text" NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "backup_position_config_backup_type_check" CHECK (("backup_type" = ANY (ARRAY['up'::"text", 'down'::"text"])))
);


--
-- Name: benefit_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."benefit_types" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "type_name" "text" NOT NULL,
    "type_code" "text" NOT NULL,
    "category" "text" NOT NULL,
    "description" "text",
    "is_mandatory" boolean DEFAULT false,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


--
-- Name: benefit_usage_records; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."benefit_usage_records" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "employee_benefit_id" "uuid" NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "usage_date" "date" NOT NULL,
    "amount" numeric(10,2) NOT NULL,
    "description" "text",
    "status" "text" DEFAULT 'approved'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "benefit_usage_records_amount_check" CHECK (("amount" > (0)::numeric))
);


--
-- Name: best_practices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."best_practices" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "store_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "category" "text" NOT NULL,
    "description" "text" NOT NULL,
    "results" "jsonb",
    "applied_count" integer DEFAULT 0,
    "rating" numeric(3,2) DEFAULT 0,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "best_practices_rating_check" CHECK ((("rating" >= (0)::numeric) AND ("rating" <= (5)::numeric)))
);


--
-- Name: TABLE "best_practices"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE "public"."best_practices" IS '最佳实践分享表 - 存储各店的优秀经验分享';


--
-- Name: brands; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."brands" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "industry" "text",
    "logo_url" "text",
    "description" "text",
    "status" "text" DEFAULT 'active'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "brands_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'inactive'::"text"])))
);


--
-- Name: business_area_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."business_area_config" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "store_id" "uuid",
    "area_name" "text" NOT NULL,
    "area_type" "text" NOT NULL,
    "capacity" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "display_order" integer DEFAULT 0,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "position_count" integer DEFAULT 1,
    CONSTRAINT "business_area_config_area_type_check" CHECK (("area_type" = ANY (ARRAY['business'::"text", 'production'::"text"]))),
    CONSTRAINT "business_area_config_position_count_check" CHECK (("position_count" >= 0))
);


--
-- Name: business_areas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."business_areas" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "store_id" "uuid" NOT NULL,
    "area_code" "text" NOT NULL,
    "area_name" "text" NOT NULL,
    "area_type" "text" NOT NULL,
    "description" "text",
    "capacity" integer,
    "floor_number" integer,
    "sort_order" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "can_close_daily" boolean DEFAULT true,
    "revenue_weight" numeric(5,2) DEFAULT 1.0,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


--
-- Name: candidates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."candidates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "position_id" "uuid",
    "name" "text" NOT NULL,
    "phone" "text",
    "email" "text",
    "resume_url" "text",
    "status" "text" DEFAULT 'pending'::"text",
    "source" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "candidates_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'interview'::"text", 'offer'::"text", 'hired'::"text", 'rejected'::"text"])))
);


--
-- Name: core_position_backup; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."core_position_backup" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "store_id" "uuid" NOT NULL,
    "core_employee_id" "uuid" NOT NULL,
    "core_position" "text" NOT NULL,
    "backup_employee_ids" "uuid"[] DEFAULT '{}'::"uuid"[] NOT NULL,
    "no_same_day_off" boolean DEFAULT true,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


--
-- Name: TABLE "core_position_backup"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE "public"."core_position_backup" IS '核心岗位顶岗配置表';


--
-- Name: cost_data; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."cost_data" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "store_id" "uuid",
    "data_date" "date" NOT NULL,
    "revenue" numeric(12,2),
    "labor_cost" numeric(12,2),
    "labor_cost_ratio" numeric(5,2),
    "employee_count" integer,
    "avg_efficiency" numeric(5,2),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


--
-- Name: daily_operations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."daily_operations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "store_id" "uuid" NOT NULL,
    "operation_date" "date" NOT NULL,
    "estimated_revenue" numeric(10,2),
    "planned_staff_count" numeric(10,2),
    "midday_estimated_revenue" numeric(10,2),
    "adjusted_staff_count" numeric(10,2),
    "actual_revenue" numeric(10,2),
    "actual_staff_count" numeric(10,2),
    "per_capita_revenue" numeric(10,2),
    "efficiency_rating" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "planned_part_time_hours" numeric(10,2) DEFAULT 0,
    "planned_labor_cost" numeric(10,2),
    "adjusted_part_time_hours" numeric(10,2) DEFAULT 0,
    "actual_part_time_hours" numeric(10,2) DEFAULT 0,
    "actual_labor_cost" numeric(10,2),
    "planned_rest_count" numeric(10,2),
    "adjusted_rest_count" numeric(10,2),
    "actual_rest_count" numeric(10,2)
);


--
-- Name: COLUMN "daily_operations"."planned_staff_count"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."daily_operations"."planned_staff_count" IS '计划上岗人数（排班规划阶段）';


--
-- Name: COLUMN "daily_operations"."adjusted_staff_count"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."daily_operations"."adjusted_staff_count" IS '调整后上岗人数（营业调整阶段）';


--
-- Name: COLUMN "daily_operations"."actual_staff_count"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."daily_operations"."actual_staff_count" IS '实际上岗人数（营业复盘阶段）';


--
-- Name: COLUMN "daily_operations"."planned_part_time_hours"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."daily_operations"."planned_part_time_hours" IS '计划兼职工时（小时）';


--
-- Name: COLUMN "daily_operations"."planned_labor_cost"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."daily_operations"."planned_labor_cost" IS '计划人力成本（元）';


--
-- Name: COLUMN "daily_operations"."adjusted_part_time_hours"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."daily_operations"."adjusted_part_time_hours" IS '调整后兼职工时（小时）';


--
-- Name: COLUMN "daily_operations"."actual_part_time_hours"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."daily_operations"."actual_part_time_hours" IS '实际兼职工时（小时）';


--
-- Name: COLUMN "daily_operations"."actual_labor_cost"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."daily_operations"."actual_labor_cost" IS '实际人力成本（元）';


--
-- Name: COLUMN "daily_operations"."planned_rest_count"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."daily_operations"."planned_rest_count" IS '计划排休人数（排班规划阶段）';


--
-- Name: COLUMN "daily_operations"."adjusted_rest_count"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."daily_operations"."adjusted_rest_count" IS '调整后排休人数（营业调整阶段）';


--
-- Name: COLUMN "daily_operations"."actual_rest_count"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."daily_operations"."actual_rest_count" IS '实际排休人数（营业复盘阶段）';


--
-- Name: daily_revenue_detail; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."daily_revenue_detail" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "calendar_id" "uuid" NOT NULL,
    "revenue_date" "date" NOT NULL,
    "day_of_week" integer NOT NULL,
    "is_weekend" boolean DEFAULT false,
    "is_holiday" boolean DEFAULT false,
    "predicted_revenue" numeric(12,2) DEFAULT 0,
    "adjusted_revenue" numeric(12,2),
    "breakfast_revenue" numeric(12,2) DEFAULT 0,
    "lunch_revenue" numeric(12,2) DEFAULT 0,
    "dinner_revenue" numeric(12,2) DEFAULT 0,
    "other_revenue" numeric(12,2) DEFAULT 0,
    "weather_factor" "text",
    "event_factor" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "daily_revenue_detail_day_of_week_check" CHECK ((("day_of_week" >= 0) AND ("day_of_week" <= 6)))
);


--
-- Name: dashboard_alerts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."dashboard_alerts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "alert_type" "public"."alert_type" NOT NULL,
    "severity" "public"."alert_severity" DEFAULT 'info'::"public"."alert_severity" NOT NULL,
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "related_id" "uuid",
    "is_read" boolean DEFAULT false NOT NULL,
    "is_resolved" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "resolved_at" timestamp with time zone
);


--
-- Name: dashboard_quick_actions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."dashboard_quick_actions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "action_type" "text" NOT NULL,
    "action_name" "text" NOT NULL,
    "action_config" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "usage_count" integer DEFAULT 0 NOT NULL,
    "last_used_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


--
-- Name: dashboard_widgets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."dashboard_widgets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "widget_type" "public"."widget_type" NOT NULL,
    "widget_config" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "position" integer DEFAULT 0 NOT NULL,
    "is_visible" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


--
-- Name: data_snapshots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."data_snapshots" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "app_version" "text" NOT NULL,
    "snapshot_type" "text" NOT NULL,
    "table_name" "text" NOT NULL,
    "snapshot_data" "jsonb" NOT NULL,
    "record_count" integer NOT NULL,
    "description" "text",
    "tenant_id" "uuid",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "restored_at" timestamp with time zone,
    "restored_by" "uuid",
    CONSTRAINT "data_snapshots_snapshot_type_check" CHECK (("snapshot_type" = ANY (ARRAY['manual'::"text", 'auto'::"text", 'pre_migration'::"text"])))
);


--
-- Name: day_off_records; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."day_off_records" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "schedule_plan_id" "uuid" NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "day_off_date" "date" NOT NULL,
    "reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "meal_period" "text" DEFAULT 'all_day'::"text",
    "rest_hours" numeric(5,2) DEFAULT 8
);


--
-- Name: COLUMN "day_off_records"."meal_period"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."day_off_records"."meal_period" IS '排休餐段：all_day(全天)/breakfast(早餐)/lunch(午餐)/dinner(晚餐)';


--
-- Name: COLUMN "day_off_records"."rest_hours"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."day_off_records"."rest_hours" IS '排休小时数';


--
-- Name: departments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."departments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "code" "text",
    "parent_id" "uuid",
    "manager_id" "uuid",
    "description" "text",
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


--
-- Name: TABLE "departments"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE "public"."departments" IS '部门管理表 - 用于管理组织架构和部门信息';


--
-- Name: COLUMN "departments"."id"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."departments"."id" IS '部门ID';


--
-- Name: COLUMN "departments"."tenant_id"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."departments"."tenant_id" IS '租户ID';


--
-- Name: COLUMN "departments"."name"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."departments"."name" IS '部门名称';


--
-- Name: COLUMN "departments"."code"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."departments"."code" IS '部门编码';


--
-- Name: COLUMN "departments"."parent_id"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."departments"."parent_id" IS '父部门ID';


--
-- Name: COLUMN "departments"."manager_id"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."departments"."manager_id" IS '部门负责人ID';


--
-- Name: COLUMN "departments"."description"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."departments"."description" IS '部门描述';


--
-- Name: COLUMN "departments"."status"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."departments"."status" IS '状态：active=启用, inactive=停用';


--
-- Name: COLUMN "departments"."sort_order"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."departments"."sort_order" IS '排序顺序';


--
-- Name: efficiency_standards; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."efficiency_standards" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "store_id" "uuid",
    "low_revenue_max" numeric(10,2) DEFAULT 10000,
    "low_efficiency_standard" numeric(10,2) DEFAULT 700,
    "low_management_motto" "text" DEFAULT '严控成本，生存第一'::"text",
    "normal_revenue_min" numeric(10,2) DEFAULT 10000,
    "normal_revenue_max" numeric(10,2) DEFAULT 18000,
    "normal_efficiency_standard" numeric(10,2) DEFAULT 850,
    "normal_management_motto" "text" DEFAULT '精益运营，效率为王'::"text",
    "high_revenue_min" numeric(10,2) DEFAULT 18000,
    "high_efficiency_standard" numeric(10,2) DEFAULT 1000,
    "high_management_motto" "text" DEFAULT '保障效能，利润冲刺'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


--
-- Name: employee_benefits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."employee_benefits" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "benefit_type_id" "uuid" NOT NULL,
    "start_date" "date" NOT NULL,
    "end_date" "date",
    "amount" numeric(10,2),
    "quota" numeric(10,2),
    "used_quota" numeric(10,2) DEFAULT 0,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


--
-- Name: employee_certifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."employee_certifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "cert_name" "text" NOT NULL,
    "cert_type" "text" NOT NULL,
    "cert_level" "text",
    "obtain_date" "date" NOT NULL,
    "expire_date" "date",
    "cert_status" "text" DEFAULT 'active'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


--
-- Name: employee_levels; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."employee_levels" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "current_level" "text" DEFAULT '初级服务员'::"text" NOT NULL,
    "level_score" integer DEFAULT 0 NOT NULL,
    "next_level" "text" DEFAULT '中级服务员'::"text" NOT NULL,
    "next_level_score" integer DEFAULT 100 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


--
-- Name: employee_lifecycle_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."employee_lifecycle_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "event_type" "text" NOT NULL,
    "event_date" "date" NOT NULL,
    "description" "text",
    "metadata" "jsonb",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "employee_lifecycle_events_type_check" CHECK (("event_type" = ANY (ARRAY['applied'::"text", 'interviewed'::"text", 'hired'::"text", 'onboarded'::"text", 'promoted'::"text", 'transferred'::"text", 'resigned'::"text", 'terminated'::"text"])))
);


--
-- Name: employee_onboarding; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."employee_onboarding" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "store_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "phone" "text" NOT NULL,
    "id_card" "text",
    "email" "text",
    "emergency_contact_name" "text",
    "emergency_contact_phone" "text",
    "department" "text",
    "position" "text",
    "onboarding_date" "date" NOT NULL,
    "probation_months" integer DEFAULT 3,
    "expected_salary" numeric(10,2),
    "status" "text" DEFAULT 'pending'::"text",
    "approval_comment" "text",
    "approved_by" "uuid",
    "approved_at" timestamp with time zone,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "employee_onboarding_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text", 'completed'::"text"])))
);


--
-- Name: employee_performance; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."employee_performance" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "period_year" integer NOT NULL,
    "period_month" integer NOT NULL,
    "overall_score" numeric(3,1) NOT NULL,
    "service_score" numeric(3,1),
    "efficiency_score" numeric(3,1),
    "teamwork_score" numeric(3,1),
    "attendance_score" numeric(3,1),
    "rank_in_store" integer,
    "rank_in_company" integer,
    "evaluator_id" "uuid",
    "evaluation_notes" "text",
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "employee_performance_attendance_score_check" CHECK ((("attendance_score" >= (0)::numeric) AND ("attendance_score" <= (5)::numeric))),
    CONSTRAINT "employee_performance_efficiency_score_check" CHECK ((("efficiency_score" >= (0)::numeric) AND ("efficiency_score" <= (5)::numeric))),
    CONSTRAINT "employee_performance_overall_score_check" CHECK ((("overall_score" >= (0)::numeric) AND ("overall_score" <= (5)::numeric))),
    CONSTRAINT "employee_performance_service_score_check" CHECK ((("service_score" >= (0)::numeric) AND ("service_score" <= (5)::numeric))),
    CONSTRAINT "employee_performance_teamwork_score_check" CHECK ((("teamwork_score" >= (0)::numeric) AND ("teamwork_score" <= (5)::numeric)))
);


--
-- Name: employee_positions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."employee_positions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "position_id" "uuid" NOT NULL,
    "is_primary" boolean DEFAULT true,
    "effective_date" "date" NOT NULL,
    "expiry_date" "date",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


--
-- Name: employee_resignation; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."employee_resignation" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "store_id" "uuid" NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "resignation_type" "text" NOT NULL,
    "resignation_reason" "text" NOT NULL,
    "resignation_date" "date" NOT NULL,
    "last_working_day" "date" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text",
    "approval_comment" "text",
    "approved_by" "uuid",
    "approved_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "employee_resignation_resignation_type_check" CHECK (("resignation_type" = ANY (ARRAY['voluntary'::"text", 'involuntary'::"text", 'contract_end'::"text"]))),
    CONSTRAINT "employee_resignation_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text", 'completed'::"text"])))
);


--
-- Name: employee_shifts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."employee_shifts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "store_id" "uuid",
    "shift_date" "date" NOT NULL,
    "shift_type" "public"."shift_type" NOT NULL,
    "start_time" time without time zone,
    "end_time" time without time zone,
    "work_hours" numeric(4,2) DEFAULT 0,
    "position" "text",
    "status" "public"."shift_status" DEFAULT 'scheduled'::"public"."shift_status",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


--
-- Name: employee_work_info; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."employee_work_info" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "current_position" "text",
    "work_status" "text" DEFAULT 'active'::"text",
    "entry_date" "date",
    "department" "text",
    "skill_level" integer DEFAULT 0,
    "service_score" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "employee_work_info_service_score_check" CHECK ((("service_score" >= 0) AND ("service_score" <= 100))),
    CONSTRAINT "employee_work_info_skill_level_check" CHECK ((("skill_level" >= 0) AND ("skill_level" <= 100))),
    CONSTRAINT "employee_work_info_work_status_check" CHECK (("work_status" = ANY (ARRAY['active'::"text", 'on_leave'::"text", 'resigned'::"text"])))
);


--
-- Name: TABLE "employee_work_info"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE "public"."employee_work_info" IS '员工工作信息表';


--
-- Name: COLUMN "employee_work_info"."current_position"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."employee_work_info"."current_position" IS '当前岗位';


--
-- Name: COLUMN "employee_work_info"."work_status"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."employee_work_info"."work_status" IS '工作状态：active-在职, on_leave-休假, resigned-离职';


--
-- Name: COLUMN "employee_work_info"."skill_level"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."employee_work_info"."skill_level" IS '技能等级（0-100）';


--
-- Name: COLUMN "employee_work_info"."service_score"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."employee_work_info"."service_score" IS '服务评分（0-100）';


--
-- Name: employees; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."employees" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "store_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "name" "text" NOT NULL,
    "phone" "text",
    "employee_type" "text" DEFAULT 'full_time'::"text",
    "position" "text",
    "status" "text" DEFAULT 'active'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "department" "public"."department_type" DEFAULT 'front_hall'::"public"."department_type" NOT NULL,
    "monthly_salary" numeric(10,2),
    "daily_work_hours" numeric(4,2) DEFAULT 8.00,
    "is_core_position" boolean DEFAULT false,
    "position_fixed_backup" boolean DEFAULT false,
    "can_backup_positions" "text"[] DEFAULT '{}'::"text"[],
    "rest_days_per_month" integer DEFAULT 4,
    "brand_id" "uuid",
    "department_id" "uuid",
    CONSTRAINT "check_can_backup_positions_not_empty" CHECK ((("can_backup_positions" IS NULL) OR (NOT (''::"text" = ANY ("can_backup_positions")))))
);


--
-- Name: COLUMN "employees"."department"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."employees"."department" IS '员工部门：front_hall=前厅, kitchen=后厨';


--
-- Name: COLUMN "employees"."monthly_salary"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."employees"."monthly_salary" IS '月薪（元），用于计算人力成本，正式工必填';


--
-- Name: COLUMN "employees"."daily_work_hours"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."employees"."daily_work_hours" IS '每日工作小时数，默认8小时，仅正式工使用';


--
-- Name: COLUMN "employees"."is_core_position"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."employees"."is_core_position" IS '是否核心岗位，核心岗位需要特殊排班处理';


--
-- Name: COLUMN "employees"."position_fixed_backup"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."employees"."position_fixed_backup" IS '岗位是否需要固定顶岗，需要时必须配置顶岗人员';


--
-- Name: COLUMN "employees"."can_backup_positions"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."employees"."can_backup_positions" IS '可以顶岗的岗位列表，记录该员工可以顶岗的其他岗位名称';


--
-- Name: COLUMN "employees"."rest_days_per_month"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."employees"."rest_days_per_month" IS '月公休天数，默认4天，用于计算日薪';


--
-- Name: COLUMN "employees"."department_id"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."employees"."department_id" IS '部门ID（关联departments表）';


--
-- Name: exit_interview; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."exit_interview" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "resignation_id" "uuid" NOT NULL,
    "interview_date" "date" NOT NULL,
    "interviewer_id" "uuid",
    "satisfaction_rating" integer,
    "leaving_reason_detail" "text",
    "company_feedback" "text",
    "improvement_suggestions" "text",
    "would_recommend" boolean,
    "would_return" boolean,
    "interview_notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "exit_interview_satisfaction_rating_check" CHECK ((("satisfaction_rating" >= 1) AND ("satisfaction_rating" <= 5)))
);


--
-- Name: exit_interviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."exit_interviews" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "resignation_id" "uuid",
    "interviewer_id" "uuid",
    "interview_date" "date",
    "satisfaction_score" integer,
    "feedback" "text",
    "suggestions" "text",
    "would_recommend" boolean,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "exit_interviews_score_check" CHECK ((("satisfaction_score" >= 1) AND ("satisfaction_score" <= 5)))
);


--
-- Name: handbook_reading_progress; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."handbook_reading_progress" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "section_id" "text" NOT NULL,
    "is_read" boolean DEFAULT false,
    "read_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


--
-- Name: TABLE "handbook_reading_progress"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE "public"."handbook_reading_progress" IS '手册阅读进度表';


--
-- Name: help_article_feedback; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."help_article_feedback" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "article_id" "text" NOT NULL,
    "is_helpful" boolean NOT NULL,
    "feedback_text" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


--
-- Name: TABLE "help_article_feedback"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE "public"."help_article_feedback" IS '帮助文章反馈表';


--
-- Name: hr_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."hr_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "message" "text" NOT NULL,
    "images" "text"[],
    "status" "text" DEFAULT 'pending'::"text",
    "reply" "text",
    "replied_by" "uuid",
    "replied_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "hr_messages_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'replied'::"text", 'closed'::"text"])))
);


--
-- Name: TABLE "hr_messages"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE "public"."hr_messages" IS 'HR留言表';


--
-- Name: impact_factors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."impact_factors" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "factor_type" "text" NOT NULL,
    "factor_name" "text" NOT NULL,
    "factor_category" "text",
    "impact_value" numeric(5,4) NOT NULL,
    "confidence" numeric(4,3) DEFAULT 1.0,
    "effective_date" "date" NOT NULL,
    "expiration_date" "date",
    "data_source" "text" NOT NULL,
    "source_details" "jsonb",
    "description" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "impact_factors_confidence_check" CHECK ((("confidence" >= (0)::numeric) AND ("confidence" <= (1)::numeric))),
    CONSTRAINT "impact_factors_data_source_check" CHECK (("data_source" = ANY (ARRAY['auto'::"text", 'manual'::"text", 'api'::"text"]))),
    CONSTRAINT "impact_factors_factor_type_check" CHECK (("factor_type" = ANY (ARRAY['weather'::"text", 'holiday'::"text", 'event'::"text", 'marketing'::"text", 'competition'::"text", 'internal'::"text"]))),
    CONSTRAINT "impact_factors_impact_value_check" CHECK ((("impact_value" >= '-1.0'::numeric) AND ("impact_value" <= 1.0))),
    CONSTRAINT "valid_date_range" CHECK ((("expiration_date" IS NULL) OR ("expiration_date" >= "effective_date")))
);


--
-- Name: TABLE "impact_factors"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE "public"."impact_factors" IS '影响因子表已初始化测试数据';


--
-- Name: interviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."interviews" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "candidate_id" "uuid",
    "interviewer_id" "uuid",
    "interview_date" timestamp with time zone,
    "interview_type" "text",
    "feedback" "text",
    "score" integer,
    "result" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "interviews_result_check" CHECK (("result" = ANY (ARRAY['pass'::"text", 'fail'::"text", 'pending'::"text"]))),
    CONSTRAINT "interviews_score_check" CHECK ((("score" >= 0) AND ("score" <= 100)))
);


--
-- Name: invitation_code_uses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."invitation_code_uses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "invitation_code_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "used_at" timestamp with time zone DEFAULT "now"()
);


--
-- Name: TABLE "invitation_code_uses"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE "public"."invitation_code_uses" IS '邀请码使用记录表';


--
-- Name: invitation_codes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."invitation_codes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "store_id" "uuid",
    "code" "text" NOT NULL,
    "role" "public"."user_role" DEFAULT 'employee'::"public"."user_role" NOT NULL,
    "max_uses" integer DEFAULT 1,
    "used_count" integer DEFAULT 0,
    "expires_at" timestamp with time zone NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "status" "text" DEFAULT 'active'::"text",
    CONSTRAINT "valid_max_uses" CHECK (("max_uses" > 0)),
    CONSTRAINT "valid_used_count" CHECK ((("used_count" >= 0) AND ("used_count" <= "max_uses")))
);


--
-- Name: TABLE "invitation_codes"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE "public"."invitation_codes" IS '邀请码表，用于员工加入租户';


--
-- Name: COLUMN "invitation_codes"."code"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."invitation_codes"."code" IS '邀请码，格式：6位大写字母和数字';


--
-- Name: COLUMN "invitation_codes"."role"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."invitation_codes"."role" IS '加入后的角色';


--
-- Name: COLUMN "invitation_codes"."max_uses"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."invitation_codes"."max_uses" IS '最大使用次数';


--
-- Name: COLUMN "invitation_codes"."used_count"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."invitation_codes"."used_count" IS '已使用次数';


--
-- Name: COLUMN "invitation_codes"."expires_at"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."invitation_codes"."expires_at" IS '过期时间';


--
-- Name: learning_achievements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."learning_achievements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "achievement_type" "text" NOT NULL,
    "achievement_name" "text" NOT NULL,
    "achievement_icon" "text",
    "earned_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"()
);


--
-- Name: TABLE "learning_achievements"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE "public"."learning_achievements" IS '学习成就表';


--
-- Name: leave_balances; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."leave_balances" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "leave_type_id" "uuid" NOT NULL,
    "year" integer NOT NULL,
    "total_days" numeric(5,1) DEFAULT 0 NOT NULL,
    "used_days" numeric(5,1) DEFAULT 0 NOT NULL,
    "remaining_days" numeric(5,1) DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


--
-- Name: leave_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."leave_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "store_id" "uuid" NOT NULL,
    "leave_type" "text" NOT NULL,
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "days" numeric(10,2) NOT NULL,
    "reason" "text",
    "within_rules" boolean DEFAULT false NOT NULL,
    "rule_id" "uuid",
    "current_month_days" numeric(10,2) DEFAULT 0,
    "rule_max_days" numeric(10,2),
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "approver_id" "uuid",
    "approval_comment" "text",
    "approved_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "leave_requests_days_check" CHECK (("days" > (0)::numeric)),
    CONSTRAINT "leave_requests_leave_type_check" CHECK (("leave_type" = ANY (ARRAY['annual_leave'::"text", 'sick_leave'::"text", 'personal_leave'::"text", 'other'::"text"]))),
    CONSTRAINT "leave_requests_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text", 'cancelled'::"text"]))),
    CONSTRAINT "valid_date_range" CHECK (("end_date" >= "start_date"))
);


--
-- Name: TABLE "leave_requests"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE "public"."leave_requests" IS '休假申请表';


--
-- Name: COLUMN "leave_requests"."leave_type"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."leave_requests"."leave_type" IS '休假类型: annual_leave(年假), sick_leave(病假), personal_leave(事假), other(其他)';


--
-- Name: COLUMN "leave_requests"."within_rules"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."leave_requests"."within_rules" IS '是否在休假规则范围内';


--
-- Name: COLUMN "leave_requests"."status"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."leave_requests"."status" IS '状态: pending(待审批), approved(已批准), rejected(已拒绝), cancelled(已取消)';


--
-- Name: leave_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."leave_types" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "type_name" "text" NOT NULL,
    "type_code" "text" NOT NULL,
    "description" "text",
    "max_days_per_year" integer,
    "requires_approval" boolean DEFAULT true,
    "is_paid" boolean DEFAULT true,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


--
-- Name: meal_periods; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."meal_periods" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "store_id" "uuid",
    "period_name" "text" NOT NULL,
    "period_order" integer DEFAULT 0 NOT NULL,
    "start_time" time without time zone,
    "end_time" time without time zone,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


--
-- Name: TABLE "meal_periods"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE "public"."meal_periods" IS '餐段配置表（RLS已启用，允许所有认证用户访问）';


--
-- Name: min_revenue_position_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."min_revenue_position_config" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "store_id" "uuid",
    "position_name" "text" NOT NULL,
    "min_count" integer DEFAULT 1 NOT NULL,
    "priority" integer DEFAULT 0,
    "responsibilities" "text",
    "is_required" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


--
-- Name: min_revenue_positions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."min_revenue_positions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "store_id" "uuid" NOT NULL,
    "min_revenue" numeric(12,2) NOT NULL,
    "scenario_name" "text" NOT NULL,
    "required_positions" "jsonb" NOT NULL,
    "description" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


--
-- Name: TABLE "min_revenue_positions"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE "public"."min_revenue_positions" IS '最低营收岗位配置表';


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" "public"."notification_type" NOT NULL,
    "title" "text" NOT NULL,
    "content" "text" NOT NULL,
    "related_id" "uuid",
    "related_type" "text",
    "is_read" boolean DEFAULT false,
    "read_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"()
);


--
-- Name: offboarding_applications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."offboarding_applications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "application_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "expected_leave_date" "date" NOT NULL,
    "resignation_type" "text" NOT NULL,
    "resignation_reason" "text" NOT NULL,
    "detailed_reason" "text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "submitted_at" timestamp with time zone DEFAULT "now"(),
    "approved_by" "uuid",
    "approved_at" timestamp with time zone,
    "actual_leave_date" "date",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


--
-- Name: offboarding_handovers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."offboarding_handovers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "application_id" "uuid" NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "handover_to" "uuid" NOT NULL,
    "handover_type" "text" NOT NULL,
    "handover_item" "text" NOT NULL,
    "handover_description" "text",
    "handover_date" "date",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "completed_at" timestamp with time zone,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


--
-- Name: offboarding_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."offboarding_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "application_id" "uuid",
    "employee_name" "text" NOT NULL,
    "position" "text" NOT NULL,
    "department" "text" NOT NULL,
    "store_id" "uuid",
    "join_date" "date" NOT NULL,
    "leave_date" "date" NOT NULL,
    "tenure_months" integer,
    "resignation_type" "text" NOT NULL,
    "resignation_reason" "text" NOT NULL,
    "final_salary" numeric(10,2),
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


--
-- Name: offboarding_interviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."offboarding_interviews" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "application_id" "uuid" NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "interviewer_id" "uuid" NOT NULL,
    "interview_date" "date" NOT NULL,
    "interview_duration" integer,
    "satisfaction_score" integer,
    "would_recommend" boolean,
    "would_return" boolean,
    "feedback" "text",
    "suggestions" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "offboarding_interviews_interview_duration_check" CHECK (("interview_duration" >= 0)),
    CONSTRAINT "offboarding_interviews_satisfaction_score_check" CHECK ((("satisfaction_score" >= 1) AND ("satisfaction_score" <= 5)))
);


--
-- Name: offboarding_tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."offboarding_tasks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "application_id" "uuid" NOT NULL,
    "task_name" "text" NOT NULL,
    "task_description" "text",
    "task_type" "text" NOT NULL,
    "assigned_to" "uuid",
    "due_date" "date",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "completed_at" timestamp with time zone,
    "completed_by" "uuid",
    "priority" "text" DEFAULT 'medium'::"text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


--
-- Name: onboarding_applications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."onboarding_applications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "candidate_name" "text" NOT NULL,
    "candidate_phone" "text" NOT NULL,
    "candidate_email" "text",
    "position" "text" NOT NULL,
    "department" "text" NOT NULL,
    "store_id" "uuid",
    "expected_start_date" "date" NOT NULL,
    "salary" numeric(10,2),
    "application_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "submitted_by" "uuid",
    "approved_by" "uuid",
    "approved_at" timestamp with time zone,
    "employee_id" "uuid",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


--
-- Name: onboarding_documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."onboarding_documents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "application_id" "uuid" NOT NULL,
    "document_name" "text" NOT NULL,
    "document_type" "text" NOT NULL,
    "document_url" "text",
    "file_size" integer,
    "uploaded_by" "uuid",
    "uploaded_at" timestamp with time zone DEFAULT "now"(),
    "is_required" boolean DEFAULT false,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "verified_by" "uuid",
    "verified_at" timestamp with time zone,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "file_url" "text",
    "file_type" "text",
    "file_name" "text"
);


--
-- Name: COLUMN "onboarding_documents"."file_size"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."onboarding_documents"."file_size" IS '文件大小（字节）';


--
-- Name: COLUMN "onboarding_documents"."uploaded_at"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."onboarding_documents"."uploaded_at" IS '上传时间';


--
-- Name: COLUMN "onboarding_documents"."file_url"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."onboarding_documents"."file_url" IS '文档文件URL（Supabase Storage路径）';


--
-- Name: COLUMN "onboarding_documents"."file_type"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."onboarding_documents"."file_type" IS '文件类型（image/jpeg, image/png, application/pdf）';


--
-- Name: COLUMN "onboarding_documents"."file_name"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."onboarding_documents"."file_name" IS '原始文件名';


--
-- Name: onboarding_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."onboarding_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "application_id" "uuid",
    "candidate_name" "text" NOT NULL,
    "position" "text" NOT NULL,
    "department" "text" NOT NULL,
    "store_id" "uuid",
    "start_date" "date" NOT NULL,
    "onboarding_date" "date" NOT NULL,
    "completion_date" "date",
    "onboarding_duration_days" integer,
    "status" "text" DEFAULT 'in_progress'::"text" NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


--
-- Name: onboarding_processes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."onboarding_processes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "process_name" "text" NOT NULL,
    "description" "text",
    "position_type" "text",
    "department" "text",
    "duration_days" integer DEFAULT 7 NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "onboarding_processes_duration_days_check" CHECK (("duration_days" > 0))
);


--
-- Name: onboarding_tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."onboarding_tasks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "application_id" "uuid" NOT NULL,
    "process_id" "uuid",
    "task_name" "text" NOT NULL,
    "task_description" "text",
    "task_type" "text" NOT NULL,
    "assigned_to" "uuid",
    "due_date" "date",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "completed_at" timestamp with time zone,
    "completed_by" "uuid",
    "priority" "text" DEFAULT 'medium'::"text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


--
-- Name: operation_adjustments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."operation_adjustments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "store_id" "uuid" NOT NULL,
    "operation_date" "date" NOT NULL,
    "adjustment_time" timestamp with time zone DEFAULT "now"() NOT NULL,
    "adjustment_period" "text" NOT NULL,
    "before_estimated_revenue" numeric(10,2) NOT NULL,
    "before_staff_count" integer NOT NULL,
    "after_estimated_revenue" numeric(10,2) NOT NULL,
    "after_staff_count" integer NOT NULL,
    "adjustment_reason" "text" NOT NULL,
    "adjusted_by" "uuid",
    "adjusted_by_name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "operation_adjustments_adjustment_period_check" CHECK (("adjustment_period" = ANY (ARRAY['after_breakfast'::"text", 'after_lunch'::"text", 'after_dinner'::"text"])))
);


--
-- Name: TABLE "operation_adjustments"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE "public"."operation_adjustments" IS '营业调整记录表，记录排班规划后的所有调整操作';


--
-- Name: COLUMN "operation_adjustments"."adjustment_period"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."operation_adjustments"."adjustment_period" IS '调整时段：after_breakfast(早餐后)、after_lunch(午餐后)、after_dinner(晚餐后)';


--
-- Name: COLUMN "operation_adjustments"."adjustment_reason"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."operation_adjustments"."adjustment_reason" IS '调整原因，必填字段，用于记录为什么要进行调整';


--
-- Name: operations_data; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."operations_data" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "store_id" "uuid",
    "data_date" "date" NOT NULL,
    "total_schedules" integer DEFAULT 0,
    "completed_schedules" integer DEFAULT 0,
    "excellent_schedules" integer DEFAULT 0,
    "delayed_schedules" integer DEFAULT 0,
    "avg_duration_minutes" integer DEFAULT 0,
    "participation_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


--
-- Name: overtime_compensations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."overtime_compensations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "overtime_request_id" "uuid" NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "compensation_type" "text" NOT NULL,
    "hours" numeric(4,2) NOT NULL,
    "amount" numeric(10,2),
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "used_at" timestamp with time zone,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "overtime_compensations_hours_check" CHECK (("hours" > (0)::numeric))
);


--
-- Name: overtime_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."overtime_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "overtime_type_id" "uuid" NOT NULL,
    "overtime_date" "date" NOT NULL,
    "start_time" time without time zone NOT NULL,
    "end_time" time without time zone NOT NULL,
    "hours" numeric(4,2) NOT NULL,
    "reason" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "approver_id" "uuid",
    "approved_at" timestamp with time zone,
    "approval_notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "overtime_requests_check" CHECK (("end_time" > "start_time")),
    CONSTRAINT "overtime_requests_hours_check" CHECK (("hours" > (0)::numeric))
);


--
-- Name: overtime_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."overtime_types" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "type_name" "text" NOT NULL,
    "type_code" "text" NOT NULL,
    "description" "text",
    "rate" numeric(3,2) DEFAULT 1.5 NOT NULL,
    "can_compensate" boolean DEFAULT true,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


--
-- Name: part_time_records; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."part_time_records" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "schedule_plan_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "phone" "text",
    "work_hours" numeric(5,2) DEFAULT 0,
    "hourly_rate" numeric(10,2) DEFAULT 0,
    "total_cost" numeric(10,2) DEFAULT 0,
    "work_date" "date" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


--
-- Name: part_time_shifts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."part_time_shifts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "store_id" "uuid" NOT NULL,
    "operation_date" "date" NOT NULL,
    "employee_name" "text" NOT NULL,
    "work_hours" numeric NOT NULL,
    "hourly_rate" numeric NOT NULL,
    "total_cost" numeric NOT NULL,
    "meal_period" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "phone" "text",
    CONSTRAINT "part_time_shifts_hourly_rate_check" CHECK (("hourly_rate" > (0)::numeric)),
    CONSTRAINT "part_time_shifts_total_cost_check" CHECK (("total_cost" >= (0)::numeric)),
    CONSTRAINT "part_time_shifts_work_hours_check" CHECK (("work_hours" > (0)::numeric))
);


--
-- Name: COLUMN "part_time_shifts"."phone"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."part_time_shifts"."phone" IS '兼职员工联系电话';


--
-- Name: performance_goals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."performance_goals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "goal_title" "text" NOT NULL,
    "goal_description" "text",
    "goal_type" "text" NOT NULL,
    "target_value" numeric,
    "current_value" numeric DEFAULT 0,
    "unit" "text",
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "status" "text" DEFAULT 'in_progress'::"text" NOT NULL,
    "completion_rate" integer DEFAULT 0,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "performance_goals_completion_rate_check" CHECK ((("completion_rate" >= 0) AND ("completion_rate" <= 100)))
);


--
-- Name: performance_improvements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."performance_improvements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "performance_id" "uuid",
    "improvement_area" "text" NOT NULL,
    "current_situation" "text",
    "improvement_plan" "text" NOT NULL,
    "expected_result" "text",
    "deadline" "date",
    "status" "text" DEFAULT 'planning'::"text" NOT NULL,
    "progress" integer DEFAULT 0,
    "mentor_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "performance_improvements_progress_check" CHECK ((("progress" >= 0) AND ("progress" <= 100)))
);


--
-- Name: position_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."position_config" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "position_name" "text" NOT NULL,
    "position_category" "text" NOT NULL,
    "is_core" boolean DEFAULT false,
    "display_order" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "position_config_position_category_check" CHECK (("position_category" = ANY (ARRAY['front'::"text", 'kitchen'::"text"])))
);


--
-- Name: TABLE "position_config"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE "public"."position_config" IS '岗位配置表：存储可选的岗位列表';


--
-- Name: position_module_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."position_module_permissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "position_id" "uuid" NOT NULL,
    "module_id" "uuid" NOT NULL,
    "can_view" boolean DEFAULT false,
    "can_create" boolean DEFAULT false,
    "can_edit" boolean DEFAULT false,
    "can_delete" boolean DEFAULT false,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


--
-- Name: positions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."positions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "position_name" "text" NOT NULL,
    "position_level" integer NOT NULL,
    "description" "text",
    "sort_order" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "positions_position_level_check" CHECK ((("position_level" >= 1) AND ("position_level" <= 3)))
);


--
-- Name: probation_conversion_applications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."probation_conversion_applications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "probation_id" "uuid" NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "application_date" "date" NOT NULL,
    "self_evaluation" "text" NOT NULL,
    "work_summary" "text" NOT NULL,
    "future_plan" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "review_notes" "text",
    "reviewed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "probation_conversion_applications_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text"])))
);


--
-- Name: probation_evaluation; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."probation_evaluation" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "evaluation_date" "date" NOT NULL,
    "work_attitude_score" integer,
    "work_ability_score" integer,
    "team_cooperation_score" integer,
    "overall_score" integer,
    "evaluation_content" "text",
    "improvement_suggestions" "text",
    "evaluator_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "probation_evaluation_overall_score_check" CHECK ((("overall_score" >= 1) AND ("overall_score" <= 5))),
    CONSTRAINT "probation_evaluation_team_cooperation_score_check" CHECK ((("team_cooperation_score" >= 1) AND ("team_cooperation_score" <= 5))),
    CONSTRAINT "probation_evaluation_work_ability_score_check" CHECK ((("work_ability_score" >= 1) AND ("work_ability_score" <= 5))),
    CONSTRAINT "probation_evaluation_work_attitude_score_check" CHECK ((("work_attitude_score" >= 1) AND ("work_attitude_score" <= 5)))
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "tenant_id" "uuid",
    "phone" "text",
    "email" "text",
    "wechat_id" "text",
    "name" "text",
    "avatar_url" "text",
    "role" "public"."user_role" DEFAULT 'employee'::"public"."user_role" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "salary" numeric(10,2),
    "employment_type" "public"."employment_type" DEFAULT 'full_time'::"public"."employment_type",
    "daily_work_hours" numeric(4,2) DEFAULT 8.00,
    "wechat_openid" "text",
    "wechat_unionid" "text",
    "wechat_nickname" "text",
    "wechat_avatar" "text"
);


--
-- Name: COLUMN "profiles"."salary"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."profiles"."salary" IS '月薪（元），用于计算人力成本';


--
-- Name: COLUMN "profiles"."employment_type"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."profiles"."employment_type" IS '雇佣类型：full_time=正式工，part_time=兼职工';


--
-- Name: COLUMN "profiles"."daily_work_hours"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."profiles"."daily_work_hours" IS '每日工作小时数，默认8小时（仅正式工使用）';


--
-- Name: COLUMN "profiles"."wechat_openid"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."profiles"."wechat_openid" IS '微信小程序 openid，用于微信登录';


--
-- Name: COLUMN "profiles"."wechat_unionid"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."profiles"."wechat_unionid" IS '微信开放平台 unionid，用于跨应用识别';


--
-- Name: COLUMN "profiles"."wechat_nickname"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."profiles"."wechat_nickname" IS '微信昵称';


--
-- Name: COLUMN "profiles"."wechat_avatar"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."profiles"."wechat_avatar" IS '微信头像URL';


--
-- Name: promotion_applications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."promotion_applications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "promotion_path_id" "uuid" NOT NULL,
    "current_position" "text" NOT NULL,
    "target_position" "text" NOT NULL,
    "current_level" integer NOT NULL,
    "target_level" integer NOT NULL,
    "application_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "reason" "text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "submitted_at" timestamp with time zone DEFAULT "now"(),
    "reviewed_at" timestamp with time zone,
    "approved_at" timestamp with time zone,
    "effective_date" "date",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "promotion_applications_check" CHECK (("target_level" > "current_level"))
);


--
-- Name: promotion_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."promotion_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "application_id" "uuid",
    "from_position" "text" NOT NULL,
    "to_position" "text" NOT NULL,
    "from_level" integer NOT NULL,
    "to_level" integer NOT NULL,
    "promotion_date" "date" NOT NULL,
    "promotion_type" "text" DEFAULT 'regular'::"text" NOT NULL,
    "salary_increase" numeric(10,2),
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "promotion_history_check" CHECK (("to_level" > "from_level"))
);


--
-- Name: promotion_paths; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."promotion_paths" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "from_position" "text" NOT NULL,
    "to_position" "text" NOT NULL,
    "from_level" integer NOT NULL,
    "to_level" integer NOT NULL,
    "min_tenure_months" integer DEFAULT 12 NOT NULL,
    "description" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "promotion_paths_check" CHECK (("to_level" > "from_level")),
    CONSTRAINT "promotion_paths_min_tenure_months_check" CHECK (("min_tenure_months" >= 0))
);


--
-- Name: promotion_requirements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."promotion_requirements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "promotion_path_id" "uuid" NOT NULL,
    "requirement_type" "text" NOT NULL,
    "requirement_name" "text" NOT NULL,
    "requirement_value" "text" NOT NULL,
    "description" "text",
    "is_mandatory" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


--
-- Name: promotion_reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."promotion_reviews" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "application_id" "uuid" NOT NULL,
    "reviewer_id" "uuid" NOT NULL,
    "review_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "review_result" "text" NOT NULL,
    "review_score" integer,
    "review_comments" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "promotion_reviews_review_score_check" CHECK ((("review_score" >= 0) AND ("review_score" <= 100)))
);


--
-- Name: recruitment_positions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."recruitment_positions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "department" "text",
    "description" "text",
    "requirements" "text",
    "salary_range" "text",
    "status" "text" DEFAULT 'open'::"text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "recruitment_positions_status_check" CHECK (("status" = ANY (ARRAY['open'::"text", 'closed'::"text"])))
);


--
-- Name: regularization_application; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."regularization_application" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "application_date" "date" NOT NULL,
    "expected_regularization_date" "date" NOT NULL,
    "self_evaluation" "text",
    "work_summary" "text",
    "status" "text" DEFAULT 'pending'::"text",
    "approval_comment" "text",
    "approved_by" "uuid",
    "approved_at" timestamp with time zone,
    "actual_regularization_date" "date",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "regularization_application_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text"])))
);


--
-- Name: resignation_handover; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."resignation_handover" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "resignation_id" "uuid" NOT NULL,
    "handover_item" "text" NOT NULL,
    "handover_to_id" "uuid",
    "handover_status" "text" DEFAULT 'pending'::"text",
    "handover_date" "date",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "resignation_handover_handover_status_check" CHECK (("handover_status" = ANY (ARRAY['pending'::"text", 'in_progress'::"text", 'completed'::"text"])))
);


--
-- Name: resignation_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."resignation_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "reason_type" "text",
    "reason_detail" "text",
    "resignation_date" "date",
    "last_working_day" "date",
    "status" "text" DEFAULT 'pending'::"text",
    "approved_by" "uuid",
    "approved_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "resignation_requests_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text", 'completed'::"text"])))
);


--
-- Name: rest_day_rules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."rest_day_rules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "store_id" "uuid" NOT NULL,
    "rule_name" "text" NOT NULL,
    "monthly_rest_days" integer DEFAULT 4 NOT NULL,
    "blocked_dates" "jsonb" DEFAULT '[]'::"jsonb",
    "max_specific_date_requests" integer DEFAULT 2,
    "allow_rest_accumulation" boolean DEFAULT false,
    "max_accumulated_days" integer DEFAULT 0,
    "allow_consecutive_rest" boolean DEFAULT true,
    "max_consecutive_days" integer DEFAULT 2,
    "is_active" boolean DEFAULT true,
    "applicable_employees" "jsonb" DEFAULT '[]'::"jsonb",
    "priority" integer DEFAULT 0,
    "description" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "backup_rules" "jsonb" DEFAULT '[]'::"jsonb",
    "enable_backup_check" boolean DEFAULT false
);


--
-- Name: TABLE "rest_day_rules"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE "public"."rest_day_rules" IS '排休规则配置表';


--
-- Name: COLUMN "rest_day_rules"."rule_name"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."rest_day_rules"."rule_name" IS '规则名称';


--
-- Name: COLUMN "rest_day_rules"."monthly_rest_days"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."rest_day_rules"."monthly_rest_days" IS '每月休息天数';


--
-- Name: COLUMN "rest_day_rules"."blocked_dates"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."rest_day_rules"."blocked_dates" IS '不可排休时间（JSON数组）';


--
-- Name: COLUMN "rest_day_rules"."max_specific_date_requests"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."rest_day_rules"."max_specific_date_requests" IS '每月最多可以申请特定日子休息天数';


--
-- Name: COLUMN "rest_day_rules"."allow_rest_accumulation"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."rest_day_rules"."allow_rest_accumulation" IS '是否可以存休';


--
-- Name: COLUMN "rest_day_rules"."max_accumulated_days"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."rest_day_rules"."max_accumulated_days" IS '最大存休天数';


--
-- Name: COLUMN "rest_day_rules"."allow_consecutive_rest"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."rest_day_rules"."allow_consecutive_rest" IS '是否允许连休';


--
-- Name: COLUMN "rest_day_rules"."max_consecutive_days"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."rest_day_rules"."max_consecutive_days" IS '最多连休天数';


--
-- Name: COLUMN "rest_day_rules"."is_active"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."rest_day_rules"."is_active" IS '是否启用';


--
-- Name: COLUMN "rest_day_rules"."applicable_employees"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."rest_day_rules"."applicable_employees" IS '适用员工（JSON数组）';


--
-- Name: COLUMN "rest_day_rules"."priority"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."rest_day_rules"."priority" IS '优先级（数字越大优先级越高）';


--
-- Name: COLUMN "rest_day_rules"."backup_rules"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."rest_day_rules"."backup_rules" IS '顶岗规则配置，JSON数组格式，包含核心岗位和顶岗人员的映射关系';


--
-- Name: COLUMN "rest_day_rules"."enable_backup_check"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."rest_day_rules"."enable_backup_check" IS '是否启用顶岗检查，true表示在排休时检查核心岗位与顶岗人员不可同休';


--
-- Name: revenue_adjustment_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."revenue_adjustment_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "calendar_id" "uuid" NOT NULL,
    "daily_detail_id" "uuid",
    "adjustment_type" "text" NOT NULL,
    "adjustment_scope" "text",
    "old_value" numeric(12,2),
    "new_value" numeric(12,2),
    "adjustment_reason" "text",
    "impact_factors" "jsonb",
    "adjusted_by" "uuid",
    "adjusted_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "revenue_adjustment_log_adjustment_type_check" CHECK (("adjustment_type" = ANY (ARRAY['total'::"text", 'daily'::"text", 'meal'::"text"])))
);


--
-- Name: revenue_calendar; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."revenue_calendar" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "store_id" "uuid" NOT NULL,
    "calendar_month" "text" NOT NULL,
    "total_revenue_target" numeric(12,2) DEFAULT 0,
    "predicted_total_revenue" numeric(12,2) DEFAULT 0,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "generated_by" "text" DEFAULT 'auto'::"text" NOT NULL,
    "confirmed_at" timestamp with time zone,
    "confirmed_by" "uuid",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "revenue_calendar_generated_by_check" CHECK (("generated_by" = ANY (ARRAY['auto'::"text", 'manual'::"text"]))),
    CONSTRAINT "revenue_calendar_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'confirmed'::"text", 'locked'::"text"])))
);


--
-- Name: revenue_detail_records; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."revenue_detail_records" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "store_id" "uuid" NOT NULL,
    "revenue_date" "date" NOT NULL,
    "meal_period" "text" NOT NULL,
    "business_area" "text" NOT NULL,
    "customer_count" integer DEFAULT 0 NOT NULL,
    "avg_price_per_customer" numeric(10,2) DEFAULT 0 NOT NULL,
    "total_revenue" numeric(12,2) DEFAULT 0 NOT NULL,
    "notes" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "revenue_detail_records_avg_price_per_customer_check" CHECK (("avg_price_per_customer" >= (0)::numeric)),
    CONSTRAINT "revenue_detail_records_business_area_check" CHECK (("business_area" = ANY (ARRAY['hall'::"text", 'private_room'::"text", 'takeout'::"text", 'other'::"text"]))),
    CONSTRAINT "revenue_detail_records_customer_count_check" CHECK (("customer_count" >= 0)),
    CONSTRAINT "revenue_detail_records_meal_period_check" CHECK (("meal_period" = ANY (ARRAY['breakfast'::"text", 'lunch'::"text", 'dinner'::"text", 'night'::"text"]))),
    CONSTRAINT "revenue_detail_records_total_revenue_check" CHECK (("total_revenue" >= (0)::numeric))
);


--
-- Name: TABLE "revenue_detail_records"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE "public"."revenue_detail_records" IS '营收明细记录表：支持细化到天、餐段、经营区的营收数据';


--
-- Name: COLUMN "revenue_detail_records"."meal_period"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."revenue_detail_records"."meal_period" IS '餐段：breakfast=早餐, lunch=午餐, dinner=晚餐, night=夜宵';


--
-- Name: COLUMN "revenue_detail_records"."business_area"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."revenue_detail_records"."business_area" IS '经营区：hall=大厅, private_room=包间, takeout=外卖, other=其他';


--
-- Name: COLUMN "revenue_detail_records"."customer_count"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."revenue_detail_records"."customer_count" IS '来客数';


--
-- Name: COLUMN "revenue_detail_records"."avg_price_per_customer"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."revenue_detail_records"."avg_price_per_customer" IS '客单价';


--
-- Name: COLUMN "revenue_detail_records"."total_revenue"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."revenue_detail_records"."total_revenue" IS '总营收（自动计算：来客数 × 客单价）';


--
-- Name: revenue_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."revenue_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "store_id" "uuid" NOT NULL,
    "revenue_date" "date" NOT NULL,
    "revenue_amount" numeric(12,2) NOT NULL,
    "customer_count" integer,
    "staff_count" integer,
    "working_hours" numeric(8,2),
    "labor_cost" numeric(12,2),
    "data_source" "text" DEFAULT 'import'::"text",
    "import_batch_id" "uuid",
    "notes" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "revenue_history_data_source_check" CHECK (("data_source" = ANY (ARRAY['import'::"text", 'manual'::"text", 'system'::"text"])))
);


--
-- Name: TABLE "revenue_history"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE "public"."revenue_history" IS '历史营收数据表';


--
-- Name: revenue_impact_factors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."revenue_impact_factors" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "store_id" "uuid" NOT NULL,
    "factor_type" "text" NOT NULL,
    "factor_name" "text" NOT NULL,
    "factor_value" "text",
    "impact_rate" numeric(5,2) DEFAULT 0,
    "description" "text",
    "is_active" boolean DEFAULT true,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "revenue_impact_factors_factor_type_check" CHECK (("factor_type" = ANY (ARRAY['weather'::"text", 'holiday'::"text", 'promotion'::"text", 'event'::"text"])))
);


--
-- Name: revenue_import_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."revenue_import_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "store_id" "uuid",
    "import_date" "date" NOT NULL,
    "file_name" "text" NOT NULL,
    "total_records" integer DEFAULT 0 NOT NULL,
    "success_records" integer DEFAULT 0 NOT NULL,
    "failed_records" integer DEFAULT 0 NOT NULL,
    "error_details" "jsonb",
    "imported_by" "uuid",
    "imported_at" timestamp with time zone DEFAULT "now"()
);


--
-- Name: TABLE "revenue_import_logs"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE "public"."revenue_import_logs" IS 'Excel导入记录表：记录营收数据导入历史';


--
-- Name: revenue_predictions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."revenue_predictions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "store_id" "uuid",
    "prediction_type" "text" NOT NULL,
    "target_period" "date" NOT NULL,
    "conservative_value" numeric(12,2) NOT NULL,
    "baseline_value" numeric(12,2) NOT NULL,
    "optimistic_value" numeric(12,2) NOT NULL,
    "confidence" numeric(4,3) NOT NULL,
    "applied_factors" "jsonb",
    "actual_value" numeric(12,2),
    "accuracy_rate" numeric(5,2),
    "model_version" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "revenue_predictions_confidence_check" CHECK ((("confidence" >= (0)::numeric) AND ("confidence" <= (1)::numeric))),
    CONSTRAINT "revenue_predictions_prediction_type_check" CHECK (("prediction_type" = ANY (ARRAY['monthly'::"text", 'daily'::"text"])))
);


--
-- Name: TABLE "revenue_predictions"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE "public"."revenue_predictions" IS '营收预测表已初始化测试数据';


--
-- Name: risk_alerts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."risk_alerts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "store_id" "uuid",
    "risk_type" "text" NOT NULL,
    "risk_level" "text" NOT NULL,
    "risk_category" "text" NOT NULL,
    "risk_title" "text" NOT NULL,
    "risk_description" "text",
    "risk_impact" "jsonb",
    "recommendations" "jsonb",
    "status" "text" DEFAULT 'active'::"text",
    "acknowledged_at" timestamp with time zone,
    "acknowledged_by" "uuid",
    "resolved_at" timestamp with time zone,
    "resolution_notes" "text",
    "detected_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "risk_alerts_risk_level_check" CHECK (("risk_level" = ANY (ARRAY['high'::"text", 'medium'::"text", 'low'::"text"]))),
    CONSTRAINT "risk_alerts_risk_type_check" CHECK (("risk_type" = ANY (ARRAY['personnel'::"text", 'cost'::"text", 'operation'::"text"]))),
    CONSTRAINT "risk_alerts_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'acknowledged'::"text", 'resolved'::"text", 'ignored'::"text"])))
);


--
-- Name: TABLE "risk_alerts"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE "public"."risk_alerts" IS '风险预警表已初始化测试数据';


--
-- Name: role_module_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."role_module_permissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "role" "text" NOT NULL,
    "module_id" "uuid" NOT NULL,
    "can_view" boolean DEFAULT false,
    "can_create" boolean DEFAULT false,
    "can_edit" boolean DEFAULT false,
    "can_delete" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "role_module_permissions_role_check" CHECK (("role" = ANY (ARRAY['super_admin'::"text", 'tenant_admin'::"text", 'store_manager'::"text", 'employee'::"text", 'guest'::"text"])))
);


--
-- Name: salary_records; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."salary_records" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "salary_structure_id" "uuid",
    "year" integer NOT NULL,
    "month" integer NOT NULL,
    "base_salary" numeric(10,2) DEFAULT 0 NOT NULL,
    "performance_salary" numeric(10,2) DEFAULT 0,
    "allowances" numeric(10,2) DEFAULT 0,
    "overtime_pay" numeric(10,2) DEFAULT 0,
    "bonus" numeric(10,2) DEFAULT 0,
    "deductions" numeric(10,2) DEFAULT 0,
    "social_insurance" numeric(10,2) DEFAULT 0,
    "housing_fund" numeric(10,2) DEFAULT 0,
    "tax" numeric(10,2) DEFAULT 0,
    "net_salary" numeric(10,2) DEFAULT 0 NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "paid_at" timestamp with time zone,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "salary_records_month_check" CHECK ((("month" >= 1) AND ("month" <= 12))),
    CONSTRAINT "salary_records_year_check" CHECK ((("year" >= 2000) AND ("year" <= 2100)))
);


--
-- Name: salary_structures; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."salary_structures" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "base_salary" numeric(10,2) DEFAULT 0 NOT NULL,
    "performance_salary" numeric(10,2) DEFAULT 0,
    "position_allowance" numeric(10,2) DEFAULT 0,
    "meal_allowance" numeric(10,2) DEFAULT 0,
    "transport_allowance" numeric(10,2) DEFAULT 0,
    "housing_allowance" numeric(10,2) DEFAULT 0,
    "other_allowance" numeric(10,2) DEFAULT 0,
    "effective_date" "date" NOT NULL,
    "end_date" "date",
    "is_active" boolean DEFAULT true,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "salary_structures_base_salary_check" CHECK (("base_salary" >= (0)::numeric))
);


--
-- Name: schedule_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."schedule_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "schedule_id" "uuid" NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "store_id" "uuid" NOT NULL,
    "log_date" "date" NOT NULL,
    "completion_status" "text",
    "completion_time" timestamp with time zone,
    "score" integer,
    "duration_minutes" integer,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "schedule_logs_score_check" CHECK ((("score" >= 0) AND ("score" <= 100)))
);


--
-- Name: schedule_plan_periods; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."schedule_plan_periods" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "schedule_plan_id" "uuid" NOT NULL,
    "period_name" "text" NOT NULL,
    "estimated_revenue" numeric(10,2) DEFAULT 0,
    "required_staff" integer DEFAULT 0,
    "confirmed_staff" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


--
-- Name: schedule_plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."schedule_plans" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "store_id" "uuid" NOT NULL,
    "plan_date" "date" NOT NULL,
    "total_estimated_revenue" numeric(10,2) DEFAULT 0,
    "total_required_staff" integer DEFAULT 0,
    "total_confirmed_staff" integer DEFAULT 0,
    "total_regular_staff" integer DEFAULT 0,
    "total_day_off_staff" integer DEFAULT 0,
    "total_working_staff" integer DEFAULT 0,
    "total_part_time_staff" integer DEFAULT 0,
    "total_salary" numeric(10,2) DEFAULT 0,
    "is_reasonable" boolean DEFAULT true,
    "status" "text" DEFAULT 'draft'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


--
-- Name: schedule_results; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."schedule_results" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "store_id" "uuid" NOT NULL,
    "operation_date" "date" NOT NULL,
    "estimated_revenue" numeric NOT NULL,
    "target_staff_count" integer NOT NULL,
    "planned_staff_count" integer NOT NULL,
    "rest_staff_count" numeric(10,2) NOT NULL,
    "part_time_count" integer DEFAULT 0,
    "part_time_hours" numeric DEFAULT 0,
    "achievement_rate" numeric NOT NULL,
    "total_labor_cost" numeric NOT NULL,
    "labor_cost_rate" numeric NOT NULL,
    "is_cost_qualified" boolean NOT NULL,
    "efficiency_zone" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "rest_days" numeric DEFAULT 0,
    "adjustment_type" "text" DEFAULT '首次规划'::"text",
    "adjustment_reason" "text",
    "previous_result_id" "uuid",
    "adjustment_details" "jsonb",
    "adjusted_by" "uuid",
    "is_latest" boolean DEFAULT true,
    CONSTRAINT "schedule_results_estimated_revenue_check" CHECK (("estimated_revenue" >= (0)::numeric)),
    CONSTRAINT "schedule_results_part_time_count_check" CHECK (("part_time_count" >= 0)),
    CONSTRAINT "schedule_results_part_time_hours_check" CHECK (("part_time_hours" >= (0)::numeric)),
    CONSTRAINT "schedule_results_planned_staff_count_check" CHECK (("planned_staff_count" >= 0)),
    CONSTRAINT "schedule_results_rest_days_check" CHECK (("rest_days" >= (0)::numeric)),
    CONSTRAINT "schedule_results_rest_staff_count_check" CHECK (("rest_staff_count" >= (0)::numeric)),
    CONSTRAINT "schedule_results_target_staff_count_check" CHECK (("target_staff_count" > 0)),
    CONSTRAINT "schedule_results_total_labor_cost_check" CHECK (("total_labor_cost" >= (0)::numeric))
);


--
-- Name: COLUMN "schedule_results"."rest_days"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."schedule_results"."rest_days" IS '排休总天数（例如：4小时=0.5天，8小时=1天）';


--
-- Name: schedules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."schedules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "store_id" "uuid" NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "schedule_date" "date" NOT NULL,
    "shift_type" "text",
    "start_time" time without time zone,
    "end_time" time without time zone,
    "status" "text" DEFAULT 'pending'::"text",
    "notes" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "is_day_off" boolean DEFAULT false,
    "meal_period" "text" DEFAULT 'all_day'::"text",
    "rest_hours" numeric(5,2) DEFAULT 0
);


--
-- Name: COLUMN "schedules"."is_day_off"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."schedules"."is_day_off" IS '是否为排休记录：true=排休，false=排班';


--
-- Name: COLUMN "schedules"."meal_period"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."schedules"."meal_period" IS '排休餐段：all_day(全天)/breakfast(早餐)/lunch(午餐)/dinner(晚餐)';


--
-- Name: COLUMN "schedules"."rest_hours"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."schedules"."rest_hours" IS '排休小时数';


--
-- Name: scheduling_optimizations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."scheduling_optimizations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "schedule_id" "uuid" NOT NULL,
    "optimization_type" "text" NOT NULL,
    "trigger_reason" "text",
    "before_data" "jsonb" NOT NULL,
    "after_data" "jsonb" NOT NULL,
    "improvements" "jsonb",
    "objectives" "jsonb",
    "weights" "jsonb",
    "cost_impact" numeric(10,2),
    "efficiency_impact" numeric(8,2),
    "satisfaction_impact" numeric(4,2),
    "status" "text" DEFAULT 'pending'::"text",
    "applied_at" timestamp with time zone,
    "applied_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "scheduling_optimizations_optimization_type_check" CHECK (("optimization_type" = ANY (ARRAY['initial'::"text", 'adjustment'::"text", 'emergency'::"text"]))),
    CONSTRAINT "scheduling_optimizations_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'applied'::"text", 'rejected'::"text"])))
);


--
-- Name: TABLE "scheduling_optimizations"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE "public"."scheduling_optimizations" IS '排班优化记录表 - 存储排班优化的历史记录';


--
-- Name: shift_swap_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."shift_swap_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "requester_id" "uuid" NOT NULL,
    "requester_shift_id" "uuid" NOT NULL,
    "target_id" "uuid" NOT NULL,
    "target_shift_id" "uuid" NOT NULL,
    "reason" "text" NOT NULL,
    "status" "public"."swap_request_status" DEFAULT 'pending'::"public"."swap_request_status" NOT NULL,
    "reviewed_by" "uuid",
    "reviewed_at" timestamp with time zone,
    "review_notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "shift_swap_requests_check" CHECK (("requester_id" <> "target_id")),
    CONSTRAINT "shift_swap_requests_check1" CHECK (("requester_shift_id" <> "target_shift_id"))
);


--
-- Name: staff_transfers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."staff_transfers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "from_store_id" "uuid" NOT NULL,
    "to_store_id" "uuid" NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "transfer_date" "date" NOT NULL,
    "transfer_hours" numeric(4,2) NOT NULL,
    "reason" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text",
    "cost" numeric(10,2),
    "approved_by" "uuid",
    "approved_at" timestamp with time zone,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "different_stores" CHECK (("from_store_id" <> "to_store_id")),
    CONSTRAINT "staff_transfers_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text", 'completed'::"text"])))
);


--
-- Name: TABLE "staff_transfers"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE "public"."staff_transfers" IS '人员调配记录表 - 存储跨店人员调配记录';


--
-- Name: store_hierarchy; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."store_hierarchy" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "store_id" "uuid" NOT NULL,
    "scheduling_principle" "text" NOT NULL,
    "hierarchy_data" "jsonb",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "store_hierarchy_scheduling_principle_check" CHECK (("scheduling_principle" = ANY (ARRAY['top_only'::"text", 'top_and_down'::"text"])))
);


--
-- Name: TABLE "store_hierarchy"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE "public"."store_hierarchy" IS '门店组织架构配置表';


--
-- Name: store_organization; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."store_organization" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "store_id" "uuid" NOT NULL,
    "position_id" "uuid" NOT NULL,
    "parent_position_id" "uuid",
    "position_level" integer NOT NULL,
    "required_count" integer DEFAULT 1,
    "sort_order" integer DEFAULT 0,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "store_organization_position_level_check" CHECK ((("position_level" >= 1) AND ("position_level" <= 3))),
    CONSTRAINT "store_organization_required_count_check" CHECK (("required_count" > 0))
);


--
-- Name: store_position_assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."store_position_assignments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "store_id" "uuid" NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "is_primary" boolean DEFAULT true,
    "effective_date" "date" NOT NULL,
    "expiry_date" "date",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


--
-- Name: stores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."stores" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "address" "text",
    "manager_id" "uuid",
    "status" "text" DEFAULT 'active'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "brand_id" "uuid"
);


--
-- Name: system_modules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."system_modules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "module_key" "text" NOT NULL,
    "module_name" "text" NOT NULL,
    "module_description" "text",
    "parent_module_id" "uuid",
    "icon" "text",
    "route_path" "text",
    "sort_order" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


--
-- Name: tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."tasks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "priority" "text" DEFAULT 'medium'::"text",
    "status" "text" DEFAULT 'pending'::"text",
    "due_date" "date",
    "completed_at" timestamp with time zone,
    "created_by" "uuid" NOT NULL,
    "assigned_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "tasks_priority_check" CHECK (("priority" = ANY (ARRAY['high'::"text", 'medium'::"text", 'low'::"text"]))),
    CONSTRAINT "tasks_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'in_progress'::"text", 'completed'::"text", 'cancelled'::"text"])))
);


--
-- Name: TABLE "tasks"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE "public"."tasks" IS '任务表';


--
-- Name: COLUMN "tasks"."title"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."tasks"."title" IS '任务标题';


--
-- Name: COLUMN "tasks"."description"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."tasks"."description" IS '任务描述';


--
-- Name: COLUMN "tasks"."priority"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."tasks"."priority" IS '优先级：high-高, medium-中, low-低';


--
-- Name: COLUMN "tasks"."status"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."tasks"."status" IS '状态：pending-待开始, in_progress-进行中, completed-已完成, cancelled-已取消';


--
-- Name: COLUMN "tasks"."due_date"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."tasks"."due_date" IS '截止日期';


--
-- Name: COLUMN "tasks"."completed_at"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."tasks"."completed_at" IS '完成时间';


--
-- Name: COLUMN "tasks"."created_by"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."tasks"."created_by" IS '创建者ID';


--
-- Name: COLUMN "tasks"."assigned_by"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."tasks"."assigned_by" IS '分配者ID';


--
-- Name: tenant_applications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."tenant_applications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "applicant_id" "uuid",
    "applicant_phone" "text" NOT NULL,
    "tenant_name" "text" NOT NULL,
    "industry" "text" NOT NULL,
    "company_address" "text" NOT NULL,
    "business_license" "text",
    "contact_person" "text" NOT NULL,
    "contact_phone" "text" NOT NULL,
    "description" "text",
    "status" "text" DEFAULT 'pending'::"text",
    "rejection_reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "reviewed_by" "uuid",
    "reviewed_at" timestamp with time zone,
    "brand_name" "text" NOT NULL,
    CONSTRAINT "tenant_applications_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text"])))
);


--
-- Name: COLUMN "tenant_applications"."brand_name"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."tenant_applications"."brand_name" IS '品牌名称，审核通过后自动填充到租户配置';


--
-- Name: tenant_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."tenant_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "default_daily_work_hours" numeric(4,2) DEFAULT 8.00 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "brand_name" "text",
    "industry" "text",
    "contact_person" "text",
    "contact_phone" "text",
    "contact_email" "text",
    "logo_url" "text",
    "description" "text",
    "default_monthly_work_days" numeric(4,2) DEFAULT 26.00 NOT NULL,
    "default_part_time_hourly_rate" numeric(6,2) DEFAULT 20.00 NOT NULL,
    "cost_warning_threshold" numeric(4,2) DEFAULT 0.35 NOT NULL,
    "efficiency_warning_threshold" numeric(4,2) DEFAULT 0.80 NOT NULL
);


--
-- Name: TABLE "tenant_settings"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE "public"."tenant_settings" IS '租户配置表';


--
-- Name: COLUMN "tenant_settings"."default_daily_work_hours"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."tenant_settings"."default_daily_work_hours" IS '默认每日工作小时数，用于正式工工时计算';


--
-- Name: COLUMN "tenant_settings"."brand_name"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."tenant_settings"."brand_name" IS '品牌名称，从租户申请中自动填充';


--
-- Name: COLUMN "tenant_settings"."default_monthly_work_days"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."tenant_settings"."default_monthly_work_days" IS '默认每月工作天数，用于计算日薪';


--
-- Name: COLUMN "tenant_settings"."default_part_time_hourly_rate"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."tenant_settings"."default_part_time_hourly_rate" IS '默认兼职时薪（元/小时）';


--
-- Name: COLUMN "tenant_settings"."cost_warning_threshold"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."tenant_settings"."cost_warning_threshold" IS '成本预警阈值（如0.35表示35%）';


--
-- Name: COLUMN "tenant_settings"."efficiency_warning_threshold"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."tenant_settings"."efficiency_warning_threshold" IS '效率预警阈值（如0.8表示80%）';


--
-- Name: tenants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."tenants" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "industry" "text",
    "package_type" "text" DEFAULT 'basic'::"text",
    "status" "text" DEFAULT 'active'::"text",
    "store_count" integer DEFAULT 0,
    "employee_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "contact_person" "text",
    "contact_phone" "text",
    "invitation_code_used" boolean DEFAULT false,
    "invitation_code" "text",
    "admin_phone" "text",
    "is_demo" boolean DEFAULT false
);


--
-- Name: COLUMN "tenants"."contact_person"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."tenants"."contact_person" IS '联系人姓名';


--
-- Name: COLUMN "tenants"."contact_phone"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."tenants"."contact_phone" IS '联系电话';


--
-- Name: COLUMN "tenants"."invitation_code_used"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."tenants"."invitation_code_used" IS '邀请码是否已使用（用于管理员首次登录）';


--
-- Name: COLUMN "tenants"."invitation_code"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."tenants"."invitation_code" IS '租户管理员邀请码（8位大写字母+数字）';


--
-- Name: COLUMN "tenants"."admin_phone"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."tenants"."admin_phone" IS '租户管理员电话号码';


--
-- Name: COLUMN "tenants"."is_demo"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."tenants"."is_demo" IS '是否为测试餐厅';


--
-- Name: training_courses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."training_courses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "category" "public"."training_category" DEFAULT 'other'::"public"."training_category" NOT NULL,
    "duration_hours" numeric(5,2) DEFAULT 1.0 NOT NULL,
    "instructor" "text",
    "max_participants" integer,
    "status" "public"."course_status" DEFAULT 'draft'::"public"."course_status" NOT NULL,
    "cover_image" "text",
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


--
-- Name: training_exams; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."training_exams" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "course_id" "uuid" NOT NULL,
    "record_id" "uuid" NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "exam_date" "date" NOT NULL,
    "score" numeric(5,2) NOT NULL,
    "pass_score" numeric(5,2) DEFAULT 60.0 NOT NULL,
    "status" "public"."exam_status" DEFAULT 'pending'::"public"."exam_status" NOT NULL,
    "examiner" "uuid",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


--
-- Name: training_records; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."training_records" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "course_id" "uuid" NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "status" "public"."training_status" DEFAULT 'enrolled'::"public"."training_status" NOT NULL,
    "enrolled_at" timestamp with time zone DEFAULT "now"(),
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "progress" integer DEFAULT 0,
    "score" numeric(5,2),
    "feedback" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "training_records_progress_check" CHECK ((("progress" >= 0) AND ("progress" <= 100)))
);


--
-- Name: transfer_applications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."transfer_applications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "transfer_position_id" "uuid" NOT NULL,
    "current_position" "text" NOT NULL,
    "current_department" "text" NOT NULL,
    "current_store_id" "uuid",
    "target_position" "text" NOT NULL,
    "target_department" "text" NOT NULL,
    "target_store_id" "uuid",
    "application_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "reason" "text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "submitted_at" timestamp with time zone DEFAULT "now"(),
    "reviewed_at" timestamp with time zone,
    "approved_at" timestamp with time zone,
    "effective_date" "date",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


--
-- Name: transfer_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."transfer_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "application_id" "uuid",
    "from_position" "text" NOT NULL,
    "to_position" "text" NOT NULL,
    "from_department" "text" NOT NULL,
    "to_department" "text" NOT NULL,
    "from_store_id" "uuid",
    "to_store_id" "uuid",
    "transfer_date" "date" NOT NULL,
    "transfer_type" "text" DEFAULT 'regular'::"text" NOT NULL,
    "salary_change" numeric(10,2),
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


--
-- Name: transfer_positions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."transfer_positions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "store_id" "uuid",
    "position_name" "text" NOT NULL,
    "department" "text" NOT NULL,
    "level" integer NOT NULL,
    "description" "text",
    "requirements" "text",
    "available_slots" integer DEFAULT 1 NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "transfer_positions_available_slots_check" CHECK (("available_slots" >= 0))
);


--
-- Name: transfer_requirements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."transfer_requirements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "transfer_position_id" "uuid" NOT NULL,
    "requirement_type" "text" NOT NULL,
    "requirement_name" "text" NOT NULL,
    "requirement_value" "text" NOT NULL,
    "description" "text",
    "is_mandatory" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


--
-- Name: transfer_reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."transfer_reviews" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "application_id" "uuid" NOT NULL,
    "reviewer_id" "uuid" NOT NULL,
    "review_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "review_result" "text" NOT NULL,
    "review_score" integer,
    "review_comments" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "transfer_reviews_review_score_check" CHECK ((("review_score" >= 0) AND ("review_score" <= 100)))
);


--
-- Name: user_module_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."user_module_permissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "module_id" "uuid" NOT NULL,
    "can_view" boolean DEFAULT false,
    "can_create" boolean DEFAULT false,
    "can_edit" boolean DEFAULT false,
    "can_delete" boolean DEFAULT false,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


--
-- Name: work_attendance; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."work_attendance" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "store_id" "uuid",
    "date" "date" NOT NULL,
    "shift_type" "text",
    "clock_in_time" timestamp with time zone,
    "clock_out_time" timestamp with time zone,
    "status" "text" DEFAULT 'normal'::"text",
    "work_hours" numeric(4,2),
    "note" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "work_attendance_shift_type_check" CHECK (("shift_type" = ANY (ARRAY['early'::"text", 'middle'::"text", 'late'::"text"]))),
    CONSTRAINT "work_attendance_status_check" CHECK (("status" = ANY (ARRAY['normal'::"text", 'late'::"text", 'early_leave'::"text", 'absent'::"text"])))
);


--
-- Name: TABLE "work_attendance"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE "public"."work_attendance" IS '工作考勤表';


--
-- Name: COLUMN "work_attendance"."shift_type"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."work_attendance"."shift_type" IS '班次类型：early-早班, middle-中班, late-晚班';


--
-- Name: COLUMN "work_attendance"."status"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."work_attendance"."status" IS '考勤状态：normal-正常, late-迟到, early_leave-早退, absent-缺勤';


--
-- Name: COLUMN "work_attendance"."work_hours"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."work_attendance"."work_hours" IS '实际工作小时数';


--
-- Name: work_log_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."work_log_categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "icon" "text" NOT NULL,
    "color" "text" NOT NULL,
    "sort_order" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


--
-- Name: work_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."work_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "schedule_record_id" "uuid" NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "log_date" "date" NOT NULL,
    "work_content" "text" NOT NULL,
    "achievements" "text",
    "issues" "text",
    "suggestions" "text",
    "quality_score" integer,
    "efficiency_score" integer,
    "attitude_score" integer,
    "total_score" integer,
    "images" "text"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "work_logs_attitude_score_check" CHECK ((("attitude_score" >= 1) AND ("attitude_score" <= 5))),
    CONSTRAINT "work_logs_efficiency_score_check" CHECK ((("efficiency_score" >= 1) AND ("efficiency_score" <= 5))),
    CONSTRAINT "work_logs_quality_score_check" CHECK ((("quality_score" >= 1) AND ("quality_score" <= 5)))
);


--
-- Name: work_ratings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."work_ratings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "work_log_id" "uuid" NOT NULL,
    "rater_id" "uuid" NOT NULL,
    "rating_type" "public"."work_rating_type" NOT NULL,
    "quality_score" integer NOT NULL,
    "efficiency_score" integer NOT NULL,
    "attitude_score" integer NOT NULL,
    "total_score" integer NOT NULL,
    "comments" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "work_ratings_attitude_score_check" CHECK ((("attitude_score" >= 1) AND ("attitude_score" <= 5))),
    CONSTRAINT "work_ratings_efficiency_score_check" CHECK ((("efficiency_score" >= 1) AND ("efficiency_score" <= 5))),
    CONSTRAINT "work_ratings_quality_score_check" CHECK ((("quality_score" >= 1) AND ("quality_score" <= 5)))
);


--
-- Name: work_records; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."work_records" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "category_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "images" "text"[] DEFAULT '{}'::"text"[],
    "videos" "text"[] DEFAULT '{}'::"text"[],
    "voice_duration" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


--
-- Name: work_schedule_configs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."work_schedule_configs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "store_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "type" "public"."work_schedule_type" DEFAULT 'daily'::"public"."work_schedule_type" NOT NULL,
    "start_date" "date" NOT NULL,
    "end_date" "date",
    "status" "public"."work_schedule_status" DEFAULT 'draft'::"public"."work_schedule_status" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


--
-- Name: work_schedule_records; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."work_schedule_records" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "config_id" "uuid" NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "schedule_date" "date" NOT NULL,
    "shift_type" "public"."work_shift_type" NOT NULL,
    "start_time" time without time zone NOT NULL,
    "end_time" time without time zone NOT NULL,
    "status" "public"."work_record_status" DEFAULT 'pending'::"public"."work_record_status" NOT NULL,
    "actual_start_time" timestamp with time zone,
    "actual_end_time" timestamp with time zone,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


--
-- Name: work_shifts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."work_shifts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "store_id" "uuid",
    "shift_name" "text" NOT NULL,
    "shift_order" integer DEFAULT 0 NOT NULL,
    "start_time" time without time zone NOT NULL,
    "end_time" time without time zone NOT NULL,
    "work_hours" numeric(4,2) DEFAULT 8.00,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "time_periods" "jsonb"
);


--
-- Name: TABLE "work_shifts"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE "public"."work_shifts" IS '班次配置表（RLS已启用，允许所有认证用户访问）';


--
-- Name: COLUMN "work_shifts"."shift_name"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."work_shifts"."shift_name" IS '班次名称，如：早班、晚班、正常班';


--
-- Name: COLUMN "work_shifts"."time_periods"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN "public"."work_shifts"."time_periods" IS '多时间段配置，JSON格式：[{"start": "06:00", "end": "09:00"}]';


--
-- Name: agent_assignments agent_assignments_agent_id_store_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'agent_assignments_agent_id_store_id_key'
      AND n.nspname = 'public'
      AND c.relname = 'agent_assignments'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."agent_assignments"
    ADD CONSTRAINT "agent_assignments_agent_id_store_id_key" UNIQUE ("agent_id", "store_id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: agent_assignments agent_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'agent_assignments_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'agent_assignments'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."agent_assignments"
    ADD CONSTRAINT "agent_assignments_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: approval_logs approval_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'approval_logs_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'approval_logs'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."approval_logs"
    ADD CONSTRAINT "approval_logs_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: area_attendance_overview area_attendance_overview_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'area_attendance_overview_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'area_attendance_overview'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."area_attendance_overview"
    ADD CONSTRAINT "area_attendance_overview_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: area_daily_status area_daily_status_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'area_daily_status_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'area_daily_status'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."area_daily_status"
    ADD CONSTRAINT "area_daily_status_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: area_positions area_positions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'area_positions_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'area_positions'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."area_positions"
    ADD CONSTRAINT "area_positions_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: area_staff_assignments area_staff_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'area_staff_assignments_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'area_staff_assignments'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."area_staff_assignments"
    ADD CONSTRAINT "area_staff_assignments_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'audit_logs_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'audit_logs'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: backup_position_config backup_position_config_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'backup_position_config_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'backup_position_config'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."backup_position_config"
    ADD CONSTRAINT "backup_position_config_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: backup_position_config backup_position_config_store_id_primary_position_id_backup__key; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'backup_position_config_store_id_primary_position_id_backup__key'
      AND n.nspname = 'public'
      AND c.relname = 'backup_position_config'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."backup_position_config"
    ADD CONSTRAINT "backup_position_config_store_id_primary_position_id_backup__key" UNIQUE ("store_id", "primary_position_id", "backup_position_id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: benefit_types benefit_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'benefit_types_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'benefit_types'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."benefit_types"
    ADD CONSTRAINT "benefit_types_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: benefit_types benefit_types_tenant_id_type_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'benefit_types_tenant_id_type_code_key'
      AND n.nspname = 'public'
      AND c.relname = 'benefit_types'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."benefit_types"
    ADD CONSTRAINT "benefit_types_tenant_id_type_code_key" UNIQUE ("tenant_id", "type_code");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: benefit_usage_records benefit_usage_records_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'benefit_usage_records_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'benefit_usage_records'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."benefit_usage_records"
    ADD CONSTRAINT "benefit_usage_records_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: best_practices best_practices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'best_practices_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'best_practices'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."best_practices"
    ADD CONSTRAINT "best_practices_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: brands brands_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'brands_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'brands'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."brands"
    ADD CONSTRAINT "brands_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: business_area_config business_area_config_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'business_area_config_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'business_area_config'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."business_area_config"
    ADD CONSTRAINT "business_area_config_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: business_area_config business_area_config_tenant_id_store_id_area_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'business_area_config_tenant_id_store_id_area_name_key'
      AND n.nspname = 'public'
      AND c.relname = 'business_area_config'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."business_area_config"
    ADD CONSTRAINT "business_area_config_tenant_id_store_id_area_name_key" UNIQUE ("tenant_id", "store_id", "area_name");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: business_areas business_areas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'business_areas_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'business_areas'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."business_areas"
    ADD CONSTRAINT "business_areas_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: candidates candidates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'candidates_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'candidates'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."candidates"
    ADD CONSTRAINT "candidates_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: core_position_backup core_position_backup_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'core_position_backup_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'core_position_backup'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."core_position_backup"
    ADD CONSTRAINT "core_position_backup_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: cost_data cost_data_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'cost_data_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'cost_data'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."cost_data"
    ADD CONSTRAINT "cost_data_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: cost_data cost_data_tenant_id_store_id_data_date_key; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'cost_data_tenant_id_store_id_data_date_key'
      AND n.nspname = 'public'
      AND c.relname = 'cost_data'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."cost_data"
    ADD CONSTRAINT "cost_data_tenant_id_store_id_data_date_key" UNIQUE ("tenant_id", "store_id", "data_date");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: daily_operations daily_operations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'daily_operations_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'daily_operations'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."daily_operations"
    ADD CONSTRAINT "daily_operations_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: daily_operations daily_operations_tenant_id_store_id_operation_date_key; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'daily_operations_tenant_id_store_id_operation_date_key'
      AND n.nspname = 'public'
      AND c.relname = 'daily_operations'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."daily_operations"
    ADD CONSTRAINT "daily_operations_tenant_id_store_id_operation_date_key" UNIQUE ("tenant_id", "store_id", "operation_date");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: daily_revenue_detail daily_revenue_detail_calendar_id_revenue_date_key; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'daily_revenue_detail_calendar_id_revenue_date_key'
      AND n.nspname = 'public'
      AND c.relname = 'daily_revenue_detail'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."daily_revenue_detail"
    ADD CONSTRAINT "daily_revenue_detail_calendar_id_revenue_date_key" UNIQUE ("calendar_id", "revenue_date");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: daily_revenue_detail daily_revenue_detail_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'daily_revenue_detail_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'daily_revenue_detail'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."daily_revenue_detail"
    ADD CONSTRAINT "daily_revenue_detail_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: dashboard_alerts dashboard_alerts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'dashboard_alerts_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'dashboard_alerts'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."dashboard_alerts"
    ADD CONSTRAINT "dashboard_alerts_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: dashboard_quick_actions dashboard_quick_actions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'dashboard_quick_actions_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'dashboard_quick_actions'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."dashboard_quick_actions"
    ADD CONSTRAINT "dashboard_quick_actions_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: dashboard_widgets dashboard_widgets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'dashboard_widgets_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'dashboard_widgets'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."dashboard_widgets"
    ADD CONSTRAINT "dashboard_widgets_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: data_snapshots data_snapshots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'data_snapshots_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'data_snapshots'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."data_snapshots"
    ADD CONSTRAINT "data_snapshots_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: day_off_records day_off_records_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'day_off_records_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'day_off_records'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."day_off_records"
    ADD CONSTRAINT "day_off_records_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'departments_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'departments'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."departments"
    ADD CONSTRAINT "departments_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: efficiency_standards efficiency_standards_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'efficiency_standards_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'efficiency_standards'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."efficiency_standards"
    ADD CONSTRAINT "efficiency_standards_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: efficiency_standards efficiency_standards_tenant_id_store_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'efficiency_standards_tenant_id_store_id_key'
      AND n.nspname = 'public'
      AND c.relname = 'efficiency_standards'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."efficiency_standards"
    ADD CONSTRAINT "efficiency_standards_tenant_id_store_id_key" UNIQUE ("tenant_id", "store_id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: employee_benefits employee_benefits_employee_id_benefit_type_id_start_date_key; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'employee_benefits_employee_id_benefit_type_id_start_date_key'
      AND n.nspname = 'public'
      AND c.relname = 'employee_benefits'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."employee_benefits"
    ADD CONSTRAINT "employee_benefits_employee_id_benefit_type_id_start_date_key" UNIQUE ("employee_id", "benefit_type_id", "start_date");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: employee_benefits employee_benefits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'employee_benefits_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'employee_benefits'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."employee_benefits"
    ADD CONSTRAINT "employee_benefits_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: employee_certifications employee_certifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'employee_certifications_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'employee_certifications'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."employee_certifications"
    ADD CONSTRAINT "employee_certifications_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: employee_levels employee_levels_employee_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'employee_levels_employee_id_key'
      AND n.nspname = 'public'
      AND c.relname = 'employee_levels'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."employee_levels"
    ADD CONSTRAINT "employee_levels_employee_id_key" UNIQUE ("employee_id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: employee_levels employee_levels_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'employee_levels_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'employee_levels'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."employee_levels"
    ADD CONSTRAINT "employee_levels_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: employee_lifecycle_events employee_lifecycle_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'employee_lifecycle_events_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'employee_lifecycle_events'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."employee_lifecycle_events"
    ADD CONSTRAINT "employee_lifecycle_events_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: employee_onboarding employee_onboarding_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'employee_onboarding_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'employee_onboarding'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."employee_onboarding"
    ADD CONSTRAINT "employee_onboarding_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: employee_performance employee_performance_employee_id_period_year_period_month_key; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'employee_performance_employee_id_period_year_period_month_key'
      AND n.nspname = 'public'
      AND c.relname = 'employee_performance'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."employee_performance"
    ADD CONSTRAINT "employee_performance_employee_id_period_year_period_month_key" UNIQUE ("employee_id", "period_year", "period_month");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: employee_performance employee_performance_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'employee_performance_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'employee_performance'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."employee_performance"
    ADD CONSTRAINT "employee_performance_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: employee_positions employee_positions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'employee_positions_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'employee_positions'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."employee_positions"
    ADD CONSTRAINT "employee_positions_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: employee_resignation employee_resignation_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'employee_resignation_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'employee_resignation'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."employee_resignation"
    ADD CONSTRAINT "employee_resignation_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: employee_shifts employee_shifts_employee_id_shift_date_key; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'employee_shifts_employee_id_shift_date_key'
      AND n.nspname = 'public'
      AND c.relname = 'employee_shifts'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."employee_shifts"
    ADD CONSTRAINT "employee_shifts_employee_id_shift_date_key" UNIQUE ("employee_id", "shift_date");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: employee_shifts employee_shifts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'employee_shifts_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'employee_shifts'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."employee_shifts"
    ADD CONSTRAINT "employee_shifts_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: employee_work_info employee_work_info_employee_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'employee_work_info_employee_id_key'
      AND n.nspname = 'public'
      AND c.relname = 'employee_work_info'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."employee_work_info"
    ADD CONSTRAINT "employee_work_info_employee_id_key" UNIQUE ("employee_id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: employee_work_info employee_work_info_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'employee_work_info_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'employee_work_info'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."employee_work_info"
    ADD CONSTRAINT "employee_work_info_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: employees employees_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'employees_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'employees'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: exit_interview exit_interview_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'exit_interview_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'exit_interview'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."exit_interview"
    ADD CONSTRAINT "exit_interview_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: exit_interviews exit_interviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'exit_interviews_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'exit_interviews'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."exit_interviews"
    ADD CONSTRAINT "exit_interviews_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: handbook_reading_progress handbook_reading_progress_employee_id_section_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'handbook_reading_progress_employee_id_section_id_key'
      AND n.nspname = 'public'
      AND c.relname = 'handbook_reading_progress'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."handbook_reading_progress"
    ADD CONSTRAINT "handbook_reading_progress_employee_id_section_id_key" UNIQUE ("employee_id", "section_id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: handbook_reading_progress handbook_reading_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'handbook_reading_progress_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'handbook_reading_progress'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."handbook_reading_progress"
    ADD CONSTRAINT "handbook_reading_progress_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: help_article_feedback help_article_feedback_employee_id_article_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'help_article_feedback_employee_id_article_id_key'
      AND n.nspname = 'public'
      AND c.relname = 'help_article_feedback'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."help_article_feedback"
    ADD CONSTRAINT "help_article_feedback_employee_id_article_id_key" UNIQUE ("employee_id", "article_id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: help_article_feedback help_article_feedback_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'help_article_feedback_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'help_article_feedback'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."help_article_feedback"
    ADD CONSTRAINT "help_article_feedback_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: hr_messages hr_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'hr_messages_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'hr_messages'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."hr_messages"
    ADD CONSTRAINT "hr_messages_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: impact_factors impact_factors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'impact_factors_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'impact_factors'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."impact_factors"
    ADD CONSTRAINT "impact_factors_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: interviews interviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'interviews_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'interviews'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."interviews"
    ADD CONSTRAINT "interviews_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: invitation_code_uses invitation_code_uses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'invitation_code_uses_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'invitation_code_uses'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."invitation_code_uses"
    ADD CONSTRAINT "invitation_code_uses_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: invitation_codes invitation_codes_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'invitation_codes_code_key'
      AND n.nspname = 'public'
      AND c.relname = 'invitation_codes'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."invitation_codes"
    ADD CONSTRAINT "invitation_codes_code_key" UNIQUE ("code");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: invitation_codes invitation_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'invitation_codes_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'invitation_codes'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."invitation_codes"
    ADD CONSTRAINT "invitation_codes_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: learning_achievements learning_achievements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'learning_achievements_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'learning_achievements'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."learning_achievements"
    ADD CONSTRAINT "learning_achievements_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: leave_balances leave_balances_employee_id_leave_type_id_year_key; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'leave_balances_employee_id_leave_type_id_year_key'
      AND n.nspname = 'public'
      AND c.relname = 'leave_balances'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."leave_balances"
    ADD CONSTRAINT "leave_balances_employee_id_leave_type_id_year_key" UNIQUE ("employee_id", "leave_type_id", "year");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: leave_balances leave_balances_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'leave_balances_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'leave_balances'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."leave_balances"
    ADD CONSTRAINT "leave_balances_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: leave_requests leave_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'leave_requests_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'leave_requests'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."leave_requests"
    ADD CONSTRAINT "leave_requests_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: leave_types leave_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'leave_types_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'leave_types'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."leave_types"
    ADD CONSTRAINT "leave_types_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: leave_types leave_types_tenant_id_type_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'leave_types_tenant_id_type_code_key'
      AND n.nspname = 'public'
      AND c.relname = 'leave_types'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."leave_types"
    ADD CONSTRAINT "leave_types_tenant_id_type_code_key" UNIQUE ("tenant_id", "type_code");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: meal_periods meal_periods_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'meal_periods_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'meal_periods'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."meal_periods"
    ADD CONSTRAINT "meal_periods_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: meal_periods meal_periods_tenant_id_store_id_period_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'meal_periods_tenant_id_store_id_period_name_key'
      AND n.nspname = 'public'
      AND c.relname = 'meal_periods'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."meal_periods"
    ADD CONSTRAINT "meal_periods_tenant_id_store_id_period_name_key" UNIQUE ("tenant_id", "store_id", "period_name");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: min_revenue_position_config min_revenue_position_config_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'min_revenue_position_config_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'min_revenue_position_config'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."min_revenue_position_config"
    ADD CONSTRAINT "min_revenue_position_config_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: min_revenue_position_config min_revenue_position_config_tenant_id_store_id_position_nam_key; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'min_revenue_position_config_tenant_id_store_id_position_nam_key'
      AND n.nspname = 'public'
      AND c.relname = 'min_revenue_position_config'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."min_revenue_position_config"
    ADD CONSTRAINT "min_revenue_position_config_tenant_id_store_id_position_nam_key" UNIQUE ("tenant_id", "store_id", "position_name");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: min_revenue_positions min_revenue_positions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'min_revenue_positions_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'min_revenue_positions'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."min_revenue_positions"
    ADD CONSTRAINT "min_revenue_positions_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'notifications_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'notifications'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: offboarding_applications offboarding_applications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'offboarding_applications_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'offboarding_applications'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."offboarding_applications"
    ADD CONSTRAINT "offboarding_applications_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: offboarding_handovers offboarding_handovers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'offboarding_handovers_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'offboarding_handovers'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."offboarding_handovers"
    ADD CONSTRAINT "offboarding_handovers_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: offboarding_history offboarding_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'offboarding_history_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'offboarding_history'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."offboarding_history"
    ADD CONSTRAINT "offboarding_history_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: offboarding_interviews offboarding_interviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'offboarding_interviews_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'offboarding_interviews'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."offboarding_interviews"
    ADD CONSTRAINT "offboarding_interviews_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: offboarding_tasks offboarding_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'offboarding_tasks_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'offboarding_tasks'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."offboarding_tasks"
    ADD CONSTRAINT "offboarding_tasks_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: onboarding_applications onboarding_applications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'onboarding_applications_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'onboarding_applications'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."onboarding_applications"
    ADD CONSTRAINT "onboarding_applications_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: onboarding_documents onboarding_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'onboarding_documents_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'onboarding_documents'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."onboarding_documents"
    ADD CONSTRAINT "onboarding_documents_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: onboarding_history onboarding_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'onboarding_history_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'onboarding_history'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."onboarding_history"
    ADD CONSTRAINT "onboarding_history_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: onboarding_processes onboarding_processes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'onboarding_processes_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'onboarding_processes'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."onboarding_processes"
    ADD CONSTRAINT "onboarding_processes_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: onboarding_tasks onboarding_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'onboarding_tasks_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'onboarding_tasks'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."onboarding_tasks"
    ADD CONSTRAINT "onboarding_tasks_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: operation_adjustments operation_adjustments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'operation_adjustments_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'operation_adjustments'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."operation_adjustments"
    ADD CONSTRAINT "operation_adjustments_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: operations_data operations_data_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'operations_data_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'operations_data'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."operations_data"
    ADD CONSTRAINT "operations_data_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: operations_data operations_data_tenant_id_store_id_data_date_key; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'operations_data_tenant_id_store_id_data_date_key'
      AND n.nspname = 'public'
      AND c.relname = 'operations_data'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."operations_data"
    ADD CONSTRAINT "operations_data_tenant_id_store_id_data_date_key" UNIQUE ("tenant_id", "store_id", "data_date");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: overtime_compensations overtime_compensations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'overtime_compensations_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'overtime_compensations'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."overtime_compensations"
    ADD CONSTRAINT "overtime_compensations_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: overtime_requests overtime_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'overtime_requests_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'overtime_requests'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."overtime_requests"
    ADD CONSTRAINT "overtime_requests_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: overtime_types overtime_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'overtime_types_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'overtime_types'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."overtime_types"
    ADD CONSTRAINT "overtime_types_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: overtime_types overtime_types_tenant_id_type_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'overtime_types_tenant_id_type_code_key'
      AND n.nspname = 'public'
      AND c.relname = 'overtime_types'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."overtime_types"
    ADD CONSTRAINT "overtime_types_tenant_id_type_code_key" UNIQUE ("tenant_id", "type_code");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: part_time_records part_time_records_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'part_time_records_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'part_time_records'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."part_time_records"
    ADD CONSTRAINT "part_time_records_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: part_time_shifts part_time_shifts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'part_time_shifts_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'part_time_shifts'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."part_time_shifts"
    ADD CONSTRAINT "part_time_shifts_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: performance_goals performance_goals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'performance_goals_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'performance_goals'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."performance_goals"
    ADD CONSTRAINT "performance_goals_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: performance_improvements performance_improvements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'performance_improvements_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'performance_improvements'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."performance_improvements"
    ADD CONSTRAINT "performance_improvements_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: position_config position_config_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'position_config_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'position_config'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."position_config"
    ADD CONSTRAINT "position_config_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: position_config position_config_tenant_id_position_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'position_config_tenant_id_position_name_key'
      AND n.nspname = 'public'
      AND c.relname = 'position_config'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."position_config"
    ADD CONSTRAINT "position_config_tenant_id_position_name_key" UNIQUE ("tenant_id", "position_name");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: position_module_permissions position_module_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'position_module_permissions_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'position_module_permissions'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."position_module_permissions"
    ADD CONSTRAINT "position_module_permissions_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: position_module_permissions position_module_permissions_position_id_module_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'position_module_permissions_position_id_module_id_key'
      AND n.nspname = 'public'
      AND c.relname = 'position_module_permissions'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."position_module_permissions"
    ADD CONSTRAINT "position_module_permissions_position_id_module_id_key" UNIQUE ("position_id", "module_id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: positions positions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'positions_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'positions'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."positions"
    ADD CONSTRAINT "positions_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: probation_conversion_applications probation_conversion_applications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'probation_conversion_applications_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'probation_conversion_applications'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."probation_conversion_applications"
    ADD CONSTRAINT "probation_conversion_applications_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: probation_evaluation probation_evaluation_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'probation_evaluation_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'probation_evaluation'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."probation_evaluation"
    ADD CONSTRAINT "probation_evaluation_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: profiles profiles_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'profiles_email_key'
      AND n.nspname = 'public'
      AND c.relname = 'profiles'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_email_key" UNIQUE ("email");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: profiles profiles_phone_key; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'profiles_phone_key'
      AND n.nspname = 'public'
      AND c.relname = 'profiles'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_phone_key" UNIQUE ("phone");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'profiles_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'profiles'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: profiles profiles_wechat_openid_key; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'profiles_wechat_openid_key'
      AND n.nspname = 'public'
      AND c.relname = 'profiles'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_wechat_openid_key" UNIQUE ("wechat_openid");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: profiles profiles_wechat_unionid_key; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'profiles_wechat_unionid_key'
      AND n.nspname = 'public'
      AND c.relname = 'profiles'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_wechat_unionid_key" UNIQUE ("wechat_unionid");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: promotion_applications promotion_applications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'promotion_applications_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'promotion_applications'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."promotion_applications"
    ADD CONSTRAINT "promotion_applications_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: promotion_history promotion_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'promotion_history_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'promotion_history'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."promotion_history"
    ADD CONSTRAINT "promotion_history_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: promotion_paths promotion_paths_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'promotion_paths_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'promotion_paths'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."promotion_paths"
    ADD CONSTRAINT "promotion_paths_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: promotion_paths promotion_paths_tenant_id_from_position_to_position_key; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'promotion_paths_tenant_id_from_position_to_position_key'
      AND n.nspname = 'public'
      AND c.relname = 'promotion_paths'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."promotion_paths"
    ADD CONSTRAINT "promotion_paths_tenant_id_from_position_to_position_key" UNIQUE ("tenant_id", "from_position", "to_position");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: promotion_requirements promotion_requirements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'promotion_requirements_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'promotion_requirements'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."promotion_requirements"
    ADD CONSTRAINT "promotion_requirements_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: promotion_reviews promotion_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'promotion_reviews_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'promotion_reviews'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."promotion_reviews"
    ADD CONSTRAINT "promotion_reviews_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: recruitment_positions recruitment_positions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'recruitment_positions_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'recruitment_positions'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."recruitment_positions"
    ADD CONSTRAINT "recruitment_positions_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: regularization_application regularization_application_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'regularization_application_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'regularization_application'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."regularization_application"
    ADD CONSTRAINT "regularization_application_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: resignation_handover resignation_handover_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'resignation_handover_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'resignation_handover'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."resignation_handover"
    ADD CONSTRAINT "resignation_handover_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: resignation_requests resignation_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'resignation_requests_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'resignation_requests'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."resignation_requests"
    ADD CONSTRAINT "resignation_requests_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: rest_day_rules rest_day_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'rest_day_rules_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'rest_day_rules'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."rest_day_rules"
    ADD CONSTRAINT "rest_day_rules_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: revenue_adjustment_log revenue_adjustment_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'revenue_adjustment_log_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'revenue_adjustment_log'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."revenue_adjustment_log"
    ADD CONSTRAINT "revenue_adjustment_log_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: revenue_calendar revenue_calendar_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'revenue_calendar_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'revenue_calendar'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."revenue_calendar"
    ADD CONSTRAINT "revenue_calendar_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: revenue_calendar revenue_calendar_tenant_id_store_id_calendar_month_key; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'revenue_calendar_tenant_id_store_id_calendar_month_key'
      AND n.nspname = 'public'
      AND c.relname = 'revenue_calendar'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."revenue_calendar"
    ADD CONSTRAINT "revenue_calendar_tenant_id_store_id_calendar_month_key" UNIQUE ("tenant_id", "store_id", "calendar_month");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: revenue_detail_records revenue_detail_records_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'revenue_detail_records_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'revenue_detail_records'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."revenue_detail_records"
    ADD CONSTRAINT "revenue_detail_records_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: revenue_detail_records revenue_detail_records_tenant_id_store_id_revenue_date_meal_key; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'revenue_detail_records_tenant_id_store_id_revenue_date_meal_key'
      AND n.nspname = 'public'
      AND c.relname = 'revenue_detail_records'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."revenue_detail_records"
    ADD CONSTRAINT "revenue_detail_records_tenant_id_store_id_revenue_date_meal_key" UNIQUE ("tenant_id", "store_id", "revenue_date", "meal_period", "business_area");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: revenue_history revenue_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'revenue_history_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'revenue_history'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."revenue_history"
    ADD CONSTRAINT "revenue_history_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: revenue_history revenue_history_store_id_revenue_date_key; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'revenue_history_store_id_revenue_date_key'
      AND n.nspname = 'public'
      AND c.relname = 'revenue_history'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."revenue_history"
    ADD CONSTRAINT "revenue_history_store_id_revenue_date_key" UNIQUE ("store_id", "revenue_date");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: revenue_impact_factors revenue_impact_factors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'revenue_impact_factors_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'revenue_impact_factors'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."revenue_impact_factors"
    ADD CONSTRAINT "revenue_impact_factors_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: revenue_import_logs revenue_import_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'revenue_import_logs_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'revenue_import_logs'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."revenue_import_logs"
    ADD CONSTRAINT "revenue_import_logs_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: revenue_predictions revenue_predictions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'revenue_predictions_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'revenue_predictions'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."revenue_predictions"
    ADD CONSTRAINT "revenue_predictions_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: risk_alerts risk_alerts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'risk_alerts_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'risk_alerts'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."risk_alerts"
    ADD CONSTRAINT "risk_alerts_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: role_module_permissions role_module_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'role_module_permissions_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'role_module_permissions'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."role_module_permissions"
    ADD CONSTRAINT "role_module_permissions_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: role_module_permissions role_module_permissions_role_module_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'role_module_permissions_role_module_id_key'
      AND n.nspname = 'public'
      AND c.relname = 'role_module_permissions'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."role_module_permissions"
    ADD CONSTRAINT "role_module_permissions_role_module_id_key" UNIQUE ("role", "module_id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: salary_records salary_records_employee_id_year_month_key; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'salary_records_employee_id_year_month_key'
      AND n.nspname = 'public'
      AND c.relname = 'salary_records'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."salary_records"
    ADD CONSTRAINT "salary_records_employee_id_year_month_key" UNIQUE ("employee_id", "year", "month");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: salary_records salary_records_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'salary_records_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'salary_records'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."salary_records"
    ADD CONSTRAINT "salary_records_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: salary_structures salary_structures_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'salary_structures_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'salary_structures'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."salary_structures"
    ADD CONSTRAINT "salary_structures_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: schedule_logs schedule_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'schedule_logs_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'schedule_logs'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."schedule_logs"
    ADD CONSTRAINT "schedule_logs_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: schedule_plan_periods schedule_plan_periods_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'schedule_plan_periods_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'schedule_plan_periods'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."schedule_plan_periods"
    ADD CONSTRAINT "schedule_plan_periods_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: schedule_plans schedule_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'schedule_plans_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'schedule_plans'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."schedule_plans"
    ADD CONSTRAINT "schedule_plans_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: schedule_plans schedule_plans_tenant_id_store_id_plan_date_key; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'schedule_plans_tenant_id_store_id_plan_date_key'
      AND n.nspname = 'public'
      AND c.relname = 'schedule_plans'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."schedule_plans"
    ADD CONSTRAINT "schedule_plans_tenant_id_store_id_plan_date_key" UNIQUE ("tenant_id", "store_id", "plan_date");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: schedule_results schedule_results_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'schedule_results_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'schedule_results'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."schedule_results"
    ADD CONSTRAINT "schedule_results_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: schedules schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'schedules_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'schedules'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."schedules"
    ADD CONSTRAINT "schedules_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: scheduling_optimizations scheduling_optimizations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'scheduling_optimizations_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'scheduling_optimizations'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."scheduling_optimizations"
    ADD CONSTRAINT "scheduling_optimizations_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: shift_swap_requests shift_swap_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'shift_swap_requests_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'shift_swap_requests'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."shift_swap_requests"
    ADD CONSTRAINT "shift_swap_requests_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: staff_transfers staff_transfers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'staff_transfers_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'staff_transfers'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."staff_transfers"
    ADD CONSTRAINT "staff_transfers_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: store_hierarchy store_hierarchy_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'store_hierarchy_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'store_hierarchy'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."store_hierarchy"
    ADD CONSTRAINT "store_hierarchy_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: store_hierarchy store_hierarchy_store_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'store_hierarchy_store_id_key'
      AND n.nspname = 'public'
      AND c.relname = 'store_hierarchy'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."store_hierarchy"
    ADD CONSTRAINT "store_hierarchy_store_id_key" UNIQUE ("store_id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: store_organization store_organization_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'store_organization_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'store_organization'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."store_organization"
    ADD CONSTRAINT "store_organization_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: store_position_assignments store_position_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'store_position_assignments_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'store_position_assignments'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."store_position_assignments"
    ADD CONSTRAINT "store_position_assignments_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: stores stores_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'stores_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'stores'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."stores"
    ADD CONSTRAINT "stores_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: system_modules system_modules_module_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'system_modules_module_key_key'
      AND n.nspname = 'public'
      AND c.relname = 'system_modules'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."system_modules"
    ADD CONSTRAINT "system_modules_module_key_key" UNIQUE ("module_key");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: system_modules system_modules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'system_modules_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'system_modules'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."system_modules"
    ADD CONSTRAINT "system_modules_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'tasks_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'tasks'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: tenant_applications tenant_applications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'tenant_applications_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'tenant_applications'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."tenant_applications"
    ADD CONSTRAINT "tenant_applications_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: tenant_settings tenant_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'tenant_settings_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'tenant_settings'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."tenant_settings"
    ADD CONSTRAINT "tenant_settings_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: tenant_settings tenant_settings_tenant_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'tenant_settings_tenant_id_key'
      AND n.nspname = 'public'
      AND c.relname = 'tenant_settings'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."tenant_settings"
    ADD CONSTRAINT "tenant_settings_tenant_id_key" UNIQUE ("tenant_id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: tenants tenants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'tenants_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'tenants'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."tenants"
    ADD CONSTRAINT "tenants_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: training_courses training_courses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'training_courses_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'training_courses'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."training_courses"
    ADD CONSTRAINT "training_courses_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: training_exams training_exams_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'training_exams_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'training_exams'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."training_exams"
    ADD CONSTRAINT "training_exams_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: training_records training_records_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'training_records_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'training_records'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."training_records"
    ADD CONSTRAINT "training_records_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: transfer_applications transfer_applications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'transfer_applications_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'transfer_applications'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."transfer_applications"
    ADD CONSTRAINT "transfer_applications_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: transfer_history transfer_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'transfer_history_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'transfer_history'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."transfer_history"
    ADD CONSTRAINT "transfer_history_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: transfer_positions transfer_positions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'transfer_positions_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'transfer_positions'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."transfer_positions"
    ADD CONSTRAINT "transfer_positions_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: transfer_requirements transfer_requirements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'transfer_requirements_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'transfer_requirements'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."transfer_requirements"
    ADD CONSTRAINT "transfer_requirements_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: transfer_reviews transfer_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'transfer_reviews_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'transfer_reviews'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."transfer_reviews"
    ADD CONSTRAINT "transfer_reviews_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: user_module_permissions user_module_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'user_module_permissions_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'user_module_permissions'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."user_module_permissions"
    ADD CONSTRAINT "user_module_permissions_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: user_module_permissions user_module_permissions_user_id_module_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'user_module_permissions_user_id_module_id_key'
      AND n.nspname = 'public'
      AND c.relname = 'user_module_permissions'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."user_module_permissions"
    ADD CONSTRAINT "user_module_permissions_user_id_module_id_key" UNIQUE ("user_id", "module_id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: work_attendance work_attendance_employee_id_date_key; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'work_attendance_employee_id_date_key'
      AND n.nspname = 'public'
      AND c.relname = 'work_attendance'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."work_attendance"
    ADD CONSTRAINT "work_attendance_employee_id_date_key" UNIQUE ("employee_id", "date");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: work_attendance work_attendance_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'work_attendance_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'work_attendance'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."work_attendance"
    ADD CONSTRAINT "work_attendance_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: work_log_categories work_log_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'work_log_categories_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'work_log_categories'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."work_log_categories"
    ADD CONSTRAINT "work_log_categories_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: work_logs work_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'work_logs_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'work_logs'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."work_logs"
    ADD CONSTRAINT "work_logs_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: work_ratings work_ratings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'work_ratings_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'work_ratings'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."work_ratings"
    ADD CONSTRAINT "work_ratings_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: work_records work_records_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'work_records_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'work_records'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."work_records"
    ADD CONSTRAINT "work_records_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: work_schedule_configs work_schedule_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'work_schedule_configs_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'work_schedule_configs'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."work_schedule_configs"
    ADD CONSTRAINT "work_schedule_configs_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: work_schedule_records work_schedule_records_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'work_schedule_records_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'work_schedule_records'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."work_schedule_records"
    ADD CONSTRAINT "work_schedule_records_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: work_shifts work_shifts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'work_shifts_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'work_shifts'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."work_shifts"
    ADD CONSTRAINT "work_shifts_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: work_shifts work_shifts_tenant_id_store_id_shift_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'work_shifts_tenant_id_store_id_shift_name_key'
      AND n.nspname = 'public'
      AND c.relname = 'work_shifts'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."work_shifts"
    ADD CONSTRAINT "work_shifts_tenant_id_store_id_shift_name_key" UNIQUE ("tenant_id", "store_id", "shift_name");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: idx_agent_assignments_agent_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_agent_assignments_agent_id" ON "public"."agent_assignments" USING "btree" ("agent_id");


--
-- Name: idx_agent_assignments_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_agent_assignments_status" ON "public"."agent_assignments" USING "btree" ("status");


--
-- Name: idx_agent_assignments_store_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_agent_assignments_store_id" ON "public"."agent_assignments" USING "btree" ("store_id");


--
-- Name: idx_agent_assignments_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_agent_assignments_tenant_id" ON "public"."agent_assignments" USING "btree" ("tenant_id");


--
-- Name: idx_alerts_detected; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_alerts_detected" ON "public"."risk_alerts" USING "btree" ("detected_at" DESC);


--
-- Name: idx_alerts_level; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_alerts_level" ON "public"."risk_alerts" USING "btree" ("risk_level");


--
-- Name: idx_alerts_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_alerts_status" ON "public"."risk_alerts" USING "btree" ("status");


--
-- Name: idx_alerts_store; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_alerts_store" ON "public"."risk_alerts" USING "btree" ("store_id");


--
-- Name: idx_alerts_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_alerts_tenant" ON "public"."risk_alerts" USING "btree" ("tenant_id");


--
-- Name: idx_alerts_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_alerts_type" ON "public"."risk_alerts" USING "btree" ("risk_type");


--
-- Name: idx_approval_logs_approver; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_approval_logs_approver" ON "public"."approval_logs" USING "btree" ("approver_id");


--
-- Name: idx_approval_logs_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_approval_logs_created" ON "public"."approval_logs" USING "btree" ("created_at" DESC);


--
-- Name: idx_approval_logs_request; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_approval_logs_request" ON "public"."approval_logs" USING "btree" ("request_type", "request_id");


--
-- Name: idx_approval_logs_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_approval_logs_tenant" ON "public"."approval_logs" USING "btree" ("tenant_id");


--
-- Name: idx_area_assignments_area; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_area_assignments_area" ON "public"."area_staff_assignments" USING "btree" ("area_id");


--
-- Name: idx_area_assignments_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_area_assignments_date" ON "public"."area_staff_assignments" USING "btree" ("start_date", "end_date");


--
-- Name: idx_area_assignments_employee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_area_assignments_employee" ON "public"."area_staff_assignments" USING "btree" ("employee_id");


--
-- Name: idx_area_assignments_position; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_area_assignments_position" ON "public"."area_staff_assignments" USING "btree" ("area_position_id");


--
-- Name: idx_area_assignments_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_area_assignments_tenant" ON "public"."area_staff_assignments" USING "btree" ("tenant_id");


--
-- Name: idx_area_daily_status_area; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_area_daily_status_area" ON "public"."area_daily_status" USING "btree" ("area_id");


--
-- Name: idx_area_daily_status_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_area_daily_status_date" ON "public"."area_daily_status" USING "btree" ("status_date");


--
-- Name: idx_area_daily_status_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_area_daily_status_tenant" ON "public"."area_daily_status" USING "btree" ("tenant_id");


--
-- Name: idx_area_daily_status_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX IF NOT EXISTS "idx_area_daily_status_unique" ON "public"."area_daily_status" USING "btree" ("tenant_id", "store_id", "area_id", "status_date");


--
-- Name: idx_area_positions_area; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_area_positions_area" ON "public"."area_positions" USING "btree" ("area_id");


--
-- Name: idx_area_positions_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_area_positions_name" ON "public"."area_positions" USING "btree" ("position_name");


--
-- Name: idx_area_positions_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_area_positions_tenant" ON "public"."area_positions" USING "btree" ("tenant_id");


--
-- Name: idx_area_positions_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX IF NOT EXISTS "idx_area_positions_unique" ON "public"."area_positions" USING "btree" ("tenant_id", "store_id", "area_id", "position_name");


--
-- Name: idx_area_staff_assignments_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX IF NOT EXISTS "idx_area_staff_assignments_unique" ON "public"."area_staff_assignments" USING "btree" ("tenant_id", "store_id", "area_position_id", "employee_id", "start_date");


--
-- Name: idx_attendance_overview_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_attendance_overview_date" ON "public"."area_attendance_overview" USING "btree" ("overview_date");


--
-- Name: idx_attendance_overview_store; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_attendance_overview_store" ON "public"."area_attendance_overview" USING "btree" ("store_id");


--
-- Name: idx_attendance_overview_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_attendance_overview_tenant" ON "public"."area_attendance_overview" USING "btree" ("tenant_id");


--
-- Name: idx_attendance_overview_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX IF NOT EXISTS "idx_attendance_overview_unique" ON "public"."area_attendance_overview" USING "btree" ("tenant_id", "store_id", "overview_date");


--
-- Name: idx_audit_logs_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_audit_logs_created" ON "public"."audit_logs" USING "btree" ("created_at" DESC);


--
-- Name: idx_audit_logs_record; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_audit_logs_record" ON "public"."audit_logs" USING "btree" ("record_id");


--
-- Name: idx_audit_logs_table; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_audit_logs_table" ON "public"."audit_logs" USING "btree" ("table_name");


--
-- Name: idx_audit_logs_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_audit_logs_tenant" ON "public"."audit_logs" USING "btree" ("tenant_id");


--
-- Name: idx_audit_logs_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_audit_logs_user" ON "public"."audit_logs" USING "btree" ("user_id");


--
-- Name: idx_audit_logs_version; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_audit_logs_version" ON "public"."audit_logs" USING "btree" ("app_version");


--
-- Name: idx_backup_config_backup; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_backup_config_backup" ON "public"."backup_position_config" USING "btree" ("backup_position_id");


--
-- Name: idx_backup_config_primary; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_backup_config_primary" ON "public"."backup_position_config" USING "btree" ("primary_position_id");


--
-- Name: idx_backup_config_store; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_backup_config_store" ON "public"."backup_position_config" USING "btree" ("store_id");


--
-- Name: idx_backup_config_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_backup_config_tenant" ON "public"."backup_position_config" USING "btree" ("tenant_id");


--
-- Name: idx_benefit_types_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_benefit_types_active" ON "public"."benefit_types" USING "btree" ("is_active");


--
-- Name: idx_benefit_types_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_benefit_types_tenant" ON "public"."benefit_types" USING "btree" ("tenant_id");


--
-- Name: idx_benefit_usage_records_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_benefit_usage_records_date" ON "public"."benefit_usage_records" USING "btree" ("usage_date");


--
-- Name: idx_benefit_usage_records_employee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_benefit_usage_records_employee" ON "public"."benefit_usage_records" USING "btree" ("employee_id");


--
-- Name: idx_brands_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_brands_created" ON "public"."brands" USING "btree" ("created_at" DESC);


--
-- Name: idx_brands_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_brands_status" ON "public"."brands" USING "btree" ("status");


--
-- Name: idx_brands_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_brands_tenant" ON "public"."brands" USING "btree" ("tenant_id");


--
-- Name: idx_business_areas_store; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_business_areas_store" ON "public"."business_areas" USING "btree" ("store_id");


--
-- Name: idx_business_areas_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_business_areas_tenant" ON "public"."business_areas" USING "btree" ("tenant_id");


--
-- Name: idx_business_areas_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_business_areas_type" ON "public"."business_areas" USING "btree" ("area_type");


--
-- Name: idx_business_areas_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX IF NOT EXISTS "idx_business_areas_unique" ON "public"."business_areas" USING "btree" ("tenant_id", "store_id", "area_code");


--
-- Name: idx_candidates_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_candidates_status" ON "public"."candidates" USING "btree" ("status");


--
-- Name: idx_candidates_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_candidates_tenant_id" ON "public"."candidates" USING "btree" ("tenant_id");


--
-- Name: idx_certifications_employee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_certifications_employee" ON "public"."employee_certifications" USING "btree" ("employee_id");


--
-- Name: idx_certifications_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_certifications_status" ON "public"."employee_certifications" USING "btree" ("cert_status");


--
-- Name: idx_core_backup_core_emp; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_core_backup_core_emp" ON "public"."core_position_backup" USING "btree" ("core_employee_id");


--
-- Name: idx_core_backup_store; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_core_backup_store" ON "public"."core_position_backup" USING "btree" ("store_id");


--
-- Name: idx_core_backup_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_core_backup_tenant" ON "public"."core_position_backup" USING "btree" ("tenant_id");


--
-- Name: idx_daily_revenue_calendar; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_daily_revenue_calendar" ON "public"."daily_revenue_detail" USING "btree" ("calendar_id");


--
-- Name: idx_daily_revenue_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_daily_revenue_date" ON "public"."daily_revenue_detail" USING "btree" ("revenue_date");


--
-- Name: idx_daily_revenue_weekend; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_daily_revenue_weekend" ON "public"."daily_revenue_detail" USING "btree" ("is_weekend");


--
-- Name: idx_dashboard_alerts_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_dashboard_alerts_created_at" ON "public"."dashboard_alerts" USING "btree" ("created_at" DESC);


--
-- Name: idx_dashboard_alerts_severity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_dashboard_alerts_severity" ON "public"."dashboard_alerts" USING "btree" ("severity");


--
-- Name: idx_dashboard_alerts_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_dashboard_alerts_type" ON "public"."dashboard_alerts" USING "btree" ("alert_type");


--
-- Name: idx_dashboard_quick_actions_usage; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_dashboard_quick_actions_usage" ON "public"."dashboard_quick_actions" USING "btree" ("usage_count" DESC);


--
-- Name: idx_dashboard_quick_actions_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_dashboard_quick_actions_user_id" ON "public"."dashboard_quick_actions" USING "btree" ("user_id");


--
-- Name: idx_dashboard_widgets_position; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_dashboard_widgets_position" ON "public"."dashboard_widgets" USING "btree" ("position");


--
-- Name: idx_dashboard_widgets_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_dashboard_widgets_user_id" ON "public"."dashboard_widgets" USING "btree" ("user_id");


--
-- Name: idx_day_off_records_employee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_day_off_records_employee" ON "public"."day_off_records" USING "btree" ("employee_id");


--
-- Name: idx_day_off_records_plan; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_day_off_records_plan" ON "public"."day_off_records" USING "btree" ("schedule_plan_id");


--
-- Name: idx_departments_manager_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_departments_manager_id" ON "public"."departments" USING "btree" ("manager_id");


--
-- Name: idx_departments_parent_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_departments_parent_id" ON "public"."departments" USING "btree" ("parent_id");


--
-- Name: idx_departments_sort_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_departments_sort_order" ON "public"."departments" USING "btree" ("sort_order");


--
-- Name: idx_departments_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_departments_status" ON "public"."departments" USING "btree" ("status");


--
-- Name: idx_departments_tenant_code; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX IF NOT EXISTS "idx_departments_tenant_code" ON "public"."departments" USING "btree" ("tenant_id", "code") WHERE (("code" IS NOT NULL) AND ("status" = 'active'::"text"));


--
-- Name: idx_departments_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_departments_tenant_id" ON "public"."departments" USING "btree" ("tenant_id");


--
-- Name: idx_departments_tenant_name; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX IF NOT EXISTS "idx_departments_tenant_name" ON "public"."departments" USING "btree" ("tenant_id", "name") WHERE ("status" = 'active'::"text");


--
-- Name: idx_employee_benefits_employee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_employee_benefits_employee" ON "public"."employee_benefits" USING "btree" ("employee_id");


--
-- Name: idx_employee_benefits_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_employee_benefits_status" ON "public"."employee_benefits" USING "btree" ("status");


--
-- Name: idx_employee_levels_employee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_employee_levels_employee" ON "public"."employee_levels" USING "btree" ("employee_id");


--
-- Name: idx_employee_levels_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_employee_levels_tenant" ON "public"."employee_levels" USING "btree" ("tenant_id");


--
-- Name: idx_employee_lifecycle_events_employee_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_employee_lifecycle_events_employee_id" ON "public"."employee_lifecycle_events" USING "btree" ("employee_id");


--
-- Name: idx_employee_lifecycle_events_event_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_employee_lifecycle_events_event_type" ON "public"."employee_lifecycle_events" USING "btree" ("event_type");


--
-- Name: idx_employee_onboarding_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_employee_onboarding_status" ON "public"."employee_onboarding" USING "btree" ("status");


--
-- Name: idx_employee_onboarding_store; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_employee_onboarding_store" ON "public"."employee_onboarding" USING "btree" ("store_id");


--
-- Name: idx_employee_onboarding_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_employee_onboarding_tenant" ON "public"."employee_onboarding" USING "btree" ("tenant_id");


--
-- Name: idx_employee_positions_dates; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_employee_positions_dates" ON "public"."employee_positions" USING "btree" ("effective_date", "expiry_date");


--
-- Name: idx_employee_positions_employee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_employee_positions_employee" ON "public"."employee_positions" USING "btree" ("employee_id");


--
-- Name: idx_employee_positions_position; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_employee_positions_position" ON "public"."employee_positions" USING "btree" ("position_id");


--
-- Name: idx_employee_positions_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_employee_positions_tenant" ON "public"."employee_positions" USING "btree" ("tenant_id");


--
-- Name: idx_employee_resignation_employee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_employee_resignation_employee" ON "public"."employee_resignation" USING "btree" ("employee_id");


--
-- Name: idx_employee_resignation_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_employee_resignation_status" ON "public"."employee_resignation" USING "btree" ("status");


--
-- Name: idx_employee_resignation_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_employee_resignation_tenant" ON "public"."employee_resignation" USING "btree" ("tenant_id");


--
-- Name: idx_employee_shifts_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_employee_shifts_date" ON "public"."employee_shifts" USING "btree" ("shift_date");


--
-- Name: idx_employee_shifts_employee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_employee_shifts_employee" ON "public"."employee_shifts" USING "btree" ("employee_id");


--
-- Name: idx_employee_shifts_store; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_employee_shifts_store" ON "public"."employee_shifts" USING "btree" ("store_id");


--
-- Name: idx_employee_shifts_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_employee_shifts_tenant" ON "public"."employee_shifts" USING "btree" ("tenant_id");


--
-- Name: idx_employee_work_info_employee_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_employee_work_info_employee_id" ON "public"."employee_work_info" USING "btree" ("employee_id");


--
-- Name: idx_employee_work_info_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_employee_work_info_tenant_id" ON "public"."employee_work_info" USING "btree" ("tenant_id");


--
-- Name: idx_employee_work_info_work_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_employee_work_info_work_status" ON "public"."employee_work_info" USING "btree" ("work_status");


--
-- Name: idx_employees_brand; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_employees_brand" ON "public"."employees" USING "btree" ("brand_id");


--
-- Name: idx_employees_can_backup_positions; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_employees_can_backup_positions" ON "public"."employees" USING "gin" ("can_backup_positions");


--
-- Name: idx_employees_department_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_employees_department_id" ON "public"."employees" USING "btree" ("department_id");


--
-- Name: idx_employees_is_core_position; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_employees_is_core_position" ON "public"."employees" USING "btree" ("is_core_position") WHERE ("is_core_position" = true);


--
-- Name: idx_employees_monthly_salary; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_employees_monthly_salary" ON "public"."employees" USING "btree" ("monthly_salary") WHERE ("monthly_salary" IS NOT NULL);


--
-- Name: idx_employees_position_fixed_backup; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_employees_position_fixed_backup" ON "public"."employees" USING "btree" ("position_fixed_backup") WHERE ("position_fixed_backup" = true);


--
-- Name: idx_employees_rest_days; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_employees_rest_days" ON "public"."employees" USING "btree" ("rest_days_per_month");


--
-- Name: idx_employees_type_salary; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_employees_type_salary" ON "public"."employees" USING "btree" ("employee_type", "monthly_salary");


--
-- Name: idx_exit_interviews_resignation_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_exit_interviews_resignation_id" ON "public"."exit_interviews" USING "btree" ("resignation_id");


--
-- Name: idx_factors_effective; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_factors_effective" ON "public"."impact_factors" USING "btree" ("effective_date");


--
-- Name: idx_factors_expiration; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_factors_expiration" ON "public"."impact_factors" USING "btree" ("expiration_date");


--
-- Name: idx_factors_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_factors_tenant" ON "public"."impact_factors" USING "btree" ("tenant_id");


--
-- Name: idx_factors_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_factors_type" ON "public"."impact_factors" USING "btree" ("factor_type");


--
-- Name: idx_goals_dates; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_goals_dates" ON "public"."performance_goals" USING "btree" ("start_date", "end_date");


--
-- Name: idx_goals_employee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_goals_employee" ON "public"."performance_goals" USING "btree" ("employee_id");


--
-- Name: idx_goals_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_goals_status" ON "public"."performance_goals" USING "btree" ("status");


--
-- Name: idx_handbook_reading_progress_employee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_handbook_reading_progress_employee" ON "public"."handbook_reading_progress" USING "btree" ("employee_id");


--
-- Name: idx_handbook_reading_progress_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_handbook_reading_progress_tenant" ON "public"."handbook_reading_progress" USING "btree" ("tenant_id");


--
-- Name: idx_help_article_feedback_article; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_help_article_feedback_article" ON "public"."help_article_feedback" USING "btree" ("article_id");


--
-- Name: idx_help_article_feedback_employee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_help_article_feedback_employee" ON "public"."help_article_feedback" USING "btree" ("employee_id");


--
-- Name: idx_help_article_feedback_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_help_article_feedback_tenant" ON "public"."help_article_feedback" USING "btree" ("tenant_id");


--
-- Name: idx_hierarchy_store; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_hierarchy_store" ON "public"."store_hierarchy" USING "btree" ("store_id");


--
-- Name: idx_hierarchy_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_hierarchy_tenant" ON "public"."store_hierarchy" USING "btree" ("tenant_id");


--
-- Name: idx_hr_messages_employee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_hr_messages_employee" ON "public"."hr_messages" USING "btree" ("employee_id");


--
-- Name: idx_hr_messages_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_hr_messages_status" ON "public"."hr_messages" USING "btree" ("status");


--
-- Name: idx_hr_messages_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_hr_messages_tenant" ON "public"."hr_messages" USING "btree" ("tenant_id");


--
-- Name: idx_impact_factors_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_impact_factors_active" ON "public"."revenue_impact_factors" USING "btree" ("is_active");


--
-- Name: idx_impact_factors_store; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_impact_factors_store" ON "public"."revenue_impact_factors" USING "btree" ("store_id");


--
-- Name: idx_impact_factors_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_impact_factors_tenant" ON "public"."revenue_impact_factors" USING "btree" ("tenant_id");


--
-- Name: idx_impact_factors_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_impact_factors_type" ON "public"."revenue_impact_factors" USING "btree" ("factor_type");


--
-- Name: idx_improvements_employee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_improvements_employee" ON "public"."performance_improvements" USING "btree" ("employee_id");


--
-- Name: idx_improvements_performance; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_improvements_performance" ON "public"."performance_improvements" USING "btree" ("performance_id");


--
-- Name: idx_improvements_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_improvements_status" ON "public"."performance_improvements" USING "btree" ("status");


--
-- Name: idx_interviews_candidate_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_interviews_candidate_id" ON "public"."interviews" USING "btree" ("candidate_id");


--
-- Name: idx_invitation_code_uses_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_invitation_code_uses_code" ON "public"."invitation_code_uses" USING "btree" ("invitation_code_id");


--
-- Name: idx_invitation_code_uses_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_invitation_code_uses_user" ON "public"."invitation_code_uses" USING "btree" ("user_id");


--
-- Name: idx_invitation_codes_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_invitation_codes_code" ON "public"."invitation_codes" USING "btree" ("code");


--
-- Name: idx_invitation_codes_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_invitation_codes_status" ON "public"."invitation_codes" USING "btree" ("status");


--
-- Name: idx_invitation_codes_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_invitation_codes_tenant" ON "public"."invitation_codes" USING "btree" ("tenant_id");


--
-- Name: idx_learning_achievements_employee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_learning_achievements_employee" ON "public"."learning_achievements" USING "btree" ("employee_id");


--
-- Name: idx_learning_achievements_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_learning_achievements_tenant" ON "public"."learning_achievements" USING "btree" ("tenant_id");


--
-- Name: idx_learning_achievements_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_learning_achievements_type" ON "public"."learning_achievements" USING "btree" ("achievement_type");


--
-- Name: idx_leave_balances_employee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_leave_balances_employee" ON "public"."leave_balances" USING "btree" ("employee_id");


--
-- Name: idx_leave_balances_year; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_leave_balances_year" ON "public"."leave_balances" USING "btree" ("year");


--
-- Name: idx_leave_requests_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_leave_requests_created" ON "public"."leave_requests" USING "btree" ("created_at" DESC);


--
-- Name: idx_leave_requests_dates; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_leave_requests_dates" ON "public"."leave_requests" USING "btree" ("start_date", "end_date");


--
-- Name: idx_leave_requests_employee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_leave_requests_employee" ON "public"."leave_requests" USING "btree" ("employee_id");


--
-- Name: idx_leave_requests_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_leave_requests_status" ON "public"."leave_requests" USING "btree" ("status");


--
-- Name: idx_leave_requests_store; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_leave_requests_store" ON "public"."leave_requests" USING "btree" ("store_id");


--
-- Name: idx_leave_requests_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_leave_requests_tenant" ON "public"."leave_requests" USING "btree" ("tenant_id");


--
-- Name: idx_leave_types_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_leave_types_active" ON "public"."leave_types" USING "btree" ("is_active");


--
-- Name: idx_leave_types_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_leave_types_tenant" ON "public"."leave_types" USING "btree" ("tenant_id");


--
-- Name: idx_meal_periods_store; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_meal_periods_store" ON "public"."meal_periods" USING "btree" ("store_id");


--
-- Name: idx_meal_periods_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_meal_periods_tenant" ON "public"."meal_periods" USING "btree" ("tenant_id");


--
-- Name: idx_min_revenue_store; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_min_revenue_store" ON "public"."min_revenue_positions" USING "btree" ("store_id");


--
-- Name: idx_min_revenue_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_min_revenue_tenant" ON "public"."min_revenue_positions" USING "btree" ("tenant_id");


--
-- Name: idx_min_revenue_value; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_min_revenue_value" ON "public"."min_revenue_positions" USING "btree" ("min_revenue");


--
-- Name: idx_notifications_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_notifications_created_at" ON "public"."notifications" USING "btree" ("created_at" DESC);


--
-- Name: idx_notifications_is_read; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_notifications_is_read" ON "public"."notifications" USING "btree" ("is_read");


--
-- Name: idx_notifications_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_notifications_tenant_id" ON "public"."notifications" USING "btree" ("tenant_id");


--
-- Name: idx_notifications_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_notifications_user_id" ON "public"."notifications" USING "btree" ("user_id");


--
-- Name: idx_offboarding_applications_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_offboarding_applications_date" ON "public"."offboarding_applications" USING "btree" ("application_date");


--
-- Name: idx_offboarding_applications_employee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_offboarding_applications_employee" ON "public"."offboarding_applications" USING "btree" ("employee_id");


--
-- Name: idx_offboarding_applications_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_offboarding_applications_status" ON "public"."offboarding_applications" USING "btree" ("status");


--
-- Name: idx_offboarding_applications_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_offboarding_applications_tenant" ON "public"."offboarding_applications" USING "btree" ("tenant_id");


--
-- Name: idx_offboarding_handovers_application; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_offboarding_handovers_application" ON "public"."offboarding_handovers" USING "btree" ("application_id");


--
-- Name: idx_offboarding_handovers_employee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_offboarding_handovers_employee" ON "public"."offboarding_handovers" USING "btree" ("employee_id");


--
-- Name: idx_offboarding_handovers_handover_to; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_offboarding_handovers_handover_to" ON "public"."offboarding_handovers" USING "btree" ("handover_to");


--
-- Name: idx_offboarding_history_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_offboarding_history_date" ON "public"."offboarding_history" USING "btree" ("leave_date");


--
-- Name: idx_offboarding_history_employee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_offboarding_history_employee" ON "public"."offboarding_history" USING "btree" ("employee_id");


--
-- Name: idx_offboarding_interviews_application; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_offboarding_interviews_application" ON "public"."offboarding_interviews" USING "btree" ("application_id");


--
-- Name: idx_offboarding_interviews_employee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_offboarding_interviews_employee" ON "public"."offboarding_interviews" USING "btree" ("employee_id");


--
-- Name: idx_offboarding_interviews_interviewer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_offboarding_interviews_interviewer" ON "public"."offboarding_interviews" USING "btree" ("interviewer_id");


--
-- Name: idx_offboarding_tasks_application; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_offboarding_tasks_application" ON "public"."offboarding_tasks" USING "btree" ("application_id");


--
-- Name: idx_offboarding_tasks_assigned; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_offboarding_tasks_assigned" ON "public"."offboarding_tasks" USING "btree" ("assigned_to");


--
-- Name: idx_offboarding_tasks_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_offboarding_tasks_status" ON "public"."offboarding_tasks" USING "btree" ("status");


--
-- Name: idx_onboarding_applications_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_onboarding_applications_date" ON "public"."onboarding_applications" USING "btree" ("application_date");


--
-- Name: idx_onboarding_applications_employee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_onboarding_applications_employee" ON "public"."onboarding_applications" USING "btree" ("employee_id");


--
-- Name: idx_onboarding_applications_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_onboarding_applications_status" ON "public"."onboarding_applications" USING "btree" ("status");


--
-- Name: idx_onboarding_applications_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_onboarding_applications_tenant" ON "public"."onboarding_applications" USING "btree" ("tenant_id");


--
-- Name: idx_onboarding_documents_application; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_onboarding_documents_application" ON "public"."onboarding_documents" USING "btree" ("application_id");


--
-- Name: idx_onboarding_documents_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_onboarding_documents_status" ON "public"."onboarding_documents" USING "btree" ("status");


--
-- Name: idx_onboarding_documents_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_onboarding_documents_type" ON "public"."onboarding_documents" USING "btree" ("document_type");


--
-- Name: idx_onboarding_history_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_onboarding_history_date" ON "public"."onboarding_history" USING "btree" ("onboarding_date");


--
-- Name: idx_onboarding_history_employee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_onboarding_history_employee" ON "public"."onboarding_history" USING "btree" ("employee_id");


--
-- Name: idx_onboarding_processes_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_onboarding_processes_active" ON "public"."onboarding_processes" USING "btree" ("is_active");


--
-- Name: idx_onboarding_processes_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_onboarding_processes_tenant" ON "public"."onboarding_processes" USING "btree" ("tenant_id");


--
-- Name: idx_onboarding_tasks_application; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_onboarding_tasks_application" ON "public"."onboarding_tasks" USING "btree" ("application_id");


--
-- Name: idx_onboarding_tasks_assigned; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_onboarding_tasks_assigned" ON "public"."onboarding_tasks" USING "btree" ("assigned_to");


--
-- Name: idx_onboarding_tasks_due_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_onboarding_tasks_due_date" ON "public"."onboarding_tasks" USING "btree" ("due_date");


--
-- Name: idx_onboarding_tasks_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_onboarding_tasks_status" ON "public"."onboarding_tasks" USING "btree" ("status");


--
-- Name: idx_operation_adjustments_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_operation_adjustments_date" ON "public"."operation_adjustments" USING "btree" ("operation_date" DESC);


--
-- Name: idx_operation_adjustments_tenant_store_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_operation_adjustments_tenant_store_date" ON "public"."operation_adjustments" USING "btree" ("tenant_id", "store_id", "operation_date", "adjustment_time" DESC);


--
-- Name: idx_optimizations_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_optimizations_created" ON "public"."scheduling_optimizations" USING "btree" ("created_at" DESC);


--
-- Name: idx_optimizations_schedule; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_optimizations_schedule" ON "public"."scheduling_optimizations" USING "btree" ("schedule_id");


--
-- Name: idx_optimizations_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_optimizations_status" ON "public"."scheduling_optimizations" USING "btree" ("status");


--
-- Name: idx_optimizations_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_optimizations_tenant" ON "public"."scheduling_optimizations" USING "btree" ("tenant_id");


--
-- Name: idx_overtime_compensations_employee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_overtime_compensations_employee" ON "public"."overtime_compensations" USING "btree" ("employee_id");


--
-- Name: idx_overtime_compensations_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_overtime_compensations_status" ON "public"."overtime_compensations" USING "btree" ("status");


--
-- Name: idx_overtime_requests_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_overtime_requests_date" ON "public"."overtime_requests" USING "btree" ("overtime_date");


--
-- Name: idx_overtime_requests_employee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_overtime_requests_employee" ON "public"."overtime_requests" USING "btree" ("employee_id");


--
-- Name: idx_overtime_requests_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_overtime_requests_status" ON "public"."overtime_requests" USING "btree" ("status");


--
-- Name: idx_overtime_types_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_overtime_types_active" ON "public"."overtime_types" USING "btree" ("is_active");


--
-- Name: idx_overtime_types_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_overtime_types_tenant" ON "public"."overtime_types" USING "btree" ("tenant_id");


--
-- Name: idx_part_time_records_plan; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_part_time_records_plan" ON "public"."part_time_records" USING "btree" ("schedule_plan_id");


--
-- Name: idx_part_time_shifts_phone; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_part_time_shifts_phone" ON "public"."part_time_shifts" USING "btree" ("phone");


--
-- Name: idx_part_time_shifts_tenant_store_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_part_time_shifts_tenant_store_date" ON "public"."part_time_shifts" USING "btree" ("tenant_id", "store_id", "operation_date");


--
-- Name: idx_performance_employee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_performance_employee" ON "public"."employee_performance" USING "btree" ("employee_id");


--
-- Name: idx_performance_period; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_performance_period" ON "public"."employee_performance" USING "btree" ("period_year", "period_month");


--
-- Name: idx_performance_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_performance_status" ON "public"."employee_performance" USING "btree" ("status");


--
-- Name: idx_position_config_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_position_config_active" ON "public"."position_config" USING "btree" ("is_active");


--
-- Name: idx_position_config_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_position_config_category" ON "public"."position_config" USING "btree" ("position_category");


--
-- Name: idx_position_config_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_position_config_tenant" ON "public"."position_config" USING "btree" ("tenant_id");


--
-- Name: idx_position_permissions_module; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_position_permissions_module" ON "public"."position_module_permissions" USING "btree" ("module_id");


--
-- Name: idx_position_permissions_position; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_position_permissions_position" ON "public"."position_module_permissions" USING "btree" ("position_id");


--
-- Name: idx_position_permissions_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_position_permissions_tenant" ON "public"."position_module_permissions" USING "btree" ("tenant_id");


--
-- Name: idx_positions_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_positions_active" ON "public"."positions" USING "btree" ("is_active");


--
-- Name: idx_positions_level; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_positions_level" ON "public"."positions" USING "btree" ("position_level");


--
-- Name: idx_positions_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_positions_tenant_id" ON "public"."positions" USING "btree" ("tenant_id");


--
-- Name: idx_practices_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_practices_category" ON "public"."best_practices" USING "btree" ("category");


--
-- Name: idx_practices_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_practices_created" ON "public"."best_practices" USING "btree" ("created_at" DESC);


--
-- Name: idx_practices_rating; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_practices_rating" ON "public"."best_practices" USING "btree" ("rating" DESC);


--
-- Name: idx_practices_store; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_practices_store" ON "public"."best_practices" USING "btree" ("store_id");


--
-- Name: idx_practices_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_practices_tenant" ON "public"."best_practices" USING "btree" ("tenant_id");


--
-- Name: idx_predictions_period; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_predictions_period" ON "public"."revenue_predictions" USING "btree" ("target_period");


--
-- Name: idx_predictions_store; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_predictions_store" ON "public"."revenue_predictions" USING "btree" ("store_id");


--
-- Name: idx_predictions_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_predictions_tenant" ON "public"."revenue_predictions" USING "btree" ("tenant_id");


--
-- Name: idx_predictions_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_predictions_type" ON "public"."revenue_predictions" USING "btree" ("prediction_type");


--
-- Name: idx_probation_conversion_applications_employee_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_probation_conversion_applications_employee_id" ON "public"."probation_conversion_applications" USING "btree" ("employee_id");


--
-- Name: idx_probation_conversion_applications_probation_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_probation_conversion_applications_probation_id" ON "public"."probation_conversion_applications" USING "btree" ("probation_id");


--
-- Name: idx_probation_conversion_applications_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_probation_conversion_applications_tenant_id" ON "public"."probation_conversion_applications" USING "btree" ("tenant_id");


--
-- Name: idx_probation_evaluation_employee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_probation_evaluation_employee" ON "public"."probation_evaluation" USING "btree" ("employee_id");


--
-- Name: idx_profiles_employment_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_profiles_employment_type" ON "public"."profiles" USING "btree" ("employment_type");


--
-- Name: idx_profiles_tenant_employment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_profiles_tenant_employment" ON "public"."profiles" USING "btree" ("tenant_id", "employment_type");


--
-- Name: idx_profiles_wechat_openid; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_profiles_wechat_openid" ON "public"."profiles" USING "btree" ("wechat_openid");


--
-- Name: idx_profiles_wechat_unionid; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_profiles_wechat_unionid" ON "public"."profiles" USING "btree" ("wechat_unionid");


--
-- Name: idx_promotion_applications_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_promotion_applications_date" ON "public"."promotion_applications" USING "btree" ("application_date");


--
-- Name: idx_promotion_applications_employee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_promotion_applications_employee" ON "public"."promotion_applications" USING "btree" ("employee_id");


--
-- Name: idx_promotion_applications_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_promotion_applications_status" ON "public"."promotion_applications" USING "btree" ("status");


--
-- Name: idx_promotion_history_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_promotion_history_date" ON "public"."promotion_history" USING "btree" ("promotion_date");


--
-- Name: idx_promotion_history_employee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_promotion_history_employee" ON "public"."promotion_history" USING "btree" ("employee_id");


--
-- Name: idx_promotion_paths_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_promotion_paths_active" ON "public"."promotion_paths" USING "btree" ("is_active");


--
-- Name: idx_promotion_paths_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_promotion_paths_tenant" ON "public"."promotion_paths" USING "btree" ("tenant_id");


--
-- Name: idx_promotion_requirements_path; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_promotion_requirements_path" ON "public"."promotion_requirements" USING "btree" ("promotion_path_id");


--
-- Name: idx_promotion_reviews_application; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_promotion_reviews_application" ON "public"."promotion_reviews" USING "btree" ("application_id");


--
-- Name: idx_promotion_reviews_reviewer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_promotion_reviews_reviewer" ON "public"."promotion_reviews" USING "btree" ("reviewer_id");


--
-- Name: idx_recruitment_positions_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_recruitment_positions_status" ON "public"."recruitment_positions" USING "btree" ("status");


--
-- Name: idx_recruitment_positions_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_recruitment_positions_tenant_id" ON "public"."recruitment_positions" USING "btree" ("tenant_id");


--
-- Name: idx_regularization_application_employee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_regularization_application_employee" ON "public"."regularization_application" USING "btree" ("employee_id");


--
-- Name: idx_resignation_requests_employee_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_resignation_requests_employee_id" ON "public"."resignation_requests" USING "btree" ("employee_id");


--
-- Name: idx_resignation_requests_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_resignation_requests_status" ON "public"."resignation_requests" USING "btree" ("status");


--
-- Name: idx_resignation_requests_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_resignation_requests_tenant_id" ON "public"."resignation_requests" USING "btree" ("tenant_id");


--
-- Name: idx_rest_rules_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_rest_rules_active" ON "public"."rest_day_rules" USING "btree" ("is_active");


--
-- Name: idx_rest_rules_priority; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_rest_rules_priority" ON "public"."rest_day_rules" USING "btree" ("priority" DESC);


--
-- Name: idx_rest_rules_store; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_rest_rules_store" ON "public"."rest_day_rules" USING "btree" ("store_id");


--
-- Name: idx_rest_rules_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_rest_rules_tenant" ON "public"."rest_day_rules" USING "btree" ("tenant_id");


--
-- Name: idx_revenue_adjustment_calendar; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_revenue_adjustment_calendar" ON "public"."revenue_adjustment_log" USING "btree" ("calendar_id");


--
-- Name: idx_revenue_adjustment_daily; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_revenue_adjustment_daily" ON "public"."revenue_adjustment_log" USING "btree" ("daily_detail_id");


--
-- Name: idx_revenue_adjustment_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_revenue_adjustment_type" ON "public"."revenue_adjustment_log" USING "btree" ("adjustment_type");


--
-- Name: idx_revenue_calendar_month; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_revenue_calendar_month" ON "public"."revenue_calendar" USING "btree" ("calendar_month");


--
-- Name: idx_revenue_calendar_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_revenue_calendar_status" ON "public"."revenue_calendar" USING "btree" ("status");


--
-- Name: idx_revenue_calendar_store; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_revenue_calendar_store" ON "public"."revenue_calendar" USING "btree" ("store_id");


--
-- Name: idx_revenue_calendar_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_revenue_calendar_tenant" ON "public"."revenue_calendar" USING "btree" ("tenant_id");


--
-- Name: idx_revenue_detail_area; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_revenue_detail_area" ON "public"."revenue_detail_records" USING "btree" ("business_area");


--
-- Name: idx_revenue_detail_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_revenue_detail_date" ON "public"."revenue_detail_records" USING "btree" ("revenue_date");


--
-- Name: idx_revenue_detail_meal; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_revenue_detail_meal" ON "public"."revenue_detail_records" USING "btree" ("meal_period");


--
-- Name: idx_revenue_detail_store; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_revenue_detail_store" ON "public"."revenue_detail_records" USING "btree" ("store_id");


--
-- Name: idx_revenue_detail_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_revenue_detail_tenant" ON "public"."revenue_detail_records" USING "btree" ("tenant_id");


--
-- Name: idx_revenue_history_batch; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_revenue_history_batch" ON "public"."revenue_history" USING "btree" ("import_batch_id");


--
-- Name: idx_revenue_history_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_revenue_history_date" ON "public"."revenue_history" USING "btree" ("revenue_date" DESC);


--
-- Name: idx_revenue_history_store; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_revenue_history_store" ON "public"."revenue_history" USING "btree" ("store_id");


--
-- Name: idx_revenue_history_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_revenue_history_tenant" ON "public"."revenue_history" USING "btree" ("tenant_id");


--
-- Name: idx_revenue_import_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_revenue_import_date" ON "public"."revenue_import_logs" USING "btree" ("import_date");


--
-- Name: idx_revenue_import_store; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_revenue_import_store" ON "public"."revenue_import_logs" USING "btree" ("store_id");


--
-- Name: idx_revenue_import_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_revenue_import_tenant" ON "public"."revenue_import_logs" USING "btree" ("tenant_id");


--
-- Name: idx_role_permissions_module; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_role_permissions_module" ON "public"."role_module_permissions" USING "btree" ("module_id");


--
-- Name: idx_role_permissions_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_role_permissions_role" ON "public"."role_module_permissions" USING "btree" ("role");


--
-- Name: idx_salary_records_employee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_salary_records_employee" ON "public"."salary_records" USING "btree" ("employee_id");


--
-- Name: idx_salary_records_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_salary_records_status" ON "public"."salary_records" USING "btree" ("status");


--
-- Name: idx_salary_records_year_month; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_salary_records_year_month" ON "public"."salary_records" USING "btree" ("year", "month");


--
-- Name: idx_salary_structures_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_salary_structures_active" ON "public"."salary_structures" USING "btree" ("is_active");


--
-- Name: idx_salary_structures_employee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_salary_structures_employee" ON "public"."salary_structures" USING "btree" ("employee_id");


--
-- Name: idx_schedule_plan_periods_plan; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_schedule_plan_periods_plan" ON "public"."schedule_plan_periods" USING "btree" ("schedule_plan_id");


--
-- Name: idx_schedule_plans_tenant_store_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_schedule_plans_tenant_store_date" ON "public"."schedule_plans" USING "btree" ("tenant_id", "store_id", "plan_date");


--
-- Name: idx_schedule_results_adjustment_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_schedule_results_adjustment_type" ON "public"."schedule_results" USING "btree" ("adjustment_type");


--
-- Name: idx_schedule_results_is_latest; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_schedule_results_is_latest" ON "public"."schedule_results" USING "btree" ("tenant_id", "store_id", "operation_date", "is_latest");


--
-- Name: idx_schedule_results_previous_result; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_schedule_results_previous_result" ON "public"."schedule_results" USING "btree" ("previous_result_id");


--
-- Name: idx_schedule_results_tenant_store_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_schedule_results_tenant_store_date" ON "public"."schedule_results" USING "btree" ("tenant_id", "store_id", "operation_date");


--
-- Name: idx_schedules_day_off; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_schedules_day_off" ON "public"."schedules" USING "btree" ("tenant_id", "store_id", "schedule_date", "is_day_off");


--
-- Name: idx_shift_swap_requests_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_shift_swap_requests_created" ON "public"."shift_swap_requests" USING "btree" ("created_at");


--
-- Name: idx_shift_swap_requests_requester; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_shift_swap_requests_requester" ON "public"."shift_swap_requests" USING "btree" ("requester_id");


--
-- Name: idx_shift_swap_requests_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_shift_swap_requests_status" ON "public"."shift_swap_requests" USING "btree" ("status");


--
-- Name: idx_shift_swap_requests_target; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_shift_swap_requests_target" ON "public"."shift_swap_requests" USING "btree" ("target_id");


--
-- Name: idx_shift_swap_requests_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_shift_swap_requests_tenant" ON "public"."shift_swap_requests" USING "btree" ("tenant_id");


--
-- Name: idx_snapshots_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_snapshots_created" ON "public"."data_snapshots" USING "btree" ("created_at" DESC);


--
-- Name: idx_snapshots_table; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_snapshots_table" ON "public"."data_snapshots" USING "btree" ("table_name");


--
-- Name: idx_snapshots_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_snapshots_tenant" ON "public"."data_snapshots" USING "btree" ("tenant_id");


--
-- Name: idx_snapshots_version; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_snapshots_version" ON "public"."data_snapshots" USING "btree" ("app_version");


--
-- Name: idx_store_assignments_dates; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_store_assignments_dates" ON "public"."store_position_assignments" USING "btree" ("effective_date", "expiry_date");


--
-- Name: idx_store_assignments_employee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_store_assignments_employee" ON "public"."store_position_assignments" USING "btree" ("employee_id");


--
-- Name: idx_store_assignments_org; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_store_assignments_org" ON "public"."store_position_assignments" USING "btree" ("organization_id");


--
-- Name: idx_store_assignments_store; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_store_assignments_store" ON "public"."store_position_assignments" USING "btree" ("store_id");


--
-- Name: idx_store_assignments_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_store_assignments_tenant" ON "public"."store_position_assignments" USING "btree" ("tenant_id");


--
-- Name: idx_store_org_level; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_store_org_level" ON "public"."store_organization" USING "btree" ("position_level");


--
-- Name: idx_store_org_parent; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_store_org_parent" ON "public"."store_organization" USING "btree" ("parent_position_id");


--
-- Name: idx_store_org_position; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_store_org_position" ON "public"."store_organization" USING "btree" ("position_id");


--
-- Name: idx_store_org_store; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_store_org_store" ON "public"."store_organization" USING "btree" ("store_id");


--
-- Name: idx_store_org_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_store_org_tenant" ON "public"."store_organization" USING "btree" ("tenant_id");


--
-- Name: idx_stores_brand; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_stores_brand" ON "public"."stores" USING "btree" ("brand_id");


--
-- Name: idx_system_modules_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_system_modules_active" ON "public"."system_modules" USING "btree" ("is_active");


--
-- Name: idx_system_modules_key; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_system_modules_key" ON "public"."system_modules" USING "btree" ("module_key");


--
-- Name: idx_system_modules_parent; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_system_modules_parent" ON "public"."system_modules" USING "btree" ("parent_module_id");


--
-- Name: idx_tasks_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_tasks_created_by" ON "public"."tasks" USING "btree" ("created_by");


--
-- Name: idx_tasks_due_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_tasks_due_date" ON "public"."tasks" USING "btree" ("due_date");


--
-- Name: idx_tasks_employee_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_tasks_employee_id" ON "public"."tasks" USING "btree" ("employee_id");


--
-- Name: idx_tasks_priority; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_tasks_priority" ON "public"."tasks" USING "btree" ("priority");


--
-- Name: idx_tasks_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_tasks_status" ON "public"."tasks" USING "btree" ("status");


--
-- Name: idx_tasks_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_tasks_tenant_id" ON "public"."tasks" USING "btree" ("tenant_id");


--
-- Name: idx_tenant_applications_applicant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_tenant_applications_applicant" ON "public"."tenant_applications" USING "btree" ("applicant_id");


--
-- Name: idx_tenant_applications_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_tenant_applications_created" ON "public"."tenant_applications" USING "btree" ("created_at" DESC);


--
-- Name: idx_tenant_applications_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_tenant_applications_status" ON "public"."tenant_applications" USING "btree" ("status");


--
-- Name: idx_tenant_settings_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_tenant_settings_tenant" ON "public"."tenant_settings" USING "btree" ("tenant_id");


--
-- Name: idx_tenants_admin_phone; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_tenants_admin_phone" ON "public"."tenants" USING "btree" ("admin_phone");


--
-- Name: idx_tenants_contact_phone; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_tenants_contact_phone" ON "public"."tenants" USING "btree" ("contact_phone");


--
-- Name: idx_tenants_invitation_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_tenants_invitation_code" ON "public"."tenants" USING "btree" ("invitation_code");


--
-- Name: idx_tenants_invitation_code_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX IF NOT EXISTS "idx_tenants_invitation_code_unique" ON "public"."tenants" USING "btree" ("invitation_code") WHERE ("invitation_code" IS NOT NULL);


--
-- Name: idx_tenants_invitation_code_used; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_tenants_invitation_code_used" ON "public"."tenants" USING "btree" ("invitation_code_used");


--
-- Name: idx_tenants_is_demo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_tenants_is_demo" ON "public"."tenants" USING "btree" ("is_demo") WHERE ("is_demo" = true);


--
-- Name: idx_training_courses_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_training_courses_category" ON "public"."training_courses" USING "btree" ("category");


--
-- Name: idx_training_courses_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_training_courses_status" ON "public"."training_courses" USING "btree" ("status");


--
-- Name: idx_training_courses_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_training_courses_tenant" ON "public"."training_courses" USING "btree" ("tenant_id");


--
-- Name: idx_training_exams_course; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_training_exams_course" ON "public"."training_exams" USING "btree" ("course_id");


--
-- Name: idx_training_exams_employee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_training_exams_employee" ON "public"."training_exams" USING "btree" ("employee_id");


--
-- Name: idx_training_exams_record; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_training_exams_record" ON "public"."training_exams" USING "btree" ("record_id");


--
-- Name: idx_training_exams_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_training_exams_tenant" ON "public"."training_exams" USING "btree" ("tenant_id");


--
-- Name: idx_training_records_course; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_training_records_course" ON "public"."training_records" USING "btree" ("course_id");


--
-- Name: idx_training_records_employee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_training_records_employee" ON "public"."training_records" USING "btree" ("employee_id");


--
-- Name: idx_training_records_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_training_records_status" ON "public"."training_records" USING "btree" ("status");


--
-- Name: idx_training_records_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_training_records_tenant" ON "public"."training_records" USING "btree" ("tenant_id");


--
-- Name: idx_transfer_applications_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_transfer_applications_date" ON "public"."transfer_applications" USING "btree" ("application_date");


--
-- Name: idx_transfer_applications_employee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_transfer_applications_employee" ON "public"."transfer_applications" USING "btree" ("employee_id");


--
-- Name: idx_transfer_applications_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_transfer_applications_status" ON "public"."transfer_applications" USING "btree" ("status");


--
-- Name: idx_transfer_history_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_transfer_history_date" ON "public"."transfer_history" USING "btree" ("transfer_date");


--
-- Name: idx_transfer_history_employee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_transfer_history_employee" ON "public"."transfer_history" USING "btree" ("employee_id");


--
-- Name: idx_transfer_positions_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_transfer_positions_active" ON "public"."transfer_positions" USING "btree" ("is_active");


--
-- Name: idx_transfer_positions_store; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_transfer_positions_store" ON "public"."transfer_positions" USING "btree" ("store_id");


--
-- Name: idx_transfer_positions_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_transfer_positions_tenant" ON "public"."transfer_positions" USING "btree" ("tenant_id");


--
-- Name: idx_transfer_requirements_position; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_transfer_requirements_position" ON "public"."transfer_requirements" USING "btree" ("transfer_position_id");


--
-- Name: idx_transfer_reviews_application; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_transfer_reviews_application" ON "public"."transfer_reviews" USING "btree" ("application_id");


--
-- Name: idx_transfer_reviews_reviewer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_transfer_reviews_reviewer" ON "public"."transfer_reviews" USING "btree" ("reviewer_id");


--
-- Name: idx_transfers_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_transfers_date" ON "public"."staff_transfers" USING "btree" ("transfer_date");


--
-- Name: idx_transfers_employee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_transfers_employee" ON "public"."staff_transfers" USING "btree" ("employee_id");


--
-- Name: idx_transfers_from_store; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_transfers_from_store" ON "public"."staff_transfers" USING "btree" ("from_store_id");


--
-- Name: idx_transfers_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_transfers_status" ON "public"."staff_transfers" USING "btree" ("status");


--
-- Name: idx_transfers_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_transfers_tenant" ON "public"."staff_transfers" USING "btree" ("tenant_id");


--
-- Name: idx_transfers_to_store; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_transfers_to_store" ON "public"."staff_transfers" USING "btree" ("to_store_id");


--
-- Name: idx_user_permissions_module; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_user_permissions_module" ON "public"."user_module_permissions" USING "btree" ("module_id");


--
-- Name: idx_user_permissions_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_user_permissions_user" ON "public"."user_module_permissions" USING "btree" ("user_id");


--
-- Name: idx_work_attendance_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_work_attendance_date" ON "public"."work_attendance" USING "btree" ("date");


--
-- Name: idx_work_attendance_employee_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_work_attendance_employee_id" ON "public"."work_attendance" USING "btree" ("employee_id");


--
-- Name: idx_work_attendance_store_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_work_attendance_store_id" ON "public"."work_attendance" USING "btree" ("store_id");


--
-- Name: idx_work_attendance_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_work_attendance_tenant_id" ON "public"."work_attendance" USING "btree" ("tenant_id");


--
-- Name: idx_work_log_categories_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_work_log_categories_active" ON "public"."work_log_categories" USING "btree" ("tenant_id", "is_active");


--
-- Name: idx_work_log_categories_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_work_log_categories_tenant" ON "public"."work_log_categories" USING "btree" ("tenant_id");


--
-- Name: idx_work_logs_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_work_logs_date" ON "public"."work_logs" USING "btree" ("log_date");


--
-- Name: idx_work_logs_employee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_work_logs_employee" ON "public"."work_logs" USING "btree" ("employee_id");


--
-- Name: idx_work_logs_schedule_record; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_work_logs_schedule_record" ON "public"."work_logs" USING "btree" ("schedule_record_id");


--
-- Name: idx_work_ratings_log; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_work_ratings_log" ON "public"."work_ratings" USING "btree" ("work_log_id");


--
-- Name: idx_work_ratings_rater; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_work_ratings_rater" ON "public"."work_ratings" USING "btree" ("rater_id");


--
-- Name: idx_work_records_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_work_records_category" ON "public"."work_records" USING "btree" ("category_id");


--
-- Name: idx_work_records_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_work_records_created" ON "public"."work_records" USING "btree" ("tenant_id", "created_at" DESC);


--
-- Name: idx_work_records_employee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_work_records_employee" ON "public"."work_records" USING "btree" ("tenant_id", "employee_id");


--
-- Name: idx_work_records_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_work_records_tenant" ON "public"."work_records" USING "btree" ("tenant_id");


--
-- Name: idx_work_schedule_configs_dates; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_work_schedule_configs_dates" ON "public"."work_schedule_configs" USING "btree" ("start_date", "end_date");


--
-- Name: idx_work_schedule_configs_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_work_schedule_configs_status" ON "public"."work_schedule_configs" USING "btree" ("status");


--
-- Name: idx_work_schedule_configs_store; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_work_schedule_configs_store" ON "public"."work_schedule_configs" USING "btree" ("store_id");


--
-- Name: idx_work_schedule_configs_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_work_schedule_configs_tenant" ON "public"."work_schedule_configs" USING "btree" ("tenant_id");


--
-- Name: idx_work_schedule_records_config; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_work_schedule_records_config" ON "public"."work_schedule_records" USING "btree" ("config_id");


--
-- Name: idx_work_schedule_records_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_work_schedule_records_date" ON "public"."work_schedule_records" USING "btree" ("schedule_date");


--
-- Name: idx_work_schedule_records_employee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_work_schedule_records_employee" ON "public"."work_schedule_records" USING "btree" ("employee_id");


--
-- Name: idx_work_schedule_records_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_work_schedule_records_status" ON "public"."work_schedule_records" USING "btree" ("status");


--
-- Name: idx_work_shifts_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_work_shifts_order" ON "public"."work_shifts" USING "btree" ("tenant_id", "shift_order");


--
-- Name: idx_work_shifts_store; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_work_shifts_store" ON "public"."work_shifts" USING "btree" ("store_id");


--
-- Name: idx_work_shifts_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_work_shifts_tenant" ON "public"."work_shifts" USING "btree" ("tenant_id");


--
-- Name: idx_work_shifts_time_periods; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_work_shifts_time_periods" ON "public"."work_shifts" USING "gin" ("time_periods");


--
-- Name: benefit_types benefit_types_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE OR REPLACE TRIGGER "benefit_types_updated_at" BEFORE UPDATE ON "public"."benefit_types" FOR EACH ROW EXECUTE FUNCTION "public"."update_benefit_types_updated_at"();


--
-- Name: benefit_usage_records benefit_usage_records_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE OR REPLACE TRIGGER "benefit_usage_records_updated_at" BEFORE UPDATE ON "public"."benefit_usage_records" FOR EACH ROW EXECUTE FUNCTION "public"."update_benefit_usage_records_updated_at"();


--
-- Name: employee_certifications certifications_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE OR REPLACE TRIGGER "certifications_updated_at" BEFORE UPDATE ON "public"."employee_certifications" FOR EACH ROW EXECUTE FUNCTION "public"."update_certifications_updated_at"();


--
-- Name: offboarding_applications create_offboarding_history_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE OR REPLACE TRIGGER "create_offboarding_history_trigger" AFTER UPDATE ON "public"."offboarding_applications" FOR EACH ROW EXECUTE FUNCTION "public"."create_offboarding_history_on_approval"();


--
-- Name: onboarding_applications create_onboarding_history_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE OR REPLACE TRIGGER "create_onboarding_history_trigger" AFTER UPDATE ON "public"."onboarding_applications" FOR EACH ROW EXECUTE FUNCTION "public"."create_onboarding_history_on_approval"();


--
-- Name: promotion_applications create_promotion_history_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE OR REPLACE TRIGGER "create_promotion_history_trigger" AFTER UPDATE ON "public"."promotion_applications" FOR EACH ROW EXECUTE FUNCTION "public"."create_promotion_history_on_approval"();


--
-- Name: transfer_applications create_transfer_history_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE OR REPLACE TRIGGER "create_transfer_history_trigger" AFTER UPDATE ON "public"."transfer_applications" FOR EACH ROW EXECUTE FUNCTION "public"."create_transfer_history_on_approval"();


--
-- Name: employee_benefits employee_benefits_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE OR REPLACE TRIGGER "employee_benefits_updated_at" BEFORE UPDATE ON "public"."employee_benefits" FOR EACH ROW EXECUTE FUNCTION "public"."update_employee_benefits_updated_at"();


--
-- Name: employee_levels employee_levels_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE OR REPLACE TRIGGER "employee_levels_updated_at" BEFORE UPDATE ON "public"."employee_levels" FOR EACH ROW EXECUTE FUNCTION "public"."update_employee_levels_updated_at"();


--
-- Name: employee_shifts employee_shifts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE OR REPLACE TRIGGER "employee_shifts_updated_at" BEFORE UPDATE ON "public"."employee_shifts" FOR EACH ROW EXECUTE FUNCTION "public"."update_employee_shifts_updated_at"();


--
-- Name: performance_goals goals_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE OR REPLACE TRIGGER "goals_updated_at" BEFORE UPDATE ON "public"."performance_goals" FOR EACH ROW EXECUTE FUNCTION "public"."update_goals_updated_at"();


--
-- Name: performance_improvements improvements_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE OR REPLACE TRIGGER "improvements_updated_at" BEFORE UPDATE ON "public"."performance_improvements" FOR EACH ROW EXECUTE FUNCTION "public"."update_improvements_updated_at"();


--
-- Name: leave_requests leave_balance_update; Type: TRIGGER; Schema: public; Owner: -
--

CREATE OR REPLACE TRIGGER "leave_balance_update" AFTER UPDATE ON "public"."leave_requests" FOR EACH ROW EXECUTE FUNCTION "public"."update_leave_balance_on_approval"();


--
-- Name: leave_balances leave_balances_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE OR REPLACE TRIGGER "leave_balances_updated_at" BEFORE UPDATE ON "public"."leave_balances" FOR EACH ROW EXECUTE FUNCTION "public"."update_leave_balances_updated_at"();


--
-- Name: leave_requests leave_requests_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE OR REPLACE TRIGGER "leave_requests_updated_at" BEFORE UPDATE ON "public"."leave_requests" FOR EACH ROW EXECUTE FUNCTION "public"."update_leave_requests_updated_at"();


--
-- Name: leave_types leave_types_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE OR REPLACE TRIGGER "leave_types_updated_at" BEFORE UPDATE ON "public"."leave_types" FOR EACH ROW EXECUTE FUNCTION "public"."update_leave_types_updated_at"();


--
-- Name: offboarding_applications offboarding_applications_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE OR REPLACE TRIGGER "offboarding_applications_updated_at" BEFORE UPDATE ON "public"."offboarding_applications" FOR EACH ROW EXECUTE FUNCTION "public"."update_offboarding_applications_updated_at"();


--
-- Name: offboarding_handovers offboarding_handovers_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE OR REPLACE TRIGGER "offboarding_handovers_updated_at" BEFORE UPDATE ON "public"."offboarding_handovers" FOR EACH ROW EXECUTE FUNCTION "public"."update_offboarding_handovers_updated_at"();


--
-- Name: offboarding_history offboarding_history_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE OR REPLACE TRIGGER "offboarding_history_updated_at" BEFORE UPDATE ON "public"."offboarding_history" FOR EACH ROW EXECUTE FUNCTION "public"."update_offboarding_history_updated_at"();


--
-- Name: offboarding_interviews offboarding_interviews_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE OR REPLACE TRIGGER "offboarding_interviews_updated_at" BEFORE UPDATE ON "public"."offboarding_interviews" FOR EACH ROW EXECUTE FUNCTION "public"."update_offboarding_interviews_updated_at"();


--
-- Name: offboarding_tasks offboarding_tasks_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE OR REPLACE TRIGGER "offboarding_tasks_updated_at" BEFORE UPDATE ON "public"."offboarding_tasks" FOR EACH ROW EXECUTE FUNCTION "public"."update_offboarding_tasks_updated_at"();


--
-- Name: onboarding_applications onboarding_applications_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE OR REPLACE TRIGGER "onboarding_applications_updated_at" BEFORE UPDATE ON "public"."onboarding_applications" FOR EACH ROW EXECUTE FUNCTION "public"."update_onboarding_applications_updated_at"();


--
-- Name: onboarding_documents onboarding_documents_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE OR REPLACE TRIGGER "onboarding_documents_updated_at" BEFORE UPDATE ON "public"."onboarding_documents" FOR EACH ROW EXECUTE FUNCTION "public"."update_onboarding_documents_updated_at"();


--
-- Name: onboarding_history onboarding_history_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE OR REPLACE TRIGGER "onboarding_history_updated_at" BEFORE UPDATE ON "public"."onboarding_history" FOR EACH ROW EXECUTE FUNCTION "public"."update_onboarding_history_updated_at"();


--
-- Name: onboarding_processes onboarding_processes_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE OR REPLACE TRIGGER "onboarding_processes_updated_at" BEFORE UPDATE ON "public"."onboarding_processes" FOR EACH ROW EXECUTE FUNCTION "public"."update_onboarding_processes_updated_at"();


--
-- Name: onboarding_tasks onboarding_tasks_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE OR REPLACE TRIGGER "onboarding_tasks_updated_at" BEFORE UPDATE ON "public"."onboarding_tasks" FOR EACH ROW EXECUTE FUNCTION "public"."update_onboarding_tasks_updated_at"();


--
-- Name: overtime_requests overtime_compensation_create; Type: TRIGGER; Schema: public; Owner: -
--

CREATE OR REPLACE TRIGGER "overtime_compensation_create" AFTER UPDATE ON "public"."overtime_requests" FOR EACH ROW EXECUTE FUNCTION "public"."create_overtime_compensation"();


--
-- Name: overtime_compensations overtime_compensations_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE OR REPLACE TRIGGER "overtime_compensations_updated_at" BEFORE UPDATE ON "public"."overtime_compensations" FOR EACH ROW EXECUTE FUNCTION "public"."update_overtime_compensations_updated_at"();


--
-- Name: overtime_requests overtime_requests_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE OR REPLACE TRIGGER "overtime_requests_updated_at" BEFORE UPDATE ON "public"."overtime_requests" FOR EACH ROW EXECUTE FUNCTION "public"."update_overtime_requests_updated_at"();


--
-- Name: overtime_types overtime_types_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE OR REPLACE TRIGGER "overtime_types_updated_at" BEFORE UPDATE ON "public"."overtime_types" FOR EACH ROW EXECUTE FUNCTION "public"."update_overtime_types_updated_at"();


--
-- Name: employee_performance performance_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE OR REPLACE TRIGGER "performance_updated_at" BEFORE UPDATE ON "public"."employee_performance" FOR EACH ROW EXECUTE FUNCTION "public"."update_performance_updated_at"();


--
-- Name: promotion_applications promotion_applications_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE OR REPLACE TRIGGER "promotion_applications_updated_at" BEFORE UPDATE ON "public"."promotion_applications" FOR EACH ROW EXECUTE FUNCTION "public"."update_promotion_applications_updated_at"();


--
-- Name: promotion_history promotion_history_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE OR REPLACE TRIGGER "promotion_history_updated_at" BEFORE UPDATE ON "public"."promotion_history" FOR EACH ROW EXECUTE FUNCTION "public"."update_promotion_history_updated_at"();


--
-- Name: promotion_paths promotion_paths_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE OR REPLACE TRIGGER "promotion_paths_updated_at" BEFORE UPDATE ON "public"."promotion_paths" FOR EACH ROW EXECUTE FUNCTION "public"."update_promotion_paths_updated_at"();


--
-- Name: promotion_requirements promotion_requirements_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE OR REPLACE TRIGGER "promotion_requirements_updated_at" BEFORE UPDATE ON "public"."promotion_requirements" FOR EACH ROW EXECUTE FUNCTION "public"."update_promotion_requirements_updated_at"();


--
-- Name: promotion_reviews promotion_reviews_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE OR REPLACE TRIGGER "promotion_reviews_updated_at" BEFORE UPDATE ON "public"."promotion_reviews" FOR EACH ROW EXECUTE FUNCTION "public"."update_promotion_reviews_updated_at"();


--
-- Name: salary_records salary_records_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE OR REPLACE TRIGGER "salary_records_updated_at" BEFORE UPDATE ON "public"."salary_records" FOR EACH ROW EXECUTE FUNCTION "public"."update_salary_records_updated_at"();


--
-- Name: salary_structures salary_structures_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE OR REPLACE TRIGGER "salary_structures_updated_at" BEFORE UPDATE ON "public"."salary_structures" FOR EACH ROW EXECUTE FUNCTION "public"."update_salary_structures_updated_at"();


--
-- Name: tasks set_task_completed_at_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE OR REPLACE TRIGGER "set_task_completed_at_trigger" BEFORE UPDATE ON "public"."tasks" FOR EACH ROW EXECUTE FUNCTION "public"."set_task_completed_at"();


--
-- Name: shift_swap_requests shift_swap_requests_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE OR REPLACE TRIGGER "shift_swap_requests_updated_at" BEFORE UPDATE ON "public"."shift_swap_requests" FOR EACH ROW EXECUTE FUNCTION "public"."update_shift_swap_requests_updated_at"();


--
-- Name: transfer_applications transfer_applications_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE OR REPLACE TRIGGER "transfer_applications_updated_at" BEFORE UPDATE ON "public"."transfer_applications" FOR EACH ROW EXECUTE FUNCTION "public"."update_transfer_applications_updated_at"();


--
-- Name: transfer_history transfer_history_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE OR REPLACE TRIGGER "transfer_history_updated_at" BEFORE UPDATE ON "public"."transfer_history" FOR EACH ROW EXECUTE FUNCTION "public"."update_transfer_history_updated_at"();


--
-- Name: transfer_positions transfer_positions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE OR REPLACE TRIGGER "transfer_positions_updated_at" BEFORE UPDATE ON "public"."transfer_positions" FOR EACH ROW EXECUTE FUNCTION "public"."update_transfer_positions_updated_at"();


--
-- Name: transfer_requirements transfer_requirements_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE OR REPLACE TRIGGER "transfer_requirements_updated_at" BEFORE UPDATE ON "public"."transfer_requirements" FOR EACH ROW EXECUTE FUNCTION "public"."update_transfer_requirements_updated_at"();


--
-- Name: transfer_reviews transfer_reviews_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE OR REPLACE TRIGGER "transfer_reviews_updated_at" BEFORE UPDATE ON "public"."transfer_reviews" FOR EACH ROW EXECUTE FUNCTION "public"."update_transfer_reviews_updated_at"();


--
-- Name: revenue_detail_records trigger_calculate_total_revenue; Type: TRIGGER; Schema: public; Owner: -
--

CREATE OR REPLACE TRIGGER "trigger_calculate_total_revenue" BEFORE INSERT OR UPDATE ON "public"."revenue_detail_records" FOR EACH ROW EXECUTE FUNCTION "public"."calculate_total_revenue"();


--
-- Name: tenants trigger_create_default_work_log_categories; Type: TRIGGER; Schema: public; Owner: -
--

CREATE OR REPLACE TRIGGER "trigger_create_default_work_log_categories" AFTER INSERT ON "public"."tenants" FOR EACH ROW EXECUTE FUNCTION "public"."create_default_work_log_categories"();


--
-- Name: agent_assignments trigger_update_agent_assignments_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE OR REPLACE TRIGGER "trigger_update_agent_assignments_updated_at" BEFORE UPDATE ON "public"."agent_assignments" FOR EACH ROW EXECUTE FUNCTION "public"."update_agent_assignments_updated_at"();


--
-- Name: brands trigger_update_brands_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE OR REPLACE TRIGGER "trigger_update_brands_updated_at" BEFORE UPDATE ON "public"."brands" FOR EACH ROW EXECUTE FUNCTION "public"."update_brands_updated_at"();


--
-- Name: dashboard_widgets trigger_update_dashboard_widgets_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE OR REPLACE TRIGGER "trigger_update_dashboard_widgets_updated_at" BEFORE UPDATE ON "public"."dashboard_widgets" FOR EACH ROW EXECUTE FUNCTION "public"."update_dashboard_widgets_updated_at"();


--
-- Name: departments trigger_update_departments_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE OR REPLACE TRIGGER "trigger_update_departments_updated_at" BEFORE UPDATE ON "public"."departments" FOR EACH ROW EXECUTE FUNCTION "public"."update_departments_updated_at"();


--
-- Name: leave_requests trigger_update_leave_requests_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE OR REPLACE TRIGGER "trigger_update_leave_requests_updated_at" BEFORE UPDATE ON "public"."leave_requests" FOR EACH ROW EXECUTE FUNCTION "public"."update_leave_requests_updated_at"();


--
-- Name: tenant_applications trigger_update_tenant_applications_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE OR REPLACE TRIGGER "trigger_update_tenant_applications_updated_at" BEFORE UPDATE ON "public"."tenant_applications" FOR EACH ROW EXECUTE FUNCTION "public"."update_tenant_applications_updated_at"();


--
-- Name: employees trigger_update_tenant_employee_count; Type: TRIGGER; Schema: public; Owner: -
--

CREATE OR REPLACE TRIGGER "trigger_update_tenant_employee_count" AFTER INSERT OR DELETE ON "public"."employees" FOR EACH ROW EXECUTE FUNCTION "public"."update_tenant_employee_count"();


--
-- Name: stores trigger_update_tenant_store_count; Type: TRIGGER; Schema: public; Owner: -
--

CREATE OR REPLACE TRIGGER "trigger_update_tenant_store_count" AFTER INSERT OR DELETE ON "public"."stores" FOR EACH ROW EXECUTE FUNCTION "public"."update_tenant_store_count"();


--
-- Name: employee_work_info update_employee_work_info_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE OR REPLACE TRIGGER "update_employee_work_info_updated_at" BEFORE UPDATE ON "public"."employee_work_info" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();


--
-- Name: handbook_reading_progress update_handbook_reading_progress_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE OR REPLACE TRIGGER "update_handbook_reading_progress_updated_at" BEFORE UPDATE ON "public"."handbook_reading_progress" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();


--
-- Name: hr_messages update_hr_messages_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE OR REPLACE TRIGGER "update_hr_messages_updated_at" BEFORE UPDATE ON "public"."hr_messages" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();


--
-- Name: recruitment_positions update_recruitment_positions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE OR REPLACE TRIGGER "update_recruitment_positions_updated_at" BEFORE UPDATE ON "public"."recruitment_positions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();


--
-- Name: tasks update_tasks_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE OR REPLACE TRIGGER "update_tasks_updated_at" BEFORE UPDATE ON "public"."tasks" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();


--
-- Name: training_courses update_training_courses_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE OR REPLACE TRIGGER "update_training_courses_updated_at" BEFORE UPDATE ON "public"."training_courses" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();


--
-- Name: training_exams update_training_exams_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE OR REPLACE TRIGGER "update_training_exams_updated_at" BEFORE UPDATE ON "public"."training_exams" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();


--
-- Name: training_records update_training_records_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE OR REPLACE TRIGGER "update_training_records_updated_at" BEFORE UPDATE ON "public"."training_records" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();


--
-- Name: work_attendance update_work_attendance_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE OR REPLACE TRIGGER "update_work_attendance_updated_at" BEFORE UPDATE ON "public"."work_attendance" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();


--
-- Name: work_log_categories update_work_log_categories_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE OR REPLACE TRIGGER "update_work_log_categories_updated_at" BEFORE UPDATE ON "public"."work_log_categories" FOR EACH ROW EXECUTE FUNCTION "public"."update_work_log_updated_at"();


--
-- Name: work_records update_work_records_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE OR REPLACE TRIGGER "update_work_records_updated_at" BEFORE UPDATE ON "public"."work_records" FOR EACH ROW EXECUTE FUNCTION "public"."update_work_log_updated_at"();


--
-- Name: work_shifts update_work_shifts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE OR REPLACE TRIGGER "update_work_shifts_updated_at" BEFORE UPDATE ON "public"."work_shifts" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();


--
-- Name: work_logs work_logs_calculate_total_score; Type: TRIGGER; Schema: public; Owner: -
--

CREATE OR REPLACE TRIGGER "work_logs_calculate_total_score" BEFORE INSERT OR UPDATE ON "public"."work_logs" FOR EACH ROW EXECUTE FUNCTION "public"."calculate_work_log_total_score"();


--
-- Name: work_logs work_logs_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE OR REPLACE TRIGGER "work_logs_updated_at" BEFORE UPDATE ON "public"."work_logs" FOR EACH ROW EXECUTE FUNCTION "public"."update_work_schedule_updated_at"();


--
-- Name: work_schedule_configs work_schedule_configs_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE OR REPLACE TRIGGER "work_schedule_configs_updated_at" BEFORE UPDATE ON "public"."work_schedule_configs" FOR EACH ROW EXECUTE FUNCTION "public"."update_work_schedule_updated_at"();


--
-- Name: work_schedule_records work_schedule_records_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE OR REPLACE TRIGGER "work_schedule_records_updated_at" BEFORE UPDATE ON "public"."work_schedule_records" FOR EACH ROW EXECUTE FUNCTION "public"."update_work_schedule_updated_at"();


--
-- Name: agent_assignments agent_assignments_agent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'agent_assignments_agent_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'agent_assignments'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."agent_assignments"
    ADD CONSTRAINT "agent_assignments_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: agent_assignments agent_assignments_assigned_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'agent_assignments_assigned_by_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'agent_assignments'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."agent_assignments"
    ADD CONSTRAINT "agent_assignments_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "public"."profiles"("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: agent_assignments agent_assignments_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'agent_assignments_store_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'agent_assignments'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."agent_assignments"
    ADD CONSTRAINT "agent_assignments_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: agent_assignments agent_assignments_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'agent_assignments_tenant_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'agent_assignments'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."agent_assignments"
    ADD CONSTRAINT "agent_assignments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: area_daily_status area_daily_status_area_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'area_daily_status_area_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'area_daily_status'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."area_daily_status"
    ADD CONSTRAINT "area_daily_status_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "public"."business_areas"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: area_positions area_positions_area_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'area_positions_area_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'area_positions'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."area_positions"
    ADD CONSTRAINT "area_positions_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "public"."business_areas"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: area_staff_assignments area_staff_assignments_area_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'area_staff_assignments_area_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'area_staff_assignments'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."area_staff_assignments"
    ADD CONSTRAINT "area_staff_assignments_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "public"."business_areas"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: area_staff_assignments area_staff_assignments_area_position_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'area_staff_assignments_area_position_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'area_staff_assignments'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."area_staff_assignments"
    ADD CONSTRAINT "area_staff_assignments_area_position_id_fkey" FOREIGN KEY ("area_position_id") REFERENCES "public"."area_positions"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'audit_logs_user_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'audit_logs'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: backup_position_config backup_position_config_backup_position_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'backup_position_config_backup_position_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'backup_position_config'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."backup_position_config"
    ADD CONSTRAINT "backup_position_config_backup_position_id_fkey" FOREIGN KEY ("backup_position_id") REFERENCES "public"."positions"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: backup_position_config backup_position_config_primary_position_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'backup_position_config_primary_position_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'backup_position_config'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."backup_position_config"
    ADD CONSTRAINT "backup_position_config_primary_position_id_fkey" FOREIGN KEY ("primary_position_id") REFERENCES "public"."positions"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: benefit_types benefit_types_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'benefit_types_tenant_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'benefit_types'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."benefit_types"
    ADD CONSTRAINT "benefit_types_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: benefit_usage_records benefit_usage_records_employee_benefit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'benefit_usage_records_employee_benefit_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'benefit_usage_records'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."benefit_usage_records"
    ADD CONSTRAINT "benefit_usage_records_employee_benefit_id_fkey" FOREIGN KEY ("employee_benefit_id") REFERENCES "public"."employee_benefits"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: benefit_usage_records benefit_usage_records_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'benefit_usage_records_employee_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'benefit_usage_records'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."benefit_usage_records"
    ADD CONSTRAINT "benefit_usage_records_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: benefit_usage_records benefit_usage_records_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'benefit_usage_records_tenant_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'benefit_usage_records'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."benefit_usage_records"
    ADD CONSTRAINT "benefit_usage_records_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: best_practices best_practices_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'best_practices_created_by_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'best_practices'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."best_practices"
    ADD CONSTRAINT "best_practices_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: best_practices best_practices_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'best_practices_store_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'best_practices'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."best_practices"
    ADD CONSTRAINT "best_practices_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: best_practices best_practices_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'best_practices_tenant_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'best_practices'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."best_practices"
    ADD CONSTRAINT "best_practices_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: brands brands_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'brands_tenant_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'brands'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."brands"
    ADD CONSTRAINT "brands_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: business_area_config business_area_config_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'business_area_config_store_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'business_area_config'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."business_area_config"
    ADD CONSTRAINT "business_area_config_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: business_area_config business_area_config_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'business_area_config_tenant_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'business_area_config'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."business_area_config"
    ADD CONSTRAINT "business_area_config_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: candidates candidates_position_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'candidates_position_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'candidates'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."candidates"
    ADD CONSTRAINT "candidates_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "public"."positions"("id") ON DELETE SET NULL;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: core_position_backup core_position_backup_core_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'core_position_backup_core_employee_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'core_position_backup'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."core_position_backup"
    ADD CONSTRAINT "core_position_backup_core_employee_id_fkey" FOREIGN KEY ("core_employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: core_position_backup core_position_backup_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'core_position_backup_created_by_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'core_position_backup'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."core_position_backup"
    ADD CONSTRAINT "core_position_backup_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: core_position_backup core_position_backup_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'core_position_backup_store_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'core_position_backup'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."core_position_backup"
    ADD CONSTRAINT "core_position_backup_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: core_position_backup core_position_backup_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'core_position_backup_tenant_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'core_position_backup'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."core_position_backup"
    ADD CONSTRAINT "core_position_backup_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: cost_data cost_data_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'cost_data_store_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'cost_data'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."cost_data"
    ADD CONSTRAINT "cost_data_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: cost_data cost_data_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'cost_data_tenant_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'cost_data'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."cost_data"
    ADD CONSTRAINT "cost_data_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: daily_operations daily_operations_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'daily_operations_store_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'daily_operations'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."daily_operations"
    ADD CONSTRAINT "daily_operations_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: daily_operations daily_operations_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'daily_operations_tenant_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'daily_operations'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."daily_operations"
    ADD CONSTRAINT "daily_operations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: daily_revenue_detail daily_revenue_detail_calendar_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'daily_revenue_detail_calendar_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'daily_revenue_detail'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."daily_revenue_detail"
    ADD CONSTRAINT "daily_revenue_detail_calendar_id_fkey" FOREIGN KEY ("calendar_id") REFERENCES "public"."revenue_calendar"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: dashboard_quick_actions dashboard_quick_actions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'dashboard_quick_actions_user_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'dashboard_quick_actions'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."dashboard_quick_actions"
    ADD CONSTRAINT "dashboard_quick_actions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: dashboard_widgets dashboard_widgets_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'dashboard_widgets_user_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'dashboard_widgets'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."dashboard_widgets"
    ADD CONSTRAINT "dashboard_widgets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: data_snapshots data_snapshots_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'data_snapshots_created_by_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'data_snapshots'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."data_snapshots"
    ADD CONSTRAINT "data_snapshots_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: data_snapshots data_snapshots_restored_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'data_snapshots_restored_by_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'data_snapshots'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."data_snapshots"
    ADD CONSTRAINT "data_snapshots_restored_by_fkey" FOREIGN KEY ("restored_by") REFERENCES "auth"."users"("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: day_off_records day_off_records_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'day_off_records_employee_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'day_off_records'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."day_off_records"
    ADD CONSTRAINT "day_off_records_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: day_off_records day_off_records_schedule_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'day_off_records_schedule_plan_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'day_off_records'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."day_off_records"
    ADD CONSTRAINT "day_off_records_schedule_plan_id_fkey" FOREIGN KEY ("schedule_plan_id") REFERENCES "public"."schedule_plans"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: departments departments_manager_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'departments_manager_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'departments'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."departments"
    ADD CONSTRAINT "departments_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "public"."employees"("id") ON DELETE SET NULL;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: departments departments_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'departments_parent_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'departments'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."departments"
    ADD CONSTRAINT "departments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."departments"("id") ON DELETE SET NULL;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: departments departments_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'departments_tenant_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'departments'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."departments"
    ADD CONSTRAINT "departments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: efficiency_standards efficiency_standards_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'efficiency_standards_store_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'efficiency_standards'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."efficiency_standards"
    ADD CONSTRAINT "efficiency_standards_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: efficiency_standards efficiency_standards_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'efficiency_standards_tenant_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'efficiency_standards'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."efficiency_standards"
    ADD CONSTRAINT "efficiency_standards_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: employee_benefits employee_benefits_benefit_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'employee_benefits_benefit_type_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'employee_benefits'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."employee_benefits"
    ADD CONSTRAINT "employee_benefits_benefit_type_id_fkey" FOREIGN KEY ("benefit_type_id") REFERENCES "public"."benefit_types"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: employee_benefits employee_benefits_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'employee_benefits_employee_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'employee_benefits'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."employee_benefits"
    ADD CONSTRAINT "employee_benefits_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: employee_benefits employee_benefits_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'employee_benefits_tenant_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'employee_benefits'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."employee_benefits"
    ADD CONSTRAINT "employee_benefits_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: employee_certifications employee_certifications_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'employee_certifications_employee_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'employee_certifications'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."employee_certifications"
    ADD CONSTRAINT "employee_certifications_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: employee_certifications employee_certifications_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'employee_certifications_tenant_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'employee_certifications'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."employee_certifications"
    ADD CONSTRAINT "employee_certifications_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: employee_levels employee_levels_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'employee_levels_employee_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'employee_levels'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."employee_levels"
    ADD CONSTRAINT "employee_levels_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: employee_levels employee_levels_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'employee_levels_tenant_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'employee_levels'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."employee_levels"
    ADD CONSTRAINT "employee_levels_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: employee_onboarding employee_onboarding_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'employee_onboarding_approved_by_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'employee_onboarding'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."employee_onboarding"
    ADD CONSTRAINT "employee_onboarding_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: employee_onboarding employee_onboarding_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'employee_onboarding_created_by_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'employee_onboarding'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."employee_onboarding"
    ADD CONSTRAINT "employee_onboarding_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: employee_onboarding employee_onboarding_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'employee_onboarding_store_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'employee_onboarding'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."employee_onboarding"
    ADD CONSTRAINT "employee_onboarding_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: employee_onboarding employee_onboarding_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'employee_onboarding_tenant_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'employee_onboarding'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."employee_onboarding"
    ADD CONSTRAINT "employee_onboarding_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: employee_performance employee_performance_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'employee_performance_employee_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'employee_performance'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."employee_performance"
    ADD CONSTRAINT "employee_performance_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: employee_performance employee_performance_evaluator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'employee_performance_evaluator_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'employee_performance'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."employee_performance"
    ADD CONSTRAINT "employee_performance_evaluator_id_fkey" FOREIGN KEY ("evaluator_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: employee_performance employee_performance_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'employee_performance_tenant_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'employee_performance'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."employee_performance"
    ADD CONSTRAINT "employee_performance_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: employee_positions employee_positions_position_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'employee_positions_position_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'employee_positions'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."employee_positions"
    ADD CONSTRAINT "employee_positions_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "public"."positions"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: employee_resignation employee_resignation_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'employee_resignation_approved_by_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'employee_resignation'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."employee_resignation"
    ADD CONSTRAINT "employee_resignation_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: employee_resignation employee_resignation_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'employee_resignation_employee_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'employee_resignation'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."employee_resignation"
    ADD CONSTRAINT "employee_resignation_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: employee_resignation employee_resignation_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'employee_resignation_store_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'employee_resignation'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."employee_resignation"
    ADD CONSTRAINT "employee_resignation_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: employee_resignation employee_resignation_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'employee_resignation_tenant_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'employee_resignation'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."employee_resignation"
    ADD CONSTRAINT "employee_resignation_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: employee_shifts employee_shifts_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'employee_shifts_employee_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'employee_shifts'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."employee_shifts"
    ADD CONSTRAINT "employee_shifts_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: employee_shifts employee_shifts_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'employee_shifts_store_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'employee_shifts'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."employee_shifts"
    ADD CONSTRAINT "employee_shifts_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE SET NULL;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: employee_shifts employee_shifts_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'employee_shifts_tenant_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'employee_shifts'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."employee_shifts"
    ADD CONSTRAINT "employee_shifts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: employee_work_info employee_work_info_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'employee_work_info_employee_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'employee_work_info'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."employee_work_info"
    ADD CONSTRAINT "employee_work_info_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: employee_work_info employee_work_info_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'employee_work_info_tenant_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'employee_work_info'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."employee_work_info"
    ADD CONSTRAINT "employee_work_info_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: employees employees_brand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'employees_brand_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'employees'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: employees employees_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'employees_department_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'employees'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE SET NULL;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: employees employees_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'employees_store_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'employees'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: employees employees_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'employees_tenant_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'employees'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: employees employees_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'employees_user_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'employees'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: exit_interview exit_interview_interviewer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'exit_interview_interviewer_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'exit_interview'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."exit_interview"
    ADD CONSTRAINT "exit_interview_interviewer_id_fkey" FOREIGN KEY ("interviewer_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: exit_interview exit_interview_resignation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'exit_interview_resignation_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'exit_interview'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."exit_interview"
    ADD CONSTRAINT "exit_interview_resignation_id_fkey" FOREIGN KEY ("resignation_id") REFERENCES "public"."employee_resignation"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: exit_interviews exit_interviews_resignation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'exit_interviews_resignation_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'exit_interviews'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."exit_interviews"
    ADD CONSTRAINT "exit_interviews_resignation_id_fkey" FOREIGN KEY ("resignation_id") REFERENCES "public"."resignation_requests"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: schedule_results fk_previous_result; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'fk_previous_result'
      AND n.nspname = 'public'
      AND c.relname = 'schedule_results'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."schedule_results"
    ADD CONSTRAINT "fk_previous_result" FOREIGN KEY ("previous_result_id") REFERENCES "public"."schedule_results"("id") ON DELETE SET NULL;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: handbook_reading_progress handbook_reading_progress_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'handbook_reading_progress_employee_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'handbook_reading_progress'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."handbook_reading_progress"
    ADD CONSTRAINT "handbook_reading_progress_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: handbook_reading_progress handbook_reading_progress_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'handbook_reading_progress_tenant_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'handbook_reading_progress'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."handbook_reading_progress"
    ADD CONSTRAINT "handbook_reading_progress_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: help_article_feedback help_article_feedback_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'help_article_feedback_employee_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'help_article_feedback'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."help_article_feedback"
    ADD CONSTRAINT "help_article_feedback_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: help_article_feedback help_article_feedback_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'help_article_feedback_tenant_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'help_article_feedback'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."help_article_feedback"
    ADD CONSTRAINT "help_article_feedback_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: hr_messages hr_messages_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'hr_messages_employee_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'hr_messages'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."hr_messages"
    ADD CONSTRAINT "hr_messages_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: hr_messages hr_messages_replied_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'hr_messages_replied_by_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'hr_messages'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."hr_messages"
    ADD CONSTRAINT "hr_messages_replied_by_fkey" FOREIGN KEY ("replied_by") REFERENCES "public"."profiles"("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: hr_messages hr_messages_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'hr_messages_tenant_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'hr_messages'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."hr_messages"
    ADD CONSTRAINT "hr_messages_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: impact_factors impact_factors_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'impact_factors_created_by_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'impact_factors'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."impact_factors"
    ADD CONSTRAINT "impact_factors_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: impact_factors impact_factors_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'impact_factors_tenant_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'impact_factors'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."impact_factors"
    ADD CONSTRAINT "impact_factors_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: interviews interviews_candidate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'interviews_candidate_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'interviews'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."interviews"
    ADD CONSTRAINT "interviews_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: invitation_code_uses invitation_code_uses_invitation_code_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'invitation_code_uses_invitation_code_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'invitation_code_uses'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."invitation_code_uses"
    ADD CONSTRAINT "invitation_code_uses_invitation_code_id_fkey" FOREIGN KEY ("invitation_code_id") REFERENCES "public"."invitation_codes"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: invitation_code_uses invitation_code_uses_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'invitation_code_uses_user_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'invitation_code_uses'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."invitation_code_uses"
    ADD CONSTRAINT "invitation_code_uses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: invitation_codes invitation_codes_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'invitation_codes_created_by_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'invitation_codes'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."invitation_codes"
    ADD CONSTRAINT "invitation_codes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: invitation_codes invitation_codes_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'invitation_codes_store_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'invitation_codes'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."invitation_codes"
    ADD CONSTRAINT "invitation_codes_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE SET NULL;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: invitation_codes invitation_codes_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'invitation_codes_tenant_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'invitation_codes'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."invitation_codes"
    ADD CONSTRAINT "invitation_codes_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: learning_achievements learning_achievements_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'learning_achievements_employee_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'learning_achievements'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."learning_achievements"
    ADD CONSTRAINT "learning_achievements_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: learning_achievements learning_achievements_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'learning_achievements_tenant_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'learning_achievements'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."learning_achievements"
    ADD CONSTRAINT "learning_achievements_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: leave_balances leave_balances_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'leave_balances_employee_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'leave_balances'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."leave_balances"
    ADD CONSTRAINT "leave_balances_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: leave_balances leave_balances_leave_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'leave_balances_leave_type_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'leave_balances'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."leave_balances"
    ADD CONSTRAINT "leave_balances_leave_type_id_fkey" FOREIGN KEY ("leave_type_id") REFERENCES "public"."leave_types"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: leave_balances leave_balances_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'leave_balances_tenant_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'leave_balances'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."leave_balances"
    ADD CONSTRAINT "leave_balances_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: leave_types leave_types_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'leave_types_tenant_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'leave_types'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."leave_types"
    ADD CONSTRAINT "leave_types_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: meal_periods meal_periods_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'meal_periods_store_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'meal_periods'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."meal_periods"
    ADD CONSTRAINT "meal_periods_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: meal_periods meal_periods_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'meal_periods_tenant_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'meal_periods'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."meal_periods"
    ADD CONSTRAINT "meal_periods_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: min_revenue_position_config min_revenue_position_config_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'min_revenue_position_config_store_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'min_revenue_position_config'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."min_revenue_position_config"
    ADD CONSTRAINT "min_revenue_position_config_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: min_revenue_position_config min_revenue_position_config_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'min_revenue_position_config_tenant_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'min_revenue_position_config'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."min_revenue_position_config"
    ADD CONSTRAINT "min_revenue_position_config_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: min_revenue_positions min_revenue_positions_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'min_revenue_positions_created_by_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'min_revenue_positions'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."min_revenue_positions"
    ADD CONSTRAINT "min_revenue_positions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: min_revenue_positions min_revenue_positions_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'min_revenue_positions_store_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'min_revenue_positions'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."min_revenue_positions"
    ADD CONSTRAINT "min_revenue_positions_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: min_revenue_positions min_revenue_positions_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'min_revenue_positions_tenant_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'min_revenue_positions'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."min_revenue_positions"
    ADD CONSTRAINT "min_revenue_positions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: notifications notifications_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'notifications_tenant_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'notifications'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'notifications_user_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'notifications'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: offboarding_applications offboarding_applications_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'offboarding_applications_approved_by_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'offboarding_applications'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."offboarding_applications"
    ADD CONSTRAINT "offboarding_applications_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."employees"("id") ON DELETE SET NULL;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: offboarding_applications offboarding_applications_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'offboarding_applications_employee_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'offboarding_applications'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."offboarding_applications"
    ADD CONSTRAINT "offboarding_applications_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: offboarding_applications offboarding_applications_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'offboarding_applications_tenant_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'offboarding_applications'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."offboarding_applications"
    ADD CONSTRAINT "offboarding_applications_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: offboarding_handovers offboarding_handovers_application_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'offboarding_handovers_application_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'offboarding_handovers'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."offboarding_handovers"
    ADD CONSTRAINT "offboarding_handovers_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "public"."offboarding_applications"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: offboarding_handovers offboarding_handovers_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'offboarding_handovers_employee_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'offboarding_handovers'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."offboarding_handovers"
    ADD CONSTRAINT "offboarding_handovers_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: offboarding_handovers offboarding_handovers_handover_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'offboarding_handovers_handover_to_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'offboarding_handovers'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."offboarding_handovers"
    ADD CONSTRAINT "offboarding_handovers_handover_to_fkey" FOREIGN KEY ("handover_to") REFERENCES "public"."employees"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: offboarding_handovers offboarding_handovers_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'offboarding_handovers_tenant_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'offboarding_handovers'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."offboarding_handovers"
    ADD CONSTRAINT "offboarding_handovers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: offboarding_history offboarding_history_application_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'offboarding_history_application_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'offboarding_history'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."offboarding_history"
    ADD CONSTRAINT "offboarding_history_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "public"."offboarding_applications"("id") ON DELETE SET NULL;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: offboarding_history offboarding_history_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'offboarding_history_employee_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'offboarding_history'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."offboarding_history"
    ADD CONSTRAINT "offboarding_history_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: offboarding_history offboarding_history_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'offboarding_history_store_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'offboarding_history'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."offboarding_history"
    ADD CONSTRAINT "offboarding_history_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE SET NULL;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: offboarding_history offboarding_history_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'offboarding_history_tenant_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'offboarding_history'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."offboarding_history"
    ADD CONSTRAINT "offboarding_history_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: offboarding_interviews offboarding_interviews_application_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'offboarding_interviews_application_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'offboarding_interviews'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."offboarding_interviews"
    ADD CONSTRAINT "offboarding_interviews_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "public"."offboarding_applications"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: offboarding_interviews offboarding_interviews_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'offboarding_interviews_employee_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'offboarding_interviews'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."offboarding_interviews"
    ADD CONSTRAINT "offboarding_interviews_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: offboarding_interviews offboarding_interviews_interviewer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'offboarding_interviews_interviewer_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'offboarding_interviews'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."offboarding_interviews"
    ADD CONSTRAINT "offboarding_interviews_interviewer_id_fkey" FOREIGN KEY ("interviewer_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: offboarding_interviews offboarding_interviews_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'offboarding_interviews_tenant_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'offboarding_interviews'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."offboarding_interviews"
    ADD CONSTRAINT "offboarding_interviews_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: offboarding_tasks offboarding_tasks_application_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'offboarding_tasks_application_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'offboarding_tasks'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."offboarding_tasks"
    ADD CONSTRAINT "offboarding_tasks_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "public"."offboarding_applications"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: offboarding_tasks offboarding_tasks_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'offboarding_tasks_assigned_to_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'offboarding_tasks'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."offboarding_tasks"
    ADD CONSTRAINT "offboarding_tasks_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "public"."employees"("id") ON DELETE SET NULL;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: offboarding_tasks offboarding_tasks_completed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'offboarding_tasks_completed_by_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'offboarding_tasks'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."offboarding_tasks"
    ADD CONSTRAINT "offboarding_tasks_completed_by_fkey" FOREIGN KEY ("completed_by") REFERENCES "public"."employees"("id") ON DELETE SET NULL;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: offboarding_tasks offboarding_tasks_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'offboarding_tasks_tenant_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'offboarding_tasks'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."offboarding_tasks"
    ADD CONSTRAINT "offboarding_tasks_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: onboarding_applications onboarding_applications_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'onboarding_applications_approved_by_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'onboarding_applications'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."onboarding_applications"
    ADD CONSTRAINT "onboarding_applications_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."employees"("id") ON DELETE SET NULL;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: onboarding_applications onboarding_applications_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'onboarding_applications_employee_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'onboarding_applications'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."onboarding_applications"
    ADD CONSTRAINT "onboarding_applications_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE SET NULL;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: onboarding_applications onboarding_applications_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'onboarding_applications_store_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'onboarding_applications'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."onboarding_applications"
    ADD CONSTRAINT "onboarding_applications_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE SET NULL;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: onboarding_applications onboarding_applications_submitted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'onboarding_applications_submitted_by_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'onboarding_applications'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."onboarding_applications"
    ADD CONSTRAINT "onboarding_applications_submitted_by_fkey" FOREIGN KEY ("submitted_by") REFERENCES "public"."employees"("id") ON DELETE SET NULL;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: onboarding_applications onboarding_applications_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'onboarding_applications_tenant_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'onboarding_applications'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."onboarding_applications"
    ADD CONSTRAINT "onboarding_applications_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: onboarding_documents onboarding_documents_application_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'onboarding_documents_application_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'onboarding_documents'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."onboarding_documents"
    ADD CONSTRAINT "onboarding_documents_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "public"."onboarding_applications"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: onboarding_documents onboarding_documents_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'onboarding_documents_tenant_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'onboarding_documents'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."onboarding_documents"
    ADD CONSTRAINT "onboarding_documents_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: onboarding_documents onboarding_documents_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'onboarding_documents_uploaded_by_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'onboarding_documents'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."onboarding_documents"
    ADD CONSTRAINT "onboarding_documents_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "public"."employees"("id") ON DELETE SET NULL;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: onboarding_documents onboarding_documents_verified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'onboarding_documents_verified_by_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'onboarding_documents'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."onboarding_documents"
    ADD CONSTRAINT "onboarding_documents_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "public"."employees"("id") ON DELETE SET NULL;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: onboarding_history onboarding_history_application_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'onboarding_history_application_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'onboarding_history'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."onboarding_history"
    ADD CONSTRAINT "onboarding_history_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "public"."onboarding_applications"("id") ON DELETE SET NULL;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: onboarding_history onboarding_history_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'onboarding_history_employee_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'onboarding_history'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."onboarding_history"
    ADD CONSTRAINT "onboarding_history_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: onboarding_history onboarding_history_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'onboarding_history_store_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'onboarding_history'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."onboarding_history"
    ADD CONSTRAINT "onboarding_history_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE SET NULL;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: onboarding_history onboarding_history_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'onboarding_history_tenant_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'onboarding_history'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."onboarding_history"
    ADD CONSTRAINT "onboarding_history_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: onboarding_processes onboarding_processes_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'onboarding_processes_tenant_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'onboarding_processes'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."onboarding_processes"
    ADD CONSTRAINT "onboarding_processes_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: onboarding_tasks onboarding_tasks_application_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'onboarding_tasks_application_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'onboarding_tasks'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."onboarding_tasks"
    ADD CONSTRAINT "onboarding_tasks_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "public"."onboarding_applications"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: onboarding_tasks onboarding_tasks_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'onboarding_tasks_assigned_to_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'onboarding_tasks'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."onboarding_tasks"
    ADD CONSTRAINT "onboarding_tasks_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "public"."employees"("id") ON DELETE SET NULL;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: onboarding_tasks onboarding_tasks_completed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'onboarding_tasks_completed_by_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'onboarding_tasks'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."onboarding_tasks"
    ADD CONSTRAINT "onboarding_tasks_completed_by_fkey" FOREIGN KEY ("completed_by") REFERENCES "public"."employees"("id") ON DELETE SET NULL;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: onboarding_tasks onboarding_tasks_process_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'onboarding_tasks_process_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'onboarding_tasks'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."onboarding_tasks"
    ADD CONSTRAINT "onboarding_tasks_process_id_fkey" FOREIGN KEY ("process_id") REFERENCES "public"."onboarding_processes"("id") ON DELETE SET NULL;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: onboarding_tasks onboarding_tasks_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'onboarding_tasks_tenant_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'onboarding_tasks'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."onboarding_tasks"
    ADD CONSTRAINT "onboarding_tasks_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: operation_adjustments operation_adjustments_adjusted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'operation_adjustments_adjusted_by_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'operation_adjustments'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."operation_adjustments"
    ADD CONSTRAINT "operation_adjustments_adjusted_by_fkey" FOREIGN KEY ("adjusted_by") REFERENCES "public"."profiles"("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: operation_adjustments operation_adjustments_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'operation_adjustments_store_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'operation_adjustments'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."operation_adjustments"
    ADD CONSTRAINT "operation_adjustments_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: operation_adjustments operation_adjustments_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'operation_adjustments_tenant_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'operation_adjustments'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."operation_adjustments"
    ADD CONSTRAINT "operation_adjustments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: operations_data operations_data_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'operations_data_store_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'operations_data'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."operations_data"
    ADD CONSTRAINT "operations_data_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: operations_data operations_data_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'operations_data_tenant_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'operations_data'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."operations_data"
    ADD CONSTRAINT "operations_data_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: overtime_compensations overtime_compensations_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'overtime_compensations_employee_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'overtime_compensations'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."overtime_compensations"
    ADD CONSTRAINT "overtime_compensations_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: overtime_compensations overtime_compensations_overtime_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'overtime_compensations_overtime_request_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'overtime_compensations'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."overtime_compensations"
    ADD CONSTRAINT "overtime_compensations_overtime_request_id_fkey" FOREIGN KEY ("overtime_request_id") REFERENCES "public"."overtime_requests"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: overtime_compensations overtime_compensations_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'overtime_compensations_tenant_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'overtime_compensations'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."overtime_compensations"
    ADD CONSTRAINT "overtime_compensations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: overtime_requests overtime_requests_approver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'overtime_requests_approver_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'overtime_requests'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."overtime_requests"
    ADD CONSTRAINT "overtime_requests_approver_id_fkey" FOREIGN KEY ("approver_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: overtime_requests overtime_requests_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'overtime_requests_employee_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'overtime_requests'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."overtime_requests"
    ADD CONSTRAINT "overtime_requests_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: overtime_requests overtime_requests_overtime_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'overtime_requests_overtime_type_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'overtime_requests'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."overtime_requests"
    ADD CONSTRAINT "overtime_requests_overtime_type_id_fkey" FOREIGN KEY ("overtime_type_id") REFERENCES "public"."overtime_types"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: overtime_requests overtime_requests_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'overtime_requests_tenant_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'overtime_requests'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."overtime_requests"
    ADD CONSTRAINT "overtime_requests_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: overtime_types overtime_types_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'overtime_types_tenant_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'overtime_types'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."overtime_types"
    ADD CONSTRAINT "overtime_types_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: part_time_records part_time_records_schedule_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'part_time_records_schedule_plan_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'part_time_records'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."part_time_records"
    ADD CONSTRAINT "part_time_records_schedule_plan_id_fkey" FOREIGN KEY ("schedule_plan_id") REFERENCES "public"."schedule_plans"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: performance_goals performance_goals_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'performance_goals_created_by_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'performance_goals'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."performance_goals"
    ADD CONSTRAINT "performance_goals_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: performance_goals performance_goals_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'performance_goals_employee_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'performance_goals'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."performance_goals"
    ADD CONSTRAINT "performance_goals_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: performance_goals performance_goals_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'performance_goals_tenant_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'performance_goals'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."performance_goals"
    ADD CONSTRAINT "performance_goals_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: performance_improvements performance_improvements_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'performance_improvements_employee_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'performance_improvements'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."performance_improvements"
    ADD CONSTRAINT "performance_improvements_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: performance_improvements performance_improvements_mentor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'performance_improvements_mentor_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'performance_improvements'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."performance_improvements"
    ADD CONSTRAINT "performance_improvements_mentor_id_fkey" FOREIGN KEY ("mentor_id") REFERENCES "public"."employees"("id") ON DELETE SET NULL;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: performance_improvements performance_improvements_performance_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'performance_improvements_performance_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'performance_improvements'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."performance_improvements"
    ADD CONSTRAINT "performance_improvements_performance_id_fkey" FOREIGN KEY ("performance_id") REFERENCES "public"."employee_performance"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: performance_improvements performance_improvements_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'performance_improvements_tenant_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'performance_improvements'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."performance_improvements"
    ADD CONSTRAINT "performance_improvements_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: position_config position_config_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'position_config_tenant_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'position_config'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."position_config"
    ADD CONSTRAINT "position_config_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: position_module_permissions position_module_permissions_module_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'position_module_permissions_module_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'position_module_permissions'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."position_module_permissions"
    ADD CONSTRAINT "position_module_permissions_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "public"."system_modules"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: position_module_permissions position_module_permissions_position_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'position_module_permissions_position_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'position_module_permissions'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."position_module_permissions"
    ADD CONSTRAINT "position_module_permissions_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "public"."positions"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: probation_evaluation probation_evaluation_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'probation_evaluation_employee_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'probation_evaluation'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."probation_evaluation"
    ADD CONSTRAINT "probation_evaluation_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: probation_evaluation probation_evaluation_evaluator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'probation_evaluation_evaluator_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'probation_evaluation'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."probation_evaluation"
    ADD CONSTRAINT "probation_evaluation_evaluator_id_fkey" FOREIGN KEY ("evaluator_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: probation_evaluation probation_evaluation_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'probation_evaluation_tenant_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'probation_evaluation'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."probation_evaluation"
    ADD CONSTRAINT "probation_evaluation_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: profiles profiles_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'profiles_tenant_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'profiles'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE SET NULL;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: promotion_applications promotion_applications_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'promotion_applications_employee_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'promotion_applications'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."promotion_applications"
    ADD CONSTRAINT "promotion_applications_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: promotion_applications promotion_applications_promotion_path_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'promotion_applications_promotion_path_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'promotion_applications'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."promotion_applications"
    ADD CONSTRAINT "promotion_applications_promotion_path_id_fkey" FOREIGN KEY ("promotion_path_id") REFERENCES "public"."promotion_paths"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: promotion_applications promotion_applications_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'promotion_applications_tenant_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'promotion_applications'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."promotion_applications"
    ADD CONSTRAINT "promotion_applications_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: promotion_history promotion_history_application_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'promotion_history_application_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'promotion_history'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."promotion_history"
    ADD CONSTRAINT "promotion_history_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "public"."promotion_applications"("id") ON DELETE SET NULL;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: promotion_history promotion_history_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'promotion_history_employee_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'promotion_history'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."promotion_history"
    ADD CONSTRAINT "promotion_history_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: promotion_history promotion_history_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'promotion_history_tenant_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'promotion_history'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."promotion_history"
    ADD CONSTRAINT "promotion_history_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: promotion_paths promotion_paths_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'promotion_paths_tenant_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'promotion_paths'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."promotion_paths"
    ADD CONSTRAINT "promotion_paths_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: promotion_requirements promotion_requirements_promotion_path_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'promotion_requirements_promotion_path_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'promotion_requirements'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."promotion_requirements"
    ADD CONSTRAINT "promotion_requirements_promotion_path_id_fkey" FOREIGN KEY ("promotion_path_id") REFERENCES "public"."promotion_paths"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: promotion_requirements promotion_requirements_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'promotion_requirements_tenant_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'promotion_requirements'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."promotion_requirements"
    ADD CONSTRAINT "promotion_requirements_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: promotion_reviews promotion_reviews_application_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'promotion_reviews_application_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'promotion_reviews'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."promotion_reviews"
    ADD CONSTRAINT "promotion_reviews_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "public"."promotion_applications"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: promotion_reviews promotion_reviews_reviewer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'promotion_reviews_reviewer_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'promotion_reviews'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."promotion_reviews"
    ADD CONSTRAINT "promotion_reviews_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: promotion_reviews promotion_reviews_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'promotion_reviews_tenant_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'promotion_reviews'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."promotion_reviews"
    ADD CONSTRAINT "promotion_reviews_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: regularization_application regularization_application_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'regularization_application_approved_by_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'regularization_application'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."regularization_application"
    ADD CONSTRAINT "regularization_application_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: regularization_application regularization_application_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'regularization_application_employee_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'regularization_application'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."regularization_application"
    ADD CONSTRAINT "regularization_application_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: regularization_application regularization_application_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'regularization_application_tenant_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'regularization_application'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."regularization_application"
    ADD CONSTRAINT "regularization_application_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: resignation_handover resignation_handover_handover_to_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'resignation_handover_handover_to_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'resignation_handover'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."resignation_handover"
    ADD CONSTRAINT "resignation_handover_handover_to_id_fkey" FOREIGN KEY ("handover_to_id") REFERENCES "public"."employees"("id") ON DELETE SET NULL;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: resignation_handover resignation_handover_resignation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'resignation_handover_resignation_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'resignation_handover'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."resignation_handover"
    ADD CONSTRAINT "resignation_handover_resignation_id_fkey" FOREIGN KEY ("resignation_id") REFERENCES "public"."employee_resignation"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: rest_day_rules rest_day_rules_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'rest_day_rules_created_by_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'rest_day_rules'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."rest_day_rules"
    ADD CONSTRAINT "rest_day_rules_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: rest_day_rules rest_day_rules_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'rest_day_rules_store_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'rest_day_rules'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."rest_day_rules"
    ADD CONSTRAINT "rest_day_rules_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: rest_day_rules rest_day_rules_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'rest_day_rules_tenant_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'rest_day_rules'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."rest_day_rules"
    ADD CONSTRAINT "rest_day_rules_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: revenue_adjustment_log revenue_adjustment_log_adjusted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'revenue_adjustment_log_adjusted_by_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'revenue_adjustment_log'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."revenue_adjustment_log"
    ADD CONSTRAINT "revenue_adjustment_log_adjusted_by_fkey" FOREIGN KEY ("adjusted_by") REFERENCES "public"."profiles"("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: revenue_adjustment_log revenue_adjustment_log_calendar_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'revenue_adjustment_log_calendar_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'revenue_adjustment_log'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."revenue_adjustment_log"
    ADD CONSTRAINT "revenue_adjustment_log_calendar_id_fkey" FOREIGN KEY ("calendar_id") REFERENCES "public"."revenue_calendar"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: revenue_adjustment_log revenue_adjustment_log_daily_detail_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'revenue_adjustment_log_daily_detail_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'revenue_adjustment_log'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."revenue_adjustment_log"
    ADD CONSTRAINT "revenue_adjustment_log_daily_detail_id_fkey" FOREIGN KEY ("daily_detail_id") REFERENCES "public"."daily_revenue_detail"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: revenue_calendar revenue_calendar_confirmed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'revenue_calendar_confirmed_by_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'revenue_calendar'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."revenue_calendar"
    ADD CONSTRAINT "revenue_calendar_confirmed_by_fkey" FOREIGN KEY ("confirmed_by") REFERENCES "public"."profiles"("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: revenue_calendar revenue_calendar_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'revenue_calendar_created_by_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'revenue_calendar'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."revenue_calendar"
    ADD CONSTRAINT "revenue_calendar_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: revenue_calendar revenue_calendar_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'revenue_calendar_store_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'revenue_calendar'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."revenue_calendar"
    ADD CONSTRAINT "revenue_calendar_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: revenue_calendar revenue_calendar_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'revenue_calendar_tenant_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'revenue_calendar'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."revenue_calendar"
    ADD CONSTRAINT "revenue_calendar_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: revenue_detail_records revenue_detail_records_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'revenue_detail_records_created_by_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'revenue_detail_records'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."revenue_detail_records"
    ADD CONSTRAINT "revenue_detail_records_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: revenue_detail_records revenue_detail_records_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'revenue_detail_records_store_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'revenue_detail_records'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."revenue_detail_records"
    ADD CONSTRAINT "revenue_detail_records_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: revenue_detail_records revenue_detail_records_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'revenue_detail_records_tenant_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'revenue_detail_records'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."revenue_detail_records"
    ADD CONSTRAINT "revenue_detail_records_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: revenue_history revenue_history_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'revenue_history_created_by_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'revenue_history'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."revenue_history"
    ADD CONSTRAINT "revenue_history_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: revenue_history revenue_history_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'revenue_history_store_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'revenue_history'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."revenue_history"
    ADD CONSTRAINT "revenue_history_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: revenue_history revenue_history_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'revenue_history_tenant_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'revenue_history'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."revenue_history"
    ADD CONSTRAINT "revenue_history_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: revenue_impact_factors revenue_impact_factors_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'revenue_impact_factors_created_by_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'revenue_impact_factors'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."revenue_impact_factors"
    ADD CONSTRAINT "revenue_impact_factors_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: revenue_impact_factors revenue_impact_factors_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'revenue_impact_factors_store_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'revenue_impact_factors'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."revenue_impact_factors"
    ADD CONSTRAINT "revenue_impact_factors_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: revenue_impact_factors revenue_impact_factors_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'revenue_impact_factors_tenant_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'revenue_impact_factors'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."revenue_impact_factors"
    ADD CONSTRAINT "revenue_impact_factors_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: revenue_import_logs revenue_import_logs_imported_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'revenue_import_logs_imported_by_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'revenue_import_logs'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."revenue_import_logs"
    ADD CONSTRAINT "revenue_import_logs_imported_by_fkey" FOREIGN KEY ("imported_by") REFERENCES "public"."profiles"("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: revenue_import_logs revenue_import_logs_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'revenue_import_logs_store_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'revenue_import_logs'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."revenue_import_logs"
    ADD CONSTRAINT "revenue_import_logs_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: revenue_import_logs revenue_import_logs_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'revenue_import_logs_tenant_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'revenue_import_logs'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."revenue_import_logs"
    ADD CONSTRAINT "revenue_import_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: revenue_predictions revenue_predictions_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'revenue_predictions_store_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'revenue_predictions'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."revenue_predictions"
    ADD CONSTRAINT "revenue_predictions_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: revenue_predictions revenue_predictions_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'revenue_predictions_tenant_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'revenue_predictions'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."revenue_predictions"
    ADD CONSTRAINT "revenue_predictions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: risk_alerts risk_alerts_acknowledged_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'risk_alerts_acknowledged_by_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'risk_alerts'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."risk_alerts"
    ADD CONSTRAINT "risk_alerts_acknowledged_by_fkey" FOREIGN KEY ("acknowledged_by") REFERENCES "auth"."users"("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: risk_alerts risk_alerts_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'risk_alerts_store_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'risk_alerts'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."risk_alerts"
    ADD CONSTRAINT "risk_alerts_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: risk_alerts risk_alerts_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'risk_alerts_tenant_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'risk_alerts'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."risk_alerts"
    ADD CONSTRAINT "risk_alerts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: role_module_permissions role_module_permissions_module_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'role_module_permissions_module_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'role_module_permissions'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."role_module_permissions"
    ADD CONSTRAINT "role_module_permissions_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "public"."system_modules"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: salary_records salary_records_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'salary_records_employee_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'salary_records'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."salary_records"
    ADD CONSTRAINT "salary_records_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: salary_records salary_records_salary_structure_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'salary_records_salary_structure_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'salary_records'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."salary_records"
    ADD CONSTRAINT "salary_records_salary_structure_id_fkey" FOREIGN KEY ("salary_structure_id") REFERENCES "public"."salary_structures"("id") ON DELETE SET NULL;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: salary_records salary_records_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'salary_records_tenant_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'salary_records'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."salary_records"
    ADD CONSTRAINT "salary_records_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: salary_structures salary_structures_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'salary_structures_employee_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'salary_structures'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."salary_structures"
    ADD CONSTRAINT "salary_structures_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: salary_structures salary_structures_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'salary_structures_tenant_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'salary_structures'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."salary_structures"
    ADD CONSTRAINT "salary_structures_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: schedule_logs schedule_logs_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'schedule_logs_employee_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'schedule_logs'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."schedule_logs"
    ADD CONSTRAINT "schedule_logs_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: schedule_logs schedule_logs_schedule_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'schedule_logs_schedule_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'schedule_logs'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."schedule_logs"
    ADD CONSTRAINT "schedule_logs_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "public"."schedules"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: schedule_logs schedule_logs_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'schedule_logs_store_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'schedule_logs'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."schedule_logs"
    ADD CONSTRAINT "schedule_logs_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: schedule_logs schedule_logs_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'schedule_logs_tenant_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'schedule_logs'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."schedule_logs"
    ADD CONSTRAINT "schedule_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: schedule_plan_periods schedule_plan_periods_schedule_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'schedule_plan_periods_schedule_plan_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'schedule_plan_periods'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."schedule_plan_periods"
    ADD CONSTRAINT "schedule_plan_periods_schedule_plan_id_fkey" FOREIGN KEY ("schedule_plan_id") REFERENCES "public"."schedule_plans"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: schedule_plans schedule_plans_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'schedule_plans_store_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'schedule_plans'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."schedule_plans"
    ADD CONSTRAINT "schedule_plans_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: schedule_plans schedule_plans_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'schedule_plans_tenant_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'schedule_plans'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."schedule_plans"
    ADD CONSTRAINT "schedule_plans_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: schedules schedules_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'schedules_created_by_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'schedules'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."schedules"
    ADD CONSTRAINT "schedules_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: schedules schedules_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'schedules_employee_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'schedules'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."schedules"
    ADD CONSTRAINT "schedules_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: schedules schedules_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'schedules_store_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'schedules'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."schedules"
    ADD CONSTRAINT "schedules_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: schedules schedules_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'schedules_tenant_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'schedules'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."schedules"
    ADD CONSTRAINT "schedules_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: scheduling_optimizations scheduling_optimizations_applied_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'scheduling_optimizations_applied_by_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'scheduling_optimizations'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."scheduling_optimizations"
    ADD CONSTRAINT "scheduling_optimizations_applied_by_fkey" FOREIGN KEY ("applied_by") REFERENCES "auth"."users"("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: scheduling_optimizations scheduling_optimizations_schedule_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'scheduling_optimizations_schedule_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'scheduling_optimizations'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."scheduling_optimizations"
    ADD CONSTRAINT "scheduling_optimizations_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "public"."schedules"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: scheduling_optimizations scheduling_optimizations_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'scheduling_optimizations_tenant_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'scheduling_optimizations'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."scheduling_optimizations"
    ADD CONSTRAINT "scheduling_optimizations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: shift_swap_requests shift_swap_requests_requester_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'shift_swap_requests_requester_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'shift_swap_requests'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."shift_swap_requests"
    ADD CONSTRAINT "shift_swap_requests_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: shift_swap_requests shift_swap_requests_requester_shift_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'shift_swap_requests_requester_shift_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'shift_swap_requests'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."shift_swap_requests"
    ADD CONSTRAINT "shift_swap_requests_requester_shift_id_fkey" FOREIGN KEY ("requester_shift_id") REFERENCES "public"."employee_shifts"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: shift_swap_requests shift_swap_requests_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'shift_swap_requests_reviewed_by_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'shift_swap_requests'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."shift_swap_requests"
    ADD CONSTRAINT "shift_swap_requests_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: shift_swap_requests shift_swap_requests_target_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'shift_swap_requests_target_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'shift_swap_requests'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."shift_swap_requests"
    ADD CONSTRAINT "shift_swap_requests_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: shift_swap_requests shift_swap_requests_target_shift_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'shift_swap_requests_target_shift_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'shift_swap_requests'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."shift_swap_requests"
    ADD CONSTRAINT "shift_swap_requests_target_shift_id_fkey" FOREIGN KEY ("target_shift_id") REFERENCES "public"."employee_shifts"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: shift_swap_requests shift_swap_requests_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'shift_swap_requests_tenant_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'shift_swap_requests'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."shift_swap_requests"
    ADD CONSTRAINT "shift_swap_requests_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: staff_transfers staff_transfers_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'staff_transfers_approved_by_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'staff_transfers'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."staff_transfers"
    ADD CONSTRAINT "staff_transfers_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "auth"."users"("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: staff_transfers staff_transfers_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'staff_transfers_created_by_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'staff_transfers'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."staff_transfers"
    ADD CONSTRAINT "staff_transfers_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: staff_transfers staff_transfers_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'staff_transfers_employee_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'staff_transfers'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."staff_transfers"
    ADD CONSTRAINT "staff_transfers_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: staff_transfers staff_transfers_from_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'staff_transfers_from_store_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'staff_transfers'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."staff_transfers"
    ADD CONSTRAINT "staff_transfers_from_store_id_fkey" FOREIGN KEY ("from_store_id") REFERENCES "public"."stores"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: staff_transfers staff_transfers_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'staff_transfers_tenant_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'staff_transfers'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."staff_transfers"
    ADD CONSTRAINT "staff_transfers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: staff_transfers staff_transfers_to_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'staff_transfers_to_store_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'staff_transfers'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."staff_transfers"
    ADD CONSTRAINT "staff_transfers_to_store_id_fkey" FOREIGN KEY ("to_store_id") REFERENCES "public"."stores"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: store_hierarchy store_hierarchy_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'store_hierarchy_created_by_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'store_hierarchy'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."store_hierarchy"
    ADD CONSTRAINT "store_hierarchy_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: store_hierarchy store_hierarchy_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'store_hierarchy_store_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'store_hierarchy'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."store_hierarchy"
    ADD CONSTRAINT "store_hierarchy_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: store_hierarchy store_hierarchy_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'store_hierarchy_tenant_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'store_hierarchy'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."store_hierarchy"
    ADD CONSTRAINT "store_hierarchy_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: store_organization store_organization_parent_position_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'store_organization_parent_position_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'store_organization'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."store_organization"
    ADD CONSTRAINT "store_organization_parent_position_id_fkey" FOREIGN KEY ("parent_position_id") REFERENCES "public"."store_organization"("id") ON DELETE SET NULL;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: store_organization store_organization_position_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'store_organization_position_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'store_organization'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."store_organization"
    ADD CONSTRAINT "store_organization_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "public"."positions"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: store_position_assignments store_position_assignments_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'store_position_assignments_organization_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'store_position_assignments'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."store_position_assignments"
    ADD CONSTRAINT "store_position_assignments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."store_organization"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: stores stores_brand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'stores_brand_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'stores'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."stores"
    ADD CONSTRAINT "stores_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: stores stores_manager_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'stores_manager_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'stores'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."stores"
    ADD CONSTRAINT "stores_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: stores stores_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'stores_tenant_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'stores'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."stores"
    ADD CONSTRAINT "stores_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: system_modules system_modules_parent_module_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'system_modules_parent_module_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'system_modules'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."system_modules"
    ADD CONSTRAINT "system_modules_parent_module_id_fkey" FOREIGN KEY ("parent_module_id") REFERENCES "public"."system_modules"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: tasks tasks_assigned_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'tasks_assigned_by_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'tasks'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "public"."profiles"("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: tasks tasks_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'tasks_created_by_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'tasks'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: tasks tasks_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'tasks_employee_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'tasks'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: tasks tasks_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'tasks_tenant_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'tasks'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: tenant_applications tenant_applications_applicant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'tenant_applications_applicant_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'tenant_applications'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."tenant_applications"
    ADD CONSTRAINT "tenant_applications_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: tenant_applications tenant_applications_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'tenant_applications_reviewed_by_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'tenant_applications'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."tenant_applications"
    ADD CONSTRAINT "tenant_applications_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "public"."profiles"("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: tenant_settings tenant_settings_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'tenant_settings_tenant_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'tenant_settings'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."tenant_settings"
    ADD CONSTRAINT "tenant_settings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: training_courses training_courses_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'training_courses_tenant_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'training_courses'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."training_courses"
    ADD CONSTRAINT "training_courses_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: training_exams training_exams_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'training_exams_course_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'training_exams'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."training_exams"
    ADD CONSTRAINT "training_exams_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."training_courses"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: training_exams training_exams_record_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'training_exams_record_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'training_exams'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."training_exams"
    ADD CONSTRAINT "training_exams_record_id_fkey" FOREIGN KEY ("record_id") REFERENCES "public"."training_records"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: training_exams training_exams_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'training_exams_tenant_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'training_exams'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."training_exams"
    ADD CONSTRAINT "training_exams_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: training_records training_records_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'training_records_course_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'training_records'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."training_records"
    ADD CONSTRAINT "training_records_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."training_courses"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: training_records training_records_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'training_records_tenant_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'training_records'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."training_records"
    ADD CONSTRAINT "training_records_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: transfer_applications transfer_applications_current_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'transfer_applications_current_store_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'transfer_applications'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."transfer_applications"
    ADD CONSTRAINT "transfer_applications_current_store_id_fkey" FOREIGN KEY ("current_store_id") REFERENCES "public"."stores"("id") ON DELETE SET NULL;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: transfer_applications transfer_applications_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'transfer_applications_employee_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'transfer_applications'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."transfer_applications"
    ADD CONSTRAINT "transfer_applications_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: transfer_applications transfer_applications_target_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'transfer_applications_target_store_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'transfer_applications'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."transfer_applications"
    ADD CONSTRAINT "transfer_applications_target_store_id_fkey" FOREIGN KEY ("target_store_id") REFERENCES "public"."stores"("id") ON DELETE SET NULL;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: transfer_applications transfer_applications_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'transfer_applications_tenant_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'transfer_applications'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."transfer_applications"
    ADD CONSTRAINT "transfer_applications_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: transfer_applications transfer_applications_transfer_position_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'transfer_applications_transfer_position_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'transfer_applications'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."transfer_applications"
    ADD CONSTRAINT "transfer_applications_transfer_position_id_fkey" FOREIGN KEY ("transfer_position_id") REFERENCES "public"."transfer_positions"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: transfer_history transfer_history_application_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'transfer_history_application_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'transfer_history'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."transfer_history"
    ADD CONSTRAINT "transfer_history_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "public"."transfer_applications"("id") ON DELETE SET NULL;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: transfer_history transfer_history_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'transfer_history_employee_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'transfer_history'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."transfer_history"
    ADD CONSTRAINT "transfer_history_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: transfer_history transfer_history_from_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'transfer_history_from_store_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'transfer_history'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."transfer_history"
    ADD CONSTRAINT "transfer_history_from_store_id_fkey" FOREIGN KEY ("from_store_id") REFERENCES "public"."stores"("id") ON DELETE SET NULL;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: transfer_history transfer_history_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'transfer_history_tenant_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'transfer_history'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."transfer_history"
    ADD CONSTRAINT "transfer_history_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: transfer_history transfer_history_to_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'transfer_history_to_store_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'transfer_history'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."transfer_history"
    ADD CONSTRAINT "transfer_history_to_store_id_fkey" FOREIGN KEY ("to_store_id") REFERENCES "public"."stores"("id") ON DELETE SET NULL;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: transfer_positions transfer_positions_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'transfer_positions_store_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'transfer_positions'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."transfer_positions"
    ADD CONSTRAINT "transfer_positions_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: transfer_positions transfer_positions_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'transfer_positions_tenant_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'transfer_positions'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."transfer_positions"
    ADD CONSTRAINT "transfer_positions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: transfer_requirements transfer_requirements_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'transfer_requirements_tenant_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'transfer_requirements'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."transfer_requirements"
    ADD CONSTRAINT "transfer_requirements_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: transfer_requirements transfer_requirements_transfer_position_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'transfer_requirements_transfer_position_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'transfer_requirements'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."transfer_requirements"
    ADD CONSTRAINT "transfer_requirements_transfer_position_id_fkey" FOREIGN KEY ("transfer_position_id") REFERENCES "public"."transfer_positions"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: transfer_reviews transfer_reviews_application_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'transfer_reviews_application_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'transfer_reviews'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."transfer_reviews"
    ADD CONSTRAINT "transfer_reviews_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "public"."transfer_applications"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: transfer_reviews transfer_reviews_reviewer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'transfer_reviews_reviewer_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'transfer_reviews'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."transfer_reviews"
    ADD CONSTRAINT "transfer_reviews_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: transfer_reviews transfer_reviews_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'transfer_reviews_tenant_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'transfer_reviews'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."transfer_reviews"
    ADD CONSTRAINT "transfer_reviews_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: user_module_permissions user_module_permissions_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'user_module_permissions_created_by_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'user_module_permissions'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."user_module_permissions"
    ADD CONSTRAINT "user_module_permissions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: user_module_permissions user_module_permissions_module_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'user_module_permissions_module_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'user_module_permissions'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."user_module_permissions"
    ADD CONSTRAINT "user_module_permissions_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "public"."system_modules"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: user_module_permissions user_module_permissions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'user_module_permissions_user_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'user_module_permissions'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."user_module_permissions"
    ADD CONSTRAINT "user_module_permissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: work_attendance work_attendance_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'work_attendance_employee_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'work_attendance'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."work_attendance"
    ADD CONSTRAINT "work_attendance_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: work_attendance work_attendance_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'work_attendance_store_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'work_attendance'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."work_attendance"
    ADD CONSTRAINT "work_attendance_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE SET NULL;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: work_attendance work_attendance_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'work_attendance_tenant_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'work_attendance'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."work_attendance"
    ADD CONSTRAINT "work_attendance_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: work_log_categories work_log_categories_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'work_log_categories_tenant_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'work_log_categories'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."work_log_categories"
    ADD CONSTRAINT "work_log_categories_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: work_logs work_logs_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'work_logs_employee_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'work_logs'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."work_logs"
    ADD CONSTRAINT "work_logs_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: work_logs work_logs_schedule_record_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'work_logs_schedule_record_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'work_logs'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."work_logs"
    ADD CONSTRAINT "work_logs_schedule_record_id_fkey" FOREIGN KEY ("schedule_record_id") REFERENCES "public"."work_schedule_records"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: work_ratings work_ratings_rater_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'work_ratings_rater_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'work_ratings'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."work_ratings"
    ADD CONSTRAINT "work_ratings_rater_id_fkey" FOREIGN KEY ("rater_id") REFERENCES "public"."profiles"("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: work_ratings work_ratings_work_log_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'work_ratings_work_log_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'work_ratings'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."work_ratings"
    ADD CONSTRAINT "work_ratings_work_log_id_fkey" FOREIGN KEY ("work_log_id") REFERENCES "public"."work_logs"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: work_records work_records_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'work_records_category_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'work_records'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."work_records"
    ADD CONSTRAINT "work_records_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."work_log_categories"("id") ON DELETE RESTRICT;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: work_records work_records_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'work_records_employee_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'work_records'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."work_records"
    ADD CONSTRAINT "work_records_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: work_records work_records_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'work_records_tenant_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'work_records'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."work_records"
    ADD CONSTRAINT "work_records_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: work_schedule_configs work_schedule_configs_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'work_schedule_configs_created_by_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'work_schedule_configs'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."work_schedule_configs"
    ADD CONSTRAINT "work_schedule_configs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: work_schedule_configs work_schedule_configs_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'work_schedule_configs_store_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'work_schedule_configs'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."work_schedule_configs"
    ADD CONSTRAINT "work_schedule_configs_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: work_schedule_configs work_schedule_configs_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'work_schedule_configs_tenant_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'work_schedule_configs'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."work_schedule_configs"
    ADD CONSTRAINT "work_schedule_configs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: work_schedule_records work_schedule_records_config_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'work_schedule_records_config_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'work_schedule_records'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."work_schedule_records"
    ADD CONSTRAINT "work_schedule_records_config_id_fkey" FOREIGN KEY ("config_id") REFERENCES "public"."work_schedule_configs"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: work_schedule_records work_schedule_records_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'work_schedule_records_employee_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'work_schedule_records'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."work_schedule_records"
    ADD CONSTRAINT "work_schedule_records_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: work_shifts work_shifts_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'work_shifts_store_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'work_shifts'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."work_shifts"
    ADD CONSTRAINT "work_shifts_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: work_shifts work_shifts_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'work_shifts_tenant_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'work_shifts'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."work_shifts"
    ADD CONSTRAINT "work_shifts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: training_courses Admins can manage all courses; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'Admins can manage all courses'
      AND n.nspname = 'public'
      AND c.relname = 'training_courses'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "Admins can manage all courses" ON "public"."training_courses" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['tenant_admin'::"public"."user_role", 'super_admin'::"public"."user_role"]))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: training_exams Admins can manage all exams; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'Admins can manage all exams'
      AND n.nspname = 'public'
      AND c.relname = 'training_exams'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "Admins can manage all exams" ON "public"."training_exams" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['tenant_admin'::"public"."user_role", 'super_admin'::"public"."user_role"]))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: training_records Admins can manage all records; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'Admins can manage all records'
      AND n.nspname = 'public'
      AND c.relname = 'training_records'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "Admins can manage all records" ON "public"."training_records" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['tenant_admin'::"public"."user_role", 'super_admin'::"public"."user_role"]))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: agent_assignments Agent可以查看自己的分配; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'Agent可以查看自己的分配'
      AND n.nspname = 'public'
      AND c.relname = 'agent_assignments'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "Agent可以查看自己的分配" ON "public"."agent_assignments" FOR SELECT TO "authenticated" USING (("agent_id" = "auth"."uid"()));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: training_courses Anyone can view published courses; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'Anyone can view published courses'
      AND n.nspname = 'public'
      AND c.relname = 'training_courses'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "Anyone can view published courses" ON "public"."training_courses" FOR SELECT USING (("status" = 'published'::"public"."course_status"));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: part_time_shifts Authenticated users have full access to part_time_shifts; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'Authenticated users have full access to part_time_shifts'
      AND n.nspname = 'public'
      AND c.relname = 'part_time_shifts'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "Authenticated users have full access to part_time_shifts" ON "public"."part_time_shifts" TO "authenticated" USING (true) WITH CHECK (true);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: schedule_results Authenticated users have full access to schedule_results; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'Authenticated users have full access to schedule_results'
      AND n.nspname = 'public'
      AND c.relname = 'schedule_results'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "Authenticated users have full access to schedule_results" ON "public"."schedule_results" TO "authenticated" USING (true) WITH CHECK (true);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: training_records Employees can enroll courses; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'Employees can enroll courses'
      AND n.nspname = 'public'
      AND c.relname = 'training_records'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "Employees can enroll courses" ON "public"."training_records" FOR INSERT WITH CHECK (("employee_id" = "auth"."uid"()));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: training_records Employees can update own records; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'Employees can update own records'
      AND n.nspname = 'public'
      AND c.relname = 'training_records'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "Employees can update own records" ON "public"."training_records" FOR UPDATE USING (("employee_id" = "auth"."uid"()));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: training_exams Employees can view own exams; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'Employees can view own exams'
      AND n.nspname = 'public'
      AND c.relname = 'training_exams'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "Employees can view own exams" ON "public"."training_exams" FOR SELECT USING (("employee_id" = "auth"."uid"()));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: training_records Employees can view own records; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'Employees can view own records'
      AND n.nspname = 'public'
      AND c.relname = 'training_records'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "Employees can view own records" ON "public"."training_records" FOR SELECT USING (("employee_id" = "auth"."uid"()));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: revenue_impact_factors Guest用户可以管理demo租户影响因子; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'Guest用户可以管理demo租户影响因子'
      AND n.nspname = 'public'
      AND c.relname = 'revenue_impact_factors'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "Guest用户可以管理demo租户影响因子" ON "public"."revenue_impact_factors" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."profiles" "p"
     JOIN "public"."tenants" "t" ON (("t"."id" = "revenue_impact_factors"."tenant_id")))
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = 'guest'::"public"."user_role") AND ("t"."is_demo" = true)))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: daily_revenue_detail Guest用户可以管理demo租户每日营收明细; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'Guest用户可以管理demo租户每日营收明细'
      AND n.nspname = 'public'
      AND c.relname = 'daily_revenue_detail'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "Guest用户可以管理demo租户每日营收明细" ON "public"."daily_revenue_detail" TO "authenticated" USING (("calendar_id" IN ( SELECT "rc"."id"
   FROM (("public"."revenue_calendar" "rc"
     JOIN "public"."tenants" "t" ON (("t"."id" = "rc"."tenant_id")))
     JOIN "public"."profiles" "p" ON (("p"."id" = "auth"."uid"())))
  WHERE (("p"."role" = 'guest'::"public"."user_role") AND ("t"."is_demo" = true)))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: revenue_calendar Guest用户可以管理demo租户营收日历; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'Guest用户可以管理demo租户营收日历'
      AND n.nspname = 'public'
      AND c.relname = 'revenue_calendar'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "Guest用户可以管理demo租户营收日历" ON "public"."revenue_calendar" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."profiles" "p"
     JOIN "public"."tenants" "t" ON (("t"."id" = "revenue_calendar"."tenant_id")))
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = 'guest'::"public"."user_role") AND ("t"."is_demo" = true)))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: revenue_adjustment_log Guest用户可以管理demo租户营收调整记录; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'Guest用户可以管理demo租户营收调整记录'
      AND n.nspname = 'public'
      AND c.relname = 'revenue_adjustment_log'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "Guest用户可以管理demo租户营收调整记录" ON "public"."revenue_adjustment_log" TO "authenticated" USING (("calendar_id" IN ( SELECT "rc"."id"
   FROM (("public"."revenue_calendar" "rc"
     JOIN "public"."tenants" "t" ON (("t"."id" = "rc"."tenant_id")))
     JOIN "public"."profiles" "p" ON (("p"."id" = "auth"."uid"())))
  WHERE (("p"."role" = 'guest'::"public"."user_role") AND ("t"."is_demo" = true)))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: probation_conversion_applications HR管理员可以更新转正申请; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'HR管理员可以更新转正申请'
      AND n.nspname = 'public'
      AND c.relname = 'probation_conversion_applications'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "HR管理员可以更新转正申请" ON "public"."probation_conversion_applications" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM ("public"."employees" "e"
     JOIN "public"."profiles" "p" ON (("e"."user_id" = "p"."id")))
  WHERE (("e"."user_id" = "auth"."uid"()) AND ("e"."tenant_id" = "probation_conversion_applications"."tenant_id") AND (("p"."role" = 'tenant_admin'::"public"."user_role") OR ("p"."role" = 'super_admin'::"public"."user_role"))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: probation_conversion_applications HR管理员可以查看所有转正申请; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'HR管理员可以查看所有转正申请'
      AND n.nspname = 'public'
      AND c.relname = 'probation_conversion_applications'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "HR管理员可以查看所有转正申请" ON "public"."probation_conversion_applications" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."employees" "e"
     JOIN "public"."profiles" "p" ON (("e"."user_id" = "p"."id")))
  WHERE (("e"."user_id" = "auth"."uid"()) AND ("e"."tenant_id" = "probation_conversion_applications"."tenant_id") AND (("p"."role" = 'tenant_admin'::"public"."user_role") OR ("p"."role" = 'super_admin'::"public"."user_role"))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: business_area_config Users can manage business area config; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'Users can manage business area config'
      AND n.nspname = 'public'
      AND c.relname = 'business_area_config'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "Users can manage business area config" ON "public"."business_area_config" TO "authenticated" USING (("tenant_id" IN ( SELECT "profiles"."tenant_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: min_revenue_position_config Users can manage min revenue position config; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'Users can manage min revenue position config'
      AND n.nspname = 'public'
      AND c.relname = 'min_revenue_position_config'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "Users can manage min revenue position config" ON "public"."min_revenue_position_config" TO "authenticated" USING (("tenant_id" IN ( SELECT "profiles"."tenant_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: min_revenue_positions Users can manage min revenue positions; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'Users can manage min revenue positions'
      AND n.nspname = 'public'
      AND c.relname = 'min_revenue_positions'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "Users can manage min revenue positions" ON "public"."min_revenue_positions" TO "authenticated" USING (("tenant_id" IN ( SELECT "profiles"."tenant_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: position_config Users can manage position config; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'Users can manage position config'
      AND n.nspname = 'public'
      AND c.relname = 'position_config'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "Users can manage position config" ON "public"."position_config" TO "authenticated" USING (("tenant_id" IN ( SELECT "profiles"."tenant_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: business_area_config Users can view business area config; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'Users can view business area config'
      AND n.nspname = 'public'
      AND c.relname = 'business_area_config'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "Users can view business area config" ON "public"."business_area_config" FOR SELECT TO "authenticated" USING (("tenant_id" IN ( SELECT "profiles"."tenant_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: min_revenue_position_config Users can view min revenue position config; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'Users can view min revenue position config'
      AND n.nspname = 'public'
      AND c.relname = 'min_revenue_position_config'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "Users can view min revenue position config" ON "public"."min_revenue_position_config" FOR SELECT TO "authenticated" USING (("tenant_id" IN ( SELECT "profiles"."tenant_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: min_revenue_positions Users can view min revenue positions; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'Users can view min revenue positions'
      AND n.nspname = 'public'
      AND c.relname = 'min_revenue_positions'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "Users can view min revenue positions" ON "public"."min_revenue_positions" FOR SELECT TO "authenticated" USING (("tenant_id" IN ( SELECT "profiles"."tenant_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: position_config Users can view position config; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'Users can view position config'
      AND n.nspname = 'public'
      AND c.relname = 'position_config'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "Users can view position config" ON "public"."position_config" FOR SELECT TO "authenticated" USING (("tenant_id" IN ( SELECT "profiles"."tenant_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: agent_assignments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."agent_assignments" ENABLE ROW LEVEL SECURITY;

--
-- Name: approval_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."approval_logs" ENABLE ROW LEVEL SECURITY;

--
-- Name: area_attendance_overview; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."area_attendance_overview" ENABLE ROW LEVEL SECURITY;

--
-- Name: area_daily_status; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."area_daily_status" ENABLE ROW LEVEL SECURITY;

--
-- Name: area_positions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."area_positions" ENABLE ROW LEVEL SECURITY;

--
-- Name: area_staff_assignments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."area_staff_assignments" ENABLE ROW LEVEL SECURITY;

--
-- Name: audit_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."audit_logs" ENABLE ROW LEVEL SECURITY;

--
-- Name: backup_position_config; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."backup_position_config" ENABLE ROW LEVEL SECURITY;

--
-- Name: benefit_types; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."benefit_types" ENABLE ROW LEVEL SECURITY;

--
-- Name: benefit_usage_records; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."benefit_usage_records" ENABLE ROW LEVEL SECURITY;

--
-- Name: best_practices; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."best_practices" ENABLE ROW LEVEL SECURITY;

--
-- Name: brands; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."brands" ENABLE ROW LEVEL SECURITY;

--
-- Name: business_area_config; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."business_area_config" ENABLE ROW LEVEL SECURITY;

--
-- Name: business_areas; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."business_areas" ENABLE ROW LEVEL SECURITY;

--
-- Name: core_position_backup; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."core_position_backup" ENABLE ROW LEVEL SECURITY;

--
-- Name: cost_data; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."cost_data" ENABLE ROW LEVEL SECURITY;

--
-- Name: daily_operations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."daily_operations" ENABLE ROW LEVEL SECURITY;

--
-- Name: daily_revenue_detail; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."daily_revenue_detail" ENABLE ROW LEVEL SECURITY;

--
-- Name: dashboard_alerts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."dashboard_alerts" ENABLE ROW LEVEL SECURITY;

--
-- Name: dashboard_quick_actions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."dashboard_quick_actions" ENABLE ROW LEVEL SECURITY;

--
-- Name: dashboard_widgets; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."dashboard_widgets" ENABLE ROW LEVEL SECURITY;

--
-- Name: data_snapshots; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."data_snapshots" ENABLE ROW LEVEL SECURITY;

--
-- Name: day_off_records; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."day_off_records" ENABLE ROW LEVEL SECURITY;

--
-- Name: departments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."departments" ENABLE ROW LEVEL SECURITY;

--
-- Name: efficiency_standards; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."efficiency_standards" ENABLE ROW LEVEL SECURITY;

--
-- Name: employee_benefits; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."employee_benefits" ENABLE ROW LEVEL SECURITY;

--
-- Name: employee_certifications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."employee_certifications" ENABLE ROW LEVEL SECURITY;

--
-- Name: employee_levels; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."employee_levels" ENABLE ROW LEVEL SECURITY;

--
-- Name: employee_onboarding; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."employee_onboarding" ENABLE ROW LEVEL SECURITY;

--
-- Name: employee_performance; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."employee_performance" ENABLE ROW LEVEL SECURITY;

--
-- Name: employee_positions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."employee_positions" ENABLE ROW LEVEL SECURITY;

--
-- Name: employee_resignation; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."employee_resignation" ENABLE ROW LEVEL SECURITY;

--
-- Name: employee_shifts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."employee_shifts" ENABLE ROW LEVEL SECURITY;

--
-- Name: employee_work_info; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."employee_work_info" ENABLE ROW LEVEL SECURITY;

--
-- Name: employees; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."employees" ENABLE ROW LEVEL SECURITY;

--
-- Name: exit_interview; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."exit_interview" ENABLE ROW LEVEL SECURITY;

--
-- Name: employees guest可以查看测试员工; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'guest可以查看测试员工'
      AND n.nspname = 'public'
      AND c.relname = 'employees'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "guest可以查看测试员工" ON "public"."employees" FOR SELECT USING (((EXISTS ( SELECT 1
   FROM "public"."tenants"
  WHERE (("tenants"."id" = "employees"."tenant_id") AND ("tenants"."is_demo" = true)))) AND (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'guest'::"public"."user_role"))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: stores guest可以查看测试门店; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'guest可以查看测试门店'
      AND n.nspname = 'public'
      AND c.relname = 'stores'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "guest可以查看测试门店" ON "public"."stores" FOR SELECT USING (((EXISTS ( SELECT 1
   FROM "public"."tenants"
  WHERE (("tenants"."id" = "stores"."tenant_id") AND ("tenants"."is_demo" = true)))) AND (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'guest'::"public"."user_role"))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: tenants guest可以查看测试餐厅; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'guest可以查看测试餐厅'
      AND n.nspname = 'public'
      AND c.relname = 'tenants'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "guest可以查看测试餐厅" ON "public"."tenants" FOR SELECT USING ((("is_demo" = true) AND (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'guest'::"public"."user_role"))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: handbook_reading_progress; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."handbook_reading_progress" ENABLE ROW LEVEL SECURITY;

--
-- Name: help_article_feedback; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."help_article_feedback" ENABLE ROW LEVEL SECURITY;

--
-- Name: hr_messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."hr_messages" ENABLE ROW LEVEL SECURITY;

--
-- Name: impact_factors; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."impact_factors" ENABLE ROW LEVEL SECURITY;

--
-- Name: invitation_code_uses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."invitation_code_uses" ENABLE ROW LEVEL SECURITY;

--
-- Name: invitation_codes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."invitation_codes" ENABLE ROW LEVEL SECURITY;

--
-- Name: learning_achievements; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."learning_achievements" ENABLE ROW LEVEL SECURITY;

--
-- Name: leave_balances; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."leave_balances" ENABLE ROW LEVEL SECURITY;

--
-- Name: leave_requests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."leave_requests" ENABLE ROW LEVEL SECURITY;

--
-- Name: leave_types; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."leave_types" ENABLE ROW LEVEL SECURITY;

--
-- Name: meal_periods; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."meal_periods" ENABLE ROW LEVEL SECURITY;

--
-- Name: min_revenue_position_config; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."min_revenue_position_config" ENABLE ROW LEVEL SECURITY;

--
-- Name: min_revenue_positions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."min_revenue_positions" ENABLE ROW LEVEL SECURITY;

--
-- Name: notifications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;

--
-- Name: offboarding_applications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."offboarding_applications" ENABLE ROW LEVEL SECURITY;

--
-- Name: offboarding_handovers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."offboarding_handovers" ENABLE ROW LEVEL SECURITY;

--
-- Name: offboarding_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."offboarding_history" ENABLE ROW LEVEL SECURITY;

--
-- Name: offboarding_interviews; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."offboarding_interviews" ENABLE ROW LEVEL SECURITY;

--
-- Name: offboarding_tasks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."offboarding_tasks" ENABLE ROW LEVEL SECURITY;

--
-- Name: onboarding_applications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."onboarding_applications" ENABLE ROW LEVEL SECURITY;

--
-- Name: onboarding_documents; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."onboarding_documents" ENABLE ROW LEVEL SECURITY;

--
-- Name: onboarding_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."onboarding_history" ENABLE ROW LEVEL SECURITY;

--
-- Name: onboarding_processes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."onboarding_processes" ENABLE ROW LEVEL SECURITY;

--
-- Name: onboarding_tasks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."onboarding_tasks" ENABLE ROW LEVEL SECURITY;

--
-- Name: operation_adjustments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."operation_adjustments" ENABLE ROW LEVEL SECURITY;

--
-- Name: operations_data; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."operations_data" ENABLE ROW LEVEL SECURITY;

--
-- Name: overtime_compensations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."overtime_compensations" ENABLE ROW LEVEL SECURITY;

--
-- Name: overtime_requests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."overtime_requests" ENABLE ROW LEVEL SECURITY;

--
-- Name: overtime_types; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."overtime_types" ENABLE ROW LEVEL SECURITY;

--
-- Name: part_time_records; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."part_time_records" ENABLE ROW LEVEL SECURITY;

--
-- Name: part_time_shifts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."part_time_shifts" ENABLE ROW LEVEL SECURITY;

--
-- Name: performance_goals; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."performance_goals" ENABLE ROW LEVEL SECURITY;

--
-- Name: performance_improvements; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."performance_improvements" ENABLE ROW LEVEL SECURITY;

--
-- Name: position_config; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."position_config" ENABLE ROW LEVEL SECURITY;

--
-- Name: position_module_permissions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."position_module_permissions" ENABLE ROW LEVEL SECURITY;

--
-- Name: positions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."positions" ENABLE ROW LEVEL SECURITY;

--
-- Name: probation_conversion_applications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."probation_conversion_applications" ENABLE ROW LEVEL SECURITY;

--
-- Name: probation_evaluation; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."probation_evaluation" ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;

--
-- Name: promotion_applications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."promotion_applications" ENABLE ROW LEVEL SECURITY;

--
-- Name: promotion_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."promotion_history" ENABLE ROW LEVEL SECURITY;

--
-- Name: promotion_paths; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."promotion_paths" ENABLE ROW LEVEL SECURITY;

--
-- Name: promotion_requirements; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."promotion_requirements" ENABLE ROW LEVEL SECURITY;

--
-- Name: promotion_reviews; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."promotion_reviews" ENABLE ROW LEVEL SECURITY;

--
-- Name: recruitment_positions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."recruitment_positions" ENABLE ROW LEVEL SECURITY;

--
-- Name: regularization_application; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."regularization_application" ENABLE ROW LEVEL SECURITY;

--
-- Name: resignation_handover; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."resignation_handover" ENABLE ROW LEVEL SECURITY;

--
-- Name: rest_day_rules; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."rest_day_rules" ENABLE ROW LEVEL SECURITY;

--
-- Name: revenue_adjustment_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."revenue_adjustment_log" ENABLE ROW LEVEL SECURITY;

--
-- Name: revenue_calendar; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."revenue_calendar" ENABLE ROW LEVEL SECURITY;

--
-- Name: revenue_detail_records; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."revenue_detail_records" ENABLE ROW LEVEL SECURITY;

--
-- Name: revenue_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."revenue_history" ENABLE ROW LEVEL SECURITY;

--
-- Name: revenue_impact_factors; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."revenue_impact_factors" ENABLE ROW LEVEL SECURITY;

--
-- Name: revenue_import_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."revenue_import_logs" ENABLE ROW LEVEL SECURITY;

--
-- Name: revenue_predictions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."revenue_predictions" ENABLE ROW LEVEL SECURITY;

--
-- Name: risk_alerts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."risk_alerts" ENABLE ROW LEVEL SECURITY;

--
-- Name: role_module_permissions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."role_module_permissions" ENABLE ROW LEVEL SECURITY;

--
-- Name: salary_records; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."salary_records" ENABLE ROW LEVEL SECURITY;

--
-- Name: salary_structures; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."salary_structures" ENABLE ROW LEVEL SECURITY;

--
-- Name: schedule_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."schedule_logs" ENABLE ROW LEVEL SECURITY;

--
-- Name: schedule_plan_periods; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."schedule_plan_periods" ENABLE ROW LEVEL SECURITY;

--
-- Name: schedule_plans; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."schedule_plans" ENABLE ROW LEVEL SECURITY;

--
-- Name: schedule_results; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."schedule_results" ENABLE ROW LEVEL SECURITY;

--
-- Name: schedules; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."schedules" ENABLE ROW LEVEL SECURITY;

--
-- Name: scheduling_optimizations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."scheduling_optimizations" ENABLE ROW LEVEL SECURITY;

--
-- Name: shift_swap_requests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."shift_swap_requests" ENABLE ROW LEVEL SECURITY;

--
-- Name: staff_transfers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."staff_transfers" ENABLE ROW LEVEL SECURITY;

--
-- Name: store_hierarchy; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."store_hierarchy" ENABLE ROW LEVEL SECURITY;

--
-- Name: store_organization; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."store_organization" ENABLE ROW LEVEL SECURITY;

--
-- Name: store_position_assignments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."store_position_assignments" ENABLE ROW LEVEL SECURITY;

--
-- Name: stores; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."stores" ENABLE ROW LEVEL SECURITY;

--
-- Name: system_modules; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."system_modules" ENABLE ROW LEVEL SECURITY;

--
-- Name: tasks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."tasks" ENABLE ROW LEVEL SECURITY;

--
-- Name: tenant_applications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."tenant_applications" ENABLE ROW LEVEL SECURITY;

--
-- Name: tenant_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."tenant_settings" ENABLE ROW LEVEL SECURITY;

--
-- Name: tenants; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."tenants" ENABLE ROW LEVEL SECURITY;

--
-- Name: training_courses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."training_courses" ENABLE ROW LEVEL SECURITY;

--
-- Name: training_exams; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."training_exams" ENABLE ROW LEVEL SECURITY;

--
-- Name: training_records; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."training_records" ENABLE ROW LEVEL SECURITY;

--
-- Name: transfer_applications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."transfer_applications" ENABLE ROW LEVEL SECURITY;

--
-- Name: transfer_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."transfer_history" ENABLE ROW LEVEL SECURITY;

--
-- Name: transfer_positions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."transfer_positions" ENABLE ROW LEVEL SECURITY;

--
-- Name: transfer_requirements; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."transfer_requirements" ENABLE ROW LEVEL SECURITY;

--
-- Name: transfer_reviews; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."transfer_reviews" ENABLE ROW LEVEL SECURITY;

--
-- Name: user_module_permissions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."user_module_permissions" ENABLE ROW LEVEL SECURITY;

--
-- Name: work_attendance; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."work_attendance" ENABLE ROW LEVEL SECURITY;

--
-- Name: work_log_categories; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."work_log_categories" ENABLE ROW LEVEL SECURITY;

--
-- Name: work_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."work_logs" ENABLE ROW LEVEL SECURITY;

--
-- Name: work_ratings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."work_ratings" ENABLE ROW LEVEL SECURITY;

--
-- Name: work_records; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."work_records" ENABLE ROW LEVEL SECURITY;

--
-- Name: work_schedule_configs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."work_schedule_configs" ENABLE ROW LEVEL SECURITY;

--
-- Name: work_schedule_records; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."work_schedule_records" ENABLE ROW LEVEL SECURITY;

--
-- Name: work_shifts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."work_shifts" ENABLE ROW LEVEL SECURITY;

--
-- Name: invitation_codes 任何人都可以查看有效邀请码; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '任何人都可以查看有效邀请码'
      AND n.nspname = 'public'
      AND c.relname = 'invitation_codes'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "任何人都可以查看有效邀请码" ON "public"."invitation_codes" FOR SELECT USING ((("status" = 'active'::"text") AND ("expires_at" > "now"())));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: audit_logs 允许所有认证用户插入审计日志; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '允许所有认证用户插入审计日志'
      AND n.nspname = 'public'
      AND c.relname = 'audit_logs'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "允许所有认证用户插入审计日志" ON "public"."audit_logs" FOR INSERT TO "authenticated" WITH CHECK (true);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: shift_swap_requests 员工创建换班申请; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '员工创建换班申请'
      AND n.nspname = 'public'
      AND c.relname = 'shift_swap_requests'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "员工创建换班申请" ON "public"."shift_swap_requests" FOR INSERT WITH CHECK (("requester_id" IN ( SELECT "employees"."id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = "auth"."uid"()))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: promotion_applications 员工创建晋升申请; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '员工创建晋升申请'
      AND n.nspname = 'public'
      AND c.relname = 'promotion_applications'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "员工创建晋升申请" ON "public"."promotion_applications" FOR INSERT WITH CHECK (("employee_id" IN ( SELECT "employees"."id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = "auth"."uid"()))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: offboarding_applications 员工创建离职申请; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '员工创建离职申请'
      AND n.nspname = 'public'
      AND c.relname = 'offboarding_applications'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "员工创建离职申请" ON "public"."offboarding_applications" FOR INSERT WITH CHECK (("employee_id" IN ( SELECT "employees"."id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = "auth"."uid"()))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: overtime_requests 员工创建自己的加班申请; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '员工创建自己的加班申请'
      AND n.nspname = 'public'
      AND c.relname = 'overtime_requests'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "员工创建自己的加班申请" ON "public"."overtime_requests" FOR INSERT WITH CHECK (("employee_id" IN ( SELECT "employees"."id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = "auth"."uid"()))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: leave_requests 员工创建自己的请假申请; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '员工创建自己的请假申请'
      AND n.nspname = 'public'
      AND c.relname = 'leave_requests'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "员工创建自己的请假申请" ON "public"."leave_requests" FOR INSERT WITH CHECK (("employee_id" IN ( SELECT "employees"."id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = "auth"."uid"()))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: transfer_applications 员工创建调岗申请; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '员工创建调岗申请'
      AND n.nspname = 'public'
      AND c.relname = 'transfer_applications'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "员工创建调岗申请" ON "public"."transfer_applications" FOR INSERT WITH CHECK (("employee_id" IN ( SELECT "employees"."id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = "auth"."uid"()))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: shift_swap_requests 员工取消自己的换班申请; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '员工取消自己的换班申请'
      AND n.nspname = 'public'
      AND c.relname = 'shift_swap_requests'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "员工取消自己的换班申请" ON "public"."shift_swap_requests" FOR UPDATE USING ((("requester_id" IN ( SELECT "employees"."id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = "auth"."uid"()))) AND ("status" = 'pending'::"public"."swap_request_status"))) WITH CHECK (("status" = 'cancelled'::"public"."swap_request_status"));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: help_article_feedback 员工可以创建反馈; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '员工可以创建反馈'
      AND n.nspname = 'public'
      AND c.relname = 'help_article_feedback'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "员工可以创建反馈" ON "public"."help_article_feedback" FOR INSERT WITH CHECK (("employee_id" IN ( SELECT "employees"."id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = "auth"."uid"()))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: hr_messages 员工可以创建留言; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '员工可以创建留言'
      AND n.nspname = 'public'
      AND c.relname = 'hr_messages'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "员工可以创建留言" ON "public"."hr_messages" FOR INSERT WITH CHECK (("employee_id" IN ( SELECT "employees"."id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = "auth"."uid"()))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: work_logs 员工可以创建自己的工作日志; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '员工可以创建自己的工作日志'
      AND n.nspname = 'public'
      AND c.relname = 'work_logs'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "员工可以创建自己的工作日志" ON "public"."work_logs" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."employees" "e"
  WHERE (("e"."user_id" = "auth"."uid"()) AND ("e"."id" = "work_logs"."employee_id")))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: work_records 员工可以创建自己的记录; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '员工可以创建自己的记录'
      AND n.nspname = 'public'
      AND c.relname = 'work_records'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "员工可以创建自己的记录" ON "public"."work_records" FOR INSERT WITH CHECK (("employee_id" IN ( SELECT "employees"."id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = "auth"."uid"()))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: probation_conversion_applications 员工可以创建自己的转正申请; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '员工可以创建自己的转正申请'
      AND n.nspname = 'public'
      AND c.relname = 'probation_conversion_applications'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "员工可以创建自己的转正申请" ON "public"."probation_conversion_applications" FOR INSERT WITH CHECK (("employee_id" IN ( SELECT "employees"."id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = "auth"."uid"()))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: work_ratings 员工可以创建评分; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '员工可以创建评分'
      AND n.nspname = 'public'
      AND c.relname = 'work_ratings'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "员工可以创建评分" ON "public"."work_ratings" FOR INSERT TO "authenticated" WITH CHECK (("rater_id" = "auth"."uid"()));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: leave_requests 员工可以创建请假申请; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '员工可以创建请假申请'
      AND n.nspname = 'public'
      AND c.relname = 'leave_requests'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "员工可以创建请假申请" ON "public"."leave_requests" FOR INSERT WITH CHECK (("employee_id" = "auth"."uid"()));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: leave_requests 员工可以取消自己的待审批申请; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '员工可以取消自己的待审批申请'
      AND n.nspname = 'public'
      AND c.relname = 'leave_requests'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "员工可以取消自己的待审批申请" ON "public"."leave_requests" FOR UPDATE USING ((("employee_id" = "auth"."uid"()) AND ("status" = 'pending'::"text"))) WITH CHECK ((("employee_id" = "auth"."uid"()) AND ("status" = ANY (ARRAY['pending'::"text", 'cancelled'::"text"]))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: handbook_reading_progress 员工可以插入自己的阅读进度; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '员工可以插入自己的阅读进度'
      AND n.nspname = 'public'
      AND c.relname = 'handbook_reading_progress'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "员工可以插入自己的阅读进度" ON "public"."handbook_reading_progress" FOR INSERT WITH CHECK (("employee_id" IN ( SELECT "employees"."id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = "auth"."uid"()))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: help_article_feedback 员工可以更新自己的反馈; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '员工可以更新自己的反馈'
      AND n.nspname = 'public'
      AND c.relname = 'help_article_feedback'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "员工可以更新自己的反馈" ON "public"."help_article_feedback" FOR UPDATE USING (("employee_id" IN ( SELECT "employees"."id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = "auth"."uid"()))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: work_logs 员工可以更新自己的工作日志; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '员工可以更新自己的工作日志'
      AND n.nspname = 'public'
      AND c.relname = 'work_logs'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "员工可以更新自己的工作日志" ON "public"."work_logs" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."employees" "e"
  WHERE (("e"."user_id" = "auth"."uid"()) AND ("e"."id" = "work_logs"."employee_id")))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: work_schedule_records 员工可以更新自己的排班记录; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '员工可以更新自己的排班记录'
      AND n.nspname = 'public'
      AND c.relname = 'work_schedule_records'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "员工可以更新自己的排班记录" ON "public"."work_schedule_records" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."employees" "e"
  WHERE (("e"."user_id" = "auth"."uid"()) AND ("e"."id" = "work_schedule_records"."employee_id")))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: work_records 员工可以更新自己的记录; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '员工可以更新自己的记录'
      AND n.nspname = 'public'
      AND c.relname = 'work_records'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "员工可以更新自己的记录" ON "public"."work_records" FOR UPDATE USING (("employee_id" IN ( SELECT "employees"."id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = "auth"."uid"()))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: handbook_reading_progress 员工可以更新自己的阅读进度; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '员工可以更新自己的阅读进度'
      AND n.nspname = 'public'
      AND c.relname = 'handbook_reading_progress'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "员工可以更新自己的阅读进度" ON "public"."handbook_reading_progress" FOR UPDATE USING (("employee_id" IN ( SELECT "employees"."id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = "auth"."uid"()))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: work_log_categories 员工可以查看启用的类别; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '员工可以查看启用的类别'
      AND n.nspname = 'public'
      AND c.relname = 'work_log_categories'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "员工可以查看启用的类别" ON "public"."work_log_categories" FOR SELECT USING (("is_active" = true));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: revenue_impact_factors 员工可以查看本租户影响因子; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '员工可以查看本租户影响因子'
      AND n.nspname = 'public'
      AND c.relname = 'revenue_impact_factors'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "员工可以查看本租户影响因子" ON "public"."revenue_impact_factors" FOR SELECT TO "authenticated" USING (("tenant_id" IN ( SELECT "profiles"."tenant_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: revenue_calendar 员工可以查看本租户营收日历; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '员工可以查看本租户营收日历'
      AND n.nspname = 'public'
      AND c.relname = 'revenue_calendar'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "员工可以查看本租户营收日历" ON "public"."revenue_calendar" FOR SELECT TO "authenticated" USING (("tenant_id" IN ( SELECT "profiles"."tenant_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: daily_revenue_detail 员工可以查看每日营收明细; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '员工可以查看每日营收明细'
      AND n.nspname = 'public'
      AND c.relname = 'daily_revenue_detail'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "员工可以查看每日营收明细" ON "public"."daily_revenue_detail" FOR SELECT TO "authenticated" USING (("calendar_id" IN ( SELECT "revenue_calendar"."id"
   FROM "public"."revenue_calendar"
  WHERE ("revenue_calendar"."tenant_id" IN ( SELECT "profiles"."tenant_id"
           FROM "public"."profiles"
          WHERE ("profiles"."id" = "auth"."uid"()))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: work_ratings 员工可以查看相关评分; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '员工可以查看相关评分'
      AND n.nspname = 'public'
      AND c.relname = 'work_ratings'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "员工可以查看相关评分" ON "public"."work_ratings" FOR SELECT TO "authenticated" USING ((("rater_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM ("public"."work_logs" "wl"
     JOIN "public"."employees" "e" ON (("e"."id" = "wl"."employee_id")))
  WHERE (("wl"."id" = "work_ratings"."work_log_id") AND ("e"."user_id" = "auth"."uid"()))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: help_article_feedback 员工可以查看自己的反馈; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '员工可以查看自己的反馈'
      AND n.nspname = 'public'
      AND c.relname = 'help_article_feedback'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "员工可以查看自己的反馈" ON "public"."help_article_feedback" FOR SELECT USING (("employee_id" IN ( SELECT "employees"."id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = "auth"."uid"()))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: work_logs 员工可以查看自己的工作日志; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '员工可以查看自己的工作日志'
      AND n.nspname = 'public'
      AND c.relname = 'work_logs'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "员工可以查看自己的工作日志" ON "public"."work_logs" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."employees" "e"
  WHERE (("e"."user_id" = "auth"."uid"()) AND ("e"."id" = "work_logs"."employee_id")))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: learning_achievements 员工可以查看自己的成就; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '员工可以查看自己的成就'
      AND n.nspname = 'public'
      AND c.relname = 'learning_achievements'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "员工可以查看自己的成就" ON "public"."learning_achievements" FOR SELECT USING (("employee_id" IN ( SELECT "employees"."id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = "auth"."uid"()))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: work_schedule_records 员工可以查看自己的排班记录; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '员工可以查看自己的排班记录'
      AND n.nspname = 'public'
      AND c.relname = 'work_schedule_records'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "员工可以查看自己的排班记录" ON "public"."work_schedule_records" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."employees" "e"
  WHERE (("e"."user_id" = "auth"."uid"()) AND ("e"."id" = "work_schedule_records"."employee_id")))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: hr_messages 员工可以查看自己的留言; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '员工可以查看自己的留言'
      AND n.nspname = 'public'
      AND c.relname = 'hr_messages'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "员工可以查看自己的留言" ON "public"."hr_messages" FOR SELECT USING (("employee_id" IN ( SELECT "employees"."id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = "auth"."uid"()))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: work_records 员工可以查看自己的记录; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '员工可以查看自己的记录'
      AND n.nspname = 'public'
      AND c.relname = 'work_records'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "员工可以查看自己的记录" ON "public"."work_records" FOR SELECT USING (("employee_id" IN ( SELECT "employees"."id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = "auth"."uid"()))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: leave_requests 员工可以查看自己的请假申请; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '员工可以查看自己的请假申请'
      AND n.nspname = 'public'
      AND c.relname = 'leave_requests'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "员工可以查看自己的请假申请" ON "public"."leave_requests" FOR SELECT USING ((("employee_id" = "auth"."uid"()) OR "public"."is_user_admin"("auth"."uid"())));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: probation_conversion_applications 员工可以查看自己的转正申请; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '员工可以查看自己的转正申请'
      AND n.nspname = 'public'
      AND c.relname = 'probation_conversion_applications'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "员工可以查看自己的转正申请" ON "public"."probation_conversion_applications" FOR SELECT USING (("employee_id" IN ( SELECT "employees"."id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = "auth"."uid"()))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: handbook_reading_progress 员工可以查看自己的阅读进度; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '员工可以查看自己的阅读进度'
      AND n.nspname = 'public'
      AND c.relname = 'handbook_reading_progress'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "员工可以查看自己的阅读进度" ON "public"."handbook_reading_progress" FOR SELECT USING (("employee_id" IN ( SELECT "employees"."id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = "auth"."uid"()))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: work_schedule_configs 员工可以查看自己门店的排班配置; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '员工可以查看自己门店的排班配置'
      AND n.nspname = 'public'
      AND c.relname = 'work_schedule_configs'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "员工可以查看自己门店的排班配置" ON "public"."work_schedule_configs" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."employees" "e"
  WHERE (("e"."user_id" = "auth"."uid"()) AND ("e"."store_id" = "work_schedule_configs"."store_id")))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: revenue_adjustment_log 员工可以查看营收调整记录; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '员工可以查看营收调整记录'
      AND n.nspname = 'public'
      AND c.relname = 'revenue_adjustment_log'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "员工可以查看营收调整记录" ON "public"."revenue_adjustment_log" FOR SELECT TO "authenticated" USING (("calendar_id" IN ( SELECT "revenue_calendar"."id"
   FROM "public"."revenue_calendar"
  WHERE ("revenue_calendar"."tenant_id" IN ( SELECT "profiles"."tenant_id"
           FROM "public"."profiles"
          WHERE ("profiles"."id" = "auth"."uid"()))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: area_attendance_overview 员工可查看上岗一览; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '员工可查看上岗一览'
      AND n.nspname = 'public'
      AND c.relname = 'area_attendance_overview'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "员工可查看上岗一览" ON "public"."area_attendance_overview" FOR SELECT USING (true);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: area_positions 员工可查看岗位配置; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '员工可查看岗位配置'
      AND n.nspname = 'public'
      AND c.relname = 'area_positions'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "员工可查看岗位配置" ON "public"."area_positions" FOR SELECT USING (true);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: area_staff_assignments 员工可查看自己的分配; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '员工可查看自己的分配'
      AND n.nspname = 'public'
      AND c.relname = 'area_staff_assignments'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "员工可查看自己的分配" ON "public"."area_staff_assignments" FOR SELECT USING ((("employee_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'tenant_admin'::"public"."user_role"))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: employee_positions 员工可查看自己的岗位; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '员工可查看自己的岗位'
      AND n.nspname = 'public'
      AND c.relname = 'employee_positions'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "员工可查看自己的岗位" ON "public"."employee_positions" FOR SELECT USING ((("employee_id" = "auth"."uid"()) OR ("tenant_id" IN ( SELECT "profiles"."tenant_id"
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['super_admin'::"public"."user_role", 'tenant_admin'::"public"."user_role", 'store_manager'::"public"."user_role"])))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: store_position_assignments 员工可查看自己的岗位分配; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '员工可查看自己的岗位分配'
      AND n.nspname = 'public'
      AND c.relname = 'store_position_assignments'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "员工可查看自己的岗位分配" ON "public"."store_position_assignments" FOR SELECT USING ((("employee_id" = "auth"."uid"()) OR ("tenant_id" IN ( SELECT "profiles"."tenant_id"
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['super_admin'::"public"."user_role", 'tenant_admin'::"public"."user_role", 'store_manager'::"public"."user_role"])))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: tasks 员工更新自己的任务; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '员工更新自己的任务'
      AND n.nspname = 'public'
      AND c.relname = 'tasks'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "员工更新自己的任务" ON "public"."tasks" FOR UPDATE USING (("employee_id" IN ( SELECT "employees"."id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = "auth"."uid"())))) WITH CHECK (("employee_id" IN ( SELECT "employees"."id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = "auth"."uid"()))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: overtime_requests 员工更新自己的待审批加班; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '员工更新自己的待审批加班'
      AND n.nspname = 'public'
      AND c.relname = 'overtime_requests'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "员工更新自己的待审批加班" ON "public"."overtime_requests" FOR UPDATE USING ((("employee_id" IN ( SELECT "employees"."id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = "auth"."uid"()))) AND ("status" = 'pending'::"text")));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: leave_requests 员工更新自己的待审批请假; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '员工更新自己的待审批请假'
      AND n.nspname = 'public'
      AND c.relname = 'leave_requests'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "员工更新自己的待审批请假" ON "public"."leave_requests" FOR UPDATE USING ((("employee_id" IN ( SELECT "employees"."id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = "auth"."uid"()))) AND ("status" = 'pending'::"text")));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: performance_improvements 员工更新自己的改进计划; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '员工更新自己的改进计划'
      AND n.nspname = 'public'
      AND c.relname = 'performance_improvements'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "员工更新自己的改进计划" ON "public"."performance_improvements" FOR UPDATE USING (("employee_id" IN ( SELECT "employees"."id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = "auth"."uid"()))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: employee_levels 员工更新自己的等级; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '员工更新自己的等级'
      AND n.nspname = 'public'
      AND c.relname = 'employee_levels'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "员工更新自己的等级" ON "public"."employee_levels" FOR UPDATE USING (("employee_id" IN ( SELECT "employees"."id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = "auth"."uid"()))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: shift_swap_requests 员工查看相关的换班申请; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '员工查看相关的换班申请'
      AND n.nspname = 'public'
      AND c.relname = 'shift_swap_requests'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "员工查看相关的换班申请" ON "public"."shift_swap_requests" FOR SELECT USING ((("requester_id" IN ( SELECT "employees"."id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = "auth"."uid"()))) OR ("target_id" IN ( SELECT "employees"."id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = "auth"."uid"())))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: tasks 员工查看自己的任务; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '员工查看自己的任务'
      AND n.nspname = 'public'
      AND c.relname = 'tasks'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "员工查看自己的任务" ON "public"."tasks" FOR SELECT USING (("employee_id" IN ( SELECT "employees"."id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = "auth"."uid"()))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: leave_balances 员工查看自己的假期余额; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '员工查看自己的假期余额'
      AND n.nspname = 'public'
      AND c.relname = 'leave_balances'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "员工查看自己的假期余额" ON "public"."leave_balances" FOR SELECT USING (("employee_id" IN ( SELECT "employees"."id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = "auth"."uid"()))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: onboarding_tasks 员工查看自己的入职任务; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '员工查看自己的入职任务'
      AND n.nspname = 'public'
      AND c.relname = 'onboarding_tasks'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "员工查看自己的入职任务" ON "public"."onboarding_tasks" FOR SELECT USING ((("application_id" IN ( SELECT "onboarding_applications"."id"
   FROM "public"."onboarding_applications"
  WHERE ("onboarding_applications"."employee_id" IN ( SELECT "employees"."id"
           FROM "public"."employees"
          WHERE ("employees"."user_id" = "auth"."uid"()))))) OR ("assigned_to" IN ( SELECT "employees"."id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = "auth"."uid"())))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: onboarding_history 员工查看自己的入职历史; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '员工查看自己的入职历史'
      AND n.nspname = 'public'
      AND c.relname = 'onboarding_history'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "员工查看自己的入职历史" ON "public"."onboarding_history" FOR SELECT USING (("employee_id" IN ( SELECT "employees"."id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = "auth"."uid"()))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: onboarding_applications 员工查看自己的入职申请; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '员工查看自己的入职申请'
      AND n.nspname = 'public'
      AND c.relname = 'onboarding_applications'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "员工查看自己的入职申请" ON "public"."onboarding_applications" FOR SELECT USING (("employee_id" IN ( SELECT "employees"."id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = "auth"."uid"()))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: onboarding_documents 员工查看自己的入职资料; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '员工查看自己的入职资料'
      AND n.nspname = 'public'
      AND c.relname = 'onboarding_documents'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "员工查看自己的入职资料" ON "public"."onboarding_documents" FOR SELECT USING (("application_id" IN ( SELECT "onboarding_applications"."id"
   FROM "public"."onboarding_applications"
  WHERE ("onboarding_applications"."employee_id" IN ( SELECT "employees"."id"
           FROM "public"."employees"
          WHERE ("employees"."user_id" = "auth"."uid"()))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: overtime_requests 员工查看自己的加班申请; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '员工查看自己的加班申请'
      AND n.nspname = 'public'
      AND c.relname = 'overtime_requests'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "员工查看自己的加班申请" ON "public"."overtime_requests" FOR SELECT USING (("employee_id" IN ( SELECT "employees"."id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = "auth"."uid"()))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: overtime_compensations 员工查看自己的加班补偿; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '员工查看自己的加班补偿'
      AND n.nspname = 'public'
      AND c.relname = 'overtime_compensations'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "员工查看自己的加班补偿" ON "public"."overtime_compensations" FOR SELECT USING (("employee_id" IN ( SELECT "employees"."id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = "auth"."uid"()))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: employee_work_info 员工查看自己的工作信息; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '员工查看自己的工作信息'
      AND n.nspname = 'public'
      AND c.relname = 'employee_work_info'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "员工查看自己的工作信息" ON "public"."employee_work_info" FOR SELECT USING (("employee_id" IN ( SELECT "employees"."id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = "auth"."uid"()))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: salary_records 员工查看自己的工资记录; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '员工查看自己的工资记录'
      AND n.nspname = 'public'
      AND c.relname = 'salary_records'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "员工查看自己的工资记录" ON "public"."salary_records" FOR SELECT USING (("employee_id" IN ( SELECT "employees"."id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = "auth"."uid"()))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: performance_improvements 员工查看自己的改进计划; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '员工查看自己的改进计划'
      AND n.nspname = 'public'
      AND c.relname = 'performance_improvements'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "员工查看自己的改进计划" ON "public"."performance_improvements" FOR SELECT USING (("employee_id" IN ( SELECT "employees"."id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = "auth"."uid"()))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: promotion_history 员工查看自己的晋升历史; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '员工查看自己的晋升历史'
      AND n.nspname = 'public'
      AND c.relname = 'promotion_history'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "员工查看自己的晋升历史" ON "public"."promotion_history" FOR SELECT USING (("employee_id" IN ( SELECT "employees"."id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = "auth"."uid"()))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: promotion_applications 员工查看自己的晋升申请; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '员工查看自己的晋升申请'
      AND n.nspname = 'public'
      AND c.relname = 'promotion_applications'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "员工查看自己的晋升申请" ON "public"."promotion_applications" FOR SELECT USING (("employee_id" IN ( SELECT "employees"."id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = "auth"."uid"()))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: employee_shifts 员工查看自己的班次; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '员工查看自己的班次'
      AND n.nspname = 'public'
      AND c.relname = 'employee_shifts'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "员工查看自己的班次" ON "public"."employee_shifts" FOR SELECT USING (("employee_id" IN ( SELECT "employees"."id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = "auth"."uid"()))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: performance_goals 员工查看自己的目标; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '员工查看自己的目标'
      AND n.nspname = 'public'
      AND c.relname = 'performance_goals'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "员工查看自己的目标" ON "public"."performance_goals" FOR SELECT USING (("employee_id" IN ( SELECT "employees"."id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = "auth"."uid"()))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: employee_benefits 员工查看自己的福利; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '员工查看自己的福利'
      AND n.nspname = 'public'
      AND c.relname = 'employee_benefits'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "员工查看自己的福利" ON "public"."employee_benefits" FOR SELECT USING (("employee_id" IN ( SELECT "employees"."id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = "auth"."uid"()))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: benefit_usage_records 员工查看自己的福利使用记录; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '员工查看自己的福利使用记录'
      AND n.nspname = 'public'
      AND c.relname = 'benefit_usage_records'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "员工查看自己的福利使用记录" ON "public"."benefit_usage_records" FOR SELECT USING (("employee_id" IN ( SELECT "employees"."id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = "auth"."uid"()))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: offboarding_handovers 员工查看自己的离职交接; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '员工查看自己的离职交接'
      AND n.nspname = 'public'
      AND c.relname = 'offboarding_handovers'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "员工查看自己的离职交接" ON "public"."offboarding_handovers" FOR SELECT USING ((("employee_id" IN ( SELECT "employees"."id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = "auth"."uid"()))) OR ("handover_to" IN ( SELECT "employees"."id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = "auth"."uid"())))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: offboarding_tasks 员工查看自己的离职任务; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '员工查看自己的离职任务'
      AND n.nspname = 'public'
      AND c.relname = 'offboarding_tasks'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "员工查看自己的离职任务" ON "public"."offboarding_tasks" FOR SELECT USING ((("application_id" IN ( SELECT "offboarding_applications"."id"
   FROM "public"."offboarding_applications"
  WHERE ("offboarding_applications"."employee_id" IN ( SELECT "employees"."id"
           FROM "public"."employees"
          WHERE ("employees"."user_id" = "auth"."uid"()))))) OR ("assigned_to" IN ( SELECT "employees"."id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = "auth"."uid"())))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: offboarding_history 员工查看自己的离职历史; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '员工查看自己的离职历史'
      AND n.nspname = 'public'
      AND c.relname = 'offboarding_history'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "员工查看自己的离职历史" ON "public"."offboarding_history" FOR SELECT USING (("employee_id" IN ( SELECT "employees"."id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = "auth"."uid"()))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: offboarding_applications 员工查看自己的离职申请; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '员工查看自己的离职申请'
      AND n.nspname = 'public'
      AND c.relname = 'offboarding_applications'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "员工查看自己的离职申请" ON "public"."offboarding_applications" FOR SELECT USING (("employee_id" IN ( SELECT "employees"."id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = "auth"."uid"()))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: offboarding_interviews 员工查看自己的离职面谈; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '员工查看自己的离职面谈'
      AND n.nspname = 'public'
      AND c.relname = 'offboarding_interviews'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "员工查看自己的离职面谈" ON "public"."offboarding_interviews" FOR SELECT USING (("employee_id" IN ( SELECT "employees"."id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = "auth"."uid"()))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: employee_levels 员工查看自己的等级; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '员工查看自己的等级'
      AND n.nspname = 'public'
      AND c.relname = 'employee_levels'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "员工查看自己的等级" ON "public"."employee_levels" FOR SELECT USING (("employee_id" IN ( SELECT "employees"."id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = "auth"."uid"()))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: employee_performance 员工查看自己的绩效; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '员工查看自己的绩效'
      AND n.nspname = 'public'
      AND c.relname = 'employee_performance'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "员工查看自己的绩效" ON "public"."employee_performance" FOR SELECT USING (("employee_id" IN ( SELECT "employees"."id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = "auth"."uid"()))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: work_attendance 员工查看自己的考勤; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '员工查看自己的考勤'
      AND n.nspname = 'public'
      AND c.relname = 'work_attendance'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "员工查看自己的考勤" ON "public"."work_attendance" FOR SELECT USING (("employee_id" IN ( SELECT "employees"."id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = "auth"."uid"()))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: salary_structures 员工查看自己的薪酬结构; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '员工查看自己的薪酬结构'
      AND n.nspname = 'public'
      AND c.relname = 'salary_structures'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "员工查看自己的薪酬结构" ON "public"."salary_structures" FOR SELECT USING (("employee_id" IN ( SELECT "employees"."id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = "auth"."uid"()))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: employee_certifications 员工查看自己的认证; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '员工查看自己的认证'
      AND n.nspname = 'public'
      AND c.relname = 'employee_certifications'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "员工查看自己的认证" ON "public"."employee_certifications" FOR SELECT USING (("employee_id" IN ( SELECT "employees"."id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = "auth"."uid"()))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: leave_requests 员工查看自己的请假申请; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '员工查看自己的请假申请'
      AND n.nspname = 'public'
      AND c.relname = 'leave_requests'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "员工查看自己的请假申请" ON "public"."leave_requests" FOR SELECT USING (("employee_id" IN ( SELECT "employees"."id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = "auth"."uid"()))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: transfer_history 员工查看自己的调岗历史; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '员工查看自己的调岗历史'
      AND n.nspname = 'public'
      AND c.relname = 'transfer_history'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "员工查看自己的调岗历史" ON "public"."transfer_history" FOR SELECT USING (("employee_id" IN ( SELECT "employees"."id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = "auth"."uid"()))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: transfer_applications 员工查看自己的调岗申请; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '员工查看自己的调岗申请'
      AND n.nspname = 'public'
      AND c.relname = 'transfer_applications'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "员工查看自己的调岗申请" ON "public"."transfer_applications" FOR SELECT USING (("employee_id" IN ( SELECT "employees"."id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = "auth"."uid"()))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: revenue_impact_factors 店经理可以管理所属门店影响因子; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '店经理可以管理所属门店影响因子'
      AND n.nspname = 'public'
      AND c.relname = 'revenue_impact_factors'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "店经理可以管理所属门店影响因子" ON "public"."revenue_impact_factors" TO "authenticated" USING (("store_id" IN ( SELECT "stores"."id"
   FROM "public"."stores"
  WHERE ("stores"."manager_id" = "auth"."uid"()))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: revenue_calendar 店经理可以管理所属门店营收日历; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '店经理可以管理所属门店营收日历'
      AND n.nspname = 'public'
      AND c.relname = 'revenue_calendar'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "店经理可以管理所属门店营收日历" ON "public"."revenue_calendar" TO "authenticated" USING (("store_id" IN ( SELECT "stores"."id"
   FROM "public"."stores"
  WHERE ("stores"."manager_id" = "auth"."uid"()))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: best_practices 店经理可分享最佳实践; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '店经理可分享最佳实践'
      AND n.nspname = 'public'
      AND c.relname = 'best_practices'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "店经理可分享最佳实践" ON "public"."best_practices" FOR INSERT WITH CHECK (("tenant_id" IN ( SELECT "profiles"."tenant_id"
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['store_manager'::"public"."user_role", 'tenant_admin'::"public"."user_role", 'super_admin'::"public"."user_role"]))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: scheduling_optimizations 店经理可创建优化记录; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '店经理可创建优化记录'
      AND n.nspname = 'public'
      AND c.relname = 'scheduling_optimizations'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "店经理可创建优化记录" ON "public"."scheduling_optimizations" FOR INSERT WITH CHECK (("tenant_id" IN ( SELECT "profiles"."tenant_id"
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['store_manager'::"public"."user_role", 'tenant_admin'::"public"."user_role", 'super_admin'::"public"."user_role"]))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: staff_transfers 店经理可创建调配申请; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '店经理可创建调配申请'
      AND n.nspname = 'public'
      AND c.relname = 'staff_transfers'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "店经理可创建调配申请" ON "public"."staff_transfers" FOR INSERT WITH CHECK (("tenant_id" IN ( SELECT "profiles"."tenant_id"
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['store_manager'::"public"."user_role", 'tenant_admin'::"public"."user_role", 'super_admin'::"public"."user_role"]))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: revenue_history 店经理可管理历史营收; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '店经理可管理历史营收'
      AND n.nspname = 'public'
      AND c.relname = 'revenue_history'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "店经理可管理历史营收" ON "public"."revenue_history" USING (("tenant_id" IN ( SELECT "profiles"."tenant_id"
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['store_manager'::"public"."user_role", 'tenant_admin'::"public"."user_role", 'super_admin'::"public"."user_role"]))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: store_hierarchy 店经理可管理组织架构; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '店经理可管理组织架构'
      AND n.nspname = 'public'
      AND c.relname = 'store_hierarchy'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "店经理可管理组织架构" ON "public"."store_hierarchy" USING (("tenant_id" IN ( SELECT "profiles"."tenant_id"
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['store_manager'::"public"."user_role", 'tenant_admin'::"public"."user_role", 'super_admin'::"public"."user_role"]))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: core_position_backup 店经理可管理顶岗配置; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '店经理可管理顶岗配置'
      AND n.nspname = 'public'
      AND c.relname = 'core_position_backup'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "店经理可管理顶岗配置" ON "public"."core_position_backup" USING (("tenant_id" IN ( SELECT "profiles"."tenant_id"
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['store_manager'::"public"."user_role", 'tenant_admin'::"public"."user_role", 'super_admin'::"public"."user_role"]))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: risk_alerts 店经理可管理风险预警; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '店经理可管理风险预警'
      AND n.nspname = 'public'
      AND c.relname = 'risk_alerts'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "店经理可管理风险预警" ON "public"."risk_alerts" USING (("tenant_id" IN ( SELECT "profiles"."tenant_id"
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['store_manager'::"public"."user_role", 'tenant_admin'::"public"."user_role", 'super_admin'::"public"."user_role"]))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: brands 店经理和员工可以查看本租户品牌; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '店经理和员工可以查看本租户品牌'
      AND n.nspname = 'public'
      AND c.relname = 'brands'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "店经理和员工可以查看本租户品牌" ON "public"."brands" FOR SELECT TO "authenticated" USING ((("tenant_id" = "public"."get_user_tenant_id"("auth"."uid"())) AND ("public"."get_user_role"("auth"."uid"()) = ANY (ARRAY['store_manager'::"public"."user_role", 'employee'::"public"."user_role"]))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: tasks 店长删除本店员工任务; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '店长删除本店员工任务'
      AND n.nspname = 'public'
      AND c.relname = 'tasks'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "店长删除本店员工任务" ON "public"."tasks" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM ("public"."profiles" "p"
     JOIN "public"."employees" "e" ON (("e"."user_id" = "p"."id")))
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = 'store_manager'::"public"."user_role") AND ("tasks"."employee_id" IN ( SELECT "employees"."id"
           FROM "public"."employees"
          WHERE ("employees"."store_id" = "e"."store_id")))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: tasks 店长更新本店员工任务; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '店长更新本店员工任务'
      AND n.nspname = 'public'
      AND c.relname = 'tasks'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "店长更新本店员工任务" ON "public"."tasks" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM ("public"."profiles" "p"
     JOIN "public"."employees" "e" ON (("e"."user_id" = "p"."id")))
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = 'store_manager'::"public"."user_role") AND ("tasks"."employee_id" IN ( SELECT "employees"."id"
           FROM "public"."employees"
          WHERE ("employees"."store_id" = "e"."store_id")))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: tasks 店长查看本店员工任务; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '店长查看本店员工任务'
      AND n.nspname = 'public'
      AND c.relname = 'tasks'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "店长查看本店员工任务" ON "public"."tasks" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."profiles" "p"
     JOIN "public"."employees" "e" ON (("e"."user_id" = "p"."id")))
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = 'store_manager'::"public"."user_role") AND ("tasks"."employee_id" IN ( SELECT "employees"."id"
           FROM "public"."employees"
          WHERE ("employees"."store_id" = "e"."store_id")))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: promotion_requirements 所有人查看晋升条件; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '所有人查看晋升条件'
      AND n.nspname = 'public'
      AND c.relname = 'promotion_requirements'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "所有人查看晋升条件" ON "public"."promotion_requirements" FOR SELECT USING (true);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: onboarding_processes 所有人查看活跃的入职流程; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '所有人查看活跃的入职流程'
      AND n.nspname = 'public'
      AND c.relname = 'onboarding_processes'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "所有人查看活跃的入职流程" ON "public"."onboarding_processes" FOR SELECT USING (("is_active" = true));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: overtime_types 所有人查看活跃的加班类型; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '所有人查看活跃的加班类型'
      AND n.nspname = 'public'
      AND c.relname = 'overtime_types'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "所有人查看活跃的加班类型" ON "public"."overtime_types" FOR SELECT USING (("is_active" = true));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: transfer_positions 所有人查看活跃的可调岗位; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '所有人查看活跃的可调岗位'
      AND n.nspname = 'public'
      AND c.relname = 'transfer_positions'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "所有人查看活跃的可调岗位" ON "public"."transfer_positions" FOR SELECT USING (("is_active" = true));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: promotion_paths 所有人查看活跃的晋升路径; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '所有人查看活跃的晋升路径'
      AND n.nspname = 'public'
      AND c.relname = 'promotion_paths'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "所有人查看活跃的晋升路径" ON "public"."promotion_paths" FOR SELECT USING (("is_active" = true));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: benefit_types 所有人查看活跃的福利类型; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '所有人查看活跃的福利类型'
      AND n.nspname = 'public'
      AND c.relname = 'benefit_types'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "所有人查看活跃的福利类型" ON "public"."benefit_types" FOR SELECT USING (("is_active" = true));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: leave_types 所有人查看活跃的请假类型; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '所有人查看活跃的请假类型'
      AND n.nspname = 'public'
      AND c.relname = 'leave_types'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "所有人查看活跃的请假类型" ON "public"."leave_types" FOR SELECT USING (("is_active" = true));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: transfer_requirements 所有人查看调岗条件; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '所有人查看调岗条件'
      AND n.nspname = 'public'
      AND c.relname = 'transfer_requirements'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "所有人查看调岗条件" ON "public"."transfer_requirements" FOR SELECT USING (true);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: system_modules 所有认证用户可查看系统模块; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '所有认证用户可查看系统模块'
      AND n.nspname = 'public'
      AND c.relname = 'system_modules'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "所有认证用户可查看系统模块" ON "public"."system_modules" FOR SELECT TO "authenticated" USING (true);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: role_module_permissions 所有认证用户可查看角色权限; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '所有认证用户可查看角色权限'
      AND n.nspname = 'public'
      AND c.relname = 'role_module_permissions'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "所有认证用户可查看角色权限" ON "public"."role_module_permissions" FOR SELECT TO "authenticated" USING (true);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: invitation_code_uses 用户可以创建使用记录; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '用户可以创建使用记录'
      AND n.nspname = 'public'
      AND c.relname = 'invitation_code_uses'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "用户可以创建使用记录" ON "public"."invitation_code_uses" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: profiles 用户可以创建自己的profile; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '用户可以创建自己的profile'
      AND n.nspname = 'public'
      AND c.relname = 'profiles'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "用户可以创建自己的profile" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK (("id" = "auth"."uid"()));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: dashboard_quick_actions 用户可以创建自己的快捷操作; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '用户可以创建自己的快捷操作'
      AND n.nspname = 'public'
      AND c.relname = 'dashboard_quick_actions'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "用户可以创建自己的快捷操作" ON "public"."dashboard_quick_actions" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: dashboard_widgets 用户可以创建自己的组件配置; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '用户可以创建自己的组件配置'
      AND n.nspname = 'public'
      AND c.relname = 'dashboard_widgets'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "用户可以创建自己的组件配置" ON "public"."dashboard_widgets" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: operation_adjustments 用户可以创建自己租户的调整记录; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '用户可以创建自己租户的调整记录'
      AND n.nspname = 'public'
      AND c.relname = 'operation_adjustments'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "用户可以创建自己租户的调整记录" ON "public"."operation_adjustments" FOR INSERT WITH CHECK (("tenant_id" IN ( SELECT "profiles"."tenant_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: dashboard_quick_actions 用户可以删除自己的快捷操作; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '用户可以删除自己的快捷操作'
      AND n.nspname = 'public'
      AND c.relname = 'dashboard_quick_actions'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "用户可以删除自己的快捷操作" ON "public"."dashboard_quick_actions" FOR DELETE USING (("auth"."uid"() = "user_id"));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: dashboard_widgets 用户可以删除自己的组件配置; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '用户可以删除自己的组件配置'
      AND n.nspname = 'public'
      AND c.relname = 'dashboard_widgets'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "用户可以删除自己的组件配置" ON "public"."dashboard_widgets" FOR DELETE USING (("auth"."uid"() = "user_id"));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: profiles 用户可以在首次登录时设置租户; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '用户可以在首次登录时设置租户'
      AND n.nspname = 'public'
      AND c.relname = 'profiles'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "用户可以在首次登录时设置租户" ON "public"."profiles" FOR UPDATE TO "authenticated" USING ((("id" = "auth"."uid"()) AND ("tenant_id" IS NULL))) WITH CHECK (true);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: dashboard_quick_actions 用户可以更新自己的快捷操作; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '用户可以更新自己的快捷操作'
      AND n.nspname = 'public'
      AND c.relname = 'dashboard_quick_actions'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "用户可以更新自己的快捷操作" ON "public"."dashboard_quick_actions" FOR UPDATE USING (("auth"."uid"() = "user_id"));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: dashboard_widgets 用户可以更新自己的组件配置; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '用户可以更新自己的组件配置'
      AND n.nspname = 'public'
      AND c.relname = 'dashboard_widgets'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "用户可以更新自己的组件配置" ON "public"."dashboard_widgets" FOR UPDATE USING (("auth"."uid"() = "user_id"));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: departments 用户可以查看本租户部门; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '用户可以查看本租户部门'
      AND n.nspname = 'public'
      AND c.relname = 'departments'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "用户可以查看本租户部门" ON "public"."departments" FOR SELECT TO "authenticated" USING (("tenant_id" IN ( SELECT "profiles"."tenant_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: dashboard_quick_actions 用户可以查看自己的快捷操作; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '用户可以查看自己的快捷操作'
      AND n.nspname = 'public'
      AND c.relname = 'dashboard_quick_actions'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "用户可以查看自己的快捷操作" ON "public"."dashboard_quick_actions" FOR SELECT USING (("auth"."uid"() = "user_id"));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: tenant_applications 用户可以查看自己的申请; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '用户可以查看自己的申请'
      AND n.nspname = 'public'
      AND c.relname = 'tenant_applications'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "用户可以查看自己的申请" ON "public"."tenant_applications" FOR SELECT TO "authenticated" USING (("applicant_id" = "auth"."uid"()));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: dashboard_widgets 用户可以查看自己的组件配置; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '用户可以查看自己的组件配置'
      AND n.nspname = 'public'
      AND c.relname = 'dashboard_widgets'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "用户可以查看自己的组件配置" ON "public"."dashboard_widgets" FOR SELECT USING (("auth"."uid"() = "user_id"));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: notifications 用户可以查看自己的通知; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '用户可以查看自己的通知'
      AND n.nspname = 'public'
      AND c.relname = 'notifications'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "用户可以查看自己的通知" ON "public"."notifications" FOR SELECT USING (("auth"."uid"() = "user_id"));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: operation_adjustments 用户可以查看自己租户的调整记录; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '用户可以查看自己租户的调整记录'
      AND n.nspname = 'public'
      AND c.relname = 'operation_adjustments'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "用户可以查看自己租户的调整记录" ON "public"."operation_adjustments" FOR SELECT USING (("tenant_id" IN ( SELECT "profiles"."tenant_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: notifications 用户可以标记已读; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '用户可以标记已读'
      AND n.nspname = 'public'
      AND c.relname = 'notifications'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "用户可以标记已读" ON "public"."notifications" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: profiles 用户可更新自己的信息; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '用户可更新自己的信息'
      AND n.nspname = 'public'
      AND c.relname = 'profiles'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "用户可更新自己的信息" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("id" = "auth"."uid"()));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: profiles 用户可查看自己的信息; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '用户可查看自己的信息'
      AND n.nspname = 'public'
      AND c.relname = 'profiles'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "用户可查看自己的信息" ON "public"."profiles" FOR SELECT TO "authenticated" USING (("id" = "auth"."uid"()));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: user_module_permissions 用户可查看自己的权限; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '用户可查看自己的权限'
      AND n.nspname = 'public'
      AND c.relname = 'user_module_permissions'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "用户可查看自己的权限" ON "public"."user_module_permissions" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: tenants 用户可查看自己的租户; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '用户可查看自己的租户'
      AND n.nspname = 'public'
      AND c.relname = 'tenants'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "用户可查看自己的租户" ON "public"."tenants" FOR SELECT TO "authenticated" USING (("id" = "public"."get_user_tenant_id"("auth"."uid"())));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: position_module_permissions 租户内用户可查看本租户的岗位权限; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '租户内用户可查看本租户的岗位权限'
      AND n.nspname = 'public'
      AND c.relname = 'position_module_permissions'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "租户内用户可查看本租户的岗位权限" ON "public"."position_module_permissions" FOR SELECT USING (("tenant_id" IN ( SELECT "profiles"."tenant_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: store_organization 租户内用户可查看本租户的组织架构; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '租户内用户可查看本租户的组织架构'
      AND n.nspname = 'public'
      AND c.relname = 'store_organization'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "租户内用户可查看本租户的组织架构" ON "public"."store_organization" FOR SELECT USING (("tenant_id" IN ( SELECT "profiles"."tenant_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: backup_position_config 租户内用户可查看本租户的顶岗关系; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '租户内用户可查看本租户的顶岗关系'
      AND n.nspname = 'public'
      AND c.relname = 'backup_position_config'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "租户内用户可查看本租户的顶岗关系" ON "public"."backup_position_config" FOR SELECT USING (("tenant_id" IN ( SELECT "profiles"."tenant_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: scheduling_optimizations 租户可查看自己的优化记录; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '租户可查看自己的优化记录'
      AND n.nspname = 'public'
      AND c.relname = 'scheduling_optimizations'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "租户可查看自己的优化记录" ON "public"."scheduling_optimizations" FOR SELECT USING (("tenant_id" IN ( SELECT "profiles"."tenant_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: revenue_history 租户可查看自己的历史营收; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '租户可查看自己的历史营收'
      AND n.nspname = 'public'
      AND c.relname = 'revenue_history'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "租户可查看自己的历史营收" ON "public"."revenue_history" FOR SELECT USING (("tenant_id" IN ( SELECT "profiles"."tenant_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: impact_factors 租户可查看自己的影响因子; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '租户可查看自己的影响因子'
      AND n.nspname = 'public'
      AND c.relname = 'impact_factors'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "租户可查看自己的影响因子" ON "public"."impact_factors" FOR SELECT USING (("tenant_id" IN ( SELECT "profiles"."tenant_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: best_practices 租户可查看自己的最佳实践; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '租户可查看自己的最佳实践'
      AND n.nspname = 'public'
      AND c.relname = 'best_practices'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "租户可查看自己的最佳实践" ON "public"."best_practices" FOR SELECT USING (("tenant_id" IN ( SELECT "profiles"."tenant_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: store_hierarchy 租户可查看自己的组织架构; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '租户可查看自己的组织架构'
      AND n.nspname = 'public'
      AND c.relname = 'store_hierarchy'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "租户可查看自己的组织架构" ON "public"."store_hierarchy" FOR SELECT USING (("tenant_id" IN ( SELECT "profiles"."tenant_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: staff_transfers 租户可查看自己的调配记录; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '租户可查看自己的调配记录'
      AND n.nspname = 'public'
      AND c.relname = 'staff_transfers'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "租户可查看自己的调配记录" ON "public"."staff_transfers" FOR SELECT USING (("tenant_id" IN ( SELECT "profiles"."tenant_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: core_position_backup 租户可查看自己的顶岗配置; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '租户可查看自己的顶岗配置'
      AND n.nspname = 'public'
      AND c.relname = 'core_position_backup'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "租户可查看自己的顶岗配置" ON "public"."core_position_backup" FOR SELECT USING (("tenant_id" IN ( SELECT "profiles"."tenant_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: revenue_predictions 租户可查看自己的预测记录; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '租户可查看自己的预测记录'
      AND n.nspname = 'public'
      AND c.relname = 'revenue_predictions'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "租户可查看自己的预测记录" ON "public"."revenue_predictions" FOR SELECT USING (("tenant_id" IN ( SELECT "profiles"."tenant_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: risk_alerts 租户可查看自己的风险预警; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '租户可查看自己的风险预警'
      AND n.nspname = 'public'
      AND c.relname = 'risk_alerts'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "租户可查看自己的风险预警" ON "public"."risk_alerts" FOR SELECT USING (("tenant_id" IN ( SELECT "profiles"."tenant_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: area_positions 租户成员可查看区域岗位; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '租户成员可查看区域岗位'
      AND n.nspname = 'public'
      AND c.relname = 'area_positions'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "租户成员可查看区域岗位" ON "public"."area_positions" FOR SELECT USING (("area_id" IN ( SELECT "business_areas"."id"
   FROM "public"."business_areas"
  WHERE ("business_areas"."tenant_id" IN ( SELECT "profiles"."tenant_id"
           FROM "public"."profiles"
          WHERE ("profiles"."id" = "auth"."uid"()))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: area_daily_status 租户成员可查看区域状态; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '租户成员可查看区域状态'
      AND n.nspname = 'public'
      AND c.relname = 'area_daily_status'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "租户成员可查看区域状态" ON "public"."area_daily_status" FOR SELECT USING (("area_id" IN ( SELECT "business_areas"."id"
   FROM "public"."business_areas"
  WHERE ("business_areas"."tenant_id" IN ( SELECT "profiles"."tenant_id"
           FROM "public"."profiles"
          WHERE ("profiles"."id" = "auth"."uid"()))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: area_staff_assignments 租户成员可查看员工分配; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '租户成员可查看员工分配'
      AND n.nspname = 'public'
      AND c.relname = 'area_staff_assignments'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "租户成员可查看员工分配" ON "public"."area_staff_assignments" FOR SELECT USING (("area_id" IN ( SELECT "business_areas"."id"
   FROM "public"."business_areas"
  WHERE ("business_areas"."tenant_id" IN ( SELECT "profiles"."tenant_id"
           FROM "public"."profiles"
          WHERE ("profiles"."id" = "auth"."uid"()))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: revenue_import_logs 租户成员可查看导入记录; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '租户成员可查看导入记录'
      AND n.nspname = 'public'
      AND c.relname = 'revenue_import_logs'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "租户成员可查看导入记录" ON "public"."revenue_import_logs" FOR SELECT USING (("tenant_id" IN ( SELECT "profiles"."tenant_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: position_config 租户成员可查看岗位配置; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '租户成员可查看岗位配置'
      AND n.nspname = 'public'
      AND c.relname = 'position_config'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "租户成员可查看岗位配置" ON "public"."position_config" FOR SELECT USING (("tenant_id" IN ( SELECT "profiles"."tenant_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: area_attendance_overview 租户成员可查看考勤概览; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '租户成员可查看考勤概览'
      AND n.nspname = 'public'
      AND c.relname = 'area_attendance_overview'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "租户成员可查看考勤概览" ON "public"."area_attendance_overview" FOR SELECT USING (("store_id" IN ( SELECT "stores"."id"
   FROM "public"."stores"
  WHERE ("stores"."tenant_id" IN ( SELECT "profiles"."tenant_id"
           FROM "public"."profiles"
          WHERE ("profiles"."id" = "auth"."uid"()))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: revenue_detail_records 租户成员可查看营收明细; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '租户成员可查看营收明细'
      AND n.nspname = 'public'
      AND c.relname = 'revenue_detail_records'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "租户成员可查看营收明细" ON "public"."revenue_detail_records" FOR SELECT USING (("tenant_id" IN ( SELECT "profiles"."tenant_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: employees 租户用户可访问本租户员工; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '租户用户可访问本租户员工'
      AND n.nspname = 'public'
      AND c.relname = 'employees'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "租户用户可访问本租户员工" ON "public"."employees" TO "authenticated" USING ("public"."can_access_tenant"("auth"."uid"(), "tenant_id"));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: stores 租户用户可访问本租户店铺; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '租户用户可访问本租户店铺'
      AND n.nspname = 'public'
      AND c.relname = 'stores'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "租户用户可访问本租户店铺" ON "public"."stores" TO "authenticated" USING ("public"."can_access_tenant"("auth"."uid"(), "tenant_id"));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: cost_data 租户用户可访问本租户成本数据; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '租户用户可访问本租户成本数据'
      AND n.nspname = 'public'
      AND c.relname = 'cost_data'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "租户用户可访问本租户成本数据" ON "public"."cost_data" TO "authenticated" USING ("public"."can_access_tenant"("auth"."uid"(), "tenant_id"));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: schedules 租户用户可访问本租户排班; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '租户用户可访问本租户排班'
      AND n.nspname = 'public'
      AND c.relname = 'schedules'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "租户用户可访问本租户排班" ON "public"."schedules" TO "authenticated" USING ("public"."can_access_tenant"("auth"."uid"(), "tenant_id"));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: schedule_logs 租户用户可访问本租户日志; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '租户用户可访问本租户日志'
      AND n.nspname = 'public'
      AND c.relname = 'schedule_logs'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "租户用户可访问本租户日志" ON "public"."schedule_logs" TO "authenticated" USING ("public"."can_access_tenant"("auth"."uid"(), "tenant_id"));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: operations_data 租户用户可访问本租户运营数据; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '租户用户可访问本租户运营数据'
      AND n.nspname = 'public'
      AND c.relname = 'operations_data'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "租户用户可访问本租户运营数据" ON "public"."operations_data" TO "authenticated" USING ("public"."can_access_tenant"("auth"."uid"(), "tenant_id"));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: tenants 租户管理员可以更新自己的租户; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '租户管理员可以更新自己的租户'
      AND n.nspname = 'public'
      AND c.relname = 'tenants'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "租户管理员可以更新自己的租户" ON "public"."tenants" FOR UPDATE TO "authenticated" USING ((("id" = "public"."get_user_tenant_id"("auth"."uid"())) AND ("public"."get_user_role"("auth"."uid"()) = ANY (ARRAY['tenant_admin'::"public"."user_role", 'super_admin'::"public"."user_role"]))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: tenant_settings 租户管理员可以查看本租户配置; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '租户管理员可以查看本租户配置'
      AND n.nspname = 'public'
      AND c.relname = 'tenant_settings'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "租户管理员可以查看本租户配置" ON "public"."tenant_settings" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."tenant_id" = "tenant_settings"."tenant_id") AND ("profiles"."role" = ANY (ARRAY['tenant_admin'::"public"."user_role", 'store_manager'::"public"."user_role", 'employee'::"public"."user_role"]))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: invitation_code_uses 租户管理员可以查看邀请码使用记录; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '租户管理员可以查看邀请码使用记录'
      AND n.nspname = 'public'
      AND c.relname = 'invitation_code_uses'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "租户管理员可以查看邀请码使用记录" ON "public"."invitation_code_uses" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."invitation_codes" "ic"
     JOIN "public"."profiles" "p" ON (("p"."id" = "auth"."uid"())))
  WHERE (("ic"."id" = "invitation_code_uses"."invitation_code_id") AND ("p"."tenant_id" = "ic"."tenant_id") AND ("p"."role" = ANY (ARRAY['tenant_admin'::"public"."user_role", 'super_admin'::"public"."user_role"]))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: agent_assignments 租户管理员可以管理本租户Agent分配; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '租户管理员可以管理本租户Agent分配'
      AND n.nspname = 'public'
      AND c.relname = 'agent_assignments'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "租户管理员可以管理本租户Agent分配" ON "public"."agent_assignments" TO "authenticated" USING (("tenant_id" IN ( SELECT "profiles"."tenant_id"
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'tenant_admin'::"public"."user_role")))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: brands 租户管理员可以管理本租户品牌; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '租户管理员可以管理本租户品牌'
      AND n.nspname = 'public'
      AND c.relname = 'brands'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "租户管理员可以管理本租户品牌" ON "public"."brands" TO "authenticated" USING ((("tenant_id" = "public"."get_user_tenant_id"("auth"."uid"())) AND ("public"."get_user_role"("auth"."uid"()) = 'tenant_admin'::"public"."user_role"))) WITH CHECK ((("tenant_id" = "public"."get_user_tenant_id"("auth"."uid"())) AND ("public"."get_user_role"("auth"."uid"()) = 'tenant_admin'::"public"."user_role")));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: revenue_impact_factors 租户管理员可以管理本租户影响因子; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '租户管理员可以管理本租户影响因子'
      AND n.nspname = 'public'
      AND c.relname = 'revenue_impact_factors'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "租户管理员可以管理本租户影响因子" ON "public"."revenue_impact_factors" TO "authenticated" USING (("tenant_id" IN ( SELECT "profiles"."tenant_id"
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'tenant_admin'::"public"."user_role")))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: revenue_calendar 租户管理员可以管理本租户营收日历; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '租户管理员可以管理本租户营收日历'
      AND n.nspname = 'public'
      AND c.relname = 'revenue_calendar'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "租户管理员可以管理本租户营收日历" ON "public"."revenue_calendar" TO "authenticated" USING (("tenant_id" IN ( SELECT "profiles"."tenant_id"
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'tenant_admin'::"public"."user_role")))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: tenant_settings 租户管理员可以管理本租户配置; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '租户管理员可以管理本租户配置'
      AND n.nspname = 'public'
      AND c.relname = 'tenant_settings'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "租户管理员可以管理本租户配置" ON "public"."tenant_settings" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."tenant_id" = "tenant_settings"."tenant_id") AND ("profiles"."role" = 'tenant_admin'::"public"."user_role"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."tenant_id" = "tenant_settings"."tenant_id") AND ("profiles"."role" = 'tenant_admin'::"public"."user_role")))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: revenue_predictions 租户管理员可创建预测记录; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '租户管理员可创建预测记录'
      AND n.nspname = 'public'
      AND c.relname = 'revenue_predictions'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "租户管理员可创建预测记录" ON "public"."revenue_predictions" FOR INSERT WITH CHECK (("tenant_id" IN ( SELECT "profiles"."tenant_id"
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['tenant_admin'::"public"."user_role", 'super_admin'::"public"."user_role"]))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: revenue_predictions 租户管理员可更新预测记录; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '租户管理员可更新预测记录'
      AND n.nspname = 'public'
      AND c.relname = 'revenue_predictions'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "租户管理员可更新预测记录" ON "public"."revenue_predictions" FOR UPDATE USING (("tenant_id" IN ( SELECT "profiles"."tenant_id"
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['tenant_admin'::"public"."user_role", 'super_admin'::"public"."user_role"]))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: audit_logs 租户管理员可查看本租户审计日志; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '租户管理员可查看本租户审计日志'
      AND n.nspname = 'public'
      AND c.relname = 'audit_logs'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "租户管理员可查看本租户审计日志" ON "public"."audit_logs" FOR SELECT USING (("tenant_id" IN ( SELECT "profiles"."tenant_id"
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['tenant_admin'::"public"."user_role", 'super_admin'::"public"."user_role"]))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: position_config 租户管理员可管理岗位配置; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '租户管理员可管理岗位配置'
      AND n.nspname = 'public'
      AND c.relname = 'position_config'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "租户管理员可管理岗位配置" ON "public"."position_config" USING (("tenant_id" IN ( SELECT "profiles"."tenant_id"
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['tenant_admin'::"public"."user_role", 'super_admin'::"public"."user_role"]))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: impact_factors 租户管理员可管理影响因子; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '租户管理员可管理影响因子'
      AND n.nspname = 'public'
      AND c.relname = 'impact_factors'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "租户管理员可管理影响因子" ON "public"."impact_factors" USING (("tenant_id" IN ( SELECT "profiles"."tenant_id"
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['tenant_admin'::"public"."user_role", 'super_admin'::"public"."user_role"]))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: data_snapshots 租户管理员可管理本租户快照; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '租户管理员可管理本租户快照'
      AND n.nspname = 'public'
      AND c.relname = 'data_snapshots'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "租户管理员可管理本租户快照" ON "public"."data_snapshots" USING (("tenant_id" IN ( SELECT "profiles"."tenant_id"
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['tenant_admin'::"public"."user_role", 'super_admin'::"public"."user_role"]))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: profiles 租户管理员可访问本租户用户; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '租户管理员可访问本租户用户'
      AND n.nspname = 'public'
      AND c.relname = 'profiles'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "租户管理员可访问本租户用户" ON "public"."profiles" TO "authenticated" USING ((("public"."get_user_role"("auth"."uid"()) = ANY (ARRAY['tenant_admin'::"public"."user_role", 'super_admin'::"public"."user_role"])) AND "public"."can_access_tenant"("auth"."uid"(), "tenant_id")));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: daily_revenue_detail 租户管理员和店经理可以管理每日营收明细; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '租户管理员和店经理可以管理每日营收明细'
      AND n.nspname = 'public'
      AND c.relname = 'daily_revenue_detail'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "租户管理员和店经理可以管理每日营收明细" ON "public"."daily_revenue_detail" TO "authenticated" USING (("calendar_id" IN ( SELECT "rc"."id"
   FROM ("public"."revenue_calendar" "rc"
     JOIN "public"."profiles" "p" ON (("p"."id" = "auth"."uid"())))
  WHERE ((("p"."role" = 'tenant_admin'::"public"."user_role") AND ("rc"."tenant_id" = "p"."tenant_id")) OR (("p"."role" = 'store_manager'::"public"."user_role") AND ("rc"."store_id" IN ( SELECT "stores"."id"
           FROM "public"."stores"
          WHERE ("stores"."manager_id" = "auth"."uid"()))))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: revenue_adjustment_log 租户管理员和店经理可以管理营收调整记录; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '租户管理员和店经理可以管理营收调整记录'
      AND n.nspname = 'public'
      AND c.relname = 'revenue_adjustment_log'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "租户管理员和店经理可以管理营收调整记录" ON "public"."revenue_adjustment_log" TO "authenticated" USING (("calendar_id" IN ( SELECT "rc"."id"
   FROM ("public"."revenue_calendar" "rc"
     JOIN "public"."profiles" "p" ON (("p"."id" = "auth"."uid"())))
  WHERE ((("p"."role" = 'tenant_admin'::"public"."user_role") AND ("rc"."tenant_id" = "p"."tenant_id")) OR (("p"."role" = 'store_manager'::"public"."user_role") AND ("rc"."store_id" IN ( SELECT "stores"."id"
           FROM "public"."stores"
          WHERE ("stores"."manager_id" = "auth"."uid"()))))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: revenue_import_logs 租户管理员和店经理可创建导入记录; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '租户管理员和店经理可创建导入记录'
      AND n.nspname = 'public'
      AND c.relname = 'revenue_import_logs'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "租户管理员和店经理可创建导入记录" ON "public"."revenue_import_logs" FOR INSERT WITH CHECK (("tenant_id" IN ( SELECT "profiles"."tenant_id"
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['tenant_admin'::"public"."user_role", 'store_manager'::"public"."user_role", 'super_admin'::"public"."user_role"]))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: revenue_detail_records 租户管理员和店经理可创建营收明细; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '租户管理员和店经理可创建营收明细'
      AND n.nspname = 'public'
      AND c.relname = 'revenue_detail_records'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "租户管理员和店经理可创建营收明细" ON "public"."revenue_detail_records" FOR INSERT WITH CHECK (("tenant_id" IN ( SELECT "profiles"."tenant_id"
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['tenant_admin'::"public"."user_role", 'store_manager'::"public"."user_role", 'super_admin'::"public"."user_role"]))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: revenue_detail_records 租户管理员和店经理可删除营收明细; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '租户管理员和店经理可删除营收明细'
      AND n.nspname = 'public'
      AND c.relname = 'revenue_detail_records'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "租户管理员和店经理可删除营收明细" ON "public"."revenue_detail_records" FOR DELETE USING (("tenant_id" IN ( SELECT "profiles"."tenant_id"
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['tenant_admin'::"public"."user_role", 'store_manager'::"public"."user_role", 'super_admin'::"public"."user_role"]))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: revenue_detail_records 租户管理员和店经理可更新营收明细; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '租户管理员和店经理可更新营收明细'
      AND n.nspname = 'public'
      AND c.relname = 'revenue_detail_records'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "租户管理员和店经理可更新营收明细" ON "public"."revenue_detail_records" FOR UPDATE USING (("tenant_id" IN ( SELECT "profiles"."tenant_id"
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['tenant_admin'::"public"."user_role", 'store_manager'::"public"."user_role", 'super_admin'::"public"."user_role"]))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: tasks 管理员创建任务; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员创建任务'
      AND n.nspname = 'public'
      AND c.relname = 'tasks'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员创建任务" ON "public"."tasks" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['tenant_admin'::"public"."user_role", 'super_admin'::"public"."user_role", 'store_manager'::"public"."user_role"]))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: tasks 管理员删除任务; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员删除任务'
      AND n.nspname = 'public'
      AND c.relname = 'tasks'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员删除任务" ON "public"."tasks" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['tenant_admin'::"public"."user_role", 'super_admin'::"public"."user_role"]))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: employee_work_info 管理员删除工作信息; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员删除工作信息'
      AND n.nspname = 'public'
      AND c.relname = 'employee_work_info'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员删除工作信息" ON "public"."employee_work_info" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['tenant_admin'::"public"."user_role", 'super_admin'::"public"."user_role"]))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: employee_shifts 管理员删除班次; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员删除班次'
      AND n.nspname = 'public'
      AND c.relname = 'employee_shifts'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员删除班次" ON "public"."employee_shifts" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['tenant_admin'::"public"."user_role", 'store_manager'::"public"."user_role"]))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: work_attendance 管理员删除考勤; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员删除考勤'
      AND n.nspname = 'public'
      AND c.relname = 'work_attendance'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员删除考勤" ON "public"."work_attendance" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['tenant_admin'::"public"."user_role", 'super_admin'::"public"."user_role", 'store_manager'::"public"."user_role"]))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: approval_logs 管理员可以创建审批记录; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员可以创建审批记录'
      AND n.nspname = 'public'
      AND c.relname = 'approval_logs'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员可以创建审批记录" ON "public"."approval_logs" FOR INSERT WITH CHECK ("public"."is_user_admin"("auth"."uid"()));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: notifications 管理员可以创建通知; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员可以创建通知'
      AND n.nspname = 'public'
      AND c.relname = 'notifications'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员可以创建通知" ON "public"."notifications" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['super_admin'::"public"."user_role", 'tenant_admin'::"public"."user_role", 'store_manager'::"public"."user_role"]))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: invitation_codes 管理员可以创建邀请码; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员可以创建邀请码'
      AND n.nspname = 'public'
      AND c.relname = 'invitation_codes'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员可以创建邀请码" ON "public"."invitation_codes" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND (("profiles"."role" = 'super_admin'::"public"."user_role") OR (("profiles"."role" = 'tenant_admin'::"public"."user_role") AND ("profiles"."tenant_id" = "invitation_codes"."tenant_id")))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: leave_requests 管理员可以删除请假申请; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员可以删除请假申请'
      AND n.nspname = 'public'
      AND c.relname = 'leave_requests'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员可以删除请假申请" ON "public"."leave_requests" FOR DELETE USING ("public"."is_user_admin"("auth"."uid"()));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: invitation_codes 管理员可以删除邀请码; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员可以删除邀请码'
      AND n.nspname = 'public'
      AND c.relname = 'invitation_codes'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员可以删除邀请码" ON "public"."invitation_codes" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND (("profiles"."role" = 'super_admin'::"public"."user_role") OR (("profiles"."role" = 'tenant_admin'::"public"."user_role") AND ("profiles"."tenant_id" = "invitation_codes"."tenant_id")))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: work_logs 管理员可以完全访问工作日志; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员可以完全访问工作日志'
      AND n.nspname = 'public'
      AND c.relname = 'work_logs'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员可以完全访问工作日志" ON "public"."work_logs" TO "authenticated" USING ("public"."is_user_admin"("auth"."uid"()));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: work_ratings 管理员可以完全访问工作评分; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员可以完全访问工作评分'
      AND n.nspname = 'public'
      AND c.relname = 'work_ratings'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员可以完全访问工作评分" ON "public"."work_ratings" TO "authenticated" USING ("public"."is_user_admin"("auth"."uid"()));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: work_schedule_records 管理员可以完全访问排班记录; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员可以完全访问排班记录'
      AND n.nspname = 'public'
      AND c.relname = 'work_schedule_records'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员可以完全访问排班记录" ON "public"."work_schedule_records" TO "authenticated" USING ("public"."is_user_admin"("auth"."uid"()));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: work_schedule_configs 管理员可以完全访问排班配置; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员可以完全访问排班配置'
      AND n.nspname = 'public'
      AND c.relname = 'work_schedule_configs'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员可以完全访问排班配置" ON "public"."work_schedule_configs" TO "authenticated" USING ("public"."is_user_admin"("auth"."uid"()));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: leave_requests 管理员可以审批请假申请; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员可以审批请假申请'
      AND n.nspname = 'public'
      AND c.relname = 'leave_requests'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员可以审批请假申请" ON "public"."leave_requests" FOR UPDATE USING ("public"."is_user_admin"("auth"."uid"()));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: dashboard_alerts 管理员可以更新警报; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员可以更新警报'
      AND n.nspname = 'public'
      AND c.relname = 'dashboard_alerts'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员可以更新警报" ON "public"."dashboard_alerts" FOR UPDATE USING ("public"."is_admin"("auth"."uid"()));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: invitation_codes 管理员可以更新邀请码; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员可以更新邀请码'
      AND n.nspname = 'public'
      AND c.relname = 'invitation_codes'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员可以更新邀请码" ON "public"."invitation_codes" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND (("profiles"."role" = 'super_admin'::"public"."user_role") OR (("profiles"."role" = 'tenant_admin'::"public"."user_role") AND ("profiles"."tenant_id" = "invitation_codes"."tenant_id")))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: approval_logs 管理员可以查看审批记录; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员可以查看审批记录'
      AND n.nspname = 'public'
      AND c.relname = 'approval_logs'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员可以查看审批记录" ON "public"."approval_logs" FOR SELECT USING ("public"."is_user_admin"("auth"."uid"()));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: help_article_feedback 管理员可以查看所有反馈; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员可以查看所有反馈'
      AND n.nspname = 'public'
      AND c.relname = 'help_article_feedback'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员可以查看所有反馈" ON "public"."help_article_feedback" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['super_admin'::"public"."user_role", 'tenant_admin'::"public"."user_role"]))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: learning_achievements 管理员可以查看所有成就; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员可以查看所有成就'
      AND n.nspname = 'public'
      AND c.relname = 'learning_achievements'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员可以查看所有成就" ON "public"."learning_achievements" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['super_admin'::"public"."user_role", 'tenant_admin'::"public"."user_role"]))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: dashboard_alerts 管理员可以查看所有警报; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员可以查看所有警报'
      AND n.nspname = 'public'
      AND c.relname = 'dashboard_alerts'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员可以查看所有警报" ON "public"."dashboard_alerts" FOR SELECT USING ("public"."is_admin"("auth"."uid"()));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: work_records 管理员可以查看所有记录; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员可以查看所有记录'
      AND n.nspname = 'public'
      AND c.relname = 'work_records'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员可以查看所有记录" ON "public"."work_records" FOR SELECT USING ("public"."is_admin"("auth"."uid"()));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: handbook_reading_progress 管理员可以查看所有阅读进度; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员可以查看所有阅读进度'
      AND n.nspname = 'public'
      AND c.relname = 'handbook_reading_progress'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员可以查看所有阅读进度" ON "public"."handbook_reading_progress" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['super_admin'::"public"."user_role", 'tenant_admin'::"public"."user_role"]))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: notifications 管理员可以查看租户通知; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员可以查看租户通知'
      AND n.nspname = 'public'
      AND c.relname = 'notifications'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员可以查看租户通知" ON "public"."notifications" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['super_admin'::"public"."user_role", 'tenant_admin'::"public"."user_role", 'store_manager'::"public"."user_role"])) AND (("profiles"."role" = 'super_admin'::"public"."user_role") OR ("profiles"."tenant_id" = "notifications"."tenant_id"))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: invitation_codes 管理员可以查看邀请码; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员可以查看邀请码'
      AND n.nspname = 'public'
      AND c.relname = 'invitation_codes'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员可以查看邀请码" ON "public"."invitation_codes" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND (("profiles"."role" = 'super_admin'::"public"."user_role") OR (("profiles"."role" = 'tenant_admin'::"public"."user_role") AND ("profiles"."tenant_id" = "invitation_codes"."tenant_id")))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: hr_messages 管理员可以管理所有留言; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员可以管理所有留言'
      AND n.nspname = 'public'
      AND c.relname = 'hr_messages'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员可以管理所有留言" ON "public"."hr_messages" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['super_admin'::"public"."user_role", 'tenant_admin'::"public"."user_role"]))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: departments 管理员可以管理所有部门; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员可以管理所有部门'
      AND n.nspname = 'public'
      AND c.relname = 'departments'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员可以管理所有部门" ON "public"."departments" TO "authenticated" USING ("public"."is_admin"("auth"."uid"()));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: work_log_categories 管理员可以管理类别; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员可以管理类别'
      AND n.nspname = 'public'
      AND c.relname = 'work_log_categories'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员可以管理类别" ON "public"."work_log_categories" USING ("public"."is_admin"("auth"."uid"()));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: positions 管理员可创建岗位; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员可创建岗位'
      AND n.nspname = 'public'
      AND c.relname = 'positions'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员可创建岗位" ON "public"."positions" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE ("profiles"."role" = ANY (ARRAY['store_manager'::"public"."user_role", 'tenant_admin'::"public"."user_role", 'super_admin'::"public"."user_role"])))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: rest_day_rules 管理员可创建排休规则; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员可创建排休规则'
      AND n.nspname = 'public'
      AND c.relname = 'rest_day_rules'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员可创建排休规则" ON "public"."rest_day_rules" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE ("profiles"."role" = ANY (ARRAY['store_manager'::"public"."user_role", 'tenant_admin'::"public"."user_role", 'super_admin'::"public"."user_role"])))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: min_revenue_positions 管理员可创建最低营收配置; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员可创建最低营收配置'
      AND n.nspname = 'public'
      AND c.relname = 'min_revenue_positions'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员可创建最低营收配置" ON "public"."min_revenue_positions" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE ("profiles"."role" = ANY (ARRAY['store_manager'::"public"."user_role", 'tenant_admin'::"public"."user_role", 'super_admin'::"public"."user_role"])))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: business_areas 管理员可创建经营区域; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员可创建经营区域'
      AND n.nspname = 'public'
      AND c.relname = 'business_areas'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员可创建经营区域" ON "public"."business_areas" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE ("profiles"."role" = ANY (ARRAY['store_manager'::"public"."user_role", 'tenant_admin'::"public"."user_role", 'super_admin'::"public"."user_role"])))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: positions 管理员可删除岗位; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员可删除岗位'
      AND n.nspname = 'public'
      AND c.relname = 'positions'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员可删除岗位" ON "public"."positions" FOR DELETE TO "authenticated" USING (("auth"."uid"() IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE ("profiles"."role" = ANY (ARRAY['store_manager'::"public"."user_role", 'tenant_admin'::"public"."user_role", 'super_admin'::"public"."user_role"])))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: rest_day_rules 管理员可删除排休规则; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员可删除排休规则'
      AND n.nspname = 'public'
      AND c.relname = 'rest_day_rules'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员可删除排休规则" ON "public"."rest_day_rules" FOR DELETE TO "authenticated" USING (("auth"."uid"() IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE ("profiles"."role" = ANY (ARRAY['store_manager'::"public"."user_role", 'tenant_admin'::"public"."user_role", 'super_admin'::"public"."user_role"])))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: min_revenue_positions 管理员可删除最低营收配置; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员可删除最低营收配置'
      AND n.nspname = 'public'
      AND c.relname = 'min_revenue_positions'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员可删除最低营收配置" ON "public"."min_revenue_positions" FOR DELETE TO "authenticated" USING (("auth"."uid"() IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE ("profiles"."role" = ANY (ARRAY['store_manager'::"public"."user_role", 'tenant_admin'::"public"."user_role", 'super_admin'::"public"."user_role"])))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: business_areas 管理员可删除经营区域; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员可删除经营区域'
      AND n.nspname = 'public'
      AND c.relname = 'business_areas'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员可删除经营区域" ON "public"."business_areas" FOR DELETE TO "authenticated" USING (("auth"."uid"() IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE ("profiles"."role" = ANY (ARRAY['store_manager'::"public"."user_role", 'tenant_admin'::"public"."user_role", 'super_admin'::"public"."user_role"])))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: positions 管理员可更新岗位; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员可更新岗位'
      AND n.nspname = 'public'
      AND c.relname = 'positions'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员可更新岗位" ON "public"."positions" FOR UPDATE TO "authenticated" USING (("auth"."uid"() IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE ("profiles"."role" = ANY (ARRAY['store_manager'::"public"."user_role", 'tenant_admin'::"public"."user_role", 'super_admin'::"public"."user_role"])))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: rest_day_rules 管理员可更新排休规则; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员可更新排休规则'
      AND n.nspname = 'public'
      AND c.relname = 'rest_day_rules'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员可更新排休规则" ON "public"."rest_day_rules" FOR UPDATE TO "authenticated" USING (("auth"."uid"() IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE ("profiles"."role" = ANY (ARRAY['store_manager'::"public"."user_role", 'tenant_admin'::"public"."user_role", 'super_admin'::"public"."user_role"])))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: min_revenue_positions 管理员可更新最低营收配置; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员可更新最低营收配置'
      AND n.nspname = 'public'
      AND c.relname = 'min_revenue_positions'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员可更新最低营收配置" ON "public"."min_revenue_positions" FOR UPDATE TO "authenticated" USING (("auth"."uid"() IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE ("profiles"."role" = ANY (ARRAY['store_manager'::"public"."user_role", 'tenant_admin'::"public"."user_role", 'super_admin'::"public"."user_role"])))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: business_areas 管理员可更新经营区域; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员可更新经营区域'
      AND n.nspname = 'public'
      AND c.relname = 'business_areas'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员可更新经营区域" ON "public"."business_areas" FOR UPDATE TO "authenticated" USING (("auth"."uid"() IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE ("profiles"."role" = ANY (ARRAY['store_manager'::"public"."user_role", 'tenant_admin'::"public"."user_role", 'super_admin'::"public"."user_role"])))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: audit_logs 管理员可查看所有审计日志; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员可查看所有审计日志'
      AND n.nspname = 'public'
      AND c.relname = 'audit_logs'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员可查看所有审计日志" ON "public"."audit_logs" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'super_admin'::"public"."user_role")))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: user_module_permissions 管理员可查看所有用户权限; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员可查看所有用户权限'
      AND n.nspname = 'public'
      AND c.relname = 'user_module_permissions'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员可查看所有用户权限" ON "public"."user_module_permissions" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['super_admin'::"public"."user_role", 'tenant_admin'::"public"."user_role"]))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: area_attendance_overview 管理员可管理上岗一览; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员可管理上岗一览'
      AND n.nspname = 'public'
      AND c.relname = 'area_attendance_overview'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员可管理上岗一览" ON "public"."area_attendance_overview" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'tenant_admin'::"public"."user_role")))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: area_staff_assignments 管理员可管理人员分配; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员可管理人员分配'
      AND n.nspname = 'public'
      AND c.relname = 'area_staff_assignments'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员可管理人员分配" ON "public"."area_staff_assignments" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'tenant_admin'::"public"."user_role")))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: area_positions 管理员可管理岗位配置; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员可管理岗位配置'
      AND n.nspname = 'public'
      AND c.relname = 'area_positions'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员可管理岗位配置" ON "public"."area_positions" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'tenant_admin'::"public"."user_role")))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: data_snapshots 管理员可管理所有快照; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员可管理所有快照'
      AND n.nspname = 'public'
      AND c.relname = 'data_snapshots'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员可管理所有快照" ON "public"."data_snapshots" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'super_admin'::"public"."user_role")))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: store_position_assignments 管理员可管理本租户的人员分配; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员可管理本租户的人员分配'
      AND n.nspname = 'public'
      AND c.relname = 'store_position_assignments'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员可管理本租户的人员分配" ON "public"."store_position_assignments" USING (("tenant_id" IN ( SELECT "profiles"."tenant_id"
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['super_admin'::"public"."user_role", 'tenant_admin'::"public"."user_role", 'store_manager'::"public"."user_role"]))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: employee_positions 管理员可管理本租户的员工岗位; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员可管理本租户的员工岗位'
      AND n.nspname = 'public'
      AND c.relname = 'employee_positions'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员可管理本租户的员工岗位" ON "public"."employee_positions" USING (("tenant_id" IN ( SELECT "profiles"."tenant_id"
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['super_admin'::"public"."user_role", 'tenant_admin'::"public"."user_role", 'store_manager'::"public"."user_role"]))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: position_module_permissions 管理员可管理本租户的岗位权限; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员可管理本租户的岗位权限'
      AND n.nspname = 'public'
      AND c.relname = 'position_module_permissions'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员可管理本租户的岗位权限" ON "public"."position_module_permissions" USING (("tenant_id" IN ( SELECT "profiles"."tenant_id"
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['super_admin'::"public"."user_role", 'tenant_admin'::"public"."user_role", 'store_manager'::"public"."user_role"]))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: store_organization 管理员可管理本租户的组织架构; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员可管理本租户的组织架构'
      AND n.nspname = 'public'
      AND c.relname = 'store_organization'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员可管理本租户的组织架构" ON "public"."store_organization" USING (("tenant_id" IN ( SELECT "profiles"."tenant_id"
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['super_admin'::"public"."user_role", 'tenant_admin'::"public"."user_role", 'store_manager'::"public"."user_role"]))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: backup_position_config 管理员可管理本租户的顶岗关系; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员可管理本租户的顶岗关系'
      AND n.nspname = 'public'
      AND c.relname = 'backup_position_config'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员可管理本租户的顶岗关系" ON "public"."backup_position_config" USING (("tenant_id" IN ( SELECT "profiles"."tenant_id"
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['super_admin'::"public"."user_role", 'tenant_admin'::"public"."user_role", 'store_manager'::"public"."user_role"]))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: user_module_permissions 管理员可管理用户权限; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员可管理用户权限'
      AND n.nspname = 'public'
      AND c.relname = 'user_module_permissions'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员可管理用户权限" ON "public"."user_module_permissions" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['super_admin'::"public"."user_role", 'tenant_admin'::"public"."user_role"]))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: role_module_permissions 管理员可管理角色权限; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员可管理角色权限'
      AND n.nspname = 'public'
      AND c.relname = 'role_module_permissions'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员可管理角色权限" ON "public"."role_module_permissions" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['super_admin'::"public"."user_role", 'tenant_admin'::"public"."user_role"]))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: recruitment_positions 管理员完全访问招聘职位; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员完全访问招聘职位'
      AND n.nspname = 'public'
      AND c.relname = 'recruitment_positions'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员完全访问招聘职位" ON "public"."recruitment_positions" TO "authenticated" USING ("public"."is_admin"("auth"."uid"()));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: employee_onboarding 管理员完整权限_入职申请; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员完整权限_入职申请'
      AND n.nspname = 'public'
      AND c.relname = 'employee_onboarding'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员完整权限_入职申请" ON "public"."employee_onboarding" TO "authenticated" USING ("public"."is_admin"("auth"."uid"())) WITH CHECK ("public"."is_admin"("auth"."uid"()));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: onboarding_documents 管理员完整权限_入职资料; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员完整权限_入职资料'
      AND n.nspname = 'public'
      AND c.relname = 'onboarding_documents'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员完整权限_入职资料" ON "public"."onboarding_documents" TO "authenticated" USING ("public"."is_admin"("auth"."uid"())) WITH CHECK ("public"."is_admin"("auth"."uid"()));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: resignation_handover 管理员完整权限_离职交接; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员完整权限_离职交接'
      AND n.nspname = 'public'
      AND c.relname = 'resignation_handover'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员完整权限_离职交接" ON "public"."resignation_handover" TO "authenticated" USING ("public"."is_admin"("auth"."uid"())) WITH CHECK ("public"."is_admin"("auth"."uid"()));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: employee_resignation 管理员完整权限_离职申请; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员完整权限_离职申请'
      AND n.nspname = 'public'
      AND c.relname = 'employee_resignation'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员完整权限_离职申请" ON "public"."employee_resignation" TO "authenticated" USING ("public"."is_admin"("auth"."uid"())) WITH CHECK ("public"."is_admin"("auth"."uid"()));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: exit_interview 管理员完整权限_离职面谈; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员完整权限_离职面谈'
      AND n.nspname = 'public'
      AND c.relname = 'exit_interview'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员完整权限_离职面谈" ON "public"."exit_interview" TO "authenticated" USING ("public"."is_admin"("auth"."uid"())) WITH CHECK ("public"."is_admin"("auth"."uid"()));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: probation_evaluation 管理员完整权限_试用期评估; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员完整权限_试用期评估'
      AND n.nspname = 'public'
      AND c.relname = 'probation_evaluation'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员完整权限_试用期评估" ON "public"."probation_evaluation" TO "authenticated" USING ("public"."is_admin"("auth"."uid"())) WITH CHECK ("public"."is_admin"("auth"."uid"()));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: regularization_application 管理员完整权限_转正申请; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员完整权限_转正申请'
      AND n.nspname = 'public'
      AND c.relname = 'regularization_application'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员完整权限_转正申请" ON "public"."regularization_application" TO "authenticated" USING ("public"."is_admin"("auth"."uid"())) WITH CHECK ("public"."is_admin"("auth"."uid"()));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: shift_swap_requests 管理员审批换班申请; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员审批换班申请'
      AND n.nspname = 'public'
      AND c.relname = 'shift_swap_requests'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员审批换班申请" ON "public"."shift_swap_requests" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['tenant_admin'::"public"."user_role", 'store_manager'::"public"."user_role"]))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: employee_work_info 管理员插入工作信息; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员插入工作信息'
      AND n.nspname = 'public'
      AND c.relname = 'employee_work_info'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员插入工作信息" ON "public"."employee_work_info" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['tenant_admin'::"public"."user_role", 'super_admin'::"public"."user_role"]))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: employee_shifts 管理员插入班次; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员插入班次'
      AND n.nspname = 'public'
      AND c.relname = 'employee_shifts'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员插入班次" ON "public"."employee_shifts" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['tenant_admin'::"public"."user_role", 'store_manager'::"public"."user_role"]))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: work_attendance 管理员插入考勤; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员插入考勤'
      AND n.nspname = 'public'
      AND c.relname = 'work_attendance'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员插入考勤" ON "public"."work_attendance" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['tenant_admin'::"public"."user_role", 'super_admin'::"public"."user_role", 'store_manager'::"public"."user_role"]))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: employee_work_info 管理员更新工作信息; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员更新工作信息'
      AND n.nspname = 'public'
      AND c.relname = 'employee_work_info'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员更新工作信息" ON "public"."employee_work_info" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['tenant_admin'::"public"."user_role", 'super_admin'::"public"."user_role"]))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: tasks 管理员更新所有任务; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员更新所有任务'
      AND n.nspname = 'public'
      AND c.relname = 'tasks'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员更新所有任务" ON "public"."tasks" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['tenant_admin'::"public"."user_role", 'super_admin'::"public"."user_role"]))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: employee_shifts 管理员更新班次; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员更新班次'
      AND n.nspname = 'public'
      AND c.relname = 'employee_shifts'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员更新班次" ON "public"."employee_shifts" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['tenant_admin'::"public"."user_role", 'store_manager'::"public"."user_role"]))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: work_attendance 管理员更新考勤; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员更新考勤'
      AND n.nspname = 'public'
      AND c.relname = 'work_attendance'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员更新考勤" ON "public"."work_attendance" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['tenant_admin'::"public"."user_role", 'super_admin'::"public"."user_role", 'store_manager'::"public"."user_role"]))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: tasks 管理员查看所有任务; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员查看所有任务'
      AND n.nspname = 'public'
      AND c.relname = 'tasks'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员查看所有任务" ON "public"."tasks" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['tenant_admin'::"public"."user_role", 'super_admin'::"public"."user_role"]))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: employee_work_info 管理员查看所有工作信息; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员查看所有工作信息'
      AND n.nspname = 'public'
      AND c.relname = 'employee_work_info'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员查看所有工作信息" ON "public"."employee_work_info" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['tenant_admin'::"public"."user_role", 'super_admin'::"public"."user_role"]))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: shift_swap_requests 管理员查看所有换班申请; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员查看所有换班申请'
      AND n.nspname = 'public'
      AND c.relname = 'shift_swap_requests'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员查看所有换班申请" ON "public"."shift_swap_requests" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['tenant_admin'::"public"."user_role", 'store_manager'::"public"."user_role"]))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: employee_shifts 管理员查看所有班次; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员查看所有班次'
      AND n.nspname = 'public'
      AND c.relname = 'employee_shifts'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员查看所有班次" ON "public"."employee_shifts" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['tenant_admin'::"public"."user_role", 'store_manager'::"public"."user_role"]))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: work_attendance 管理员查看所有考勤; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员查看所有考勤'
      AND n.nspname = 'public'
      AND c.relname = 'work_attendance'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员查看所有考勤" ON "public"."work_attendance" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['tenant_admin'::"public"."user_role", 'super_admin'::"public"."user_role", 'store_manager'::"public"."user_role"]))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: leave_balances 管理员管理假期余额; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员管理假期余额'
      AND n.nspname = 'public'
      AND c.relname = 'leave_balances'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员管理假期余额" ON "public"."leave_balances" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['tenant_admin'::"public"."user_role", 'store_manager'::"public"."user_role"]))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: onboarding_tasks 管理员管理入职任务; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员管理入职任务'
      AND n.nspname = 'public'
      AND c.relname = 'onboarding_tasks'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员管理入职任务" ON "public"."onboarding_tasks" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['tenant_admin'::"public"."user_role", 'store_manager'::"public"."user_role"]))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: onboarding_history 管理员管理入职历史; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员管理入职历史'
      AND n.nspname = 'public'
      AND c.relname = 'onboarding_history'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员管理入职历史" ON "public"."onboarding_history" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['tenant_admin'::"public"."user_role", 'store_manager'::"public"."user_role"]))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: onboarding_processes 管理员管理入职流程; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员管理入职流程'
      AND n.nspname = 'public'
      AND c.relname = 'onboarding_processes'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员管理入职流程" ON "public"."onboarding_processes" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['tenant_admin'::"public"."user_role", 'store_manager'::"public"."user_role"]))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: onboarding_applications 管理员管理入职申请; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员管理入职申请'
      AND n.nspname = 'public'
      AND c.relname = 'onboarding_applications'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员管理入职申请" ON "public"."onboarding_applications" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['tenant_admin'::"public"."user_role", 'store_manager'::"public"."user_role"]))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: onboarding_documents 管理员管理入职资料; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员管理入职资料'
      AND n.nspname = 'public'
      AND c.relname = 'onboarding_documents'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员管理入职资料" ON "public"."onboarding_documents" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['tenant_admin'::"public"."user_role", 'store_manager'::"public"."user_role"]))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: overtime_types 管理员管理加班类型; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员管理加班类型'
      AND n.nspname = 'public'
      AND c.relname = 'overtime_types'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员管理加班类型" ON "public"."overtime_types" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['tenant_admin'::"public"."user_role", 'store_manager'::"public"."user_role"]))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: overtime_compensations 管理员管理加班补偿; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员管理加班补偿'
      AND n.nspname = 'public'
      AND c.relname = 'overtime_compensations'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员管理加班补偿" ON "public"."overtime_compensations" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['tenant_admin'::"public"."user_role", 'store_manager'::"public"."user_role"]))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: transfer_positions 管理员管理可调岗位; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员管理可调岗位'
      AND n.nspname = 'public'
      AND c.relname = 'transfer_positions'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员管理可调岗位" ON "public"."transfer_positions" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['tenant_admin'::"public"."user_role", 'store_manager'::"public"."user_role"]))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: employee_benefits 管理员管理员工福利; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员管理员工福利'
      AND n.nspname = 'public'
      AND c.relname = 'employee_benefits'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员管理员工福利" ON "public"."employee_benefits" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['tenant_admin'::"public"."user_role", 'store_manager'::"public"."user_role"]))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: salary_records 管理员管理工资记录; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员管理工资记录'
      AND n.nspname = 'public'
      AND c.relname = 'salary_records'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员管理工资记录" ON "public"."salary_records" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['tenant_admin'::"public"."user_role", 'store_manager'::"public"."user_role"]))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: overtime_requests 管理员管理所有加班申请; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员管理所有加班申请'
      AND n.nspname = 'public'
      AND c.relname = 'overtime_requests'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员管理所有加班申请" ON "public"."overtime_requests" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['tenant_admin'::"public"."user_role", 'store_manager'::"public"."user_role"]))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: performance_improvements 管理员管理所有改进计划; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员管理所有改进计划'
      AND n.nspname = 'public'
      AND c.relname = 'performance_improvements'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员管理所有改进计划" ON "public"."performance_improvements" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['tenant_admin'::"public"."user_role", 'store_manager'::"public"."user_role"]))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: performance_goals 管理员管理所有目标; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员管理所有目标'
      AND n.nspname = 'public'
      AND c.relname = 'performance_goals'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员管理所有目标" ON "public"."performance_goals" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['tenant_admin'::"public"."user_role", 'store_manager'::"public"."user_role"]))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: employee_levels 管理员管理所有等级; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员管理所有等级'
      AND n.nspname = 'public'
      AND c.relname = 'employee_levels'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员管理所有等级" ON "public"."employee_levels" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['tenant_admin'::"public"."user_role", 'store_manager'::"public"."user_role"]))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: employee_performance 管理员管理所有绩效; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员管理所有绩效'
      AND n.nspname = 'public'
      AND c.relname = 'employee_performance'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员管理所有绩效" ON "public"."employee_performance" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['tenant_admin'::"public"."user_role", 'store_manager'::"public"."user_role"]))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: employee_certifications 管理员管理所有认证; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员管理所有认证'
      AND n.nspname = 'public'
      AND c.relname = 'employee_certifications'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员管理所有认证" ON "public"."employee_certifications" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['tenant_admin'::"public"."user_role", 'store_manager'::"public"."user_role"]))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: leave_requests 管理员管理所有请假申请; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员管理所有请假申请'
      AND n.nspname = 'public'
      AND c.relname = 'leave_requests'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员管理所有请假申请" ON "public"."leave_requests" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['tenant_admin'::"public"."user_role", 'store_manager'::"public"."user_role"]))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: promotion_history 管理员管理晋升历史; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员管理晋升历史'
      AND n.nspname = 'public'
      AND c.relname = 'promotion_history'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员管理晋升历史" ON "public"."promotion_history" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['tenant_admin'::"public"."user_role", 'store_manager'::"public"."user_role"]))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: promotion_requirements 管理员管理晋升条件; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员管理晋升条件'
      AND n.nspname = 'public'
      AND c.relname = 'promotion_requirements'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员管理晋升条件" ON "public"."promotion_requirements" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['tenant_admin'::"public"."user_role", 'store_manager'::"public"."user_role"]))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: promotion_applications 管理员管理晋升申请; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员管理晋升申请'
      AND n.nspname = 'public'
      AND c.relname = 'promotion_applications'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员管理晋升申请" ON "public"."promotion_applications" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['tenant_admin'::"public"."user_role", 'store_manager'::"public"."user_role"]))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: promotion_reviews 管理员管理晋升评审; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员管理晋升评审'
      AND n.nspname = 'public'
      AND c.relname = 'promotion_reviews'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员管理晋升评审" ON "public"."promotion_reviews" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['tenant_admin'::"public"."user_role", 'store_manager'::"public"."user_role"]))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: promotion_paths 管理员管理晋升路径; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员管理晋升路径'
      AND n.nspname = 'public'
      AND c.relname = 'promotion_paths'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员管理晋升路径" ON "public"."promotion_paths" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['tenant_admin'::"public"."user_role", 'store_manager'::"public"."user_role"]))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: benefit_usage_records 管理员管理福利使用记录; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员管理福利使用记录'
      AND n.nspname = 'public'
      AND c.relname = 'benefit_usage_records'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员管理福利使用记录" ON "public"."benefit_usage_records" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['tenant_admin'::"public"."user_role", 'store_manager'::"public"."user_role"]))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: benefit_types 管理员管理福利类型; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员管理福利类型'
      AND n.nspname = 'public'
      AND c.relname = 'benefit_types'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员管理福利类型" ON "public"."benefit_types" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['tenant_admin'::"public"."user_role", 'store_manager'::"public"."user_role"]))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: offboarding_handovers 管理员管理离职交接; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员管理离职交接'
      AND n.nspname = 'public'
      AND c.relname = 'offboarding_handovers'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员管理离职交接" ON "public"."offboarding_handovers" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['tenant_admin'::"public"."user_role", 'store_manager'::"public"."user_role"]))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: offboarding_tasks 管理员管理离职任务; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员管理离职任务'
      AND n.nspname = 'public'
      AND c.relname = 'offboarding_tasks'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员管理离职任务" ON "public"."offboarding_tasks" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['tenant_admin'::"public"."user_role", 'store_manager'::"public"."user_role"]))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: offboarding_history 管理员管理离职历史; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员管理离职历史'
      AND n.nspname = 'public'
      AND c.relname = 'offboarding_history'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员管理离职历史" ON "public"."offboarding_history" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['tenant_admin'::"public"."user_role", 'store_manager'::"public"."user_role"]))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: offboarding_applications 管理员管理离职申请; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员管理离职申请'
      AND n.nspname = 'public'
      AND c.relname = 'offboarding_applications'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员管理离职申请" ON "public"."offboarding_applications" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['tenant_admin'::"public"."user_role", 'store_manager'::"public"."user_role"]))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: offboarding_interviews 管理员管理离职面谈; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员管理离职面谈'
      AND n.nspname = 'public'
      AND c.relname = 'offboarding_interviews'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员管理离职面谈" ON "public"."offboarding_interviews" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['tenant_admin'::"public"."user_role", 'store_manager'::"public"."user_role"]))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: salary_structures 管理员管理薪酬结构; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员管理薪酬结构'
      AND n.nspname = 'public'
      AND c.relname = 'salary_structures'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员管理薪酬结构" ON "public"."salary_structures" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['tenant_admin'::"public"."user_role", 'store_manager'::"public"."user_role"]))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: leave_types 管理员管理请假类型; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员管理请假类型'
      AND n.nspname = 'public'
      AND c.relname = 'leave_types'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员管理请假类型" ON "public"."leave_types" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['tenant_admin'::"public"."user_role", 'store_manager'::"public"."user_role"]))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: transfer_history 管理员管理调岗历史; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员管理调岗历史'
      AND n.nspname = 'public'
      AND c.relname = 'transfer_history'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员管理调岗历史" ON "public"."transfer_history" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['tenant_admin'::"public"."user_role", 'store_manager'::"public"."user_role"]))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: transfer_requirements 管理员管理调岗条件; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员管理调岗条件'
      AND n.nspname = 'public'
      AND c.relname = 'transfer_requirements'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员管理调岗条件" ON "public"."transfer_requirements" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['tenant_admin'::"public"."user_role", 'store_manager'::"public"."user_role"]))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: transfer_applications 管理员管理调岗申请; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员管理调岗申请'
      AND n.nspname = 'public'
      AND c.relname = 'transfer_applications'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员管理调岗申请" ON "public"."transfer_applications" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['tenant_admin'::"public"."user_role", 'store_manager'::"public"."user_role"]))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: transfer_reviews 管理员管理调岗评审; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员管理调岗评审'
      AND n.nspname = 'public'
      AND c.relname = 'transfer_reviews'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理员管理调岗评审" ON "public"."transfer_reviews" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['tenant_admin'::"public"."user_role", 'store_manager'::"public"."user_role"]))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: area_positions 管理者可管理区域岗位; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理者可管理区域岗位'
      AND n.nspname = 'public'
      AND c.relname = 'area_positions'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理者可管理区域岗位" ON "public"."area_positions" USING (("area_id" IN ( SELECT "business_areas"."id"
   FROM "public"."business_areas"
  WHERE ("business_areas"."tenant_id" IN ( SELECT "profiles"."tenant_id"
           FROM "public"."profiles"
          WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['store_manager'::"public"."user_role", 'tenant_admin'::"public"."user_role", 'super_admin'::"public"."user_role"]))))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: area_daily_status 管理者可管理区域状态; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理者可管理区域状态'
      AND n.nspname = 'public'
      AND c.relname = 'area_daily_status'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理者可管理区域状态" ON "public"."area_daily_status" USING (("area_id" IN ( SELECT "business_areas"."id"
   FROM "public"."business_areas"
  WHERE ("business_areas"."tenant_id" IN ( SELECT "profiles"."tenant_id"
           FROM "public"."profiles"
          WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['store_manager'::"public"."user_role", 'tenant_admin'::"public"."user_role", 'super_admin'::"public"."user_role"]))))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: area_staff_assignments 管理者可管理员工分配; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理者可管理员工分配'
      AND n.nspname = 'public'
      AND c.relname = 'area_staff_assignments'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理者可管理员工分配" ON "public"."area_staff_assignments" USING (("area_id" IN ( SELECT "business_areas"."id"
   FROM "public"."business_areas"
  WHERE ("business_areas"."tenant_id" IN ( SELECT "profiles"."tenant_id"
           FROM "public"."profiles"
          WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['store_manager'::"public"."user_role", 'tenant_admin'::"public"."user_role", 'super_admin'::"public"."user_role"]))))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: area_attendance_overview 管理者可管理考勤概览; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理者可管理考勤概览'
      AND n.nspname = 'public'
      AND c.relname = 'area_attendance_overview'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "管理者可管理考勤概览" ON "public"."area_attendance_overview" USING (("store_id" IN ( SELECT "stores"."id"
   FROM "public"."stores"
  WHERE ("stores"."tenant_id" IN ( SELECT "profiles"."tenant_id"
           FROM "public"."profiles"
          WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['store_manager'::"public"."user_role", 'tenant_admin'::"public"."user_role", 'super_admin'::"public"."user_role"]))))))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: employee_levels 系统创建员工等级; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '系统创建员工等级'
      AND n.nspname = 'public'
      AND c.relname = 'employee_levels'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "系统创建员工等级" ON "public"."employee_levels" FOR INSERT WITH CHECK (true);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: employee_certifications 系统创建员工认证; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '系统创建员工认证'
      AND n.nspname = 'public'
      AND c.relname = 'employee_certifications'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "系统创建员工认证" ON "public"."employee_certifications" FOR INSERT WITH CHECK (true);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: profiles 系统可以创建profile; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '系统可以创建profile'
      AND n.nspname = 'public'
      AND c.relname = 'profiles'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "系统可以创建profile" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK (true);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: learning_achievements 系统可以创建成就; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '系统可以创建成就'
      AND n.nspname = 'public'
      AND c.relname = 'learning_achievements'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "系统可以创建成就" ON "public"."learning_achievements" FOR INSERT WITH CHECK (true);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: tenants 认证用户可以创建租户; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '认证用户可以创建租户'
      AND n.nspname = 'public'
      AND c.relname = 'tenants'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "认证用户可以创建租户" ON "public"."tenants" FOR INSERT TO "authenticated" WITH CHECK (true);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: tenant_applications 认证用户可以创建租户申请; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '认证用户可以创建租户申请'
      AND n.nspname = 'public'
      AND c.relname = 'tenant_applications'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "认证用户可以创建租户申请" ON "public"."tenant_applications" FOR INSERT TO "authenticated" WITH CHECK (true);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: day_off_records 认证用户可以管理休假记录; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '认证用户可以管理休假记录'
      AND n.nspname = 'public'
      AND c.relname = 'day_off_records'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "认证用户可以管理休假记录" ON "public"."day_off_records" TO "authenticated" USING (true) WITH CHECK (true);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: part_time_records 认证用户可以管理兼职记录; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '认证用户可以管理兼职记录'
      AND n.nspname = 'public'
      AND c.relname = 'part_time_records'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "认证用户可以管理兼职记录" ON "public"."part_time_records" TO "authenticated" USING (true) WITH CHECK (true);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: schedule_plans 认证用户可以管理排班规划; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '认证用户可以管理排班规划'
      AND n.nspname = 'public'
      AND c.relname = 'schedule_plans'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "认证用户可以管理排班规划" ON "public"."schedule_plans" TO "authenticated" USING (true) WITH CHECK (true);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: schedule_plan_periods 认证用户可以管理排班规划餐时间段; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '认证用户可以管理排班规划餐时间段'
      AND n.nspname = 'public'
      AND c.relname = 'schedule_plan_periods'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "认证用户可以管理排班规划餐时间段" ON "public"."schedule_plan_periods" TO "authenticated" USING (true) WITH CHECK (true);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: efficiency_standards 认证用户可以管理效能标准配置; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '认证用户可以管理效能标准配置'
      AND n.nspname = 'public'
      AND c.relname = 'efficiency_standards'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "认证用户可以管理效能标准配置" ON "public"."efficiency_standards" TO "authenticated" USING (true) WITH CHECK (true);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: daily_operations 认证用户可以管理每日运营记录; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '认证用户可以管理每日运营记录'
      AND n.nspname = 'public'
      AND c.relname = 'daily_operations'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "认证用户可以管理每日运营记录" ON "public"."daily_operations" TO "authenticated" USING (true) WITH CHECK (true);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: work_shifts 认证用户可以管理班次配置; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '认证用户可以管理班次配置'
      AND n.nspname = 'public'
      AND c.relname = 'work_shifts'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "认证用户可以管理班次配置" ON "public"."work_shifts" TO "authenticated" USING (true) WITH CHECK (true);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: meal_periods 认证用户可以管理餐段配置; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '认证用户可以管理餐段配置'
      AND n.nspname = 'public'
      AND c.relname = 'meal_periods'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "认证用户可以管理餐段配置" ON "public"."meal_periods" TO "authenticated" USING (true) WITH CHECK (true);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: positions 认证用户可查看岗位; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '认证用户可查看岗位'
      AND n.nspname = 'public'
      AND c.relname = 'positions'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "认证用户可查看岗位" ON "public"."positions" FOR SELECT TO "authenticated" USING (true);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: rest_day_rules 认证用户可查看排休规则; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '认证用户可查看排休规则'
      AND n.nspname = 'public'
      AND c.relname = 'rest_day_rules'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "认证用户可查看排休规则" ON "public"."rest_day_rules" FOR SELECT TO "authenticated" USING (true);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: min_revenue_positions 认证用户可查看最低营收配置; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '认证用户可查看最低营收配置'
      AND n.nspname = 'public'
      AND c.relname = 'min_revenue_positions'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "认证用户可查看最低营收配置" ON "public"."min_revenue_positions" FOR SELECT TO "authenticated" USING (true);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: business_areas 认证用户可查看经营区域; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '认证用户可查看经营区域'
      AND n.nspname = 'public'
      AND c.relname = 'business_areas'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "认证用户可查看经营区域" ON "public"."business_areas" FOR SELECT TO "authenticated" USING (true);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: promotion_reviews 评审人查看相关评审; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '评审人查看相关评审'
      AND n.nspname = 'public'
      AND c.relname = 'promotion_reviews'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "评审人查看相关评审" ON "public"."promotion_reviews" FOR SELECT USING (("reviewer_id" IN ( SELECT "employees"."id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = "auth"."uid"()))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: transfer_reviews 评审人查看相关评审; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '评审人查看相关评审'
      AND n.nspname = 'public'
      AND c.relname = 'transfer_reviews'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "评审人查看相关评审" ON "public"."transfer_reviews" FOR SELECT USING (("reviewer_id" IN ( SELECT "employees"."id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = "auth"."uid"()))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: tenants 超级管理员可以删除租户; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '超级管理员可以删除租户'
      AND n.nspname = 'public'
      AND c.relname = 'tenants'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "超级管理员可以删除租户" ON "public"."tenants" FOR DELETE TO "authenticated" USING ("public"."is_super_admin"("auth"."uid"()));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: tenant_settings 超级管理员可以删除租户配置; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '超级管理员可以删除租户配置'
      AND n.nspname = 'public'
      AND c.relname = 'tenant_settings'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "超级管理员可以删除租户配置" ON "public"."tenant_settings" FOR DELETE TO "authenticated" USING ("public"."is_super_admin"("auth"."uid"()));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: tenant_settings 超级管理员可以插入租户配置; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '超级管理员可以插入租户配置'
      AND n.nspname = 'public'
      AND c.relname = 'tenant_settings'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "超级管理员可以插入租户配置" ON "public"."tenant_settings" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_super_admin"("auth"."uid"()));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: tenant_settings 超级管理员可以更新所有租户配置; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '超级管理员可以更新所有租户配置'
      AND n.nspname = 'public'
      AND c.relname = 'tenant_settings'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "超级管理员可以更新所有租户配置" ON "public"."tenant_settings" FOR UPDATE TO "authenticated" USING ("public"."is_super_admin"("auth"."uid"())) WITH CHECK ("public"."is_super_admin"("auth"."uid"()));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: tenant_applications 超级管理员可以更新申请; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '超级管理员可以更新申请'
      AND n.nspname = 'public'
      AND c.relname = 'tenant_applications'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "超级管理员可以更新申请" ON "public"."tenant_applications" FOR UPDATE TO "authenticated" USING ("public"."is_super_admin"("auth"."uid"())) WITH CHECK ("public"."is_super_admin"("auth"."uid"()));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: tenant_applications 超级管理员可以查看所有申请; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '超级管理员可以查看所有申请'
      AND n.nspname = 'public'
      AND c.relname = 'tenant_applications'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "超级管理员可以查看所有申请" ON "public"."tenant_applications" FOR SELECT TO "authenticated" USING ("public"."is_super_admin"("auth"."uid"()));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: tenant_settings 超级管理员可以查看所有租户配置; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '超级管理员可以查看所有租户配置'
      AND n.nspname = 'public'
      AND c.relname = 'tenant_settings'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "超级管理员可以查看所有租户配置" ON "public"."tenant_settings" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'super_admin'::"public"."user_role")))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: agent_assignments 超级管理员可以管理所有Agent分配; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '超级管理员可以管理所有Agent分配'
      AND n.nspname = 'public'
      AND c.relname = 'agent_assignments'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "超级管理员可以管理所有Agent分配" ON "public"."agent_assignments" TO "authenticated" USING ("public"."is_admin"("auth"."uid"()));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: revenue_impact_factors 超级管理员可以管理所有影响因子; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '超级管理员可以管理所有影响因子'
      AND n.nspname = 'public'
      AND c.relname = 'revenue_impact_factors'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "超级管理员可以管理所有影响因子" ON "public"."revenue_impact_factors" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'super_admin'::"public"."user_role")))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: daily_revenue_detail 超级管理员可以管理所有每日营收明细; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '超级管理员可以管理所有每日营收明细'
      AND n.nspname = 'public'
      AND c.relname = 'daily_revenue_detail'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "超级管理员可以管理所有每日营收明细" ON "public"."daily_revenue_detail" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'super_admin'::"public"."user_role")))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: revenue_calendar 超级管理员可以管理所有营收日历; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '超级管理员可以管理所有营收日历'
      AND n.nspname = 'public'
      AND c.relname = 'revenue_calendar'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "超级管理员可以管理所有营收日历" ON "public"."revenue_calendar" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'super_admin'::"public"."user_role")))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: revenue_adjustment_log 超级管理员可以管理所有营收调整记录; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '超级管理员可以管理所有营收调整记录'
      AND n.nspname = 'public'
      AND c.relname = 'revenue_adjustment_log'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "超级管理员可以管理所有营收调整记录" ON "public"."revenue_adjustment_log" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'super_admin'::"public"."user_role")))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: brands 超级管理员可以访问所有品牌; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '超级管理员可以访问所有品牌'
      AND n.nspname = 'public'
      AND c.relname = 'brands'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "超级管理员可以访问所有品牌" ON "public"."brands" TO "authenticated" USING ("public"."is_super_admin"("auth"."uid"())) WITH CHECK ("public"."is_super_admin"("auth"."uid"()));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: system_modules 超级管理员可管理系统模块; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '超级管理员可管理系统模块'
      AND n.nspname = 'public'
      AND c.relname = 'system_modules'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "超级管理员可管理系统模块" ON "public"."system_modules" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'super_admin'::"public"."user_role")))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: employees 超级管理员可访问所有员工; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '超级管理员可访问所有员工'
      AND n.nspname = 'public'
      AND c.relname = 'employees'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "超级管理员可访问所有员工" ON "public"."employees" TO "authenticated" USING ("public"."is_super_admin"("auth"."uid"()));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: stores 超级管理员可访问所有店铺; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '超级管理员可访问所有店铺'
      AND n.nspname = 'public'
      AND c.relname = 'stores'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "超级管理员可访问所有店铺" ON "public"."stores" TO "authenticated" USING ("public"."is_super_admin"("auth"."uid"()));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: cost_data 超级管理员可访问所有成本数据; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '超级管理员可访问所有成本数据'
      AND n.nspname = 'public'
      AND c.relname = 'cost_data'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "超级管理员可访问所有成本数据" ON "public"."cost_data" TO "authenticated" USING ("public"."is_super_admin"("auth"."uid"()));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: schedules 超级管理员可访问所有排班; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '超级管理员可访问所有排班'
      AND n.nspname = 'public'
      AND c.relname = 'schedules'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "超级管理员可访问所有排班" ON "public"."schedules" TO "authenticated" USING ("public"."is_super_admin"("auth"."uid"()));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: schedule_logs 超级管理员可访问所有日志; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '超级管理员可访问所有日志'
      AND n.nspname = 'public'
      AND c.relname = 'schedule_logs'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "超级管理员可访问所有日志" ON "public"."schedule_logs" TO "authenticated" USING ("public"."is_super_admin"("auth"."uid"()));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: profiles 超级管理员可访问所有用户; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '超级管理员可访问所有用户'
      AND n.nspname = 'public'
      AND c.relname = 'profiles'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "超级管理员可访问所有用户" ON "public"."profiles" TO "authenticated" USING ("public"."is_super_admin"("auth"."uid"()));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: tenants 超级管理员可访问所有租户; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '超级管理员可访问所有租户'
      AND n.nspname = 'public'
      AND c.relname = 'tenants'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "超级管理员可访问所有租户" ON "public"."tenants" TO "authenticated" USING ("public"."is_super_admin"("auth"."uid"()));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: operations_data 超级管理员可访问所有运营数据; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '超级管理员可访问所有运营数据'
      AND n.nspname = 'public'
      AND c.relname = 'operations_data'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "超级管理员可访问所有运营数据" ON "public"."operations_data" TO "authenticated" USING ("public"."is_super_admin"("auth"."uid"()));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- PostgreSQL database dump complete
--




-- ============================================================
-- SECTION: DIFF FILTER OBJECTS
-- ============================================================
-- Objects that match diff-filter.json but cannot be represented
-- precisely by pg_dump --filter.

-- auth.users trigger: on_auth_user_created
DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE NOT t.tgisinternal
      AND t.tgname = 'on_auth_user_created'
      AND n.nspname = 'auth'
      AND c.relname = 'users'
  ) THEN
    EXECUTE 'CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();';
  END IF;
END
$pg_schema_restore$;
-- auth.users trigger: on_auth_user_created_or_confirmed
DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE NOT t.tgisinternal
      AND t.tgname = 'on_auth_user_created_or_confirmed'
      AND n.nspname = 'auth'
      AND c.relname = 'users'
  ) THEN
    EXECUTE 'CREATE TRIGGER on_auth_user_created_or_confirmed AFTER INSERT OR UPDATE ON auth.users FOR EACH ROW WHEN (new.phone IS NOT NULL OR new.email IS NOT NULL) EXECUTE FUNCTION public.handle_new_user();';
  END IF;
END
$pg_schema_restore$;
-- policy: "Admins can view all documents" on storage.objects
DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'Admins can view all documents'
      AND n.nspname = 'storage'
      AND c.relname = 'objects'
  ) THEN
    EXECUTE 'CREATE POLICY "Admins can view all documents" ON storage.objects AS PERMISSIVE FOR SELECT TO authenticated USING (((bucket_id = ''onboarding_documents''::text) AND public.is_admin(auth.uid())));';
  END IF;
END
$pg_schema_restore$;
-- policy: "Anyone can view signatures" on storage.objects
DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'Anyone can view signatures'
      AND n.nspname = 'storage'
      AND c.relname = 'objects'
  ) THEN
    EXECUTE 'CREATE POLICY "Anyone can view signatures" ON storage.objects AS PERMISSIVE FOR SELECT TO PUBLIC USING ((bucket_id = ''contract_signatures''::text));';
  END IF;
END
$pg_schema_restore$;
-- policy: "Authenticated users can upload documents" on storage.objects
DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'Authenticated users can upload documents'
      AND n.nspname = 'storage'
      AND c.relname = 'objects'
  ) THEN
    EXECUTE 'CREATE POLICY "Authenticated users can upload documents" ON storage.objects AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((bucket_id = ''onboarding_documents''::text));';
  END IF;
END
$pg_schema_restore$;
-- policy: "Authenticated users can upload signatures" on storage.objects
DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'Authenticated users can upload signatures'
      AND n.nspname = 'storage'
      AND c.relname = 'objects'
  ) THEN
    EXECUTE 'CREATE POLICY "Authenticated users can upload signatures" ON storage.objects AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((bucket_id = ''contract_signatures''::text));';
  END IF;
END
$pg_schema_restore$;
-- policy: "Users can delete their own documents" on storage.objects
DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'Users can delete their own documents'
      AND n.nspname = 'storage'
      AND c.relname = 'objects'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can delete their own documents" ON storage.objects AS PERMISSIVE FOR DELETE TO authenticated USING (((bucket_id = ''onboarding_documents''::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));';
  END IF;
END
$pg_schema_restore$;
-- policy: "Users can delete their own signatures" on storage.objects
DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'Users can delete their own signatures'
      AND n.nspname = 'storage'
      AND c.relname = 'objects'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can delete their own signatures" ON storage.objects AS PERMISSIVE FOR DELETE TO authenticated USING ((bucket_id = ''contract_signatures''::text));';
  END IF;
END
$pg_schema_restore$;
-- policy: "Users can view their own documents" on storage.objects
DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'Users can view their own documents'
      AND n.nspname = 'storage'
      AND c.relname = 'objects'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can view their own documents" ON storage.objects AS PERMISSIVE FOR SELECT TO authenticated USING (((bucket_id = ''onboarding_documents''::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));';
  END IF;
END
$pg_schema_restore$;
-- policy: "所有人可以查看工作记录文件" on storage.objects
DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '所有人可以查看工作记录文件'
      AND n.nspname = 'storage'
      AND c.relname = 'objects'
  ) THEN
    EXECUTE 'CREATE POLICY "所有人可以查看工作记录文件" ON storage.objects AS PERMISSIVE FOR SELECT TO PUBLIC USING ((bucket_id = ''app-7daop8q0sxdt_work_logs''::text));';
  END IF;
END
$pg_schema_restore$;
-- policy: "所有人可查看品牌Logo" on storage.objects
DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '所有人可查看品牌Logo'
      AND n.nspname = 'storage'
      AND c.relname = 'objects'
  ) THEN
    EXECUTE 'CREATE POLICY "所有人可查看品牌Logo" ON storage.objects AS PERMISSIVE FOR SELECT TO PUBLIC USING ((bucket_id = ''app-7daop8q0sxdt_brand_logos''::text));';
  END IF;
END
$pg_schema_restore$;
-- policy: "用户可以删除自己的工作记录文件" on storage.objects
DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '用户可以删除自己的工作记录文件'
      AND n.nspname = 'storage'
      AND c.relname = 'objects'
  ) THEN
    EXECUTE 'CREATE POLICY "用户可以删除自己的工作记录文件" ON storage.objects AS PERMISSIVE FOR DELETE TO authenticated USING (((bucket_id = ''app-7daop8q0sxdt_work_logs''::text) AND (owner = auth.uid())));';
  END IF;
END
$pg_schema_restore$;
-- policy: "管理员可上传品牌Logo" on storage.objects
DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员可上传品牌Logo'
      AND n.nspname = 'storage'
      AND c.relname = 'objects'
  ) THEN
    EXECUTE 'CREATE POLICY "管理员可上传品牌Logo" ON storage.objects AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((bucket_id = ''app-7daop8q0sxdt_brand_logos''::text) AND (auth.uid() IN ( SELECT profiles.id
   FROM public.profiles
  WHERE (profiles.role = ANY (ARRAY[''store_manager''::public.user_role, ''tenant_admin''::public.user_role, ''super_admin''::public.user_role]))))));';
  END IF;
END
$pg_schema_restore$;
-- policy: "管理员可删除品牌Logo" on storage.objects
DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员可删除品牌Logo'
      AND n.nspname = 'storage'
      AND c.relname = 'objects'
  ) THEN
    EXECUTE 'CREATE POLICY "管理员可删除品牌Logo" ON storage.objects AS PERMISSIVE FOR DELETE TO authenticated USING (((bucket_id = ''app-7daop8q0sxdt_brand_logos''::text) AND (auth.uid() IN ( SELECT profiles.id
   FROM public.profiles
  WHERE (profiles.role = ANY (ARRAY[''store_manager''::public.user_role, ''tenant_admin''::public.user_role, ''super_admin''::public.user_role]))))));';
  END IF;
END
$pg_schema_restore$;
-- policy: "管理员可更新品牌Logo" on storage.objects
DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '管理员可更新品牌Logo'
      AND n.nspname = 'storage'
      AND c.relname = 'objects'
  ) THEN
    EXECUTE 'CREATE POLICY "管理员可更新品牌Logo" ON storage.objects AS PERMISSIVE FOR UPDATE TO authenticated USING (((bucket_id = ''app-7daop8q0sxdt_brand_logos''::text) AND (auth.uid() IN ( SELECT profiles.id
   FROM public.profiles
  WHERE (profiles.role = ANY (ARRAY[''store_manager''::public.user_role, ''tenant_admin''::public.user_role, ''super_admin''::public.user_role]))))));';
  END IF;
END
$pg_schema_restore$;
-- policy: "认证用户可以上传工作记录文件" on storage.objects
DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = '认证用户可以上传工作记录文件'
      AND n.nspname = 'storage'
      AND c.relname = 'objects'
  ) THEN
    EXECUTE 'CREATE POLICY "认证用户可以上传工作记录文件" ON storage.objects AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((bucket_id = ''app-7daop8q0sxdt_work_logs''::text));';
  END IF;
END
$pg_schema_restore$;

-- ============================================================
-- SECTION: STORAGE BUCKETS DATA
-- ============================================================

INSERT INTO "storage"."buckets" ("id", "name", "owner", "created_at", "updated_at", "public", "avif_autodetection", "file_size_limit", "allowed_mime_types", "owner_id", "type") VALUES ('app-7daop8q0sxdt_brand_logos', 'app-7daop8q0sxdt_brand_logos', NULL, '2025-11-13 07:28:16.447445+00', '2025-11-13 07:28:16.447445+00', 'true', 'false', '1048576', '{image/jpeg,image/png,image/gif,image/webp,image/avif}', NULL, 'STANDARD') ON CONFLICT ("id") DO UPDATE SET "name" = EXCLUDED."name", "owner" = EXCLUDED."owner", "created_at" = EXCLUDED."created_at", "updated_at" = EXCLUDED."updated_at", "public" = EXCLUDED."public", "avif_autodetection" = EXCLUDED."avif_autodetection", "file_size_limit" = EXCLUDED."file_size_limit", "allowed_mime_types" = EXCLUDED."allowed_mime_types", "owner_id" = EXCLUDED."owner_id", "type" = EXCLUDED."type";
INSERT INTO "storage"."buckets" ("id", "name", "owner", "created_at", "updated_at", "public", "avif_autodetection", "file_size_limit", "allowed_mime_types", "owner_id", "type") VALUES ('app-7daop8q0sxdt_work_logs', 'app-7daop8q0sxdt_work_logs', NULL, '2025-12-09 14:08:55.397207+00', '2025-12-09 14:08:55.397207+00', 'true', 'false', '10485760', '{image/jpeg,image/png,image/gif,image/webp,video/mp4,video/quicktime}', NULL, 'STANDARD') ON CONFLICT ("id") DO UPDATE SET "name" = EXCLUDED."name", "owner" = EXCLUDED."owner", "created_at" = EXCLUDED."created_at", "updated_at" = EXCLUDED."updated_at", "public" = EXCLUDED."public", "avif_autodetection" = EXCLUDED."avif_autodetection", "file_size_limit" = EXCLUDED."file_size_limit", "allowed_mime_types" = EXCLUDED."allowed_mime_types", "owner_id" = EXCLUDED."owner_id", "type" = EXCLUDED."type";
INSERT INTO "storage"."buckets" ("id", "name", "owner", "created_at", "updated_at", "public", "avif_autodetection", "file_size_limit", "allowed_mime_types", "owner_id", "type") VALUES ('contract_signatures', 'contract_signatures', NULL, '2025-12-06 10:00:45.000235+00', '2025-12-06 10:00:45.000235+00', 'true', 'false', '1048576', '{image/png,image/jpeg,image/jpg}', NULL, 'STANDARD') ON CONFLICT ("id") DO UPDATE SET "name" = EXCLUDED."name", "owner" = EXCLUDED."owner", "created_at" = EXCLUDED."created_at", "updated_at" = EXCLUDED."updated_at", "public" = EXCLUDED."public", "avif_autodetection" = EXCLUDED."avif_autodetection", "file_size_limit" = EXCLUDED."file_size_limit", "allowed_mime_types" = EXCLUDED."allowed_mime_types", "owner_id" = EXCLUDED."owner_id", "type" = EXCLUDED."type";
INSERT INTO "storage"."buckets" ("id", "name", "owner", "created_at", "updated_at", "public", "avif_autodetection", "file_size_limit", "allowed_mime_types", "owner_id", "type") VALUES ('onboarding_documents', 'onboarding_documents', NULL, '2025-12-07 09:46:02.171805+00', '2025-12-07 09:46:02.171805+00', 'false', 'false', '5242880', '{image/png,image/jpeg,image/jpg,application/pdf}', NULL, 'STANDARD') ON CONFLICT ("id") DO UPDATE SET "name" = EXCLUDED."name", "owner" = EXCLUDED."owner", "created_at" = EXCLUDED."created_at", "updated_at" = EXCLUDED."updated_at", "public" = EXCLUDED."public", "avif_autodetection" = EXCLUDED."avif_autodetection", "file_size_limit" = EXCLUDED."file_size_limit", "allowed_mime_types" = EXCLUDED."allowed_mime_types", "owner_id" = EXCLUDED."owner_id", "type" = EXCLUDED."type";

-- ============================================================
-- SECTION: CRON JOBS
-- ============================================================
-- 用户自定义 pg_cron 任务。

