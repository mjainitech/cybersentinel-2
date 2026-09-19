import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { RiskScoreGauge } from "../RiskScoreGauge";

describe("RiskScoreGauge", () => {
  it("renders the final score after its mount animation settles", async () => {
    render(<RiskScoreGauge score={87} band="safe" />);
    // The score animates in via requestAnimationFrame rather than rendering instantly.
    await waitFor(() => expect(screen.getByText("87")).toBeInTheDocument());
  });

  it("shows the label matching the given band", () => {
    render(<RiskScoreGauge score={40} band="danger" />);
    expect(screen.getByText("Dangerous")).toBeInTheDocument();
  });

  it("shows Use Caution for the warning band", () => {
    render(<RiskScoreGauge score={65} band="warning" />);
    expect(screen.getByText("Use Caution")).toBeInTheDocument();
  });
});
