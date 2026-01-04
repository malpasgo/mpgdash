CREATE TABLE container_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type_code VARCHAR(20) NOT NULL UNIQUE,
    internal_length DECIMAL(8,3) NOT NULL,
    internal_width DECIMAL(8,3) NOT NULL,
    internal_height DECIMAL(8,3) NOT NULL,
    max_payload INTEGER NOT NULL,
    tare_weight INTEGER NOT NULL,
    cubic_capacity DECIMAL(8,3) NOT NULL,
    rental_cost DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);