import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

describe("Environment Sanity Check", () => {
  // Test 1: Verifies Pure TypeScript / Node environment
  it("should pass a basic math test", () => {
    expect(1 + 1).toBe(2);
  });

  // Test 2: Verifies React, JSX, and JSDOM environment
  it("should render a dummy React component", () => {
    render(<div>Hello Vitest</div>);
    const element = screen.getByText("Hello Vitest");
    expect(element).toBeDefined();
  });
});
