#!/usr/bin/env node

const path = require('path');

const envPath = path.join(__dirname, '..', process.env.NODE_ENV === 'production' ? '.env.production' : '.env');

try {
  process.loadEnvFile(envPath);
} catch {
  // start-sistema.bat shows a clearer message when the env file is missing.
}

function validateJwtSecret() {
  const jwtSecret = process.env.JWT_SECRET;

  console.log('Validating JWT_SECRET configuration...\n');

  if (!jwtSecret) {
    console.error('JWT_SECRET is not configured');
    process.exit(1);
  }

  if (jwtSecret === 'trocar-por-um-segredo-seguro') {
    console.error('JWT_SECRET is using the default insecure value');
    console.error('   Please set a secure JWT_SECRET in your .env file');
    process.exit(1);
  }

  if (jwtSecret.length < 32) {
    console.error('JWT_SECRET is too short (minimum 32 characters required)');
    console.error(`   Current length: ${jwtSecret.length}`);
    process.exit(1);
  }

  if (process.env.NODE_ENV === 'production') {
    const hasUpperCase = /[A-Z]/.test(jwtSecret);
    const hasLowerCase = /[a-z]/.test(jwtSecret);
    const hasNumbers = /\d/.test(jwtSecret);
    const hasSpecialChars = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(jwtSecret);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChars) {
      console.error('JWT_SECRET must contain uppercase letters, lowercase letters, numbers, and special characters');
      process.exit(1);
    }
  }

  console.log('JWT_SECRET validation passed');
  console.log(`   Length: ${jwtSecret.length} characters`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Expires in: ${process.env.JWT_EXPIRES_IN || '8h'}`);
  console.log('\nApplication can start safely\n');
}

if (require.main === module) {
  validateJwtSecret();
}

module.exports = { validateJwtSecret };
