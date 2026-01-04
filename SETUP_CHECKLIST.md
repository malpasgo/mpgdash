# ✅ Supabase Keep-Alive Setup Checklist

Gunakan checklist ini untuk memastikan setup keep-alive berhasil 100%.

---

## 📋 Pre-Setup Checklist

- [ ] Punya akun GitHub
- [ ] Punya akun Supabase (Free Plan)
- [ ] Repository sudah dibuat di GitHub
- [ ] Node.js terinstall (untuk testing lokal)
- [ ] Git terinstall dan terkonfigurasi

---

## 🔧 Setup Checklist

### Step 1: Deploy SQL Function
- [ ] Buka Supabase Dashboard
- [ ] Navigasi ke SQL Editor
- [ ] Copy SQL dari `supabase/migrations/create_keepalive_function.sql`
- [ ] Paste ke SQL Editor
- [ ] Klik **Run** button
- [ ] Lihat success message: "Success. No rows returned"
- [ ] Test function dengan query: `SELECT keepalive();`
- [ ] Verify response berisi: `{"status": "alive", ...}`

**Status**: ⬜ Not Started | ⏳ In Progress | ✅ Completed

---

### Step 2: Setup GitHub Secrets
- [ ] Buka repository di GitHub
- [ ] Klik **Settings** tab
- [ ] Klik **Secrets and variables** → **Actions**
- [ ] Klik **New repository secret**
- [ ] Buat secret pertama:
  - Name: `SUPABASE_URL`
  - Value: `https://sriuxykirmjyfmeiiorl.supabase.co`
- [ ] Klik **Add secret**
- [ ] Klik **New repository secret** lagi
- [ ] Buat secret kedua:
  - Name: `SUPABASE_ANON_KEY`
  - Value: (copy dari Supabase Dashboard → Settings → API)
- [ ] Klik **Add secret**
- [ ] Verify kedua secrets muncul di list

**Status**: ⬜ Not Started | ⏳ In Progress | ✅ Completed

---

### Step 3: Push Workflow File
- [ ] Pastikan file `.github/workflows/supabase-keepalive.yml` ada
- [ ] Commit file:
  ```bash
  git add .github/workflows/supabase-keepalive.yml
  git commit -m "Add Supabase keep-alive workflow"
  ```
- [ ] Push ke GitHub:
  ```bash
  git push origin main
  ```
- [ ] Buka GitHub repository
- [ ] Klik tab **Actions**
- [ ] Verify workflow "Supabase Keep Alive" muncul di list

**Status**: ⬜ Not Started | ⏳ In Progress | ✅ Completed

---

### Step 4: Test Manual
- [ ] Buka tab **Actions** di GitHub
- [ ] Klik workflow **Supabase Keep Alive**
- [ ] Klik **Run workflow** dropdown
- [ ] Klik **Run workflow** button
- [ ] Tunggu workflow selesai (~30-60 detik)
- [ ] Klik workflow run yang baru
- [ ] Expand "Keep Supabase Database Alive" step
- [ ] Verify log menunjukkan:
  - ✅ "Supabase database pinged successfully!"
  - ✅ "Database is active and responding!"
  - 🎉 "Keep-alive completed successfully"

**Status**: ⬜ Not Started | ⏳ In Progress | ✅ Completed

---

### Step 5: Test Lokal (Opsional)
- [ ] Buka terminal di project directory
- [ ] Jalankan: `npm run test:keepalive`
- [ ] Verify output menunjukkan:
  - ✅ "Keep-alive function response"
  - ✅ "Database is active and responding!"
  - 🎉 "All tests passed!"
- [ ] Atau jalankan: `npm run check:supabase`
- [ ] Verify semua checks passed

**Status**: ⬜ Not Started | ⏳ In Progress | ✅ Completed

---

## 🔍 Verification Checklist

### GitHub Actions
- [ ] Workflow muncul di Actions tab
- [ ] Manual run berhasil (status hijau ✅)
- [ ] Logs tidak ada error
- [ ] Schedule terkonfigurasi: "Every 6 days"

### Supabase
- [ ] Function `keepalive()` exists
- [ ] Function bisa dipanggil: `SELECT keepalive();`
- [ ] Database status: **Active**
- [ ] No pause warnings

### Local Testing
- [ ] `npm run test:keepalive` berhasil
- [ ] `npm run check:supabase` semua checks passed
- [ ] No connection errors

---

## 📧 Post-Setup Checklist

### Notifications
- [ ] Enable GitHub email notifications:
  - GitHub → Settings → Notifications
  - Centang "Send notifications for failed workflows"
- [ ] Test notification dengan trigger workflow yang gagal (opsional)

### Documentation
- [ ] Bookmark GitHub Actions page
- [ ] Bookmark Supabase Dashboard
- [ ] Save link ke dokumentasi:
  - [Quick Start](QUICKSTART_KEEPALIVE.md)
  - [Setup Guide](SUPABASE_KEEPALIVE_SETUP.md)
  - [FAQ](KEEPALIVE_FAQ.md)

### Monitoring
- [ ] Set reminder untuk cek workflow runs (weekly)
- [ ] Set reminder untuk cek database status (monthly)
- [ ] Add monitoring ke project documentation

---

## 🎯 Success Criteria

Setup dianggap berhasil jika:

✅ **SQL Function**
- Function `keepalive()` deployed di Supabase
- Function bisa dipanggil dan return JSON response
- Permissions granted ke `anon` role

✅ **GitHub Secrets**
- `SUPABASE_URL` tersimpan dengan benar
- `SUPABASE_ANON_KEY` tersimpan dengan benar
- Secrets tidak exposed di logs

✅ **GitHub Actions**
- Workflow file di-push ke repository
- Workflow muncul di Actions tab
- Manual run berhasil tanpa error
- Schedule terkonfigurasi dengan benar

✅ **Testing**
- Local test (`npm run test:keepalive`) passed
- Status check (`npm run check:supabase`) passed
- Manual workflow run di GitHub passed

✅ **Monitoring**
- Email notifications enabled
- Workflow runs monitored
- Database status checked regularly

---

## 🚨 Common Issues Checklist

Jika ada masalah, cek:

### Function Issues
- [ ] Function name benar: `keepalive` (lowercase)
- [ ] Function deployed di Supabase SQL Editor
- [ ] Permissions granted: `GRANT EXECUTE ... TO anon;`
- [ ] Test manual: `SELECT keepalive();` di SQL Editor

### GitHub Secrets Issues
- [ ] Secret names benar (case-sensitive)
- [ ] No extra spaces atau newlines di values
- [ ] Values copied dari Supabase Dashboard
- [ ] Secrets visible di Settings → Secrets

### Workflow Issues
- [ ] File path benar: `.github/workflows/supabase-keepalive.yml`
- [ ] File di-push ke default branch (main/master)
- [ ] GitHub Actions enabled di repository
- [ ] Workflow syntax valid (no YAML errors)

### Connection Issues
- [ ] Internet connection stable
- [ ] Supabase project tidak paused
- [ ] API keys tidak expired
- [ ] No firewall blocking requests

---

## 📊 Monitoring Schedule

### Daily
- [ ] (Opsional) Quick check GitHub Actions status

### Weekly
- [ ] Check workflow runs (should be 1-2 per week)
- [ ] Verify no failed runs

### Monthly
- [ ] Run `npm run check:supabase`
- [ ] Check Supabase Dashboard status
- [ ] Review workflow logs

### Quarterly
- [ ] Review setup documentation
- [ ] Check for Supabase updates
- [ ] Optimize if needed

---

## 🎉 Completion

Jika semua checklist di atas ✅, maka:

**🎊 SELAMAT! Setup keep-alive berhasil!**

Database Supabase kamu sekarang akan:
- ✅ Tetap aktif 24/7
- ✅ Tidak auto-pause setelah 7 hari
- ✅ Di-ping otomatis setiap 6 hari
- ✅ Monitored via GitHub Actions

---

## 📝 Notes

Tanggal setup: _______________

Setup by: _______________

Issues encountered: _______________

Resolution: _______________

---

**Next Steps**: 
1. Monitor workflow runs selama 1-2 minggu
2. Verify database tetap active
3. Enjoy your always-on database! 🚀

---

**Need Help?** Lihat [KEEPALIVE_FAQ.md](KEEPALIVE_FAQ.md) atau [KEEPALIVE_INDEX.md](KEEPALIVE_INDEX.md)
