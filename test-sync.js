// Test script to check if the browser extension can access the rules
const fetch = require('node-fetch');

async function testSync() {
  try {
    console.log('Testing sync endpoint...');
    
    // Replace with your actual token
    const token = 'YOUR_TOKEN_HERE';
    
    const response = await fetch('http://localhost:9002/api/supabase-mute-rules/sync', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('Error response:', errorText);
      return;
    }
    
    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));
    console.log('Server rules:', data.serverRules ? data.serverRules.length : 0);
    
    if (data.serverRules && data.serverRules.length > 0) {
      console.log('First rule details:', JSON.stringify(data.serverRules[0], null, 2));
    } else {
      console.log('No server rules received');
    }
  } catch (error) {
    console.error('Error testing sync:', error);
  }
}

testSync();
