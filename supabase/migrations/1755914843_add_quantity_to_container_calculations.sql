-- Migration: add_quantity_to_container_calculations
-- Created at: 1755914843

-- Tambah field quantity ke tabel container_calculations
ALTER TABLE container_calculations 
ADD COLUMN cargo_quantity INTEGER DEFAULT 1;;