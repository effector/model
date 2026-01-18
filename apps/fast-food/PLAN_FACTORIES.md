# Plan: Implement @withease/factories

## Goal

Integrate `@withease/factories` into `apps/fast-food` to ensure robust factory handling, stable SIDs, and proper isolation for the multi-instance architecture.

## Motivation

The current implementation uses standard JavaScript functions as factories (`createApp`, `createCartModel`). While this provides basic runtime isolation, it lacks:

1.  **Stable SIDs:** Essential for SSR, state serialization, and advanced debugging.
2.  **DevTools Support:** Without factory marking, DevTools may show duplicate or generic names.
3.  **Explicit Contract:** `@withease/factories` enforces a clear boundary between factory definition and invocation.

## Architecture Change

```mermaid
flowchart TD
    subgraph Configuration
        Vite[vite.config.ts] -->|Configures| Babel[Babel Plugin]
        Babel -->|Includes| WEF["@withease/factories"]
    end

    subgraph Code Structure
        Main[main.tsx] -->|invoke| AppFactory[createApp]
        AppFactory -->|invoke| CartFactory[createCartModel]

        CartFactory -->|Creates| Stores[Effector Stores (with SIDs)]
        AppFactory -->|Creates| AppInstance[App Model Instance]
    end
```

## Steps

### 1. Install Dependencies

Add `@withease/factories` to the project.

- `pnpm add @withease/factories` (in `apps/fast-food`)

### 2. Configure Vite & Babel

Update `apps/fast-food/vite.config.ts` to include the Effector Babel plugin with factory configuration.

```typescript
// apps/fast-food/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // ...
  plugins: [
    // ...
    react({
      babel: {
        plugins: [['effector/babel-plugin', { factories: ['@withease/factories'] }]],
      },
    }),
  ],
});
```

### 3. Refactor `cart.ts`

Wrap `createCartModel` with `createFactory`.

```typescript
// apps/fast-food/src/models/cart.ts
import { createFactory } from '@withease/factories';

export const createCartModel = createFactory(() => {
  // ... implementation ...
});
```

### 4. Refactor `app.ts`

Wrap `createApp` with `createFactory` and use `invoke` for the cart model.

```typescript
// apps/fast-food/src/models/app.ts
import { createFactory, invoke } from '@withease/factories';

export const createApp = createFactory(() => {
  // ...
  // Invoke the nested factory
  const { cartModel, ... } = invoke(createCartModel);
  // ...
});
```

### 5. Update `main.tsx`

Use `invoke` to instantiate the app.

```typescript
// apps/fast-food/src/main.tsx
import { invoke } from '@withease/factories';

const app1 = invoke(createApp);
const app2 = invoke(createApp);
```

## Verification

1.  **Build:** Ensure the project builds without errors.
2.  **Runtime:** Verify that both app instances in the browser still function correctly and independently.
