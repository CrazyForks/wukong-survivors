import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import Stats from "../index";
import { useSaveStore, useAppStore } from "../../../store";

describe("Stats Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSaveStore.getState().resetAll();
    useAppStore.getState().resetAll();

    useSaveStore.setState({
      totalGold: 1000,
      totalKills: 500,
      bestSurvivalTime: 125,
      totalPlayTime: 3665,
      completedChapters: ["chapter1"],
    });
    useAppStore.setState({
      unlockedCharacterIds: ["destined_one", "erlang_shen"],
    });
  });

  it("should display correct gold amount", () => {
    render(<Stats onBack={() => {}} />);

    expect(screen.getByText("1000")).toBeInTheDocument();
  });

  it("should display correct total kills", () => {
    render(<Stats onBack={() => {}} />);

    expect(screen.getByText("500")).toBeInTheDocument();
  });

  it("should format survival time correctly (2:05 for 125 seconds)", () => {
    render(<Stats onBack={() => {}} />);

    expect(screen.getByText("02:05")).toBeInTheDocument();
  });

  it("should format total play time correctly (61:05 for 3665 seconds)", () => {
    render(<Stats onBack={() => {}} />);

    expect(screen.getByText("61:05")).toBeInTheDocument();
  });

  it("should display unlocked characters count", () => {
    render(<Stats onBack={() => {}} />);

    // Should show "2/X" where X is total characters
    const unlockedText = screen.getByText(/^2\//);
    expect(unlockedText).toBeInTheDocument();
  });

  it("should display completed chapters count", () => {
    render(<Stats onBack={() => {}} />);

    // Should show "1/X" where X is total maps
    const completedText = screen.getByText(/^1\//);
    expect(completedText).toBeInTheDocument();
  });
});
