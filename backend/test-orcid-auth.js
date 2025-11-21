// Test script for ORCID OAuth implementation
const axios = require('axios');

// Configuration
const BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://synergyworldpress.com' 
  : 'http://localhost:5000';

async function testOrcidAuth() {
  try {
    console.log('Testing ORCID OAuth implementation...\n');

    // Test 1: Get ORCID login URL
    console.log('1. Testing ORCID login URL endpoint...');
    const loginUrlResponse = await axios.get(`${BASE_URL}/api/auth/orcid/login-url`);
    
    if (loginUrlResponse.data.url) {
      console.log('✅ ORCID login URL generated successfully');
      console.log(`   URL: ${loginUrlResponse.data.url}\n`);
    } else {
      console.log('❌ Failed to generate ORCID login URL\n');
      return;
    }

    // Test 2: Test callback with invalid code (should fail gracefully)
    console.log('2. Testing ORCID callback with invalid code...');
    try {
      const callbackResponse = await axios.get(`${BASE_URL}/api/auth/orcid/callback?code=invalid_code`);
      console.log('❌ Callback should have failed with invalid code');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Callback correctly handles invalid code');
      } else {
        console.log('❌ Unexpected error in callback:', error.message);
      }
    }

    // Test 3: Test callback without code (should fail gracefully)
    console.log('\n3. Testing ORCID callback without code...');
    try {
      const callbackResponse = await axios.get(`${BASE_URL}/api/auth/orcid/callback`);
      console.log('❌ Callback should have failed without code');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Callback correctly handles missing code');
      } else {
        console.log('❌ Unexpected error in callback:', error.message);
      }
    }

    console.log('\n✅ ORCID OAuth implementation tests completed!');
    console.log('\nTo test the full flow:');
    console.log('1. Set up ORCID credentials in your .env file:');
    console.log('   ORCID_CLIENT_ID=your_client_id');
    console.log('   ORCID_CLIENT_SECRET=your_client_secret');
    console.log('   ORCID_REDIRECT_URI=https://your-domain.com/api/auth/orcid/callback');
    console.log('\n2. Use the login URL to initiate OAuth flow');
    console.log('3. Complete the flow on ORCID\'s website');
    console.log('4. You will be redirected back to your callback endpoint');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Environment variables check
function checkEnvironmentVariables() {
  console.log('Checking environment variables...\n');
  
  const requiredVars = ['ORCID_CLIENT_ID', 'ORCID_CLIENT_SECRET', 'JWT_SECRET'];
  const optionalVars = ['ORCID_REDIRECT_URI'];
  
  let allRequiredPresent = true;
  
  requiredVars.forEach(varName => {
    if (process.env[varName]) {
      console.log(`✅ ${varName} is set`);
    } else {
      console.log(`❌ ${varName} is missing (required)`);
      allRequiredPresent = false;
    }
  });
  
  optionalVars.forEach(varName => {
    if (process.env[varName]) {
      console.log(`✅ ${varName} is set`);
    } else {
      console.log(`⚠️  ${varName} is not set (will use default)`);
    }
  });
  
  return allRequiredPresent;
}

if (checkEnvironmentVariables()) {
  testOrcidAuth();
} else {
  console.log('\n❌ Please set the required environment variables before testing');
}
