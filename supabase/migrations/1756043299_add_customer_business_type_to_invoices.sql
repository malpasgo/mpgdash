-- Migration to add customer_business_type field to invoices table
-- This enables business classification for better export segment analytics

-- Add the customer_business_type column
ALTER TABLE invoices 
ADD COLUMN customer_business_type VARCHAR(50) DEFAULT NULL;

-- Add a comment to document the field purpose
COMMENT ON COLUMN invoices.customer_business_type IS 'Business classification for export analytics: Trading Company, Direct End Customer, Manufacturer, Distributor, Retailer, Individual Buyer, Government/Institution, Export Agent, Other';

-- Create index for efficient querying in analytics
CREATE INDEX IF NOT EXISTS idx_invoices_customer_business_type ON invoices(customer_business_type);

-- Insert some sample data migrations (optional - for existing data classification)
-- This is commented out as it would need to be customized based on actual customer data
/*
UPDATE invoices 
SET customer_business_type = CASE 
    WHEN LOWER(customer_name) LIKE '%trading%' OR LOWER(customer_name) LIKE '%import%' THEN 'Trading Company'
    WHEN LOWER(customer_name) LIKE '%manufacturer%' OR LOWER(customer_name) LIKE '%factory%' THEN 'Manufacturer'
    WHEN LOWER(customer_name) LIKE '%distributor%' THEN 'Distributor'
    WHEN LOWER(customer_name) LIKE '%retailer%' OR LOWER(customer_name) LIKE '%store%' THEN 'Retailer'
    WHEN LOWER(customer_name) LIKE '%government%' OR LOWER(customer_name) LIKE '%institution%' THEN 'Government/Institution'
    WHEN LOWER(customer_name) LIKE '%agent%' THEN 'Export Agent'
    ELSE 'Other'
END
WHERE customer_business_type IS NULL;
*/