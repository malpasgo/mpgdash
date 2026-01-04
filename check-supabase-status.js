/**
 * Supabase Database Status Checker
 * 
 * Script ini untuk cek status database Supabase dan keep-alive function
 * 
 * Usage:
 *   node check-supabase-status.js
 */

const SUPABASE_URL = 'https://sriuxykirmjyfmeiiorl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyaXV4eWtpcm1qeWZtZWlpb3JsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0MTA4MTEsImV4cCI6MjA3MDk4NjgxMX0.kqd_G0jGA3gp6HP7q8BHybMMLE1CvDe5mTmknM6Pijk';

async function checkStatus() {
  console.log('🔍 Checking Supabase Database Status...\n');
  console.log('━'.repeat(60));
  
  const results = {
    database: false,
    keepalive: false,
    tables: false,
    timestamp: new Date().toISOString()
  };
  
  try {
    // Check 1: Database connectivity
    console.log('\n📡 Test 1: Database Connectivity');
    const startTime = Date.now();
    const healthResponse = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'HEAD',
      headers: {
        'apikey': SUPABASE_ANON_KEY
      }
    });
    const responseTime = Date.now() - startTime;
    
    if (healthResponse.ok) {
      console.log(`✅ Database is reachable (${responseTime}ms)`);
      results.database = true;
    } else {
      console.log(`❌ Database unreachable (HTTP ${healthResponse.status})`);
    }
    
    // Check 2: Keep-alive function
    console.log('\n📡 Test 2: Keep-Alive Function');
    try {
      const keepaliveResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/keepalive`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });
      
      if (keepaliveResponse.ok) {
        const data = await keepaliveResponse.json();
        console.log('✅ Keep-alive function is working');
        console.log(`   Status: ${data.status}`);
        console.log(`   Database: ${data.database}`);
        console.log(`   Timestamp: ${data.timestamp}`);
        results.keepalive = true;
      } else {
        console.log(`❌ Keep-alive function failed (HTTP ${keepaliveResponse.status})`);
        console.log('   ⚠️  Function mungkin belum di-deploy ke Supabase');
      }
    } catch (error) {
      console.log(`❌ Keep-alive function error: ${error.message}`);
    }
    
    // Check 3: Table access
    console.log('\n📡 Test 3: Table Access');
    try {
      const tablesResponse = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=id&limit=1`, {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      
      if (tablesResponse.ok) {
        console.log('✅ Tables are accessible');
        results.tables = true;
      } else {
        console.log(`⚠️  Table access limited (HTTP ${tablesResponse.status})`);
      }
    } catch (error) {
      console.log(`❌ Table access error: ${error.message}`);
    }
    
    // Summary
    console.log('\n' + '━'.repeat(60));
    console.log('\n📊 SUMMARY\n');
    
    const allPassed = results.database && results.keepalive && results.tables;
    
    if (allPassed) {
      console.log('🎉 All checks passed! Database is healthy.');
      console.log('✅ Database: Active');
      console.log('✅ Keep-alive: Working');
      console.log('✅ Tables: Accessible');
    } else {
      console.log('⚠️  Some checks failed:');
      console.log(`${results.database ? '✅' : '❌'} Database connectivity`);
      console.log(`${results.keepalive ? '✅' : '❌'} Keep-alive function`);
      console.log(`${results.tables ? '✅' : '❌'} Table access`);
      
      if (!results.keepalive) {
        console.log('\n💡 Action Required:');
        console.log('   Deploy SQL function ke Supabase SQL Editor');
        console.log('   Lihat: supabase/migrations/create_keepalive_function.sql');
      }
    }
    
    console.log(`\n⏰ Checked at: ${new Date().toLocaleString('id-ID')}`);
    console.log('━'.repeat(60));
    
    process.exit(allPassed ? 0 : 1);
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    console.error('\n🔍 Troubleshooting:');
    console.error('   1. Cek koneksi internet');
    console.error('   2. Cek SUPABASE_URL dan SUPABASE_ANON_KEY');
    console.error('   3. Cek Supabase Dashboard untuk status project');
    process.exit(1);
  }
}

// Run check
checkStatus();
