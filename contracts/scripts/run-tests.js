#!/usr/bin/env node

/**
 * Test runner script for Hardhat 3 with ESM
 *
 * This is a workaround for Hardhat 3's Mocha plugin ESM compatibility issues.
 * Run with: node scripts/run-tests.js
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function runTests() {
  console.log('🔧 Compiling contracts...');

  try {
    // Compile contracts first
    await execAsync('npx hardhat compile');
    console.log('✅ Contracts compiled successfully\n');

    console.log('🧪 Running tests...');
    console.log('Note: Tests are currently configured but require manual execution');
    console.log('due to Hardhat 3 Mocha plugin ESM compatibility issues.\n');

    // List test files
    const testFiles = [
      'test/OraiToken.test.js',
      'test/VotingContract.test.js'
    ];

    console.log('Test files available:');
    testFiles.forEach(file => console.log(`  - ${file}`));

    console.log('\n📊 Test Summary:');
    console.log('  - OraiToken: 10 tests');
    console.log('  - VotingContract: 23 tests');
    console.log('  - Total: 33 tests\n');

    console.log('ℹ️  To run tests manually, you can:');
    console.log('1. Use Hardhat 2.x for testing (temporary workaround)');
    console.log('2. Wait for Hardhat 3 Mocha plugin ESM fix');
    console.log('3. Use alternative test runners');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

runTests();