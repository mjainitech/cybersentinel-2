import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Lock } from "lucide-react";
import { ScanResultCard } from "../ScanResultCard";

const baseProps = {
  icon: Lock,
  title: "HTTPS Enabled",
  value: "Enabled",
  summary: "Traffic to this site is encrypted in transit.",
  learnMore: "HTTPS encrypts the connection between your browser and the website.",
  glossary: "Encrypts your connection to the site.",
} as const;

describe("ScanResultCard", () => {
  it("renders the title, value, and summary", () => {
    render(<ScanResultCard {...baseProps} status="safe" />);
    expect(screen.getByText("HTTPS Enabled")).toBeInTheDocument();
    expect(screen.getByText("Enabled")).toBeInTheDocument();
    expect(screen.getByText(baseProps.summary)).toBeInTheDocument();
  });

  it("shows the correct badge label for each status", () => {
    const { rerender } = render(<ScanResultCard {...baseProps} status="safe" />);
    expect(screen.getByText("Safe")).toBeInTheDocument();

    rerender(<ScanResultCard {...baseProps} status="warning" />);
    expect(screen.getByText("Use Caution")).toBeInTheDocument();

    rerender(<ScanResultCard {...baseProps} status="danger" />);
    expect(screen.getByText("Dangerous")).toBeInTheDocument();

    rerender(<ScanResultCard {...baseProps} status="unknown" />);
    expect(screen.getByText("Unavailable")).toBeInTheDocument();
  });

  it("toggles the Learn More section's expanded state when clicked", () => {
    render(<ScanResultCard {...baseProps} status="safe" />);
    const toggle = screen.getByRole("button", { name: /learn more/i });

    expect(toggle).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
  });

  it("exposes a labeled tooltip trigger for the check title", () => {
    render(<ScanResultCard {...baseProps} status="safe" />);
    expect(screen.getByRole("button", { name: `What is ${baseProps.title}?` })).toBeInTheDocument();
  });
});
