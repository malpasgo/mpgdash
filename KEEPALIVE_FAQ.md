# ❓ Supabase Keep-Alive FAQ

## General Questions

### Q: Kenapa database Supabase bisa auto-pause?
**A**: Supabase Free Plan akan otomatis pause database setelah **7 hari tidak ada aktivitas**. Ini untuk menghemat resources pada free tier.

### Q: Apakah solusi ini gratis?
**A**: Ya, 100% gratis! GitHub Actions free tier memberikan 2,000 menit/bulan untuk public repos dan 500 menit/bulan untuk private repos. Workflow ini hanya butuh ~1 menit per run (setiap 6 hari), jadi sangat hemat.

### Q: Apakah aman menyimpan API key di GitHub?
**A**: Ya, selama disimpan di **GitHub Secrets** (bukan di code). Secrets di-encrypt dan tidak pernah muncul di logs. Kita juga hanya pakai `anon_key` (bukan `service_role_key`), jadi akses terbatas sesuai RLS policies.

### Q: Kenapa ping setiap 6 hari, bukan 7 hari?
**A**: Untuk safety margin. Jika ada delay atau masalah teknis, masih ada buffer 1 hari sebelum database di-pause.

---

## Technical Questions

### Q: Apa yang dilakukan function `keepalive()`?
**A**: Function ini menjalankan query sederhana yang mengembalikan status database. Ini cukup untuk dianggap sebagai "aktivitas" oleh Supabase.

### Q: Apakah bisa pakai endpoint lain selain RPC function?
**A**: Bisa, tapi RPC function lebih reliable karena:
- Memastikan query benar-benar dieksekusi di database
- Tidak tergantung pada table tertentu
- Lebih mudah di-monitor dan di-debug

### Q: Bagaimana jika workflow gagal?
**A**: Workflow akan retry pada schedule berikutnya (6 hari kemudian). Jika terus gagal, kamu bisa:
1. Cek logs di GitHub Actions
2. Test manual dengan `npm run test:keepalive`
3. Trigger manual dari GitHub Actions tab

### Q: Apakah ini mempengaruhi performa database?
**A**: Tidak sama sekali. Function hanya jalan setiap 6 hari dan eksekusinya sangat cepat (<100ms). Impact ke database negligible.

---

## Setup Questions

### Q: Saya sudah deploy function tapi masih error "Function does not exist"
**A**: Kemungkinan:
1. Function belum di-deploy dengan benar. Coba run ulang SQL di Supabase SQL Editor
2. Typo di nama function. Pastikan nama function adalah `keepalive` (lowercase, no spaces)
3. Permissions belum di-grant. Pastikan ada `GRANT EXECUTE ON FUNCTION keepalive() TO anon;`

### Q: Error "Invalid API key" di GitHub Actions
**A**: Cek:
1. GitHub Secrets sudah dibuat dengan nama yang benar (`SUPABASE_URL` dan `SUPABASE_ANON_KEY`)
2. Value secrets tidak ada extra spaces atau newlines
3. Copy ulang dari Supabase Dashboard → Settings → API

### Q: Workflow tidak muncul di Actions tab
**A**: Pastikan:
1. File `.github/workflows/supabase-keepalive.yml` sudah di-push ke GitHub
2. Repository tidak disable GitHub Actions (Settings → Actions → Allow all actions)
3. Branch yang di-push adalah default branch (biasanya `main` atau `master`)

### Q: Bagaimana cara test sebelum deploy?
**A**: Jalankan test script lokal:
```bash
npm run test:keepalive
```
Atau cek status lengkap:
```bash
npm run check:supabase
```

---

## Monitoring Questions

### Q: Bagaimana cara cek apakah workflow berjalan dengan baik?
**A**: 
1. Buka GitHub → Actions tab
2. Lihat workflow runs history
3. Klik run tertentu untuk lihat detail logs
4. Cari tanda ✅ "Keep-alive completed successfully"

### Q: Bagaimana cara cek status database Supabase?
**A**: 
1. Buka Supabase Dashboard
2. Pilih project kamu
3. Lihat status di header (Active/Paused)
4. Atau jalankan `npm run check:supabase` untuk comprehensive check

### Q: Apakah ada notifikasi jika workflow gagal?
**A**: GitHub bisa kirim email notification jika workflow fails. Enable di:
- GitHub → Settings → Notifications → Actions
- Centang "Send notifications for failed workflows"

---

## Customization Questions

### Q: Bagaimana cara ubah jadwal ping?
**A**: Edit file `.github/workflows/supabase-keepalive.yml`, ubah cron schedule:
```yaml
# Setiap 3 hari
- cron: "0 0 */3 * *"

# Setiap 2 hari
- cron: "0 0 */2 * *"

# Setiap hari (paling aman)
- cron: "0 0 * * *"
```

### Q: Bagaimana cara ubah jam ping?
**A**: Ubah jam di cron schedule (format: menit jam):
```yaml
# Jam 12:00 UTC (19:00 WIB)
- cron: "0 12 */6 * *"

# Jam 06:00 UTC (13:00 WIB)
- cron: "0 6 */6 * *"
```

### Q: Bisa pakai service lain selain GitHub Actions?
**A**: Bisa! Alternatif:
- **Vercel Cron Jobs** (jika deploy di Vercel)
- **Netlify Scheduled Functions** (jika deploy di Netlify)
- **Cron-job.org** (free cron service)
- **UptimeRobot** (free monitoring service dengan HTTP checks)

Tapi GitHub Actions paling recommended karena gratis, reliable, dan terintegrasi dengan repo.

---

## Troubleshooting Questions

### Q: Database masih ke-pause padahal workflow jalan
**A**: Kemungkinan:
1. Function tidak benar-benar hit database. Cek logs untuk memastikan response sukses
2. Supabase menghitung "inactivity" dari aktivitas lain (bukan hanya function calls). Coba tambah verification step yang query table
3. Ada issue di Supabase side. Contact Supabase support

### Q: Workflow tiba-tiba berhenti jalan
**A**: Cek:
1. Repository masih aktif (tidak di-archive)
2. GitHub Actions tidak di-disable
3. Workflow file tidak di-delete atau di-rename
4. Cron schedule masih valid

### Q: Error "Resource not accessible by integration"
**A**: Ini biasanya terjadi di private repos dengan permissions terbatas. Solusi:
1. Buka Settings → Actions → General
2. Set "Workflow permissions" ke "Read and write permissions"
3. Save dan retry workflow

---

## Advanced Questions

### Q: Bisa pakai untuk multiple Supabase projects?
**A**: Bisa! Buat multiple secrets:
```
SUPABASE_URL_PROJECT1
SUPABASE_ANON_KEY_PROJECT1
SUPABASE_URL_PROJECT2
SUPABASE_ANON_KEY_PROJECT2
```
Lalu duplicate workflow atau buat matrix strategy.

### Q: Bagaimana cara monitoring multiple projects sekaligus?
**A**: Buat script monitoring yang loop through multiple projects:
```javascript
const projects = [
  { name: 'Project1', url: '...', key: '...' },
  { name: 'Project2', url: '...', key: '...' }
];

for (const project of projects) {
  await checkProject(project);
}
```

### Q: Bisa integrate dengan Slack/Discord untuk notifications?
**A**: Bisa! Tambah step di workflow:
```yaml
- name: Notify Slack
  if: failure()
  run: |
    curl -X POST ${{ secrets.SLACK_WEBHOOK_URL }} \
      -H 'Content-Type: application/json' \
      -d '{"text":"⚠️ Supabase keep-alive failed!"}'
```

---

## Migration Questions

### Q: Saya sudah pakai solusi lain, bisa migrate?
**A**: Ya, tinggal:
1. Disable solusi lama
2. Setup solusi ini (ikuti QUICKSTART_KEEPALIVE.md)
3. Test untuk memastikan berjalan dengan baik
4. Hapus solusi lama setelah yakin

### Q: Bagaimana cara rollback jika ada masalah?
**A**: 
1. Disable workflow: Rename file atau tambah `if: false` di workflow
2. Delete function di Supabase: `DROP FUNCTION IF EXISTS keepalive();`
3. Delete GitHub Secrets jika perlu

---

## Cost Questions

### Q: Apakah ada biaya tersembunyi?
**A**: Tidak ada! Semua gratis:
- GitHub Actions: Free tier cukup untuk workflow ini
- Supabase Free Plan: Tetap gratis, hanya mencegah auto-pause
- No hidden costs

### Q: Berapa banyak GitHub Actions minutes yang dipakai?
**A**: Sangat sedikit:
- Per run: ~30-60 detik
- Per bulan: ~2-4 menit (5 runs × 0.5 menit)
- Free tier: 2,000 menit/bulan (public) atau 500 menit/bulan (private)
- Usage: <1% dari free tier

---

## Best Practices

### Q: Apa best practice untuk production?
**A**: 
1. ✅ Gunakan GitHub Secrets untuk credentials
2. ✅ Enable email notifications untuk workflow failures
3. ✅ Test lokal sebelum deploy (`npm run test:keepalive`)
4. ✅ Monitor workflow runs secara berkala
5. ✅ Document setup di README project
6. ✅ Backup workflow file di multiple branches

### Q: Haruskah saya upgrade ke Supabase Pro?
**A**: Tergantung kebutuhan:
- **Tetap Free** jika: Traffic rendah, project personal/hobby, budget terbatas
- **Upgrade Pro** jika: Production app, butuh guaranteed uptime, butuh support, database >500MB

Keep-alive ini solusi bagus untuk Free Plan, tapi Pro Plan memberikan:
- No auto-pause
- Better performance
- Priority support
- More resources

---

**Masih ada pertanyaan?** 
- 📖 Lihat [SUPABASE_KEEPALIVE_SETUP.md](SUPABASE_KEEPALIVE_SETUP.md)
- 🏗️ Lihat [.github/ARCHITECTURE.md](.github/ARCHITECTURE.md)
- ⚡ Lihat [QUICKSTART_KEEPALIVE.md](QUICKSTART_KEEPALIVE.md)
