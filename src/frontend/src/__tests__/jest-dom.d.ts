// Registers the `@testing-library/jest-dom` matcher types (toBeInTheDocument,
// toBeDisabled, toHaveTextContent, ...) with Vitest's `expect` for the
// TypeScript project. The runtime registration lives in `vitest.setup.ts`,
// which sits outside `tsconfig.json`'s `include: ["src"]`, so without this
// reference the matchers work at runtime but fail `tsc --noEmit`.
import "@testing-library/jest-dom/vitest";
