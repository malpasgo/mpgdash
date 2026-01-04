-- Migration: add_customer_business_type_to_invoices
-- Created at: 1756043572

-- Migration to add customer_business_type field to invoices table
-- This enables business classification for better export segment analytics

-- Add the customer_business_type column
ALTER TABLE invoices 
ADD COLUMN customer_business_type VARCHAR(50) DEFAULT NULL;

-- Add a comment to document the field purpose
COMMENT ON COLUMN invoices.customer_business_type IS 'Business classification for export analytics: Trading Company, Direct End Customer, Manufacturer, Distributor, Retailer, Individual Buyer, Government/Institution, Export Agent, Other';

-- Create index for efficient querying in analytics
CREATE INDEX IF NOT EXISTS idx_invoices_customer_business_type ON invoices(customer_business_type);;