# Custom Commands

This directory contains custom command scripts for the Give Protocol frontend project.

## Available Commands

### `/test` - Comprehensive Quality Check

Runs a complete test suite including tests, linting, and formatting.

**Usage:**

```bash
pnpm test:all
# or
node @commands/test.js
```

**What it does:**

1. Runs all Vitest tests in run mode (non-watch)
2. Executes ESLint with auto-fix on the `src/` directory
3. Formats all files with Prettier

**Exit codes:**

- `0` - All checks passed
- `1` - One or more checks failed

**Output:**

- Color-coded terminal output
- Section headers for each step
- Summary with total duration
- Clear pass/fail status for each step

## Creating New Commands

To add a new command:

1. Create a new `.js` file in this directory
2. Make it executable with `#!/usr/bin/env node`
3. Add the command to `package.json` scripts
4. Document it in this README

Example:

```javascript
#!/usr/bin/env node
const { execSync } = require('child_process')

// Your command logic here
```
