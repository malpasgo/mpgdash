-- Migration: update_shipping_routes_medan_global
-- Created at: 1755914592

-- Hapus semua rute lama
DELETE FROM shipping_routes;

-- Insert 50 rute baru dari Medan ke seluruh dunia
INSERT INTO shipping_routes (origin_port, destination_port, route_code, transit_days, distance_km, base_handling_cost, documentation_fee, insurance_rate) VALUES

-- ASIA PACIFIC
('Medan', 'Singapore', 'MDN-SIN', 2, 550, 300, 200, 0.2),
('Medan', 'Malaysia', 'MDN-MYS', 3, 400, 280, 180, 0.2),
('Medan', 'Thailand', 'MDN-THA', 5, 1200, 350, 220, 0.25),
('Medan', 'Philippines', 'MDN-PHL', 6, 1800, 380, 240, 0.25),
('Medan', 'Vietnam', 'MDN-VNM', 7, 1500, 400, 250, 0.3),
('Medan', 'Hong Kong', 'MDN-HKG', 8, 2200, 450, 280, 0.3),
('Medan', 'China', 'MDN-CHN', 10, 2800, 500, 300, 0.35),
('Medan', 'South Korea', 'MDN-KOR', 12, 3500, 550, 320, 0.35),
('Medan', 'Japan', 'MDN-JPN', 14, 3200, 600, 350, 0.4),
('Medan', 'Australia', 'MDN-AUS', 16, 4500, 650, 380, 0.4),
('Medan', 'New Zealand', 'MDN-NZL', 18, 5200, 680, 400, 0.45),
('Medan', 'India', 'MDN-IND', 15, 3800, 580, 320, 0.35),

-- MIDDLE EAST
('Medan', 'UAE (Dubai)', 'MDN-UAE', 12, 6500, 750, 450, 0.5),
('Medan', 'Saudi Arabia', 'MDN-SAU', 14, 7200, 800, 480, 0.55),
('Medan', 'Qatar', 'MDN-QAT', 13, 6800, 770, 460, 0.5),
('Medan', 'Kuwait', 'MDN-KWT', 15, 7500, 820, 500, 0.6),
('Medan', 'Turkey', 'MDN-TUR', 18, 8500, 900, 550, 0.65),
('Medan', 'Iran', 'MDN-IRN', 16, 7800, 850, 520, 0.6),
('Medan', 'Israel', 'MDN-ISR', 17, 8200, 880, 540, 0.65),

-- EUROPE
('Medan', 'Netherlands (Rotterdam)', 'MDN-NLD', 25, 12500, 1200, 700, 0.8),
('Medan', 'Germany (Hamburg)', 'MDN-DEU', 26, 12800, 1250, 720, 0.8),
('Medan', 'United Kingdom', 'MDN-GBR', 28, 13200, 1300, 750, 0.85),
('Medan', 'France', 'MDN-FRA', 27, 13000, 1280, 730, 0.8),
('Medan', 'Italy', 'MDN-ITA', 29, 13500, 1350, 780, 0.9),
('Medan', 'Spain', 'MDN-ESP', 30, 13800, 1380, 800, 0.9),
('Medan', 'Belgium', 'MDN-BEL', 25, 12600, 1220, 710, 0.8),
('Medan', 'Norway', 'MDN-NOR', 32, 14500, 1450, 850, 0.95),
('Medan', 'Sweden', 'MDN-SWE', 31, 14200, 1420, 830, 0.9),
('Medan', 'Poland', 'MDN-POL', 28, 12800, 1180, 680, 0.75),
('Medan', 'Russia', 'MDN-RUS', 35, 15200, 1500, 900, 1.0),
('Medan', 'Denmark', 'MDN-DNK', 29, 13500, 1350, 780, 0.85),

-- AMERICAS
('Medan', 'USA (Los Angeles)', 'MDN-USA-LA', 22, 18500, 1500, 900, 1.0),
('Medan', 'USA (New York)', 'MDN-USA-NY', 28, 20500, 1600, 950, 1.1),
('Medan', 'Canada (Vancouver)', 'MDN-CAN', 24, 19200, 1550, 920, 1.0),
('Medan', 'Mexico', 'MDN-MEX', 30, 22000, 1400, 800, 0.9),
('Medan', 'Brazil', 'MDN-BRA', 35, 23500, 1800, 1100, 1.2),
('Medan', 'Argentina', 'MDN-ARG', 38, 24800, 1900, 1200, 1.3),
('Medan', 'Chile', 'MDN-CHL', 36, 24200, 1850, 1150, 1.25),
('Medan', 'Peru', 'MDN-PER', 34, 23800, 1750, 1050, 1.15),
('Medan', 'Colombia', 'MDN-COL', 32, 22800, 1650, 980, 1.05),

-- AFRICA
('Medan', 'South Africa', 'MDN-ZAF', 30, 18800, 1600, 950, 1.0),
('Medan', 'Egypt', 'MDN-EGY', 20, 9500, 1100, 650, 0.7),
('Medan', 'Morocco', 'MDN-MAR', 25, 14500, 1300, 750, 0.8),
('Medan', 'Nigeria', 'MDN-NGA', 28, 16200, 1450, 850, 0.9),
('Medan', 'Kenya', 'MDN-KEN', 25, 14800, 1350, 800, 0.85),
('Medan', 'Ghana', 'MDN-GHA', 26, 15500, 1400, 820, 0.88),
('Medan', 'Algeria', 'MDN-DZA', 24, 13800, 1250, 720, 0.78),

-- ADDITIONAL DESTINATIONS
('Medan', 'Bangladesh', 'MDN-BGD', 14, 3500, 520, 300, 0.32),
('Medan', 'Pakistan', 'MDN-PAK', 16, 4200, 600, 350, 0.38),
('Medan', 'Sri Lanka', 'MDN-LKA', 12, 3200, 480, 280, 0.28),
('Medan', 'Myanmar', 'MDN-MMR', 8, 1800, 420, 260, 0.28),
('Medan', 'Cambodia', 'MDN-KHM', 9, 1600, 450, 270, 0.3),
('Medan', 'Taiwan', 'MDN-TWN', 11, 2600, 520, 310, 0.33);;