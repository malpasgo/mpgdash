/**
 * Test Script untuk Supabase Keep-Alive Function
 * 
 * Jalankan script ini untuk test apakah function keepalive() sudah berfungsi
 * 
 * Usage:
 *   node test-keepalive.js
 */

const SUPABASE_URL = 'https://sriuxykirmjyfmeiiorl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyaXV4eWtpcm1qeWZtZWlpb3JsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0MTA4MTEsImV4cCI6MjA3MDk4NjgxMX0.kqd_G0jGA3gp6HP7q8BHybMMLE1CvDe5mTmknM6Pijk';

async function testKeepalive() {
  console.log('🔄 Testing Supabase keep-alive function...\n');
  
  try {
    // Test 1: Ping keepalive function
    console.log('📡 Test 1: Calling keepalive() function...');
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/keepalive`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ Keep-alive function response:');
    console.log(JSON.stringify(data, null, 2));
    console.log('');
    
    // Test 2: Verify database is active
    console.log('📡 Test 2: Verifying database activity...');
    const verifyResponse = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=id&limit=1`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    
    if (!verifyResponse.ok) {
      throw new Error(`HTTP ${verifyResponse.status}: ${verifyResponse.statusText}`);
    }
    
    console.log('✅ Database is active and responding!\n');
    
    // Summary
    console.log('🎉 All tests passed!');
    console.log('✅ Keep-alive function is working correctly');
    console.log('✅ Database is active');
    console.log('\n' + '═'.repeat(60));
    console.log('\n📚 DOKUMENTASI LENGKAP:');
    console.log('   • Quick Start (5 min): QUICKSTART_KEEPALIVE.md');
    console.log('   • Setup Guide: SUPABASE_KEEPALIVE_SETUP.md');
    console.log('   • Visual Guide: VISUAL_GUIDE.md');
    console.log('   • FAQ: KEEPALIVE_FAQ.md');
    console.log('   • Index: KEEPALIVE_INDEX.md');
    console.log('\n📝 NEXT STEPS:');
    console.log('   1. Setup GitHub Secrets (SUPABASE_URL, SUPABASE_ANON_KEY)');
    console.log('   2. Push workflow ke GitHub');
    console.log('   3. Test manual dari GitHub Actions tab');
    console.log('   4. Monitor workflow runs');
    console.log('\n💡 TIP: Jalankan "npm run check:supabase" untuk status lengkap');
    console.log('═'.repeat(60));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('\n🔍 Troubleshooting:');
    console.error('   1. Pastikan SQL function sudah di-deploy ke Supabase');
    console.error('   2. Cek SUPABASE_URL dan SUPABASE_ANON_KEY sudah benar');
    console.error('   3. Jalankan SQL di Supabase SQL Editor:');
    console.error('      SELECT keepalive();');
    process.exit(1);
  }
}

// Run test
testKeepalive();
