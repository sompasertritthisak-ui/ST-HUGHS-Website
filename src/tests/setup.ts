import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// `server-only` throws when imported outside a React Server Components bundle.
// Tests exercise server modules directly, so neutralise the guard here.
vi.mock("server-only", () => ({}));
