#!/usr/bin/env node

/**
 * Health check script for JWT configuration
 * This script validates JWT_SECRET configuration before application startup
 */

const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({
  path: path.join(__dirname, '..', process.env.NODE_ENV === 'production' ? '.env.production' : '.env')
});

function validateJwtSecret() {
  const jwtSecret = process.env.JWT_SECRET;

  console.log('🔐 Validating JWT_SECRET configuration...\n');

  // Check if JWT_SECRET exists
  if (!jwtSecret) {
    console.error('❌ JWT_SECRET is not configured');
    process.exit(1);
  }

  // Check if using default insecure value
  if (jwtSecret === 'trocar-por-um-segredo-seguro') {
    console.error('❌ JWT_SECRET is using the default insecure value');
    console.error('   Please set a secure JWT_SECRET in your .env file');
    process.exit(1);
  }

  // Check minimum length
  if (jwtSecret.length < 32) {
    console.error('❌ JWT_SECRET is too short (minimum 32 characters required)');
    console.error(`   Current length: ${jwtSecret.length}`);
    process.exit(1);
  }

  // Check for required character types (only in production)
  if (process.env.NODE_ENV === 'production') {
    const hasUpperCase = /[A-Z]/.test(jwtSecret);
    const hasLowerCase = /[a-z]/.test(jwtSecret);
    const hasNumbers = /\d/.test(jwtSecret);
    const hasSpecialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(jwtSecret);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChars) {
      console.error('❌ JWT_SECRET must contain uppercase letters, lowercase letters, numbers, and special characters');
      process.exit(1);
    }
  }

  console.log('✅ JWT_SECRET validation passed');
  console.log(`   Length: ${jwtSecret.length} characters`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Expires in: ${process.env.JWT_EXPIRES_IN || '8h'}`);
  console.log('\n🚀 Application can start safely\n');
}

if (require.main === module) {
  validateJwtSecret();
}

module.exports = { validateJwtSecret };