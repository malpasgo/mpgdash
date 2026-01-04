# 🚀 Setup Supabase Keep-Alive

Panduan lengkap untuk setup keep-alive otomatis agar Supabase Free Plan tidak auto-pause setelah 7 hari.

## 📋 Cara Kerja

1. **GitHub Actions** akan jalan otomatis setiap **6 hari sekali**
2. Workflow akan ping **SQL function** di Supabase
3. Database akan tetap aktif dan tidak di-pause

---

## 🔧 Setup Step-by-Step

### 1️⃣ Deploy SQL Function ke Supabase

Buka **Supabase Dashboard** → **SQL Editor** → Jalankan query ini:

```sql
-- Buat function keepalive
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

-- Berikan akses ke anon users
GRANT EXECUTE ON FUNCTION keepalive() TO anon;
GRANT EXECUTE ON FUNCTION keepalive() TO authenticated;
```

✅ Klik **Run** untuk deploy function

---

### 2️⃣ Setup GitHub Secrets

Buka repository GitHub kamu → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Tambahkan 2 secrets berikut:

#### Secret 1: `SUPABASE_URL`
```
https://sriuxykirmjyfmeiiorl.supabase.co
```

#### Secret 2: `SUPABASE_ANON_KEY`
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyaXV4eWtpcm1qeWZtZWlpb3JsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0MTA4MTEsImV4cCI6MjA3MDk4NjgxMX0.kqd_G0jGA3gp6HP7q8BHybMMLE1CvDe5mTmknM6Pijk
```

> ⚠️ **PENTING**: Jangan commit secrets ke repository! Simpan hanya di GitHub Secrets.

---

### 3️⃣ Push Workflow ke GitHub

File workflow sudah dibuat di `.github/workflows/supabase-keepalive.yml`

Commit dan push ke GitHub:

```bash
git add .github/workflows/supabase-keepalive.yml
git commit -m "Add Supabase keep-alive workflow"
git push origin main
```

---

### 4️⃣ Test Manual (Opsional)

Setelah push, test workflow secara manual:

1. Buka repository di GitHub
2. Klik tab **Actions**
3. Pilih workflow **Supabase Keep Alive**
4. Klik **Run workflow** → **Run workflow**
5. Tunggu beberapa detik, lihat hasilnya

✅ Jika berhasil, akan muncul ✅ hijau dengan log:
```
✅ Supabase database pinged successfully!
✅ Database is active and responding!
🎉 Keep-alive completed successfully
```

---

## 📅 Jadwal Otomatis

Workflow akan jalan otomatis:
- **Setiap 6 hari** pada jam **00:00 UTC** (07:00 WIB)
- Bisa juga trigger **manual** kapan saja dari GitHub Actions

---

## 🔍 Monitoring

### Cara Cek Status Workflow

1. Buka repository → tab **Actions**
2. Lihat history workflow runs
3. Klik run tertentu untuk lihat detail log

### Cara Cek Database Supabase

1. Buka **Supabase Dashboard**
2. Lihat **Project Settings** → **General**
3. Status database akan tetap **Active** (tidak Paused)

---

## ❓ Troubleshooting

### Error: "Function keepalive() does not exist"

**Solusi**: Deploy ulang SQL function di Supabase SQL Editor (lihat step 1)

### Error: "Invalid API key"

**Solusi**: 
1. Cek GitHub Secrets sudah benar
2. Pastikan `SUPABASE_ANON_KEY` tidak expired
3. Copy ulang dari Supabase Dashboard → Settings → API

### Workflow tidak jalan otomatis

**Solusi**:
1. Pastikan repository **public** atau GitHub Actions enabled untuk private repo
2. Cek tab Actions tidak di-disable
3. Test manual dulu untuk memastikan workflow valid

---

## 🎯 Keuntungan Solusi Ini

✅ **Gratis 100%** - Menggunakan GitHub Actions free tier  
✅ **Otomatis** - Tidak perlu manual intervention  
✅ **Reliable** - GitHub Actions sangat stabil  
✅ **Aman** - Secrets tersimpan encrypted di GitHub  
✅ **Minimal** - Hanya ping setiap 6 hari, tidak boros resources  

---

## 📊 Alternative: Ping Lebih Sering

Jika mau lebih aman, ubah jadwal di `.github/workflows/supabase-keepalive.yml`:

```yaml
# Setiap 3 hari
- cron: "0 0 */3 * *"

# Setiap 2 hari
- cron: "0 0 */2 * *"

# Setiap hari (paling aman tapi lebih banyak runs)
- cron: "0 0 * * *"
```

---

## 🆘 Butuh Bantuan?

Jika ada masalah:
1. Cek log di GitHub Actions tab
2. Cek Supabase logs di Dashboard → Logs
3. Test manual function di Supabase SQL Editor:
   ```sql
   SELECT keepalive();
   ```

---

**Selamat! Database Supabase kamu sekarang akan tetap alive 24/7** 🎉
