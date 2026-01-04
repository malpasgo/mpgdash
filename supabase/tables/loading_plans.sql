CREATE TABLE loading_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    calculation_id UUID NOT NULL,
    plan_name VARCHAR(200),
    container_layout JSONB NOT NULL,
    weight_distribution JSONB,
    loading_instructions TEXT,
    arrangement_pattern VARCHAR(50) NOT NULL,
    length_count INTEGER NOT NULL,
    width_count INTEGER NOT NULL,
    height_count INTEGER NOT NULL,
    visualization_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);