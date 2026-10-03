/*
# 2.0版本测试数据初始化

## 说明
为2.0版本功能提供测试数据，包括：
1. 影响因子示例数据
2. 营收预测示例数据
3. 风险预警示例数据

## 注意
- 这些数据仅用于演示和测试
- 生产环境部署时可以选择不执行此迁移
- 数据会关联到第一个租户
*/

-- ==================== 影响因子示例数据 ====================

-- 获取第一个租户ID（用于测试）
DO $$
DECLARE
    v_tenant_id uuid;
    v_user_id uuid;
BEGIN
    -- 获取第一个租户
    SELECT id INTO v_tenant_id FROM tenants ORDER BY created_at LIMIT 1;
    
    -- 获取第一个用户
    SELECT id INTO v_user_id FROM auth.users ORDER BY created_at LIMIT 1;
    
    -- 如果没有租户，跳过数据初始化
    IF v_tenant_id IS NULL THEN
        RAISE NOTICE '没有找到租户，跳过测试数据初始化';
        RETURN;
    END IF;
    
    -- 插入天气影响因子
    INSERT INTO impact_factors (tenant_id, factor_type, factor_name, factor_category, impact_value, confidence, effective_date, data_source, description, created_by)
    VALUES
        (v_tenant_id, 'weather', '晴天', '天气', 0.05, 0.9, CURRENT_DATE, 'manual', '晴天通常会增加客流量', v_user_id),
        (v_tenant_id, 'weather', '雨天', '天气', -0.15, 0.85, CURRENT_DATE, 'manual', '雨天会减少客流量', v_user_id),
        (v_tenant_id, 'weather', '高温', '天气', -0.08, 0.8, CURRENT_DATE, 'manual', '高温天气影响客流', v_user_id);
    
    -- 插入节假日影响因子
    INSERT INTO impact_factors (tenant_id, factor_type, factor_name, factor_category, impact_value, confidence, effective_date, expiration_date, data_source, description, created_by)
    VALUES
        (v_tenant_id, 'holiday', '春节', '法定节假日', 0.5, 0.95, DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '1 month', DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '1 month' + INTERVAL '7 days', 'manual', '春节期间营收大幅增长', v_user_id),
        (v_tenant_id, 'holiday', '国庆节', '法定节假日', 0.4, 0.9, DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '9 months', DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '9 months' + INTERVAL '7 days', 'manual', '国庆节期间营收显著增长', v_user_id),
        (v_tenant_id, 'holiday', '周末', '常规假日', 0.2, 0.85, CURRENT_DATE, NULL, 'manual', '周末客流量增加', v_user_id);
    
    -- 插入营销活动影响因子
    INSERT INTO impact_factors (tenant_id, factor_type, factor_name, factor_category, impact_value, confidence, effective_date, expiration_date, data_source, description, created_by)
    VALUES
        (v_tenant_id, 'marketing', '满减活动', '促销活动', 0.25, 0.8, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', 'manual', '满减活动吸引客户消费', v_user_id),
        (v_tenant_id, 'marketing', '会员日', '会员活动', 0.15, 0.85, CURRENT_DATE, NULL, 'manual', '会员日促进会员消费', v_user_id),
        (v_tenant_id, 'marketing', '新品推广', '产品活动', 0.1, 0.75, CURRENT_DATE, CURRENT_DATE + INTERVAL '60 days', 'manual', '新品推广增加营收', v_user_id);
    
    -- 插入竞争影响因子
    INSERT INTO impact_factors (tenant_id, factor_type, factor_name, factor_category, impact_value, confidence, effective_date, data_source, description, created_by)
    VALUES
        (v_tenant_id, 'competition', '附近新店开业', '竞争', -0.12, 0.7, CURRENT_DATE, 'manual', '附近竞争对手开业影响客流', v_user_id),
        (v_tenant_id, 'competition', '竞品促销', '竞争', -0.08, 0.75, CURRENT_DATE, 'manual', '竞争对手促销活动分流客户', v_user_id);
    
    -- 插入内部因素
    INSERT INTO impact_factors (tenant_id, factor_type, factor_name, factor_category, impact_value, confidence, effective_date, data_source, description, created_by)
    VALUES
        (v_tenant_id, 'internal', '装修升级', '内部改进', 0.18, 0.8, CURRENT_DATE, 'manual', '店铺装修升级提升客户体验', v_user_id),
        (v_tenant_id, 'internal', '服务培训', '内部改进', 0.08, 0.85, CURRENT_DATE, 'manual', '员工服务培训提升满意度', v_user_id),
        (v_tenant_id, 'internal', '设备故障', '内部问题', -0.2, 0.9, CURRENT_DATE, 'manual', '设备故障影响运营', v_user_id);
    
    RAISE NOTICE '成功初始化影响因子测试数据';
    
END $$;

-- ==================== 创建示例预测记录 ====================

DO $$
DECLARE
    v_tenant_id uuid;
    v_store_id uuid;
BEGIN
    -- 获取第一个租户和店铺
    SELECT id INTO v_tenant_id FROM tenants ORDER BY created_at LIMIT 1;
    SELECT id INTO v_store_id FROM stores WHERE tenant_id = v_tenant_id ORDER BY created_at LIMIT 1;
    
    IF v_tenant_id IS NULL THEN
        RETURN;
    END IF;
    
    -- 插入示例预测记录（最近3个月）
    INSERT INTO revenue_predictions (tenant_id, store_id, prediction_type, target_period, conservative_value, baseline_value, optimistic_value, confidence, model_version)
    VALUES
        (v_tenant_id, v_store_id, 'monthly', DATE_TRUNC('month', CURRENT_DATE - INTERVAL '2 months')::date, 45000, 50000, 55000, 0.85, '2.0.0'),
        (v_tenant_id, v_store_id, 'monthly', DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')::date, 48000, 53000, 58000, 0.87, '2.0.0'),
        (v_tenant_id, v_store_id, 'monthly', DATE_TRUNC('month', CURRENT_DATE)::date, 50000, 55000, 60000, 0.88, '2.0.0');
    
    RAISE NOTICE '成功初始化预测记录测试数据';
    
END $$;

-- ==================== 创建示例风险预警 ====================

DO $$
DECLARE
    v_tenant_id uuid;
    v_store_id uuid;
BEGIN
    -- 获取第一个租户和店铺
    SELECT id INTO v_tenant_id FROM tenants ORDER BY created_at LIMIT 1;
    SELECT id INTO v_store_id FROM stores WHERE tenant_id = v_tenant_id ORDER BY created_at LIMIT 1;
    
    IF v_tenant_id IS NULL THEN
        RETURN;
    END IF;
    
    -- 插入示例风险预警
    INSERT INTO risk_alerts (tenant_id, store_id, risk_type, risk_level, risk_category, risk_title, risk_description, risk_impact, recommendations, status)
    VALUES
        (
            v_tenant_id, 
            v_store_id, 
            'personnel', 
            'high', 
            '人员缺勤',
            '员工缺勤率过高',
            '本周员工缺勤率达到15%，超过警戒线10%，可能影响正常运营',
            jsonb_build_object(
                'severity', 'high',
                'affectedAreas', jsonb_build_array('排班', '服务质量', '客户满意度'),
                'estimatedLoss', 5000
            ),
            jsonb_build_array(
                jsonb_build_object('action', '联系缺勤员工了解情况', 'priority', 'high'),
                jsonb_build_object('action', '安排替补人员', 'priority', 'high'),
                jsonb_build_object('action', '调整排班计划', 'priority', 'medium')
            ),
            'active'
        ),
        (
            v_tenant_id, 
            v_store_id, 
            'cost', 
            'medium', 
            '成本超标',
            '人力成本率偏高',
            '本月人力成本率达到35%，超过目标值30%',
            jsonb_build_object(
                'severity', 'medium',
                'affectedAreas', jsonb_build_array('成本控制', '利润率'),
                'estimatedLoss', 2500
            ),
            jsonb_build_array(
                jsonb_build_object('action', '优化排班减少加班', 'priority', 'high'),
                jsonb_build_object('action', '提升人员效率', 'priority', 'medium'),
                jsonb_build_object('action', '考虑调整薪资结构', 'priority', 'low')
            ),
            'active'
        ),
        (
            v_tenant_id, 
            v_store_id, 
            'operation', 
            'low', 
            '排班覆盖',
            '高峰时段人员不足',
            '周末高峰时段排班人员略显不足，可能影响服务质量',
            jsonb_build_object(
                'severity', 'low',
                'affectedAreas', jsonb_build_array('服务质量', '客户等待时间'),
                'estimatedLoss', 1000
            ),
            jsonb_build_array(
                jsonb_build_object('action', '增加高峰时段排班', 'priority', 'medium'),
                jsonb_build_object('action', '培训员工提升效率', 'priority', 'low')
            ),
            'active'
        );
    
    RAISE NOTICE '成功初始化风险预警测试数据';
    
END $$;

-- 添加注释
COMMENT ON TABLE impact_factors IS '影响因子表已初始化测试数据';
COMMENT ON TABLE revenue_predictions IS '营收预测表已初始化测试数据';
COMMENT ON TABLE risk_alerts IS '风险预警表已初始化测试数据';
