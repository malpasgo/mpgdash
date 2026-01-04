# 🏗️ Keep-Alive Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     GitHub Actions                          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Workflow: supabase-keepalive.yml                     │  │
│  │  Schedule: Every 6 days at 00:00 UTC                  │  │
│  │                                                        │  │
│  │  Steps:                                               │  │
│  │  1. Ping keepalive() function                        │  │
│  │  2. Verify database activity                         │  │
│  │  3. Log results                                      │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS POST Request
                            │ /rest/v1/rpc/keepalive
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Database                        │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Function: keepalive()                                │  │
│  │  Type: PostgreSQL Function (plpgsql)                  │  │
│  │  Security: DEFINER                                    │  │
│  │                                                        │  │
│  │  Returns:                                             │  │
│  │  {                                                    │  │
│  │    "status": "alive",                                 │  │
│  │    "timestamp": "2026-01-04T12:00:00Z",              │  │
│  │    "database": "postgres",                           │  │
│  │    "message": "Database is active and responding"    │  │
│  │  }                                                    │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  Database Status: ACTIVE ✅                                 │
│  Auto-Pause: PREVENTED 🛡️                                  │
└─────────────────────────────────────────────────────────────┘
```

## Flow Diagram

```
Start
  │
  ├─► [Timer: Every 6 days]
  │
  ├─► GitHub Actions Triggered
  │
  ├─► Step 1: Call keepalive() function
  │     │
  │     ├─► POST /rest/v1/rpc/keepalive
  │     │
  │     ├─► Supabase executes SQL function
  │     │
  │     └─► Returns JSON response
  │
  ├─► Step 2: Verify database activity
  │     │
  │     ├─► GET /rest/v1/profiles?limit=1
  │     │
  │     └─► Confirms database is active
  │
  ├─► Step 3: Log success
  │     │
  │     └─► ✅ Keep-alive completed
  │
  └─► Database remains ACTIVE
        │
        └─► Wait 6 days → Repeat
```

## Security Model

```
┌──────────────────────────────────────────────────────────┐
│  GitHub Repository                                       │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Secrets (Encrypted)                               │  │
│  │  • SUPABASE_URL                                    │  │
│  │  • SUPABASE_ANON_KEY                               │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
                    │
                    │ Injected at runtime
                    │ (Never exposed in logs)
                    ▼
┌──────────────────────────────────────────────────────────┐
│  GitHub Actions Runner                                   │
│  • Temporary environment                                 │
│  • Secrets available as env vars                         │
│  • Destroyed after workflow completes                    │
└──────────────────────────────────────────────────────────┘
                    │
                    │ HTTPS (TLS 1.3)
                    │ Authorization: Bearer <anon_key>
                    ▼
┌──────────────────────────────────────────────────────────┐
│  Supabase API Gateway                                    │
│  • Validates API key                                     │
│  • Checks RLS policies                                   │
│  • Routes to database                                    │
└──────────────────────────────────────────────────────────┘
```

## Component Responsibilities

### GitHub Actions Workflow
- **Trigger**: Cron schedule (every 6 days)
- **Authentication**: Uses GitHub Secrets
- **Actions**: 
  1. Call keepalive function
  2. Verify database response
  3. Log results
- **Failure Handling**: Exit with error code if ping fails

### Supabase Function
- **Type**: PostgreSQL stored procedure
- **Language**: PL/pgSQL
- **Security**: SECURITY DEFINER (runs with function owner privileges)
- **Permissions**: Granted to `anon` and `authenticated` roles
- **Purpose**: Execute simple query to keep database active

### Monitoring
- **GitHub Actions Logs**: View workflow execution history
- **Supabase Dashboard**: Check database status
- **Test Scripts**: 
  - `test-keepalive.js` - Test function locally
  - `check-supabase-status.js` - Comprehensive status check

## Why This Works

1. **Database Activity**: Executing SQL function counts as database activity
2. **Scheduled Execution**: Running every 6 days ensures activity within 7-day window
3. **Reliable Infrastructure**: GitHub Actions has 99.9% uptime
4. **Zero Cost**: Both GitHub Actions and Supabase Free Plan are free
5. **Secure**: API keys stored encrypted in GitHub Secrets

## Failure Scenarios & Mitigation

| Scenario | Impact | Mitigation |
|----------|--------|------------|
| GitHub Actions down | Workflow doesn't run | Manual trigger available |
| Supabase API error | Function call fails | Workflow retries on next schedule |
| Function not deployed | 404 error | Test script detects before production |
| Invalid API key | 401 error | Workflow fails with clear error message |
| Database paused | Function can't execute | Resume manually, workflow will prevent future pauses |

## Monitoring & Alerts

### Success Indicators
- ✅ Workflow status: Green checkmark
- ✅ Log message: "Database is active and responding"
- ✅ Supabase dashboard: Status = Active

### Failure Indicators
- ❌ Workflow status: Red X
- ❌ Error in logs
- ❌ Supabase dashboard: Status = Paused

### Manual Checks
```bash
# Test function locally
npm run test:keepalive

# Check comprehensive status
npm run check:supabase
```

---

**Last Updated**: January 2026
