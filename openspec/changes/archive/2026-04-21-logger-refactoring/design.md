## Context

Current logger implementation in `src/services/logger.ts` uses `require("pino-pretty")` which causes ESLint error `@typescript-eslint/no-require-imports`. This is not idiomatic for an ESM/TypeScript project.

## Goals / Non-Goals

**Goals:**
- Remove `require()` call for pino-pretty to fix lint error
- Simplify pretty stream creation
- Keep existing functionality

**Non-Goals:**
- Change logging behavior or output format
- Add new logging features

## Decisions

1. **Use dynamic import instead of require**: Dynamic `import("pino-pretty")` is allowed and avoids the lint error while still loading pino-pretty at runtime.

2. **Inline pretty stream creation**: Remove the separate `createPrettyStream()` function and inline the stream creation directly where needed.

3. **Keep multistream pattern**: Continue using `pino.multistream()` as it's the correct way to handle multiple destinations.

## Risks / Trade-offs

- **Risk**: Dynamic import adds async overhead → Mitigation: Import happens once at logger creation, minimal impact
- **Trade-off**: Slightly more complex code vs. cleaner lint results → Worth it for proper TypeScript/ESM patterns