# GitHub Actions Workflows

## Supabase Keep-Alive

Workflow ini menjaga database Supabase tetap aktif dan mencegah auto-pause pada Free Plan.

### Cara Kerja
- Jalan otomatis setiap 6 hari
- Ping SQL function `keepalive()` di Supabase
- Verifikasi database masih aktif

### Setup
Lihat panduan lengkap di: [SUPABASE_KEEPALIVE_SETUP.md](../SUPABASE_KEEPALIVE_SETUP.md)

### Manual Trigger
Bisa trigger manual dari tab Actions → Supabase Keep Alive → Run workflow
