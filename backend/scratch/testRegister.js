import User from '../models/User.js';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config({ path: '../.env' });

const email = `test-${Date.now()}@rift.io`;
const name = 'Test User';
const password = 'password123';

console.log('--- RUNNING BACKEND INTEGRATION TEST ---');

async function run() {
  try {
    // 1. Register User
    console.log('\n1. Registering user...');
    const registerRes = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    const registerJson = await registerRes.json();
    console.log('Status Code:', registerRes.status);
    console.log('Response:', JSON.stringify(registerJson, null, 2));

    if (!registerJson.success) {
      throw new Error('Registration failed');
    }

    const { accessToken } = registerJson.data;

    // 2. Fetch profile using access token
    console.log('\n2. Fetching profile using access token...');
    const profileRes = await fetch('http://localhost:5000/api/auth/profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    const profileJson = await profileRes.json();
    console.log('Status Code:', profileRes.status);
    console.log('Response:', JSON.stringify(profileJson, null, 2));

    if (!profileJson.success) {
      throw new Error('Profile fetch failed');
    }

    // 3. Login User
    console.log('\n3. Logging in user...');
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const loginJson = await loginRes.json();
    console.log('Status Code:', loginRes.status);
    console.log('Response:', JSON.stringify(loginJson, null, 2));

    if (!loginJson.success) {
      throw new Error('Login failed');
    }

    console.log('\n--- ALL TESTS COMPLETED SUCCESSFULLY ---');
    process.exit(0);
  } catch (error) {
    console.error('Test error:', error);
    process.exit(1);
  }
}

// Small timeout to make sure database has fully loaded
setTimeout(run, 2000);
