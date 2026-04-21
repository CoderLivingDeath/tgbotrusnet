## 1. Refactor logger imports

- [x] 1.1 Replace require("pino-pretty") with dynamic import
- [x] 1.2 Make createPrettyStream async
- [x] 1.3 Update createLogger to handle async pretty stream

## 2. Verify

- [x] 2.1 Run npm run lint
- [x] 2.2 Run npm run build
- [x] 2.3 Test logging still works