-- Migration: complete_medan_global_routes_50_countries
-- Created at: 1755915879

-- Hapus semua rute lama dan replace dengan 50 rute lengkap dari Medan
DELETE FROM shipping_routes;

-- Insert 50 rute baru dari Medan ke seluruh dunia sesuai spesifikasi
INSERT INTO shipping_routes (origin_port, destination_port, route_code, transit_days, distance_km, base_handling_cost, documentation_fee, insurance_rate) VALUES

-- ASIA PACIFIC (12 rute)
('Medan', 'Singapore', 'MDN-SIN', 2, 550, 300, 200, 0.20),
('Medan', 'Malaysia (Kuala Lumpur)', 'MDN-MYS', 3, 400, 280, 180, 0.20),
('Medan', 'Thailand (Bangkok)', 'MDN-THA', 5, 1200, 350, 220, 0.25),
('Medan', 'Philippines (Manila)', 'MDN-PHL', 6, 1800, 380, 240, 0.25),
('Medan', 'Vietnam (Ho Chi Minh)', 'MDN-VNM', 7, 1500, 400, 250, 0.30),
('Medan', 'Hong Kong', 'MDN-HKG', 8, 2200, 450, 280, 0.30),
('Medan', 'China (Shanghai)', 'MDN-CHN', 10, 2800, 500, 300, 0.35),
('Medan', 'South Korea (Busan)', 'MDN-KOR', 12, 3500, 550, 320, 0.35),
('Medan', 'Japan (Tokyo)', 'MDN-JPN', 14, 3200, 600, 350, 0.40),
('Medan', 'Australia (Sydney)', 'MDN-AUS', 16, 4500, 650, 380, 0.40),
('Medan', 'New Zealand (Auckland)', 'MDN-NZL', 18, 5200, 680, 400, 0.45),
('Medan', 'India (Mumbai)', 'MDN-IND', 15, 3800, 580, 320, 0.35),

-- MIDDLE EAST (5 rute)
('Medan', 'UAE (Dubai)', 'MDN-UAE', 12, 6500, 750, 450, 0.50),
('Medan', 'Saudi Arabia (Jeddah)', 'MDN-SAU', 14, 7200, 800, 480, 0.55),
('Medan', 'Qatar (Doha)', 'MDN-QAT', 13, 6800, 770, 460, 0.50),
('Medan', 'Kuwait', 'MDN-KWT', 15, 7500, 820, 500, 0.60),
('Medan', 'Turkey (Istanbul)', 'MDN-TUR', 18, 8500, 900, 550, 0.65),

-- EUROPE (15 rute)
('Medan', 'Netherlands (Rotterdam)', 'MDN-NLD', 25, 12500, 1200, 700, 0.80),
('Medan', 'Germany (Hamburg)', 'MDN-DEU', 26, 12800, 1250, 720, 0.80),
('Medan', 'United Kingdom (London)', 'MDN-GBR', 28, 13200, 1300, 750, 0.85),
('Medan', 'France (Le Havre)', 'MDN-FRA', 27, 13000, 1280, 730, 0.80),
('Medan', 'Italy (Genoa)', 'MDN-ITA', 29, 13500, 1350, 780, 0.90),
('Medan', 'Spain (Barcelona)', 'MDN-ESP', 30, 13800, 1380, 800, 0.90),
('Medan', 'Belgium (Antwerp)', 'MDN-BEL', 25, 12600, 1220, 710, 0.80),
('Medan', 'Norway (Oslo)', 'MDN-NOR', 32, 14500, 1450, 850, 0.95),
('Medan', 'Sweden (Gothenburg)', 'MDN-SWE', 31, 14200, 1420, 830, 0.90),
('Medan', 'Poland (Gdansk)', 'MDN-POL', 28, 12800, 1180, 680, 0.75),
('Medan', 'Denmark (Copenhagen)', 'MDN-DNK', 30, 13500, 1350, 780, 0.85),
('Medan', 'Finland (Helsinki)', 'MDN-FIN', 33, 14800, 1480, 870, 0.95),
('Medan', 'Russia (St. Petersburg)', 'MDN-RUS', 20, 10500, 1000, 600, 0.70),
('Medan', 'Greece (Piraeus)', 'MDN-GRC', 25, 12200, 1150, 650, 0.75),
('Medan', 'Portugal (Lisbon)', 'MDN-PRT', 32, 14000, 1400, 820, 0.90),

-- AMERICAS (13 rute)
('Medan', 'USA (Los Angeles)', 'MDN-USA-LA', 22, 18500, 1500, 900, 1.00),
('Medan', 'USA (New York)', 'MDN-USA-NY', 28, 20500, 1600, 950, 1.10),
('Medan', 'USA (Miami)', 'MDN-USA-MI', 26, 19800, 1550, 920, 1.05),
('Medan', 'Canada (Vancouver)', 'MDN-CAN-VC', 24, 19200, 1550, 920, 1.00),
('Medan', 'Canada (Montreal)', 'MDN-CAN-MT', 30, 21000, 1650, 980, 1.15),
('Medan', 'Mexico (Veracruz)', 'MDN-MEX', 30, 22000, 1400, 800, 0.90),
('Medan', 'Brazil (Santos)', 'MDN-BRA', 35, 23500, 1800, 1100, 1.20),
('Medan', 'Argentina (Buenos Aires)', 'MDN-ARG', 38, 24800, 1900, 1200, 1.30),
('Medan', 'Chile (Valparaiso)', 'MDN-CHL', 36, 24200, 1850, 1150, 1.25),
('Medan', 'Colombia (Cartagena)', 'MDN-COL', 32, 22800, 1650, 950, 1.10),
('Medan', 'Peru (Callao)', 'MDN-PER', 34, 23200, 1700, 1000, 1.15),
('Medan', 'Uruguay (Montevideo)', 'MDN-URY', 40, 25500, 1950, 1250, 1.35),
('Medan', 'Ecuador (Guayaquil)', 'MDN-ECU', 33, 23000, 1680, 980, 1.12),

-- AFRICA (5 rute)
('Medan', 'South Africa (Cape Town)', 'MDN-ZAF', 30, 18800, 1600, 950, 1.00),
('Medan', 'Egypt (Alexandria)', 'MDN-EGY', 20, 9500, 1100, 650, 0.70),
('Medan', 'Morocco (Casablanca)', 'MDN-MAR', 25, 14500, 1300, 750, 0.80),
('Medan', 'Nigeria (Lagos)', 'MDN-NGA', 28, 16200, 1450, 850, 0.90),
('Medan', 'Kenya (Mombasa)', 'MDN-KEN', 25, 14800, 1350, 800, 0.85);;