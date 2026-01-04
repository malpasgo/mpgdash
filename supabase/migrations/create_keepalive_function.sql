-- =====================================================
-- Supabase Keep-Alive Function
-- =====================================================
-- Function ini digunakan untuk menjaga database tetap aktif
-- dan mencegah auto-pause pada Supabase Free Plan
-- =====================================================

-- Drop function jika sudah ada
DROP FUNCTION IF EXISTS keepalive();

-- Buat function keepalive yang simple dan efisien
CREATE OR REPLACE FUNCTION keepalive()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  -- Query sederhana untuk memastikan database aktif
  -- Menggunakan pg_stat_database untuk mendapatkan info database
  SELECT json_build_object(
    'status', 'alive',
    'timestamp', NOW(),
    'database', current_database(),
    'message', 'Database is active and responding'
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Berikan akses ke anon dan authenticated users
GRANT EXECUTE ON FUNCTION keepalive() TO anon;
GRANT EXECUTE ON FUNCTION keepalive() TO authenticated;

-- Tambahkan comment untuk dokumentasi
COMMENT ON FUNCTION keepalive() IS 'Keep-alive function untuk mencegah Supabase auto-pause. Dipanggil oleh GitHub Actions setiap 6 hari.';
