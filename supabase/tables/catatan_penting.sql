-- Create catatan_penting table
CREATE TABLE IF NOT EXISTS catatan_penting (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_catatan_penting_priority ON catatan_penting(priority);
CREATE INDEX IF NOT EXISTS idx_catatan_penting_status ON catatan_penting(status);
CREATE INDEX IF NOT EXISTS idx_catatan_penting_created_at ON catatan_penting(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE catatan_penting ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust based on your auth requirements)
-- Policy 1: Allow anyone to read catatan_penting
CREATE POLICY "Allow public read access to catatan_penting"
  ON catatan_penting
  FOR SELECT
  USING (true);

-- Policy 2: Allow anyone to insert catatan_penting
CREATE POLICY "Allow public insert access to catatan_penting"
  ON catatan_penting
  FOR INSERT
  WITH CHECK (true);

-- Policy 3: Allow anyone to update catatan_penting
CREATE POLICY "Allow public update access to catatan_penting"
  ON catatan_penting
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Policy 4: Allow anyone to delete catatan_penting
CREATE POLICY "Allow public delete access to catatan_penting"
  ON catatan_penting
  FOR DELETE
  USING (true);

-- Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_catatan_penting_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
CREATE TRIGGER trigger_update_catatan_penting_updated_at
  BEFORE UPDATE ON catatan_penting
  FOR EACH ROW
  EXECUTE FUNCTION update_catatan_penting_updated_at();

-- Insert sample data (optional)
INSERT INTO catatan_penting (title, description, priority, status) VALUES
  ('Dokumen LC belum lengkap', 'Beberapa dokumen untuk Letter of Credit masih kurang dan perlu segera dilengkapi sebelum deadline', 'critical', 'open'),
  ('Delay pengiriman kontainer', 'Pengiriman kontainer mengalami keterlambatan 3 hari dari jadwal', 'high', 'open'),
  ('Update harga freight', 'Perlu update harga freight untuk rute Medan-Singapore', 'medium', 'open')
ON CONFLICT DO NOTHING;
