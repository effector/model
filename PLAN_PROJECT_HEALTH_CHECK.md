# Project-Wide Health Check & CI Fix Plan

**Objective:** Ensure the entire project passes all GitHub Actions workflows (`.github/workflows`).

## Phase 1: Baseline & Quick Wins

1.  **Formatting:** Run `pnpm lint:format` and `pnpm format` to ensure all files are pretty.
2.  **Build:** Run `pnpm build` to confirm no compilation errors exist.
3.  **State Assessment:** Run `pnpm test` and `pnpm test:types` to capture the exact current failure/hang state.

## Phase 2: Resolving Process Hangs (Critical)

1.  **Core Test Hang:** Investigate why `packages/core` tests hang after completion.
    - _Hypothesis:_ Open handles (timers, intervals, database connections).
    - _Action:_ Use `--pool=threads` or `--no-threads` to see if isolation helps, or inspect teardown logic.
2.  **Type Check Hang:** Investigate why `pnpm test:types` hangs on `react` and `core`.
    - _Hypothesis:_ Circular type references, excessive recursion, or memory limits.
    - _Action:_ Isolate the problematic file/type by running `tsc` on specific files or bisecting the includes.

## Phase 3: Linting Cleanup

1.  **Bulk Fixes:** Run `pnpm lint --fix` to handle auto-fixable rules.
2.  **Manual Fixes:** Address remaining errors (e.g., `no-explicit-any`, unused vars).
    - _Strategy:_ Prioritize fixing errors that break the build. For non-critical style issues that are overwhelming, consider suppressing them temporarily with comments if a proper fix is too large for this scope.

## Phase 4: Final Validation

1.  **Simulation:** Run the full suite of commands (`lint`, `test`, `build`, `typecheck`) locally to verify green status.
