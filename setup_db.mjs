const SUPABASE_URL = 'https://klrzgbwwouckzwshpwud.supabase.co';
const SUPABASE_KEY = 'sb_publishable_jSdXFx7iwkj1BwQesyacYA_YKsspb_o';

async function main() {
  // Check if predictions table exists
  const res = await fetch(`${SUPABASE_URL}/rest/v1/predictions?select=id&limit=1`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    }
  });
  console.log(`Table check status: ${res.status}`);
  const text = await res.text();
  console.log(`Response: ${text}`);
  
  if (res.status === 200) {
    console.log('✅ predictions table exists and is accessible!');
  } else if (res.status === 401) {
    console.log('⚠️ Auth required (expected with anon key + RLS). Table likely exists.');
  } else {
    console.log('❌ Table might not exist. Status:', res.status);
  }
}

main();
