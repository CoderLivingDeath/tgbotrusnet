## Context

The current CLI implementation uses a hybrid approach:
- Commander.js for subcommands (`db:config`, `db:init`, `log:config`)
- Minimist for argument parsing in `parseArgs()` function
- Manual `showHelp()` function instead of Commander's built-in help

This creates duplication and inconsistency:
- Help text is manually written in `showHelp()` instead of being auto-generated
- Two different argument parsing approaches
- No global options support through Commander

## Goals / Non-Goals

**Goals:**
- Remove minimist dependency, use Commander exclusively
- Remove manual `showHelp()` function, use Commander's built-in help
- Add global options via Commander's `.configureOutput()` and `.globalOption()`
- Proper TypeScript typing for all commands
- Consistent command structure using Commander chains

**Non-Goals:**
- Change CLI commands or their options (functional equivalence)
- Refactor config-helper.ts (works fine)
- Update bot startup arguments (handled separately)

## Decisions

1. **Use Commander's `.addHelpCommand()` and `.showHelpAfterError()`** instead of manual help text
2. **Use `.exitOverride()`** to handle --help and invalid commands gracefully
3. **Define global options** with `.option()` at program level that apply to all commands
4. **Keep action handlers as inline arrow functions** for simplicity (already working pattern)
5. **Replace `parseArgs` function** with direct Commander program parse

## Risks / Trade-offs

- **Risk**: Breaking existing CLI usage patterns → Mitigation: Keep same option flags, just change implementation
- **Risk**: Test failures in cli.test.ts → Mitigation: Update tests to match new Commander-based behavior
- **Trade-off**: Lose manual control over help text formatting → Gain: Auto-updated help when options change