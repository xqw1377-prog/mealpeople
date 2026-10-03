/*
# 生成测试餐厅的完整测试数据

## 数据范围
- 时间范围：最近30天
- 数据类型：排班日志、运营数据（营收）、效能标准

## 数据特点
1. 排班日志：
   - 10个员工，每天6-8个员工有排班
   - 不同排班类型：早班、中班、晚班、全天班
   - 不同完成状态和质量等级
   - 真实的工作时长和备注

2. 运营数据：
   - 3个门店，每天都有运营记录
   - 工作日和周末营收有差异
   - 包含实际营收、人员配置、人效数据

3. 效能标准：
   - 不同营收区间的人效标准
   - 合理的人员配置建议

## 数据真实性
- 周末营收比工作日高20-30%
- 早期数据质量较低，后期逐渐提升
- 偶尔有延期或待改进的情况
- 不同员工表现有差异
*/

-- 获取测试餐厅ID
DO $$
DECLARE
  demo_tenant_id uuid;
  store1_id uuid;
  store2_id uuid;
  store3_id uuid;
  employee_ids uuid[];
  current_date_iter date;
  day_of_week int;
  is_weekend boolean;
  base_revenue numeric;
  revenue_multiplier numeric;
  employee_count int;
  i int;
  j int;
  random_employee_id uuid;
  random_schedule_id uuid;
  shift_type text;
  quality_level text;
  status text;
  work_hours numeric;
  completed_at timestamp;
  notes text;
  actual_revenue numeric;
  actual_staff_count int;
  per_capita_revenue numeric;
  efficiency_rating text;
BEGIN
  -- 获取测试餐厅ID
  SELECT id INTO demo_tenant_id FROM tenants WHERE is_demo = true LIMIT 1;
  
  IF demo_tenant_id IS NULL THEN
    RAISE EXCEPTION '测试餐厅不存在';
  END IF;

  RAISE NOTICE '测试餐厅ID: %', demo_tenant_id;

  -- 获取3个门店ID（使用实际的门店名称）
  SELECT id INTO store1_id FROM stores WHERE tenant_id = demo_tenant_id AND name = '朝阳店' LIMIT 1;
  SELECT id INTO store2_id FROM stores WHERE tenant_id = demo_tenant_id AND name = '海淀店' LIMIT 1;
  SELECT id INTO store3_id FROM stores WHERE tenant_id = demo_tenant_id AND name = '西城店' LIMIT 1;

  RAISE NOTICE '门店ID: %, %, %', store1_id, store2_id, store3_id;

  -- 获取所有员工ID
  SELECT array_agg(id) INTO employee_ids FROM employees WHERE tenant_id = demo_tenant_id;
  
  RAISE NOTICE '员工数量: %', array_length(employee_ids, 1);

  -- 生成最近30天的数据
  FOR i IN 0..29 LOOP
    current_date_iter := CURRENT_DATE - (29 - i);
    day_of_week := EXTRACT(DOW FROM current_date_iter); -- 0=周日, 6=周六
    is_weekend := (day_of_week = 0 OR day_of_week = 6);
    
    RAISE NOTICE '生成日期: %, 星期: %, 是否周末: %', current_date_iter, day_of_week, is_weekend;

    -- 为每个门店生成运营数据
    -- 朝阳店（规模最大）
    base_revenue := 15000 + (random() * 5000)::numeric;
    IF is_weekend THEN
      revenue_multiplier := 1.25 + (random() * 0.1)::numeric; -- 周末增长25-35%
    ELSE
      revenue_multiplier := 1.0;
    END IF;
    
    actual_revenue := (base_revenue * revenue_multiplier)::numeric(10,2);
    actual_staff_count := 8 + (random() * 4)::int;
    per_capita_revenue := (actual_revenue / actual_staff_count)::numeric(10,2);
    
    -- 根据人效计算效率评级
    IF per_capita_revenue >= 2000 THEN
      efficiency_rating := '优秀';
    ELSIF per_capita_revenue >= 1500 THEN
      efficiency_rating := '良好';
    ELSIF per_capita_revenue >= 1000 THEN
      efficiency_rating := '合格';
    ELSE
      efficiency_rating := '待改进';
    END IF;
    
    INSERT INTO daily_operations (
      tenant_id, 
      store_id, 
      operation_date, 
      estimated_revenue,
      planned_staff_count,
      actual_revenue, 
      actual_staff_count,
      per_capita_revenue,
      efficiency_rating,
      notes
    ) VALUES (
      demo_tenant_id,
      store1_id,
      current_date_iter,
      actual_revenue * 0.95, -- 预估略低于实际
      actual_staff_count,
      actual_revenue,
      actual_staff_count,
      per_capita_revenue,
      efficiency_rating,
      '朝阳店运营数据'
    );

    -- 海淀店（中等规模）
    base_revenue := 10000 + (random() * 3000)::numeric;
    IF is_weekend THEN
      revenue_multiplier := 1.2 + (random() * 0.1)::numeric;
    ELSE
      revenue_multiplier := 1.0;
    END IF;
    
    actual_revenue := (base_revenue * revenue_multiplier)::numeric(10,2);
    actual_staff_count := 6 + (random() * 3)::int;
    per_capita_revenue := (actual_revenue / actual_staff_count)::numeric(10,2);
    
    IF per_capita_revenue >= 2000 THEN
      efficiency_rating := '优秀';
    ELSIF per_capita_revenue >= 1500 THEN
      efficiency_rating := '良好';
    ELSIF per_capita_revenue >= 1000 THEN
      efficiency_rating := '合格';
    ELSE
      efficiency_rating := '待改进';
    END IF;
    
    INSERT INTO daily_operations (
      tenant_id, 
      store_id, 
      operation_date, 
      estimated_revenue,
      planned_staff_count,
      actual_revenue, 
      actual_staff_count,
      per_capita_revenue,
      efficiency_rating,
      notes
    ) VALUES (
      demo_tenant_id,
      store2_id,
      current_date_iter,
      actual_revenue * 0.95,
      actual_staff_count,
      actual_revenue,
      actual_staff_count,
      per_capita_revenue,
      efficiency_rating,
      '海淀店运营数据'
    );

    -- 西城店（较小规模）
    base_revenue := 8000 + (random() * 2000)::numeric;
    IF is_weekend THEN
      revenue_multiplier := 1.2 + (random() * 0.1)::numeric;
    ELSE
      revenue_multiplier := 1.0;
    END IF;
    
    actual_revenue := (base_revenue * revenue_multiplier)::numeric(10,2);
    actual_staff_count := 5 + (random() * 2)::int;
    per_capita_revenue := (actual_revenue / actual_staff_count)::numeric(10,2);
    
    IF per_capita_revenue >= 2000 THEN
      efficiency_rating := '优秀';
    ELSIF per_capita_revenue >= 1500 THEN
      efficiency_rating := '良好';
    ELSIF per_capita_revenue >= 1000 THEN
      efficiency_rating := '合格';
    ELSE
      efficiency_rating := '待改进';
    END IF;
    
    INSERT INTO daily_operations (
      tenant_id, 
      store_id, 
      operation_date, 
      estimated_revenue,
      planned_staff_count,
      actual_revenue, 
      actual_staff_count,
      per_capita_revenue,
      efficiency_rating,
      notes
    ) VALUES (
      demo_tenant_id,
      store3_id,
      current_date_iter,
      actual_revenue * 0.95,
      actual_staff_count,
      actual_revenue,
      actual_staff_count,
      per_capita_revenue,
      efficiency_rating,
      '西城店运营数据'
    );

    -- 生成排班日志（每天6-8个员工）
    employee_count := 6 + (random() * 3)::int;
    
    FOR j IN 1..employee_count LOOP
      -- 随机选择一个员工
      random_employee_id := employee_ids[1 + (random() * (array_length(employee_ids, 1) - 1))::int];
      
      -- 随机选择排班类型
      CASE (random() * 4)::int
        WHEN 0 THEN shift_type := '早班';
        WHEN 1 THEN shift_type := '中班';
        WHEN 2 THEN shift_type := '晚班';
        ELSE shift_type := '全天班';
      END CASE;
      
      -- 根据日期决定质量等级（早期较低，后期较高）
      IF i < 10 THEN
        -- 前10天：质量较低
        CASE (random() * 10)::int
          WHEN 0, 1 THEN quality_level := '待改进';
          WHEN 2, 3, 4 THEN quality_level := '合格';
          WHEN 5, 6, 7 THEN quality_level := '良好';
          ELSE quality_level := '优秀';
        END CASE;
      ELSIF i < 20 THEN
        -- 中间10天：质量中等
        CASE (random() * 10)::int
          WHEN 0 THEN quality_level := '待改进';
          WHEN 1, 2, 3 THEN quality_level := '合格';
          WHEN 4, 5, 6 THEN quality_level := '良好';
          ELSE quality_level := '优秀';
        END CASE;
      ELSE
        -- 后10天：质量较高
        CASE (random() * 10)::int
          WHEN 0 THEN quality_level := '合格';
          WHEN 1, 2, 3 THEN quality_level := '良好';
          ELSE quality_level := '优秀';
        END CASE;
      END IF;
      
      -- 根据质量等级决定状态
      IF quality_level = '待改进' THEN
        status := CASE WHEN random() < 0.5 THEN '已完成' ELSE '延期' END;
      ELSE
        status := '已完成';
      END IF;
      
      -- 工作时长
      work_hours := CASE shift_type
        WHEN '早班' THEN 6 + (random() * 2)::numeric
        WHEN '中班' THEN 6 + (random() * 2)::numeric
        WHEN '晚班' THEN 6 + (random() * 2)::numeric
        ELSE 9 + (random() * 2)::numeric
      END CASE;
      
      -- 完成时间
      IF status = '已完成' THEN
        completed_at := (current_date_iter + interval '1 day' - interval '2 hours')::timestamp;
      ELSE
        completed_at := NULL;
      END IF;
      
      -- 备注
      notes := CASE quality_level
        WHEN '优秀' THEN CASE (random() * 5)::int
          WHEN 0 THEN '工作表现出色，服务态度好'
          WHEN 1 THEN '效率高，客户满意度高'
          WHEN 2 THEN '团队协作良好，完成质量优秀'
          WHEN 3 THEN '主动承担额外工作，值得表扬'
          ELSE '准时完成，质量优秀'
        END
        WHEN '良好' THEN CASE (random() * 5)::int
          WHEN 0 THEN '工作认真负责'
          WHEN 1 THEN '按时完成任务'
          WHEN 2 THEN '服务质量良好'
          WHEN 3 THEN '团队配合到位'
          ELSE '整体表现良好'
        END
        WHEN '合格' THEN CASE (random() * 5)::int
          WHEN 0 THEN '基本完成任务'
          WHEN 1 THEN '需要提升服务意识'
          WHEN 2 THEN '工作效率有待提高'
          WHEN 3 THEN '完成基本要求'
          ELSE '表现一般'
        END
        ELSE CASE (random() * 5)::int
          WHEN 0 THEN '工作态度需要改进'
          WHEN 1 THEN '多次出现失误'
          WHEN 2 THEN '效率低，需要加强培训'
          WHEN 3 THEN '服务质量不达标'
          ELSE '需要重点关注和指导'
        END
      END;
      
      -- 先创建排班记录
      INSERT INTO schedules (
        tenant_id,
        store_id,
        employee_id,
        schedule_date,
        shift_type,
        start_time,
        end_time,
        status,
        notes
      ) VALUES (
        demo_tenant_id,
        CASE (random() * 3)::int
          WHEN 0 THEN store1_id
          WHEN 1 THEN store2_id
          ELSE store3_id
        END,
        random_employee_id,
        current_date_iter,
        shift_type,
        CASE shift_type
          WHEN '早班' THEN '08:00:00'::time
          WHEN '中班' THEN '12:00:00'::time
          WHEN '晚班' THEN '18:00:00'::time
          ELSE '08:00:00'::time
        END,
        CASE shift_type
          WHEN '早班' THEN '14:00:00'::time
          WHEN '中班' THEN '18:00:00'::time
          WHEN '晚班' THEN '23:00:00'::time
          ELSE '20:00:00'::time
        END,
        CASE status
          WHEN '已完成' THEN 'completed'
          WHEN '进行中' THEN 'in_progress'
          WHEN '延期' THEN 'delayed'
          ELSE 'pending'
        END,
        notes
      ) RETURNING id INTO random_schedule_id;
      
      -- 再创建排班日志
      INSERT INTO schedule_logs (
        tenant_id,
        schedule_id,
        employee_id,
        store_id,
        log_date,
        completion_status,
        completion_time,
        score,
        duration_minutes,
        notes
      ) VALUES (
        demo_tenant_id,
        random_schedule_id,
        random_employee_id,
        CASE (random() * 3)::int
          WHEN 0 THEN store1_id
          WHEN 1 THEN store2_id
          ELSE store3_id
        END,
        current_date_iter,
        status,
        completed_at,
        CASE quality_level
          WHEN '优秀' THEN 90 + (random() * 10)::int
          WHEN '良好' THEN 75 + (random() * 15)::int
          WHEN '合格' THEN 60 + (random() * 15)::int
          ELSE 40 + (random() * 20)::int
        END,
        (work_hours * 60)::int,
        notes
      );
    END LOOP;
  END LOOP;

  -- 生成效能标准数据（为每个门店创建一条配置记录）
  INSERT INTO efficiency_standards (
    tenant_id, 
    store_id,
    low_revenue_max,
    low_efficiency_standard,
    low_management_motto,
    normal_revenue_min,
    normal_revenue_max,
    normal_efficiency_standard,
    normal_management_motto,
    high_revenue_min,
    high_efficiency_standard,
    high_management_motto
  ) VALUES
    (demo_tenant_id, store1_id, 10000, 700, '严控成本，生存第一', 10000, 18000, 850, '精益运营，效率为王', 18000, 1000, '保障效能，利润冲刺'),
    (demo_tenant_id, store2_id, 10000, 700, '严控成本，生存第一', 10000, 18000, 850, '精益运营，效率为王', 18000, 1000, '保障效能，利润冲刺'),
    (demo_tenant_id, store3_id, 10000, 700, '严控成本，生存第一', 10000, 18000, 850, '精益运营，效率为王', 18000, 1000, '保障效能，利润冲刺');

  RAISE NOTICE '测试数据生成完成！';
END $$;
