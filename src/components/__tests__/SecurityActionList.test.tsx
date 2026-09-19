import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SecurityActionList } from "../SecurityActionList";
import type { SecurityAction } from "@/services/breachService";

const actions: SecurityAction[] = [
  { id: "a1", text: "Change the password", priority: "high", completed: false },
  { id: "a2", text: "Enable MFA", priority: "high", completed: false },
  { id: "a3", text: "Use a password manager", priority: "low", completed: true },
];

describe("SecurityActionList", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows the completion count", () => {
    render(<SecurityActionList actions={actions} />);
    expect(screen.getByText("1/3")).toBeInTheDocument();
  });

  it("toggling an item updates the completion count locally", () => {
    render(<SecurityActionList actions={actions} />);
    fireEvent.click(screen.getByText("Change the password"));
    expect(screen.getByText("2/3")).toBeInTheDocument();
  });

  it("does not make a network call when no reportId is provided (guest / unsaved report)", () => {
    const fetchSpy = vi.spyOn(global, "fetch");
    render(<SecurityActionList actions={actions} />);
    fireEvent.click(screen.getByText("Enable MFA"));
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
