#!/usr/bin/env node

/**
 * /test command - Runs comprehensive quality checks
 *
 * Executes in order:
 * 1. Vitest tests (run mode, not watch)
 * 2. ESLint with auto-fix
 * 3. Prettier formatting
 *
 * Usage: node @commands/test.js
 * Or add to package.json scripts for easy access
 */

const { execSync } = require('child_process')
const path = require('path')

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`)
}

function logSection(title) {
  console.log('\n')
  log('═'.repeat(60), colors.cyan)
  log(`  ${title}`, colors.bright + colors.cyan)
  log('═'.repeat(60), colors.cyan)
  console.log('')
}

function runCommand(command, description) {
  try {
    log(`▶ ${description}...`, colors.blue)
    execSync(command, {
      stdio: 'inherit',
      cwd: path.resolve(__dirname, '..'),
      shell: true,
    })
    log(`✓ ${description} completed successfully`, colors.green)
    return true
  } catch (error) {
    log(`✗ ${description} failed`, colors.red)
    return false
  }
}

async function main() {
  log('\n🚀 Starting comprehensive test suite...', colors.bright + colors.cyan)

  const startTime = Date.now()
  let allPassed = true

  // Step 1: Run tests
  logSection('1/3: Running Vitest Tests')
  const testsPassed = runCommand('pnpm test:run', 'Vitest tests')
  allPassed = allPassed && testsPassed

  // Step 2: Lint and fix
  logSection('2/3: Running ESLint with Auto-fix')
  const lintPassed = runCommand('pnpm lint:fix', 'ESLint auto-fix')
  allPassed = allPassed && lintPassed

  // Step 3: Format code
  logSection('3/3: Running Prettier Formatting')
  const formatPassed = runCommand('pnpm format', 'Prettier formatting')
  allPassed = allPassed && formatPassed

  // Summary
  const endTime = Date.now()
  const duration = ((endTime - startTime) / 1000).toFixed(2)

  console.log('\n')
  log('═'.repeat(60), colors.cyan)
  if (allPassed) {
    log('  ✓ ALL CHECKS PASSED', colors.bright + colors.green)
    log(`  Completed in ${duration}s`, colors.green)
  } else {
    log('  ✗ SOME CHECKS FAILED', colors.bright + colors.red)
    log(`  Completed in ${duration}s`, colors.red)
    log('  Please review the errors above and fix them.', colors.yellow)
  }
  log('═'.repeat(60), colors.cyan)
  console.log('\n')

  process.exit(allPassed ? 0 : 1)
}

main()
