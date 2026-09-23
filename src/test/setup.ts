import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";

// Tests share a single jsdom `window`, so localStorage (i18n language, pool selection, ...)
// would otherwise leak between test files/cases and make them order-dependent.
afterEach(() => {
  window.localStorage.clear();
});
