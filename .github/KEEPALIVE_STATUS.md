# 📊 Supabase Keep-Alive Status

## Current Configuration

| Setting | Value |
|---------|-------|
| **Schedule** | Every 6 days at 00:00 UTC (07:00 WIB) |
| **Method** | GitHub Actions + SQL Function |
| **Function** | `keepalive()` |
| **Target** | Supabase Database |
| **Status** | ✅ Active |

## Last Runs

Cek status terbaru di: [GitHub Actions](../../actions/workflows/supabase-keepalive.yml)

## Quick Links

- 📖 [Setup Guide](../../SUPABASE_KEEPALIVE_SETUP.md)
- 🧪 [Test Script](../../test-keepalive.js)
- ⚙️ [Workflow File](../workflows/supabase-keepalive.yml)
- 🗄️ [SQL Migration](../../supabase/migrations/create_keepalive_function.sql)

## Manual Trigger

Jika perlu trigger manual:
1. Buka [Actions tab](../../actions)
2. Pilih **Supabase Keep Alive**
3. Klik **Run workflow**

## Monitoring

### ✅ Signs of Success
- Workflow runs dengan status hijau (✅)
- Log menunjukkan "Database is active and responding"
- Supabase dashboard menunjukkan status "Active"

### ⚠️ Signs of Issues
- Workflow fails dengan status merah (❌)
- Error "Function does not exist"
- Supabase dashboard menunjukkan status "Paused"

### 🔧 Troubleshooting
Lihat [SUPABASE_KEEPALIVE_SETUP.md](../../SUPABASE_KEEPALIVE_SETUP.md#-troubleshooting)

---

**Last Updated**: January 2026
