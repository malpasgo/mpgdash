# ⚡ Quick Start: Supabase Keep-Alive

Setup keep-alive dalam 5 menit untuk mencegah Supabase auto-pause!

## 🎯 3 Langkah Utama

### 1️⃣ Deploy SQL Function (2 menit)

Buka **Supabase Dashboard** → **SQL Editor** → Copy-paste & Run:

```sql
CREATE OR REPLACE FUNCTION keepalive()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'status', 'alive',
    'timestamp', NOW(),
    'database', current_database(),
    'message', 'Database is active and responding'
  ) INTO result;
  
  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION keepalive() TO anon;
GRANT EXECUTE ON FUNCTION keepalive() TO authenticated;
```

✅ Klik **Run**

---

### 2️⃣ Setup GitHub Secrets (1 menit)

Buka **GitHub Repository** → **Settings** → **Secrets and variables** → **Actions**

Tambah 2 secrets:

**Name**: `SUPABASE_URL`  
**Value**: `https://sriuxykirmjyfmeiiorl.supabase.co`

**Name**: `SUPABASE_ANON_KEY`  
**Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyaXV4eWtpcm1qeWZtZWlpb3JsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0MTA4MTEsImV4cCI6MjA3MDk4NjgxMX0.kqd_G0jGA3gp6HP7q8BHybMMLE1CvDe5mTmknM6Pijk`

---

### 3️⃣ Push & Test (2 menit)

```bash
# Commit workflow files
git add .github/workflows/supabase-keepalive.yml
git commit -m "Add Supabase keep-alive"
git push

# Test lokal (opsional)
npm run test:keepalive

# Atau cek status
npm run check:supabase
```

Buka **GitHub** → **Actions** → **Supabase Keep Alive** → **Run workflow**

---

## ✅ Verifikasi

Jika berhasil, akan muncul:
```
✅ Supabase database pinged successfully!
✅ Database is active and responding!
🎉 Keep-alive completed successfully
```

---

## 📅 Jadwal Otomatis

Workflow akan jalan otomatis **setiap 6 hari** pada jam **00:00 UTC** (07:00 WIB)

---

## 🆘 Troubleshooting

### ❌ Error: "Function does not exist"
→ Ulangi Step 1 (deploy SQL function)

### ❌ Error: "Invalid API key"
→ Cek GitHub Secrets sudah benar (Step 2)

### ❌ Workflow tidak muncul
→ Pastikan file `.github/workflows/supabase-keepalive.yml` sudah di-push

---

## 📚 Dokumentasi Lengkap

Lihat [SUPABASE_KEEPALIVE_SETUP.md](SUPABASE_KEEPALIVE_SETUP.md) untuk panduan detail.

---

**Selesai!** Database kamu sekarang akan tetap alive 24/7 🎉
