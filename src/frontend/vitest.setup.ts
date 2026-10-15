import "@testing-library/jest-dom/vitest";
import { cleanup, configure } from "@testing-library/react";
import { afterEach } from "vitest";

// Generated components expose `data-ocid`; use it as the test-id attribute so
// tests can target stable hooks without depending on CSS classes.
configure({ testIdAttribute: "data-ocid" });

// jsdom does not implement the Pointer Capture API that Radix UI primitives
// (Select, Dialog, Switch) call on pointer events. Without these stubs, opening
// a Radix Select throws `target.hasPointerCapture is not a function`.
if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false;
}
if (!Element.prototype.setPointerCapture) {
  Element.prototype.setPointerCapture = () => {};
}
if (!Element.prototype.releasePointerCapture) {
  Element.prototype.releasePointerCapture = () => {};
}
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}

// Radix's Switch (via @radix-ui/react-use-size) observes its own size with a
// ResizeObserver, which jsdom does not provide.
if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}

// `main.tsx` installs this patch before rendering so TanStack Query can hash
// query keys that contain bigint ids. Tests render routes directly, bypassing
// `main.tsx`, so the same patch must be applied here or every query key with a
// bigint throws `Do not know how to serialize a BigInt`.
BigInt.prototype.toJSON = function () {
  return this.toString();
};

declare global {
  interface BigInt {
    toJSON(): string;
  }
}

afterEach(() => {
  cleanup();
});
