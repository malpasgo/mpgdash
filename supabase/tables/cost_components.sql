CREATE TABLE cost_components (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    calculation_id UUID NOT NULL,
    component_name VARCHAR(100) NOT NULL,
    component_cost DECIMAL(10,2) NOT NULL,
    component_type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);