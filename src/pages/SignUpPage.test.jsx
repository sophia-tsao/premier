// Integration tests for SignUpPage.
// Covers the client-side validation (gmail-only email, required password),
// the name -> firstName/lastName split, and the navigation on success.
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SignUpPage from "./SignUpPage";
import { signUp } from "../utils/firebase_auth";

const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

jest.mock("../utils/firebase_auth", () => ({
  signUp: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
  window.alert = jest.fn();
});

test("renders the create-account form", () => {
  render(<SignUpPage />);
  expect(screen.getByText("Create Account", { selector: "div" })).toBeInTheDocument();
  expect(screen.getByPlaceholderText("Enter your name")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Create Account" })).toBeInTheDocument();
});

test("rejects a non-gmail email without calling signUp", async () => {
  render(<SignUpPage />);

  await userEvent.type(screen.getByPlaceholderText("Enter your name"), "Ada Byte");
  await userEvent.type(
    screen.getByPlaceholderText("Enter your email address"),
    "ada@example.com"
  );
  await userEvent.type(screen.getByPlaceholderText("Enter your password"), "pw");
  await userEvent.click(screen.getByRole("button", { name: "Create Account" }));

  expect(window.alert).toHaveBeenCalledWith("Only Email Format is allowed.");
  expect(signUp).not.toHaveBeenCalled();
});

test("rejects an empty password", async () => {
  render(<SignUpPage />);

  await userEvent.type(screen.getByPlaceholderText("Enter your name"), "Ada Byte");
  await userEvent.type(
    screen.getByPlaceholderText("Enter your email address"),
    "ada@gmail.com"
  );
  await userEvent.click(screen.getByRole("button", { name: "Create Account" }));

  expect(window.alert).toHaveBeenCalledWith("Type your password");
  expect(signUp).not.toHaveBeenCalled();
});

test("splits the name and submits a teacher sign up, then navigates home", async () => {
  signUp.mockResolvedValue(true);
  render(<SignUpPage />);

  await userEvent.type(
    screen.getByPlaceholderText("Enter your name"),
    "Ada Lovelace Byte"
  );
  await userEvent.type(
    screen.getByPlaceholderText("Enter your email address"),
    "ada@gmail.com"
  );
  await userEvent.type(screen.getByPlaceholderText("Enter your password"), "secret");
  await userEvent.click(screen.getByRole("button", { name: "Create Account" }));

  await waitFor(() => expect(signUp).toHaveBeenCalledTimes(1));
  expect(signUp).toHaveBeenCalledWith(
    expect.objectContaining({
      email: "ada@gmail.com",
      password: "secret",
      firstName: "Ada",
      lastName: "Lovelace Byte",
      role: "teacher",
      authProvider: "sign-up",
    })
  );
  await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/"));
});

test("does not navigate when signUp resolves false", async () => {
  signUp.mockResolvedValue(false);
  render(<SignUpPage />);

  await userEvent.type(screen.getByPlaceholderText("Enter your name"), "Ada Byte");
  await userEvent.type(
    screen.getByPlaceholderText("Enter your email address"),
    "ada@gmail.com"
  );
  await userEvent.type(screen.getByPlaceholderText("Enter your password"), "secret");
  await userEvent.click(screen.getByRole("button", { name: "Create Account" }));

  await waitFor(() => expect(signUp).toHaveBeenCalled());
  expect(mockNavigate).not.toHaveBeenCalled();
});
