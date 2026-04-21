## 1. Refactor CLI to use Commander exclusively

- [x] 1.1 Remove minimist import from cli.ts
- [x] 1.2 Remove manual showHelp() function
- [x] 1.3 Configure Commander with .exitOverride() and .showHelpAfterError()
- [x] 1.4 Add global options using Commander's .option() at program level

## 2. Update parseArgs function

- [x] 2.1 Refactor parseArgs to use Commander program.parse() instead of minimist
- [x] 2.2 Ensure all CLIArgs fields are properly populated from parsed options
- [x] 2.3 Remove unused minimist from parseArgs implementation

## 3. Update tests

- [x] 3.1 Update cli.test.ts to work with new Commander-based implementation
- [x] 3.2 Remove minimist-related test cases
- [x] 3.3 Add tests for global options behavior

## 4. Verify and lint

- [x] 4.1 Run npm run lint to check for issues
- [x] 4.2 Run npm run build to verify compilation
- [x] 4.3 Test CLI commands work correctly