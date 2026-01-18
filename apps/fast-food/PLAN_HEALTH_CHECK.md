# Pre-Demo Health Check Plan

This document outlines the steps to verify the readiness of the `apps/fast-food` application for the final presentation.

## Verification Steps

1.  **Code Integrity**

    - [ ] **Type Check:** Run `tsc -p apps/fast-food/tsconfig.json --noEmit`
    - [ ] **Linting:** Run `nx lint fast-food`

2.  **Test Verification**

    - [ ] **Run Tests:** Run `npx vitest run apps/fast-food`

3.  **Build Check**

    - [ ] **Production Build:** Run `nx build fast-food`

4.  **Summary**
    - [ ] Provide a final status report.
