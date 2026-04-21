## Why

The current CLI implementation uses minimist for argument parsing combined with a custom manual help system. This leads to duplication (help text defined manually in `showHelp()` function), inconsistent option handling, and makes it harder to add new commands. Commander provides built-in subcommands, auto-generated help, and better type safety.

## What Changes

- Replace minimist with Commander.js for argument parsing
- Use Commander's built-in help generation instead of manual `showHelp()` function
- Refactor all CLI commands to use Commander's `.command()` API
- Add support for global options that apply to all commands
- Use Commander's `--verbose` global option instead of custom implementation

## Capabilities

### New Capabilities
- `commander-cli`: Full CLI refactoring to use Commander.js with proper subcommands

### Modified Capabilities
- (none - this is an internal implementation change)

## Impact

- `src/utils/cli.ts` - Main CLI module, refactored to use Commander
- `src/utils/config-helper.ts` - No changes needed, continues to work as before
- Tests in `src/utils/__tests__/cli.test.ts` - Will need updates for new CLI structure