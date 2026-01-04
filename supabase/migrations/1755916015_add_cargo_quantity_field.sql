-- Migration: add_cargo_quantity_field
-- Created at: 1755916015

ALTER TABLE container_calculations ADD COLUMN cargo_quantity INTEGER DEFAULT 1;;