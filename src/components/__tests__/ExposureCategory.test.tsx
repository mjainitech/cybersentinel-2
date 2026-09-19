import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ExposureCategoryGrid } from "../ExposureCategory";

describe("ExposureCategoryGrid", () => {
  it("shows a fallback message when no categories were found exposed (empty results)", () => {
    render(<ExposureCategoryGrid categoriesFound={[]} categoriesNotFound={["email", "password"]} />);
    expect(screen.getByText("No categories confirmed exposed.")).toBeInTheDocument();
  });

  it("renders confirmed-exposed categories distinctly from not-found ones", () => {
    render(<ExposureCategoryGrid categoriesFound={["email"]} categoriesNotFound={["password"]} />);
    expect(screen.getByText("Email Address")).toBeInTheDocument();
    expect(screen.getByText("Password")).toBeInTheDocument();
  });

  it("never claims a category is confirmed safe — only 'not reported as exposed'", () => {
    render(<ExposureCategoryGrid categoriesFound={[]} categoriesNotFound={["email"]} />);
    expect(screen.queryByText(/confirmed safe/i)).not.toBeInTheDocument();
    expect(screen.getByText(/not that they're confirmed safe/i)).toBeInTheDocument();
  });
});
