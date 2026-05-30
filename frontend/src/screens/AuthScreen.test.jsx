import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import AuthScreen from "./AuthScreen.jsx";


describe("AuthScreen", () => {
  it("submits the remember-device choice and toggles password visibility", async () => {
    const onContinue = vi.fn().mockResolvedValue({});
    render(<AuthScreen initialMode="login" onContinue={onContinue} onClose={() => {}} />);

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "student@example.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "careerfit-pass" } });
    fireEvent.click(screen.getByLabelText("Remember this device"));
    fireEvent.click(screen.getByTitle("Show password"));
    expect(screen.getByLabelText("Password")).toHaveAttribute("type", "text");
    fireEvent.click(screen.getAllByRole("button", { name: "Login" }).at(-1));

    await waitFor(() => expect(onContinue).toHaveBeenCalledWith("login", expect.objectContaining({ remember: true })));
  });

  it("requests a password reset link", async () => {
    const onPasswordReset = vi.fn().mockResolvedValue({ detail: "Reset link sent." });
    render(<AuthScreen initialMode="login" onContinue={() => {}} onPasswordReset={onPasswordReset} onClose={() => {}} />);

    fireEvent.click(screen.getByRole("button", { name: "Forgot password?" }));
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "student@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Send reset link" }));

    await waitFor(() => expect(onPasswordReset).toHaveBeenCalledWith({ email: "student@example.com" }));
  });
});
