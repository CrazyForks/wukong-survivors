import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import MapSelect from "../index";
import { MAPS } from "../../../constant/map";
import { useSaveStore, useAppStore } from "../../../store";

describe("MapSelect Component", () => {
  beforeEach(() => {
    useAppStore.getState().resetAll();
    useSaveStore.getState().resetAll();
    vi.clearAllMocks();
    useAppStore.setState({
      unlockedMapIds: ["chapter1", "chapter2"],
      selectedMapId: "chapter1",
    });
  });

  it("should render the map select title", () => {
    render(<MapSelect onConfirm={() => {}} onBack={() => {}} />);

    expect(screen.getByTestId("page-title")).toBeInTheDocument();
    expect(screen.getByTestId("page-title")).toHaveTextContent(
      "Select Chapter",
    );
  });

  it("should render all map cards", () => {
    render(<MapSelect onConfirm={() => {}} onBack={() => {}} />);

    MAPS.forEach((map) => {
      expect(screen.getByTestId(`map-card-${map.id}`)).toBeInTheDocument();
    });
  });

  it("should render unlocked maps with correct class", () => {
    render(<MapSelect onConfirm={() => {}} onBack={() => {}} />);

    const chapter1Card = screen.getByTestId("map-card-chapter1");
    const chapter2Card = screen.getByTestId("map-card-chapter2");
    const chapter3Card = screen.getByTestId("map-card-chapter3");

    expect(chapter1Card.className).toContain("unlocked");
    expect(chapter2Card.className).toContain("unlocked");
    expect(chapter3Card.className).toContain("locked");
  });

  it("should call selectMap when a map card is clicked", async () => {
    useAppStore.setState({
      selectedCharacterId: "destined_one",
      selectedMapId: "chapter1",
      unlockedCharacterIds: ["destined_one"],
      unlockedMapIds: ["chapter1", "chapter2"],
    });

    render(<MapSelect onConfirm={() => {}} onBack={() => {}} />);

    const mapCard = screen.getByTestId("map-card-chapter2");
    fireEvent.click(mapCard);

    expect(useAppStore.getState().selectedMapId).toBe("chapter2");
  });

  it("should not call selectMap when a locked map card is clicked", async () => {
    useAppStore.setState({
      selectedCharacterId: "destined_one",
      selectedMapId: "chapter1",
      unlockedCharacterIds: ["destined_one"],
      unlockedMapIds: ["chapter1"],
    });

    render(<MapSelect onConfirm={() => {}} onBack={() => {}} />);

    const lockedMapCard = screen.getByTestId("map-card-chapter3");
    fireEvent.click(lockedMapCard);

    expect(useAppStore.getState().selectedMapId).toBe("chapter1");
  });

  it("should call onConfirm when confirm button is clicked", async () => {
    const onConfirmMock = vi.fn();

    useAppStore.setState({
      selectedCharacterId: "destined_one",
      selectedMapId: "chapter1",
      unlockedCharacterIds: ["destined_one"],
      unlockedMapIds: ["chapter1"],
    });

    render(<MapSelect onConfirm={onConfirmMock} onBack={() => {}} />);

    const confirmButton = screen.getByTestId("start-game-button");
    fireEvent.click(confirmButton);

    expect(onConfirmMock).toHaveBeenCalled();
  });

  it("should call onBack when back button is clicked", () => {
    const onBackMock = vi.fn();
    render(<MapSelect onConfirm={() => {}} onBack={onBackMock} />);

    const backButton = screen.getByTestId("back-to-home-button");
    fireEvent.click(backButton);

    expect(onBackMock).toHaveBeenCalled();
  });

  it("should show selected map details", () => {
    render(<MapSelect onConfirm={() => {}} onBack={() => {}} />);

    // Get the details container and check if it contains text
    const detailsContainer = screen.getByTestId("map-details");
    expect(detailsContainer).toBeInTheDocument();
    expect(detailsContainer.textContent).not.toBe("");
  });

  it("should apply selected class to currently selected map", () => {
    render(<MapSelect onConfirm={() => {}} onBack={() => {}} />);

    const selectedCard = screen.getByTestId("map-card-chapter1");
    // Check if it has a class containing "selected" (CSS Modules converts to hash)
    expect(selectedCard.className).toContain("selected");
  });
});
