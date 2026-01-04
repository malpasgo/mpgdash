CREATE TABLE shipping_routes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    origin_port VARCHAR(100) NOT NULL,
    destination_port VARCHAR(100) NOT NULL,
    route_code VARCHAR(20) NOT NULL UNIQUE,
    transit_days INTEGER NOT NULL,
    distance_km INTEGER NOT NULL,
    base_handling_cost DECIMAL(10,2) NOT NULL,
    documentation_fee DECIMAL(10,2) NOT NULL,
    insurance_rate DECIMAL(5,4) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);