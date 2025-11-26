import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Dialog } from "../index";

// Mock react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => {
    return [
      (key: string) => {
        const translations: Record<string, string> = {
          cancel: "Cancel",
          confirm: "Confirm",
        };
        return translations[key] || key;
      },
    ];
  },
}));

describe("Dialog", () => {
  const defaultProps = {
    title: "Test Dialog",
    visible: true,
  };

  it("should render when visible is true", () => {
    const content = "Dialog content";
    render(<Dialog {...defaultProps}>{content}</Dialog>);

    expect(screen.getByText("Test Dialog")).toBeInTheDocument();
    expect(screen.getByText(content)).toBeInTheDocument();
  });

  it("should not render when visible is false", () => {
    const content = "Dialog content";
    render(
      <Dialog {...defaultProps} visible={false}>
        {content}
      </Dialog>,
    );

    expect(screen.queryByText("Test Dialog")).not.toBeInTheDocument();
  });

  it("should display title", () => {
    render(<Dialog {...defaultProps} title="My Custom Title" />);

    expect(screen.getByText("My Custom Title")).toBeInTheDocument();
  });

  it("should display children content", () => {
    const child1 = "Child content 1";
    const child2 = "Child content 2";
    render(
      <Dialog {...defaultProps}>
        <div>{child1}</div>
        <div>{child2}</div>
      </Dialog>,
    );

    expect(screen.getByText(child1)).toBeInTheDocument();
    expect(screen.getByText(child2)).toBeInTheDocument();
  });

  it("should call onCancel when cancel button is clicked", () => {
    const onCancel = vi.fn();
    render(<Dialog {...defaultProps} onCancel={onCancel} />);

    const cancelButton = screen.getByText("Cancel");
    fireEvent.click(cancelButton);

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("should call onOk when confirm button is clicked", () => {
    const onOk = vi.fn();
    render(<Dialog {...defaultProps} onOk={onOk} />);

    const confirmButton = screen.getByText("Confirm");
    fireEvent.click(confirmButton);

    expect(onOk).toHaveBeenCalledTimes(1);
  });

  it("should call onCancel when close button (X) is clicked", () => {
    const onCancel = vi.fn();
    render(<Dialog {...defaultProps} onCancel={onCancel} />);

    const closeButton = screen.getByText("X");
    fireEvent.click(closeButton);

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("should use custom cancel text", () => {
    render(<Dialog {...defaultProps} cancelText="No" />);

    expect(screen.getByText("No")).toBeInTheDocument();
    expect(screen.queryByText("Cancel")).not.toBeInTheDocument();
  });

  it("should use custom confirm text", () => {
    render(<Dialog {...defaultProps} confirmText="Yes" />);

    expect(screen.getByText("Yes")).toBeInTheDocument();
    expect(screen.queryByText("Confirm")).not.toBeInTheDocument();
  });

  it("should hide buttons when hideButtons is true", () => {
    render(<Dialog {...defaultProps} hideButtons={true} />);

    expect(screen.queryByText("Cancel")).not.toBeInTheDocument();
    expect(screen.queryByText("Confirm")).not.toBeInTheDocument();
  });

  it("should show buttons when hideButtons is false", () => {
    render(<Dialog {...defaultProps} hideButtons={false} />);

    expect(screen.getByText("Cancel")).toBeInTheDocument();
    expect(screen.getByText("Confirm")).toBeInTheDocument();
  });

  it("should apply custom className", () => {
    render(<Dialog {...defaultProps} className="custom-dialog" />);

    const dialogContainer = screen
      .getByText("Test Dialog")
      .closest(".custom-dialog");
    expect(dialogContainer).toBeInTheDocument();
  });

  it("should render with testId", () => {
    render(<Dialog {...defaultProps} testId="my-dialog" />);

    expect(screen.getByTestId("my-dialog")).toBeInTheDocument();
  });

  it("should render cancel and confirm buttons with testIds", () => {
    render(<Dialog {...defaultProps} testId="my-dialog" />);

    const cancelButton = screen.getByTestId("my-dialog-cancel");
    const confirmButton = screen.getByTestId("my-dialog-confirm");

    expect(cancelButton).toBeInTheDocument();
    expect(confirmButton).toBeInTheDocument();
  });

  it("should render in custom container when getContainer is provided", () => {
    const customContainer = document.createElement("div");
    customContainer.id = "custom-container";
    document.body.appendChild(customContainer);

    const content = "Custom container content";
    render(
      <Dialog
        {...defaultProps}
        testId="custom-dialog"
        getContainer={() => customContainer}
      >
        {content}
      </Dialog>,
    );

    // Check that dialog is rendered in the custom container
    const dialogElement = customContainer.querySelector(
      '[data-testid="custom-dialog"]',
    );
    expect(dialogElement).toBeTruthy();
    expect(screen.getByText(content)).toBeInTheDocument();

    document.body.removeChild(customContainer);
  });

  it("should render in document.body by default", () => {
    const content = "Default container";
    render(<Dialog {...defaultProps}>{content}</Dialog>);

    // Dialog should be rendered as a portal in body
    expect(screen.getByText(content)).toBeInTheDocument();
  });

  it("should not call handlers when buttons are not clicked", () => {
    const onCancel = vi.fn();
    const onOk = vi.fn();

    render(<Dialog {...defaultProps} onCancel={onCancel} onOk={onOk} />);

    expect(onCancel).not.toHaveBeenCalled();
    expect(onOk).not.toHaveBeenCalled();
  });

  it("should handle multiple renders correctly", () => {
    const { rerender } = render(<Dialog {...defaultProps} />);

    expect(screen.getByText("Test Dialog")).toBeInTheDocument();

    rerender(<Dialog {...defaultProps} title="Updated Title" />);

    expect(screen.getByText("Updated Title")).toBeInTheDocument();
    expect(screen.queryByText("Test Dialog")).not.toBeInTheDocument();
  });

  it("should cleanup when unmounted", () => {
    const { unmount } = render(<Dialog {...defaultProps} />);

    expect(screen.getByText("Test Dialog")).toBeInTheDocument();

    unmount();

    expect(screen.queryByText("Test Dialog")).not.toBeInTheDocument();
  });
});
