import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Shop from "../index";
import { PERMANENT_UPGRADES } from "../../../constant";
import { useSaveStore } from "../../../store";

describe("Shop Component", () => {
  beforeEach(() => {
    useSaveStore.getState().resetAll();
    vi.clearAllMocks();
    useSaveStore.setState({
      totalGold: 1500,
      luck: 3,
      speed: 1,
      attack: 1,
      health: 2,
    });
  });

  it("should render the shop title", () => {
    render(<Shop onBack={() => {}} />);

    expect(screen.getByTestId("shop-title")).toBeInTheDocument();
    expect(screen.getByTestId("shop-title")).toHaveTextContent(
      "Permanent Upgrades",
    );
  });

  it("should display the gold amount", () => {
    render(<Shop onBack={() => {}} />);

    expect(screen.getByTestId("shop-gold-display")).toBeInTheDocument();
    expect(screen.getByTestId("shop-gold-display")).toHaveTextContent("1500");
  });

  it("should render all upgrade cards", async () => {
    render(<Shop onBack={() => {}} />);

    PERMANENT_UPGRADES.forEach((upgrade) => {
      expect(
        screen.getByTestId(`upgrade-card-${upgrade.id}`),
      ).toBeInTheDocument();
    });
  });

  it("should render correct level for each upgrade", () => {
    render(<Shop onBack={() => {}} />);

    const attackCard = screen.getByTestId("upgrade-card-attack");
    expect(attackCard).toHaveTextContent("1 / ");

    const healthCard = screen.getByTestId("upgrade-card-health");
    expect(healthCard).toHaveTextContent("2 / ");

    const armorCard = screen.getByTestId("upgrade-card-armor");
    expect(armorCard).toHaveTextContent("0 / ");
  });

  it("should call upgradePermanent when purchase button is clicked", async () => {
    render(<Shop onBack={() => {}} />);

    const purchaseButton = screen.getByTestId("purchase-button-attack");
    fireEvent.click(purchaseButton);

    expect(useSaveStore.getState().attack).toBe(2);
  });

  it("should call resetPermanentUpgrades when reset button is clicked", async () => {
    // Mock window.confirm to return true
    window.confirm = vi.fn(() => true);

    render(<Shop onBack={() => {}} />);

    const resetButton = screen.getByTestId("reset-upgrades-button");
    fireEvent.click(resetButton);

    expect(window.confirm).toHaveBeenCalledWith(
      "Reset all upgrades? You will get back 100% of spent gold.",
    );
    expect(useSaveStore.getState().luck).toBe(0);
  });

  it("should not call resetPermanentUpgrades when reset is cancelled", async () => {
    // Mock window.confirm to return false
    window.confirm = vi.fn(() => false);

    render(<Shop onBack={() => {}} />);

    const resetButton = screen.getByTestId("reset-upgrades-button");
    fireEvent.click(resetButton);

    expect(window.confirm).toHaveBeenCalledWith(
      "Reset all upgrades? You will get back 100% of spent gold.",
    );
  });

  it("should disable purchase button when cannot afford", async () => {
    useSaveStore.getState().resetAll();

    render(<Shop onBack={() => {}} />);

    const purchaseButton = screen.getByTestId("purchase-button-attack");
    expect(purchaseButton).toBeDisabled();
  });

  it("should call onBack when back button is clicked", () => {
    const onBackMock = vi.fn();
    render(<Shop onBack={onBackMock} />);

    const backButton = screen.getByTestId("shop-back-button");
    fireEvent.click(backButton);

    expect(onBackMock).toHaveBeenCalled();
  });
});
